package controlador

import (
	"context"
	"log/slog"
	"net/http"
	"runtime/debug"
	"strings"
	"time"

	"nosso-livro/servico-autenticacao-usuario/internal/servico"
)

// escritorStatus funciona como um interceptador do ResponseWriter para capturar o código de status HTTP
type escritorStatus struct {
	http.ResponseWriter
	codigoStatus int
	escreveu     bool
}

// NovoEscritorStatus inicializa o interceptador de ResponseWriter com o status 200 OK por padrão
func novoEscritorStatus(w http.ResponseWriter) *escritorStatus {
	return &escritorStatus{ResponseWriter: w, codigoStatus: http.StatusOK}
}

// WriteHeader intercepta a escrita de cabeçalho para registrar o status retornado
func (es *escritorStatus) WriteHeader(codigo int) {
	if !es.escreveu {
		es.codigoStatus = codigo
		es.ResponseWriter.WriteHeader(codigo)
		es.escreveu = true
	}
}

// Write intercepta a escrita do corpo da resposta para garantir que o cabeçalho padrão 200 seja capturado caso não tenha sido explicitamente escrito
func (es *escritorStatus) Write(b []byte) (int, error) {
	if !es.escreveu {
		es.WriteHeader(http.StatusOK)
	}
	return es.ResponseWriter.Write(b)
}

// MiddlewareCORS configura os cabeçalhos de controle de acesso de origem cruzada
func MiddlewareCORS(proximo http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, OPTIONS, PUT, DELETE")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")

		// Trata a requisição de pré-vôo (preflight OPTIONS request)
		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusNoContent)
			return
		}

		proximo.ServeHTTP(w, r)
	})
}

// MiddlewareLogs registra informações estruturadas sobre cada requisição HTTP processada
func MiddlewareLogs(proximo http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		inicio := time.Now()
		escritorMock := novoEscritorStatus(w)

		proximo.ServeHTTP(escritorMock, r)

		duracao := time.Since(inicio)

		// Logs estruturados usando a biblioteca slog em português do Brasil
		slog.Info("Requisição HTTP finalizada",
			slog.String("metodo", r.Method),
			slog.String("caminho", r.URL.Path),
			slog.String("ip_origem", r.RemoteAddr),
			slog.Int("status", escritorMock.codigoStatus),
			slog.Duration("duracao", duracao),
		)
	})
}

// MiddlewareRecuperacaoPanico previne a queda do servidor recuperando falhas graves ocorridas nos handlers
func MiddlewareRecuperacaoPanico(proximo http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		defer func() {
			if err := recover(); err != nil {
				// Loga o erro com a pilha de execução em português
				slog.Error("Pânico de execução recuperado pelo middleware",
					slog.Any("erro", err),
					slog.String("pilha_execucao", string(debug.Stack())),
				)

				// Retorna uma resposta estruturada de erro 500 controlado
				responderComErro(w, http.StatusInternalServerError, "erro interno do servidor")
			}
		}()

		proximo.ServeHTTP(w, r)
	})
}

// MiddlewareAutenticacaoJWT protege rotas que necessitam de usuário logado validando o Bearer token JWT
func MiddlewareAutenticacaoJWT(chaveSecreta string) func(http.Handler) http.Handler {
	return func(proximo http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			cabecalhoAutorizacao := r.Header.Get("Authorization")

			// Verifica se o cabeçalho foi enviado e possui o prefixo Bearer
			if cabecalhoAutorizacao == "" || !strings.HasPrefix(cabecalhoAutorizacao, "Bearer ") {
				responderComErro(w, http.StatusUnauthorized, "cabeçalho de autorização ausente ou malformatado")
				return
			}

			// Extrai apenas o token string
			tokenStr := strings.TrimPrefix(cabecalhoAutorizacao, "Bearer ")
			tokenStr = strings.TrimSpace(tokenStr)

			if tokenStr == "" {
				responderComErro(w, http.StatusUnauthorized, "token de acesso vazio")
				return
			}

			// Valida o token gerado
			claims, err := servico.ValidarTokenAutenticacao(tokenStr, chaveSecreta)
			if err != nil {
				slog.Warn("Tentativa de acesso com token inválido", slog.String("erro", err.Error()))
				responderComErro(w, http.StatusUnauthorized, "token de acesso inválido ou expirado")
				return
			}

			// Injeta o ID do usuário (Subject do token) no contexto da requisição
			contextoComUsuario := context.WithValue(r.Context(), ChaveContextoUsuarioID, claims.Subject)
			
			// Continua o fluxo da requisição com o novo contexto
			proximo.ServeHTTP(w, r.WithContext(contextoComUsuario))
		})
	}
}

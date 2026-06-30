package controlador

import (
	"context"
	"encoding/json"
	"fmt"
	"log/slog"
	"net/http"
	"os"
	"strings"
	"time"

	"github.com/golang-jwt/jwt/v5"
)

type ChaveContexto string

const ChaveUsuario ChaveContexto = "usuario"

type UsuarioAutenticado struct {
	ID        string `json:"id"`
	Email     string `json:"email"`
	Nome      string `json:"nome"`
	Permissao string `json:"permissao"`
}

// ClaimsUsuario representa as claims do token JWT emitido pelo serviço de autenticação
type ClaimsUsuario struct {
	Permissao string `json:"permissao"`
	WhatsApp  string `json:"whatsapp"`
	jwt.RegisteredClaims
}

// CORS adiciona cabeçalhos CORS básicos para integração com o frontend e o gateway
func CORS(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS, PATCH")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization, x-usuario-dados")

		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusNoContent)
			return
		}

		next.ServeHTTP(w, r)
	})
}

type gravadorResposta struct {
	http.ResponseWriter
	status int
}

func (g *gravadorResposta) WriteHeader(codigo int) {
	g.status = codigo
	g.ResponseWriter.WriteHeader(codigo)
}

// LogRequisicoes registra logs estruturados sobre as chamadas HTTP processadas no microserviço
func LogRequisicoes(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		inicio := time.Now()
		gravador := &gravadorResposta{ResponseWriter: w, status: http.StatusOK}

		next.ServeHTTP(gravador, r)

		duracao := time.Since(inicio)
		slog.Info("Requisição HTTP processada",
			slog.String("metodo", r.Method),
			slog.String("caminho", r.URL.Path),
			slog.Int("status", gravador.status),
			slog.Duration("duracao", duracao),
			slog.String("ip", r.RemoteAddr),
		)
	})
}

// AutenticarJWT valida a sessão do usuário extraindo e processando dados ou validando o token localmente
func AutenticarJWT(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		var usuario UsuarioAutenticado

		// Abordagem 1: Cabeçalho repassado pelo Gateway de API (JSON serializado)
		dadosUsuarioHeader := r.Header.Get("x-usuario-dados")
		if dadosUsuarioHeader != "" {
			if err := json.Unmarshal([]byte(dadosUsuarioHeader), &usuario); err == nil {
				ctx := context.WithValue(r.Context(), ChaveUsuario, &usuario)
				next.ServeHTTP(w, r.WithContext(ctx))
				return
			}
			slog.Warn("Falha ao desserializar cabeçalho x-usuario-dados")
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusUnauthorized)
			fmt.Fprint(w, `{"erro": "Cabeçalho de dados de usuário inválido fornecido pelo gateway"}`)
			return
		}

		// Abordagem 2: Token JWT enviado diretamente no header Authorization (para testes locais)
		authHeader := r.Header.Get("Authorization")
		if authHeader == "" {
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusUnauthorized)
			fmt.Fprint(w, `{"erro": "Token de autenticação não fornecido"}`)
			return
		}

		partes := strings.Split(authHeader, " ")
		if len(partes) != 2 || strings.ToLower(partes[0]) != "bearer" {
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusUnauthorized)
			fmt.Fprint(w, `{"erro": "Formato do token de autenticação inválido"}`)
			return
		}

		tokenStr := partes[1]
		chaveSecreta := os.Getenv("CHAVE_SECRETA_JWT")
		if chaveSecreta == "" {
			chaveSecreta = "chave_secreta_padrao_desenvolvimento_nosso_livro"
		}

		token, err := jwt.ParseWithClaims(tokenStr, &ClaimsUsuario{}, func(t *jwt.Token) (interface{}, error) {
			if _, ok := t.Method.(*jwt.SigningMethodHMAC); !ok {
				return nil, fmt.Errorf("método de assinatura do token inválido: %v", t.Header["alg"])
			}
			return []byte(chaveSecreta), nil
		})

		if err != nil {
			slog.Warn("Falha na validação local do token JWT", slog.String("erro", err.Error()))
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusUnauthorized)
			fmt.Fprint(w, `{"erro": "Token de autenticação inválido ou expirado"}`)
			return
		}

		claims, ok := token.Claims.(*ClaimsUsuario)
		if !ok || !token.Valid {
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusUnauthorized)
			fmt.Fprint(w, `{"erro": "Token de autenticação inválido"}`)
			return
		}

		usuario.ID, err = claims.GetSubject()
		if err != nil || usuario.ID == "" {
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusUnauthorized)
			fmt.Fprint(w, `{"erro": "Token de autenticação não contém o identificador do usuário"}`)
			return
		}
		usuario.Permissao = claims.Permissao

		ctx := context.WithValue(r.Context(), ChaveUsuario, &usuario)
		next.ServeHTTP(w, r.WithContext(ctx))
	})
}

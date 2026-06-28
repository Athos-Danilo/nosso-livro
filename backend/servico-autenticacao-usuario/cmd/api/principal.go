package main

import (
	"fmt"
	"log"
	"log/slog"
	"net/http"
	"os"

	"nosso-livro/servico-autenticacao-usuario/internal/controlador"
	"nosso-livro/servico-autenticacao-usuario/internal/dominio"
	"nosso-livro/servico-autenticacao-usuario/internal/repositorio"
	"nosso-livro/servico-autenticacao-usuario/internal/servico"
)

func main() {
	// Configura o logger padrão para exibir informações limpas no console
	slog.SetDefault(slog.New(slog.NewTextHandler(os.Stdout, &slog.HandlerOptions{Level: slog.LevelInfo})))
	slog.Info("Iniciando o Serviço de Autenticação e Usuário...")

	// Teste rápido de integridade dos serviços de criptografia Bcrypt no startup
	hashTeste, err := servico.GerarHashSenha("senha_segura_de_teste")
	if err != nil {
		slog.Error("Falha no teste de inicialização do Bcrypt", slog.String("erro", err.Error()))
		os.Exit(1)
	}
	if err := servico.CompararSenhaHash("senha_segura_de_teste", hashTeste); err != nil {
		slog.Error("Comparação do teste de Bcrypt falhou", slog.String("erro", err.Error()))
		os.Exit(1)
	}
	slog.Info("Lógica de criptografia Bcrypt testada com sucesso no startup.")

	// 1. Conexão com o Banco de Dados
	urlBanco := os.Getenv("URL_BANCO_DADOS")
	if urlBanco == "" {
		slog.Error("A variável de ambiente URL_BANCO_DADOS não está definida. O serviço necessita de um banco de dados ativo.")
		os.Exit(1)
	}

	poolBanco, err := repositorio.ConectarBanco(urlBanco)
	if err != nil {
		slog.Error("Falha catastrófica ao conectar no banco de dados", slog.String("erro", err.Error()))
		os.Exit(1)
	}
	defer poolBanco.Close()

	repoUsuario := repositorio.NovoRepositorioUsuarioPostgres(poolBanco)
	// Validação estática de tipo em tempo de compilação para garantir integridade do contrato
	var _ dominio.RepositorioUsuario = repoUsuario
	slog.Info("Repositório de usuários carregado e validado estaticamente.")

	// 2. Chave Secreta para assinatura do JWT
	chaveSecretaJWT := os.Getenv("CHAVE_SECRETA_JWT")
	if chaveSecretaJWT == "" {
		slog.Warn("A variável de ambiente CHAVE_SECRETA_JWT não está definida. Usando chave padrão de desenvolvimento.")
		chaveSecretaJWT = "chave_secreta_padrao_desenvolvimento_nosso_livro"
	}

	// 3. Inicialização dos Controladores e Limitadores de Segurança
	controladorAuth := controlador.NovoControladorAutenticacao(repoUsuario, chaveSecretaJWT)
	controladorUser := controlador.NovoControladorUsuario(repoUsuario)

	// Inicializa o limitador de IP para rotas públicas (cadastro/login) limitando a 5 requisições por minuto (5/60 req/s) com rajada (burst) de 5
	limitadorAutenticacao := controlador.NovoLimitadorIP(5.0/60.0, 5)
	middlewareRateLimit := controlador.MiddlewareLimitadorTaxa(limitadorAutenticacao)

	// 4. Configuração do Roteador HTTP (Utilizando o ServeMux nativo do Go 1.22+ com suporte a métodos e caminhos)
	mux := http.NewServeMux()

	// Endpoint público de verificação de saúde
	mux.HandleFunc("GET /saude", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)
		fmt.Fprint(w, `{"status": "ativo", "mensagem": "Serviço de Autenticação e Usuário está funcionando corretamente"}`)
	})

	// Endpoints públicos de Autenticação (Protegidos por limitador de taxa para evitar força bruta)
	mux.Handle("POST /api/autenticacao/cadastro", middlewareRateLimit(http.HandlerFunc(controladorAuth.Cadastrar)))
	mux.Handle("POST /api/autenticacao/login", middlewareRateLimit(http.HandlerFunc(controladorAuth.Login)))

	// Middleware de proteção JWT para endpoints de usuário
	middlewareAutenticacao := controlador.MiddlewareAutenticacaoJWT(chaveSecretaJWT)

	// Endpoints protegidos de Usuário
	mux.Handle("GET /api/usuarios/me", middlewareAutenticacao(http.HandlerFunc(controladorUser.ObterPerfil)))
	mux.Handle("GET /api/usuarios/{id}", middlewareAutenticacao(http.HandlerFunc(controladorUser.ObterPorID)))

	// 5. Aplicação de Middlewares Globais
	// Ordem de execução: Pânicos -> Logs estruturados -> CORS -> Roteador (mux)
	handlerGlobal := controlador.MiddlewareCORS(mux)
	handlerGlobal = controlador.MiddlewareLogs(handlerGlobal)
	handlerGlobal = controlador.MiddlewareRecuperacaoPanico(handlerGlobal)

	porta := ":8080"
	slog.Info("Servidor HTTP rodando", slog.String("porta", porta))
	if err := http.ListenAndServe(porta, handlerGlobal); err != nil {
		log.Fatalf("[Erro] Erro ao iniciar o servidor HTTP: %v\n", err)
	}
}

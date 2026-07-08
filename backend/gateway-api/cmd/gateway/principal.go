package main

import (
	"context"
	"fmt"
	"log/slog"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"nosso-livro/gateway-api/internal/configuracao"
	"nosso-livro/gateway-api/internal/logger"
	"nosso-livro/gateway-api/internal/middleware"
	"nosso-livro/gateway-api/internal/proxy"
)

func main() {
	// 1. Carrega as configuracoes das variaveis de ambiente ou .env
	cfg := configuracao.Carregar()

	// 2. Inicializa o logger estruturado nativo
	logger.Inicializar(cfg.Ambiente)
	slog.Info("Iniciando o Gateway de API...", slog.String("ambiente", cfg.Ambiente), slog.String("porta", cfg.Porta))

	// 3. Inicializa os proxies reversos para os microsservicos
	proxyUsuario, err := proxy.NovoProxyReverso(cfg.UrlServicoUsuario)
	if err != nil {
		slog.Error("Falha ao criar proxy para o servico de usuario", slog.String("erro", err.Error()))
		os.Exit(1)
	}
	proxyCatalogo, err := proxy.NovoProxyReverso(cfg.UrlServicoCatalogo)
	if err != nil {
		slog.Error("Falha ao criar proxy para o servico de catalogo", slog.String("erro", err.Error()))
		os.Exit(1)
	}
	proxyEmprestimo, err := proxy.NovoProxyReverso(cfg.UrlServicoEmprestimo)
	if err != nil {
		slog.Error("Falha ao criar proxy para o servico de emprestimo", slog.String("erro", err.Error()))
		os.Exit(1)
	}
	proxyReserva, err := proxy.NovoProxyReverso(cfg.UrlServicoReserva)
	if err != nil {
		slog.Error("Falha ao criar proxy para o servico de reserva", slog.String("erro", err.Error()))
		os.Exit(1)
	}
	proxyRecomendacao, err := proxy.NovoProxyReverso(cfg.UrlServicoRecomendacao)
	if err != nil {
		slog.Error("Falha ao criar proxy para o servico de recomendacao", slog.String("erro", err.Error()))
		os.Exit(1)
	}
	proxyNotificacao, err := proxy.NovoProxyReverso(cfg.UrlServicoNotificacao)
	if err != nil {
		slog.Error("Falha ao criar proxy para o servico de notificacao", slog.String("erro", err.Error()))
		os.Exit(1)
	}

	// 4. Configura o Roteador HTTP (ServeMux nativo do Go 1.22+)
	mux := http.NewServeMux()

	// Endpoint publico de saude (Liveness Probe)
	mux.HandleFunc("GET /saude", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)
		fmt.Fprint(w, `{"status": "ativo", "mensagem": "Gateway de API esta funcionando corretamente"}`)
	})

	// Endpoint de prontidao (Readiness Probe)
	mux.HandleFunc("GET /pronto", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		
		clienteHTTP := &http.Client{Timeout: 1 * time.Second}
		resposta, erro := clienteHTTP.Get(cfg.UrlServicoUsuario + "/saude")
		if erro != nil || resposta.StatusCode != http.StatusOK {
			w.WriteHeader(http.StatusServiceUnavailable)
			fmt.Fprint(w, `{"status": "indisponivel", "mensagem": "Servico de Autenticacao e Usuario indisponivel"}`)
			return
		}
		defer resposta.Body.Close()

		w.WriteHeader(http.StatusOK)
		fmt.Fprint(w, `{"status": "pronto", "mensagem": "Gateway pronto para receber conexoes"}`)
	})

	// 5. Roteamento e Proxy Reverso para os microsservicos
	// Nota: No ServeMux do Go, rotas terminadas em "/" atuam como prefixo,
	// capturando todos os subcaminhos (ex: /api/usuarios/me).
	mux.Handle("/api/autenticacao/", proxyUsuario)
	mux.Handle("/api/usuarios/", proxyUsuario)
	mux.Handle("/api/livros/", proxyCatalogo)
	mux.Handle("/api/bibliotecas/", proxyCatalogo)
	mux.Handle("/api/emprestimos/", proxyEmprestimo)
	mux.Handle("POST /api/emprestimos", proxyEmprestimo)
	mux.Handle("GET /api/emprestimos", proxyEmprestimo)

	mux.Handle("/api/reservas/", proxyReserva)
	mux.Handle("POST /api/reservas", proxyReserva)
	mux.Handle("GET /api/reservas", proxyReserva)

	mux.Handle("/api/recomendacoes/", proxyRecomendacao)
	
	mux.Handle("/api/notificacoes/", proxyNotificacao)
	mux.Handle("GET /api/notificacoes", proxyNotificacao)

	// 6. Encadeamento de middlewares globais de borda
	// Ordem de execucao: Logs -> Seguranca (Filtro 2MB/Headers) -> CORS (Origens/Preflight) -> Autenticacao (JWT) -> Roteador (mux)
	var handlerGlobal http.Handler = mux
	handlerGlobal = middleware.MiddlewareAutenticacao(cfg)(handlerGlobal)
	handlerGlobal = middleware.MiddlewareCORS(cfg)(handlerGlobal)
	handlerGlobal = middleware.MiddlewareSeguranca(handlerGlobal)
	handlerGlobal = middleware.MiddlewareLogs(handlerGlobal)

	// 7. Configura o Servidor HTTP para Graceful Shutdown
	endereco := ":" + cfg.Porta
	servidor := &http.Server{
		Addr:    endereco,
		Handler: handlerGlobal,
	}

	// Inicia o servidor HTTP em uma goroutine paralela
	go func() {
		slog.Info("Gateway de API pronto para receber requisoes.", slog.String("endereco", endereco))
		if err := servidor.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			slog.Error("Erro fatal no servidor HTTP do Gateway ao escutar", slog.String("erro", err.Error()))
			os.Exit(1)
		}
	}()

	// Escuta sinais do sistema operacional para interrupcao ordenada
	canalSinal := make(chan os.Signal, 1)
	signal.Notify(canalSinal, syscall.SIGINT, syscall.SIGTERM)

	// Bloqueia a execucao principal ate capturar um sinal
	<-canalSinal
	slog.Info("Sinal de encerramento detectado. Iniciando Graceful Shutdown de seguranca...")

	// Limita o tempo de espera para esvaziar conexoes ativas antes de forcar a saida
	ctxDesligamento, cancelDesligamento := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancelDesligamento()

	// Encerra as rotas HTTP de forma ordenada
	if err := servidor.Shutdown(ctxDesligamento); err != nil {
		slog.Error("Falha ao desligar o servidor HTTP de forma graciosa", slog.String("erro", err.Error()))
	} else {
		slog.Info("Servidor HTTP do Gateway encerrado com sucesso de forma ordenada.")
	}

	slog.Info("Gateway de API finalizado com sucesso. Encerrando aplicacao.")
}

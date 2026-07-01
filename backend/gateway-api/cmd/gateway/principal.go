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
)

func main() {
	// 1. Carrega as configuracoes das variaveis de ambiente ou .env
	cfg := configuracao.Carregar()

	// 2. Inicializa o logger estruturado nativo
	logger.Inicializar(cfg.Ambiente)
	slog.Info("Iniciando o Gateway de API...", slog.String("ambiente", cfg.Ambiente), slog.String("porta", cfg.Porta))

	// 3. Configura o Roteador HTTP (ServeMux nativo do Go 1.22+)
	mux := http.NewServeMux()

	// Endpoint publico de saude (Liveness Probe)
	mux.HandleFunc("GET /saude", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)
		fmt.Fprint(w, `{"status": "ativo", "mensagem": "Gateway de API esta funcionando corretamente"}`)
	})

	// Endpoint de prontidao (Readiness Probe)
	mux.HandleFunc("GET /pronto", func(w http.ResponseWriter, r *http.Request) {
		// Por enquanto na Fase 1, retorna pronto diretamente
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)
		fmt.Fprint(w, `{"status": "pronto", "mensagem": "Gateway pronto para receber conexoes"}`)
	})

	// 4. Configura o Servidor HTTP para Graceful Shutdown
	endereco := ":" + cfg.Porta
	servidor := &http.Server{
		Addr:    endereco,
		Handler: mux,
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

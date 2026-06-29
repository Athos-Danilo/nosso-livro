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

	"nosso-livro/servico-emprestimo/internal/dominio"
	"nosso-livro/servico-emprestimo/internal/repositorio"
)

func main() {
	// Configura o logger padrão para emitir logs no formato JSON estruturado no console
	slog.SetDefault(slog.New(slog.NewJSONHandler(os.Stdout, &slog.HandlerOptions{Level: slog.LevelInfo})))
	slog.Info("Iniciando o Serviço de Empréstimo...")

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

	repoEmprestimo := repositorio.NovoRepositorioEmprestimoPostgres(poolBanco)
	// Validação estática de tipo em tempo de compilação para garantir integridade do contrato
	var _ dominio.RepositorioEmprestimo = repoEmprestimo
	slog.Info("Repositório de empréstimos carregado e validado estaticamente.")

	// 2. Configuração do Roteador HTTP (ServeMux nativo do Go 1.22+ com suporte a métodos e caminhos)
	mux := http.NewServeMux()

	// Endpoint público de saúde (Liveness Probe)
	mux.HandleFunc("GET /saude", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)
		fmt.Fprint(w, `{"status": "ativo", "mensagem": "Serviço de Empréstimo está funcionando corretamente"}`)
	})

	// Endpoint de prontidão (Readiness Probe) integrado com o ping do banco de dados
	mux.HandleFunc("GET /pronto", func(w http.ResponseWriter, r *http.Request) {
		ctxTimeout, cancel := context.WithTimeout(r.Context(), 3*time.Second)
		defer cancel()

		if err := poolBanco.Ping(ctxTimeout); err != nil {
			slog.Error("Verificação de prontidão falhou: banco de dados indisponível", slog.String("erro", err.Error()))
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusServiceUnavailable)
			fmt.Fprint(w, `{"status": "inativo", "mensagem": "conexão com banco indisponível"}`)
			return
		}

		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)
		fmt.Fprint(w, `{"status": "pronto", "mensagem": "integração com banco operacional"}`)
	})

	// 3. Middlewares globais e configuração de porta
	porta := os.Getenv("PORTA")
	if porta == "" {
		porta = os.Getenv("PORT")
	}
	if porta == "" {
		porta = ":8081" // Porta padrão do serviço de empréstimos
	} else if porta[0] != ':' {
		porta = ":" + porta
	}

	servidor := &http.Server{
		Addr:    porta,
		Handler: mux, // Posteriormente, adicionar middlewares de log, CORS e recuperação de pânico
	}

	// Inicia o servidor HTTP em uma goroutine paralela
	go func() {
		slog.Info("Servidor HTTP iniciando", slog.String("porta", porta))
		if err := servidor.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			slog.Error("Erro fatal no servidor HTTP ao escutar", slog.String("erro", err.Error()))
			os.Exit(1)
		}
	}()

	// Escuta sinais do sistema operacional para interrupção ordenada (Graceful Shutdown)
	canalSinal := make(chan os.Signal, 1)
	signal.Notify(canalSinal, syscall.SIGINT, syscall.SIGTERM)

	// Bloqueia a execução principal até capturar um sinal
	<-canalSinal
	slog.Info("Sinal de encerramento detectado. Iniciando Graceful Shutdown de segurança...")

	// Limita o tempo de espera para esvaziar conexões ativas antes de forçar a saída
	ctxDesligamento, cancelDesligamento := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancelDesligamento()

	// Encerra as rotas HTTP de forma ordenada
	if err := servidor.Shutdown(ctxDesligamento); err != nil {
		slog.Error("Falha ao desligar o servidor HTTP de forma graciosa", slog.String("erro", err.Error()))
	} else {
		slog.Info("Servidor HTTP encerrado com sucesso de forma ordenada.")
	}

	// Encerra o pool de conexões com o PostgreSQL
	slog.Info("Encerrando pool de conexões com o banco de dados...")
	poolBanco.Close()
	slog.Info("Pool de conexões com o banco finalizado com sucesso. Encerrando aplicação.")
}

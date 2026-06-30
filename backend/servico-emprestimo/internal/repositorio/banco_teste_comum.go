package repositorio

import (
	"context"
	"log/slog"
	"os"
	"testing"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/testcontainers/testcontainers-go"
	"github.com/testcontainers/testcontainers-go/modules/postgres"
	"github.com/testcontainers/testcontainers-go/wait"
)

// ObterPoolBancoTeste inicializa um banco de dados dinâmico via Testcontainers (Docker) ou efetua fallback para o banco local/Neon configurado.
func ObterPoolBancoTeste(ctx context.Context, t testing.TB) (*pgxpool.Pool, func()) {
	// 1. Tenta usar conexão via variáveis de ambiente primeiro
	urlBanco := os.Getenv("URL_BANCO_DADOS_TESTE")
	if urlBanco == "" {
		urlBanco = os.Getenv("URL_BANCO_DADOS")
	}

	if urlBanco != "" {
		pool, err := ConectarBanco(urlBanco)
		if err != nil {
			t.Fatalf("falha ao conectar no banco de testes configurado: %v", err)
		}

		// Garante a existência da tabela de empréstimos
		if err := criarTabelasDeTeste(ctx, pool); err != nil {
			pool.Close()
			t.Fatalf("falha ao assegurar estrutura de tabelas no banco de testes: %v", err)
		}

		cleanup := func() {
			pool.Close()
		}
		return pool, cleanup
	}

	// 2. Se não houver configuração de ambiente, tenta levantar o banco via Testcontainers (Docker)
	slog.Info("Variáveis de ambiente de banco ausentes. Tentando subir container do PostgreSQL via Testcontainers...")

	containerPostgres, err := postgres.Run(ctx,
		"postgres:16-alpine",
		postgres.WithDatabase("banco_emprestimos_teste"),
		postgres.WithUsername("usuario_teste"),
		postgres.WithPassword("senha_teste"),
		testcontainers.WithWaitStrategy(
			wait.ForLog("database system is ready to accept connections").
				WithOccurrence(2).
				WithStartupTimeout(30*time.Second),
		),
	)
	if err != nil {
		slog.Warn("Não foi possível inicializar o Testcontainers (Docker indisponível). Pulando teste...", slog.String("erro", err.Error()))
		t.Skip("Pulando teste de integração: Docker offline e variáveis de ambiente URL_BANCO_DADOS_TESTE/URL_BANCO_DADOS não fornecidas.")
		return nil, func() {}
	}

	connStr, err := containerPostgres.ConnectionString(ctx, "sslmode=disable")
	if err != nil {
		containerPostgres.Terminate(ctx)
		t.Fatalf("falha ao obter connection string do container de testes: %v", err)
	}

	pool, err := ConectarBanco(connStr)
	if err != nil {
		containerPostgres.Terminate(ctx)
		t.Fatalf("falha ao conectar no banco do container de testes: %v", err)
	}

	// Executa migrações/DDLs necessárias no banco dinâmico
	err = criarTabelasDeTeste(ctx, pool)
	if err != nil {
		pool.Close()
		containerPostgres.Terminate(ctx)
		t.Fatalf("falha ao executar migrações de teste no banco dinâmico: %v", err)
	}

	cleanup := func() {
		pool.Close()
		containerPostgres.Terminate(ctx)
	}

	return pool, cleanup
}

func criarTabelasDeTeste(ctx context.Context, pool *pgxpool.Pool) error {
	querySchema := `
	CREATE TABLE IF NOT EXISTS emprestimos (
		id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
		id_usuario UUID NOT NULL,
		id_livro UUID NOT NULL,
		id_biblioteca UUID NOT NULL,
		data_emprestimo TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
		data_devolucao_prevista TIMESTAMP NOT NULL,
		data_devolucao_real TIMESTAMP,
		estado VARCHAR(50) NOT NULL,
		criado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
		atualizado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
	);
	CREATE INDEX IF NOT EXISTS idx_emprestimos_id_usuario ON emprestimos(id_usuario);
	CREATE INDEX IF NOT EXISTS idx_emprestimos_id_livro ON emprestimos(id_livro);
	CREATE INDEX IF NOT EXISTS idx_emprestimos_estado ON emprestimos(estado);
	`
	_, err := pool.Exec(ctx, querySchema)
	return err
}

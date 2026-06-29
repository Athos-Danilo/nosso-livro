package repositorio

import (
	"context"
	"fmt"
	"log/slog"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
)

// ConectarBanco inicializa o pool de conexões com o PostgreSQL (Neon).
// Ele inclui um mecanismo de tentativas de conexão (retry) para lidar com o "cold start" (inicialização fria) do banco serverless.
func ConectarBanco(urlBanco string) (*pgxpool.Pool, error) {
	if urlBanco == "" {
		return nil, fmt.Errorf("a variável de ambiente contendo a URL do banco de dados está vazia")
	}

	var pool *pgxpool.Pool
	var err error
	ctx := context.Background()

	tentativasMaximas := 5
	intervaloEspera := 3 * time.Second

	for tentativa := 1; tentativa <= tentativasMaximas; tentativa++ {
		slog.Info("Tentando estabelecer conexão com o banco de dados...",
			slog.Int("tentativa", tentativa),
			slog.Int("total_tentativas", tentativasMaximas),
		)

		// Configuração básica e tentativa de criar o pool
		pool, err = pgxpool.New(ctx, urlBanco)
		if err == nil {
			// Executa um Ping para garantir que o banco está pronto e aceitando conexões
			err = pool.Ping(ctx)
			if err == nil {
				slog.Info("Conexão com o banco de dados de empréstimos estabelecida com sucesso!")
				return pool, nil
			}
		}

		slog.Warn("Falha ao conectar ao banco de dados. Aguardando para tentar novamente...",
			slog.String("erro", err.Error()),
			slog.Duration("espera", intervaloEspera),
		)
		if pool != nil {
			pool.Close()
		}
		time.Sleep(intervaloEspera)
	}

	return nil, fmt.Errorf("não foi possível se conectar ao banco de dados após %d tentativas: %w", tentativasMaximas, err)
}

package repositorio

import (
	"context"
	"fmt"
	"log"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
)

// ConectarBanco de dados inicializa o pool de conexões com o PostgreSQL (Neon).
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
		log.Printf("[Banco] Tentando estabelecer conexão com o banco de dados (tentativa %d/%d)...\n", tentativa, tentativasMaximas)

		// Configuração básica e tentativa de criar o pool
		pool, err = pgxpool.New(ctx, urlBanco)
		if err == nil {
			// Executa um Ping para garantir que o banco está pronto e aceitando conexões
			err = pool.Ping(ctx)
			if err == nil {
				log.Println("[Banco] Conexão com o banco de dados estabelecida com sucesso!")
				return pool, nil
			}
		}

		log.Printf("[Banco] Falha ao conectar: %v. Aguardando %v para tentar novamente...\n", err, intervaloEspera)
		if pool != nil {
			pool.Close()
		}
		time.Sleep(intervaloEspera)
	}

	return nil, fmt.Errorf("não foi possível se conectar ao banco de dados após %d tentativas: %w", tentativasMaximas, err)
}

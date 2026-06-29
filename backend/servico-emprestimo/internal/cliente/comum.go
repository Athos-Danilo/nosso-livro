package cliente

import (
	"context"
	"fmt"
	"log/slog"
	"net/http"
	"time"
)

// Constantes de resiliência HTTP
const (
	TimeoutRequisicao = 3 * time.Second
	MaxTentativas     = 3
	EsperaInicial     = 100 * time.Millisecond
)

// ClienteHTTPResiliente gerencia requisições HTTP internas de forma segura com retry e timeout
type ClienteHTTPResiliente struct {
	clienteHTTP *http.Client
}

// NovoClienteHTTPResiliente instancia o cliente HTTP com timeout configurado
func NovoClienteHTTPResiliente() *ClienteHTTPResiliente {
	return &ClienteHTTPResiliente{
		clienteHTTP: &http.Client{
			Timeout: TimeoutRequisicao,
		},
	}
}

// ExecutarRequisicaoComRetry executa a chamada HTTP aplicando retentativas e backoff exponencial
func (c *ClienteHTTPResiliente) ExecutarRequisicaoComRetry(ctx context.Context, req *http.Request) (*http.Response, error) {
	var resp *http.Response
	var err error
	espera := EsperaInicial

	for tentativa := 1; tentativa <= MaxTentativas; tentativa++ {
		// Aplica timeout rígido para a tentativa individual
		ctxTentativa, cancel := context.WithTimeout(ctx, TimeoutRequisicao)
		reqComCtx := req.WithContext(ctxTentativa)

		resp, err = c.clienteHTTP.Do(reqComCtx)
		cancel()

		if err == nil {
			// Retornos normais ou erros de negócio (ex: 404, 400) não geram retentativas
			if resp.StatusCode < 500 {
				return resp, nil
			}

			// Erros do servidor (5xx) qualificam para nova tentativa
			resp.Body.Close()
			err = fmt.Errorf("erro temporário do servidor: status HTTP %d", resp.StatusCode)
		}

		slog.Warn("Falha na tentativa de requisição HTTP interna",
			slog.Int("tentativa", tentativa),
			slog.Int("max_tentativas", MaxTentativas),
			slog.String("url", req.URL.String()),
			slog.String("erro", err.Error()),
		)

		if tentativa == MaxTentativas {
			break
		}

		// Backoff exponencial e checagem de cancelamento do contexto
		select {
		case <-ctx.Done():
			return nil, ctx.Err()
		case <-time.After(espera):
			espera *= 2
		}
	}

	return nil, fmt.Errorf("todas as %d tentativas de requisição HTTP falharam: %w", MaxTentativas, err)
}

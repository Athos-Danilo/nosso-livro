package middleware

import (
	"net/http"
	"strings"

	"nosso-livro/gateway-api/internal/configuracao"
)

// MiddlewareCORS cria um middleware HTTP que gerencia as politicas de CORS (Cross-Origin Resource Sharing).
func MiddlewareCORS(cfg *configuracao.Configuracao) func(http.Handler) http.Handler {
	// Divide as origens permitidas caso sejam passadas separadas por virgula
	origensPermitidas := strings.Split(cfg.CorsOrigensPermitidas, ",")
	for i, origem := range origensPermitidas {
		origensPermitidas[i] = strings.TrimSpace(origem)
	}

	return func(proximo http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			origemRequisicao := r.Header.Get("Origin")

			// Se houver cabecalho Origin, verifica se esta nas origens permitidas
			if origemRequisicao != "" {
				permitida := false
				if cfg.CorsOrigensPermitidas == "*" {
					permitida = true
				} else {
					for _, origem := range origensPermitidas {
						if origem == origemRequisicao {
							permitida = true
							break
						}
					}
				}

				if permitida {
					w.Header().Set("Access-Control-Allow-Origin", origemRequisicao)
					w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS, PATCH")
					w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With")
					w.Header().Set("Access-Control-Expose-Headers", "Content-Length")
				}
			}

			// Trata a requisicao de preflight (OPTIONS) de forma imediata
			if r.Method == http.MethodOptions {
				w.WriteHeader(http.StatusNoContent)
				return
			}

			proximo.ServeHTTP(w, r)
		})
	}
}

package middleware

import (
	"net/http"
)

// TamanhoMaximoCorpo define o limite de payload das requisicoes HTTP (2MB)
const TamanhoMaximoCorpo = 2 * 1024 * 1024

// MiddlewareSeguranca aplica cabecalhos de seguranca recomendados de borda e limita o tamanho de uploads.
func MiddlewareSeguranca(proximo http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// 1. Limita o tamanho do corpo da requisicao para evitar DoS
		r.Body = http.MaxBytesReader(w, r.Body, TamanhoMaximoCorpo)

		// 2. Injeta cabecalhos basicos de seguranca de borda
		w.Header().Set("X-Content-Type-Options", "nosniff")
		w.Header().Set("X-Frame-Options", "DENY")

		proximo.ServeHTTP(w, r)
	})
}

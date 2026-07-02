package middleware

import (
	"log/slog"
	"net/http"
	"time"
)

// respostaGravadorLocal encapsula http.ResponseWriter para interceptar o status HTTP de retorno.
type respostaGravadorLocal struct {
	http.ResponseWriter
	codigoStatus int
}

func (r *respostaGravadorLocal) WriteHeader(codigoStatus int) {
	r.codigoStatus = codigoStatus
	r.ResponseWriter.WriteHeader(codigoStatus)
}

func (r *respostaGravadorLocal) Write(dados []byte) (int, error) {
	if r.codigoStatus == 0 {
		r.codigoStatus = http.StatusOK
	}
	return r.ResponseWriter.Write(dados)
}

// MiddlewareLogs intercepta todas as requisições HTTP para gerar logs estruturados em JSON (PT-BR).
func MiddlewareLogs(proximo http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		inicio := time.Now()

		gravador := &respostaGravadorLocal{
			ResponseWriter: w,
			codigoStatus:   http.StatusOK,
		}

		proximo.ServeHTTP(gravador, r)

		latencia := time.Since(inicio)

		ipOrigem := r.Header.Get("X-Forwarded-For")
		if ipOrigem == "" {
			ipOrigem = r.RemoteAddr
		}

		slog.Info("Requisicao processada",
			slog.String("ip_origem", ipOrigem),
			slog.String("metodo", r.Method),
			slog.String("uri", r.RequestURI),
			slog.Int("status", gravador.codigoStatus),
			slog.String("latencia", latencia.String()),
		)
	})
}

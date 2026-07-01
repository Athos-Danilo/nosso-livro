package logger

import (
	"log/slog"
	"os"
)

// Inicializar configura o slog como logger padrao do sistema com base no ambiente.
func Inicializar(ambiente string) {
	nivel := slog.LevelInfo
	if ambiente == "desenvolvimento" {
		nivel = slog.LevelDebug
	}

	manipulador := slog.NewJSONHandler(os.Stdout, &slog.HandlerOptions{
		Level: nivel,
	})

	logger := slog.New(manipulador)
	slog.SetDefault(logger)
}

package logger

import (
	"log/slog"
	"os"
)

// Inicializar configura o slog como logger padrao do sistema com formato JSON e chaves em portugues.
func Inicializar(ambiente string) {
	nivel := slog.LevelInfo
	if ambiente == "desenvolvimento" {
		nivel = slog.LevelDebug
	}

	manipulador := slog.NewJSONHandler(os.Stdout, &slog.HandlerOptions{
		Level: nivel,
		ReplaceAttr: func(grupos []string, a slog.Attr) slog.Attr {
			switch a.Key {
			case slog.TimeKey:
				return slog.Attr{Key: "timestamp", Value: a.Value}
			case slog.LevelKey:
				valorNivel := a.Value.String()
				switch valorNivel {
				case "INFO":
					valorNivel = "INFO"
				case "DEBUG":
					valorNivel = "DEPURACAO"
				case "WARN":
					valorNivel = "AVISO"
				case "ERROR":
					valorNivel = "ERRO"
				}
				return slog.Attr{Key: "nivel", Value: slog.StringValue(valorNivel)}
			case slog.MessageKey:
				return slog.Attr{Key: "mensagem", Value: a.Value}
			}
			return a
		},
	})

	logger := slog.New(manipulador)
	slog.SetDefault(logger)
}

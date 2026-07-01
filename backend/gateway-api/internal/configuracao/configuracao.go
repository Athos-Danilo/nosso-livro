package configuracao

import (
	"log/slog"
	"os"

	"github.com/joho/godotenv"
)

// Configuracao centraliza todas as variaveis de ambiente mapeadas do Gateway.
type Configuracao struct {
	Porta                  string
	Ambiente               string
	ChaveSecretaJWT        string
	CorsOrigensPermitidas  string
	UrlServicoUsuario      string
	UrlServicoCatalogo     string
	UrlServicoEmprestimo   string
	UrlServicoReserva      string
	UrlServicoRecomendacao string
}

// Carregar le as configuracoes a partir do ambiente ou de um arquivo .env opcional.
func Carregar() *Configuracao {
	// Tenta carregar o arquivo .env se ele existir localmente
	if err := godotenv.Load(); err != nil {
		slog.Debug("Nenhum arquivo .env encontrado. Usando variaveis de ambiente do sistema.")
	}

	porta := os.Getenv("PORTA")
	if porta == "" {
		porta = "3000"
	}

	ambiente := os.Getenv("AMBIENTE")
	if ambiente == "" {
		ambiente = "desenvolvimento"
	}

	chaveSecretaJWT := os.Getenv("CHAVE_SECRETA_JWT")
	if chaveSecretaJWT == "" {
		chaveSecretaJWT = "chave_secreta_padrao_desenvolvimento_nosso_livro"
	}

	corsOrigens := os.Getenv("CORS_ORIGENS_PERMITIDAS")
	if corsOrigens == "" {
		corsOrigens = "*"
	}

	urlUsuario := os.Getenv("URL_SERVICO_USUARIO")
	if urlUsuario == "" {
		urlUsuario = "http://localhost:8080"
	}

	urlCatalogo := os.Getenv("URL_SERVICO_CATALOGO")
	if urlCatalogo == "" {
		urlCatalogo = "http://localhost:8000"
	}

	urlEmprestimo := os.Getenv("URL_SERVICO_EMPRESTIMO")
	if urlEmprestimo == "" {
		urlEmprestimo = "http://localhost:8081"
	}

	urlReserva := os.Getenv("URL_SERVICO_RESERVA")
	if urlReserva == "" {
		urlReserva = "http://localhost:3001"
	}

	urlRecomendacao := os.Getenv("URL_SERVICO_RECOMENDACAO")
	if urlRecomendacao == "" {
		urlRecomendacao = "http://localhost:8001"
	}

	return &Configuracao{
		Porta:                  porta,
		Ambiente:               ambiente,
		ChaveSecretaJWT:        chaveSecretaJWT,
		CorsOrigensPermitidas:  corsOrigens,
		UrlServicoUsuario:      urlUsuario,
		UrlServicoCatalogo:     urlCatalogo,
		UrlServicoEmprestimo:   urlEmprestimo,
		UrlServicoReserva:      urlReserva,
		UrlServicoRecomendacao: urlRecomendacao,
	}
}

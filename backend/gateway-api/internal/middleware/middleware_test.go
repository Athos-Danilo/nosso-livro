package middleware

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
	"time"

	"github.com/golang-jwt/jwt/v5"

	"nosso-livro/gateway-api/internal/configuracao"
)

// TesteMiddlewareCORS_Preflight valida que o middleware responde com 204 No Content
// para requisições de preflight (OPTIONS) e injeta os cabeçalhos de CORS corretos.
func TesteMiddlewareCORS_Preflight(t *testing.T) {
	configuracaoCORS := &configuracao.Configuracao{
		CorsOrigensPermitidas: "http://localhost:5173",
	}

	middlewareCORS := MiddlewareCORS(configuracaoCORS)
	manipuladorDestino := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		t.Error("O manipulador de destino não deveria ser chamado para requisições OPTIONS")
	})

	manipuladorComCORS := middlewareCORS(manipuladorDestino)

	// Cria uma requisição do tipo OPTIONS (Preflight)
	requisicao, erro := http.NewRequest(http.MethodOptions, "/api/livros", nil)
	if erro != nil {
		t.Fatalf("Falha ao criar requisição de teste: %v", erro)
	}
	requisicao.Header.Set("Origin", "http://localhost:5173")

	gravadorResposta := httptest.NewRecorder()
	manipuladorComCORS.ServeHTTP(gravadorResposta, requisicao)

	// Valida se o status retornado é 204 No Content
	if gravadorResposta.Code != http.StatusNoContent {
		t.Errorf("Esperava status 204 No Content, mas obteve %d", gravadorResposta.Code)
	}

	// Valida os cabeçalhos injetados
	origemPermitida := gravadorResposta.Header().Get("Access-Control-Allow-Origin")
	if origemPermitida != "http://localhost:5173" {
		t.Errorf("Esperava Access-Control-Allow-Origin 'http://localhost:5173', mas obteve '%s'", origemPermitida)
	}

	metodosPermitidos := gravadorResposta.Header().Get("Access-Control-Allow-Methods")
	if metodosPermitidos != "GET, POST, PUT, DELETE, OPTIONS, PATCH" {
		t.Errorf("Esperava métodos permitidos padrão, mas obteve '%s'", metodosPermitidos)
	}
}

// TesteMiddlewareCORS_OrigemPermitida valida que requisições de origens permitidas
// recebem os cabeçalhos de CORS e continuam para o próximo handler.
func TesteMiddlewareCORS_OrigemPermitida(t *testing.T) {
	configuracaoCORS := &configuracao.Configuracao{
		CorsOrigensPermitidas: "http://localhost:5173,http://localhost:3000",
	}

	middlewareCORS := MiddlewareCORS(configuracaoCORS)
	foiChamado := false
	manipuladorDestino := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		foiChamado = true
		w.WriteHeader(http.StatusOK)
	})

	manipuladorComCORS := middlewareCORS(manipuladorDestino)

	// Cria uma requisição GET simulada
	requisicao, erro := http.NewRequest(http.MethodGet, "/api/livros", nil)
	if erro != nil {
		t.Fatalf("Falha ao criar requisição de teste: %v", erro)
	}
	requisicao.Header.Set("Origin", "http://localhost:3000")

	gravadorResposta := httptest.NewRecorder()
	manipuladorComCORS.ServeHTTP(gravadorResposta, requisicao)

	if !foiChamado {
		t.Error("O manipulador de destino deveria ter sido chamado")
	}

	origemPermitida := gravadorResposta.Header().Get("Access-Control-Allow-Origin")
	if origemPermitida != "http://localhost:3000" {
		t.Errorf("Esperava Access-Control-Allow-Origin 'http://localhost:3000', mas obteve '%s'", origemPermitida)
	}
}

// TesteMiddlewareCORS_OrigemNaoPermitida valida que origens não configuradas
// não recebem os cabeçalhos de CORS.
func TesteMiddlewareCORS_OrigemNaoPermitida(t *testing.T) {
	configuracaoCORS := &configuracao.Configuracao{
		CorsOrigensPermitidas: "http://localhost:5173",
	}

	middlewareCORS := MiddlewareCORS(configuracaoCORS)
	foiChamado := false
	manipuladorDestino := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		foiChamado = true
		w.WriteHeader(http.StatusOK)
	})

	manipuladorComCORS := middlewareCORS(manipuladorDestino)

	// Cria uma requisição GET vinda de origem não cadastrada
	requisicao, erro := http.NewRequest(http.MethodGet, "/api/livros", nil)
	if erro != nil {
		t.Fatalf("Falha ao criar requisição de teste: %v", erro)
	}
	requisicao.Header.Set("Origin", "http://origem-invasora.com")

	gravadorResposta := httptest.NewRecorder()
	manipuladorComCORS.ServeHTTP(gravadorResposta, requisicao)

	if !foiChamado {
		t.Error("O manipulador de destino deveria ter sido chamado")
	}

	origemPermitida := gravadorResposta.Header().Get("Access-Control-Allow-Origin")
	if origemPermitida != "" {
		t.Errorf("Não esperava cabeçalho Access-Control-Allow-Origin para origem não permitida, mas obteve '%s'", origemPermitida)
	}
}

// TesteMiddlewareAutenticacao_TokenValido valida que uma requisição com token JWT válido
// é aceita e tem seus cabeçalhos internos X-Usuario-* injetados corretamente.
func TesteMiddlewareAutenticacao_TokenValido(t *testing.T) {
	chaveSecretaTeste := "chave_de_teste_segura_gateway_123"
	configuracaoAutenticacao := &configuracao.Configuracao{
		ChaveSecretaJWT: chaveSecretaTeste,
	}

	// Gera um token válido
	tokenClaims := jwt.MapClaims{
		"sub":      "usuario_id_123",
		"email":    "usuario@teste.com",
		"whatsapp": "5511999999999",
		"permissao": "administrador",
		"exp":      time.Now().Add(time.Hour).Unix(),
	}
	token := jwt.NewWithClaims(jwt.SigningMethodHMAC256, tokenClaims)
	tokenAssinado, erroAssinatura := token.SignedString([]byte(chaveSecretaTeste))
	if erroAssinatura != nil {
		t.Fatalf("Falha ao assinar token de teste: %v", erroAssinatura)
	}

	middlewareAutenticacao := MiddlewareAutenticacao(configuracaoAutenticacao)
	cabecalhosVerificados := false

	manipuladorDestino := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		cabecalhosVerificados = true

		// Verifica se os cabeçalhos internos foram injetados corretamente no request
		idUsuario := r.Header.Get("X-Usuario-ID")
		if idUsuario != "usuario_id_123" {
			t.Errorf("Esperava X-Usuario-ID 'usuario_id_123', obtido '%s'", idUsuario)
		}

		emailUsuario := r.Header.Get("X-Usuario-Email")
		if emailUsuario != "usuario@teste.com" {
			t.Errorf("Esperava X-Usuario-Email 'usuario@teste.com', obtido '%s'", emailUsuario)
		}

		whatsappUsuario := r.Header.Get("X-Usuario-WhatsApp")
		if whatsappUsuario != "5511999999999" {
			t.Errorf("Esperava X-Usuario-WhatsApp '5511999999999', obtido '%s'", whatsappUsuario)
		}

		permissaoUsuario := r.Header.Get("X-Usuario-Permissao")
		if permissaoUsuario != "administrador" {
			t.Errorf("Esperava X-Usuario-Permissao 'administrador', obtido '%s'", permissaoUsuario)
		}

		w.WriteHeader(http.StatusOK)
	})

	manipuladorComAutenticacao := middlewareAutenticacao(manipuladorDestino)

	requisicao, erro := http.NewRequest(http.MethodGet, "/api/usuarios/me", nil)
	if erro != nil {
		t.Fatalf("Falha ao criar requisição: %v", erro)
	}
	requisicao.Header.Set("Authorization", "Bearer "+tokenAssinado)

	gravadorResposta := httptest.NewRecorder()
	manipuladorComAutenticacao.ServeHTTP(gravadorResposta, requisicao)

	if gravadorResposta.Code != http.StatusOK {
		t.Errorf("Esperava status 200 OK, obtido %d", gravadorResposta.Code)
	}

	if !cabecalhosVerificados {
		t.Error("O manipulador de destino deveria ter sido executado")
	}
}

// TesteMiddlewareAutenticacao_TokenInvalido valida que requisições com tokens expirados,
// corrompidos ou assinados com chave incorreta sejam bloqueadas com status 401 Unauthorized
// e apresentem resposta JSON explicativa em português.
func TesteMiddlewareAutenticacao_TokenInvalido(t *testing.T) {
	chaveSecretaTeste := "chave_de_teste_segura_gateway_123"
	configuracaoAutenticacao := &configuracao.Configuracao{
		ChaveSecretaJWT: chaveSecretaTeste,
	}

	middlewareAutenticacao := MiddlewareAutenticacao(configuracaoAutenticacao)

	// Define os cenários de teste para tokens inválidos
	cenarios := []struct {
		nomeCenario       string
		prepararCabecalho func() string
		erroEsperado      string
	}{
		{
			nomeCenario: "Sem Token de Autenticação",
			prepararCabecalho: func() string {
				return ""
			},
			erroEsperado: "Token de autenticacao nao fornecido.",
		},
		{
			nomeCenario: "Formato do Token Inválido",
			prepararCabecalho: func() string {
				return "TokenSemBearer12345"
			},
			erroEsperado: "Formato de token invalido. Use 'Bearer <token>'.",
		},
		{
			nomeCenario: "Token Assinado com Chave Incorreta",
			prepararCabecalho: func() string {
				tokenClaims := jwt.MapClaims{
					"sub": "usuario_id_123",
					"exp": time.Now().Add(time.Hour).Unix(),
				}
				token := jwt.NewWithClaims(jwt.SigningMethodHMAC256, tokenClaims)
				tokenAssinado, _ := token.SignedString([]byte("chave_totalmente_errada_e_invalida"))
				return "Bearer " + tokenAssinado
			},
			erroEsperado: "Token invalido ou expirado.",
		},
		{
			nomeCenario: "Token Expirado",
			prepararCabecalho: func() string {
				tokenClaims := jwt.MapClaims{
					"sub": "usuario_id_123",
					"exp": time.Now().Add(-time.Hour).Unix(), // Expirado há 1 hora
				}
				token := jwt.NewWithClaims(jwt.SigningMethodHMAC256, tokenClaims)
				tokenAssinado, _ := token.SignedString([]byte(chaveSecretaTeste))
				return "Bearer " + tokenAssinado
			},
			erroEsperado: "Token invalido ou expirado.",
		},
		{
			nomeCenario: "Token Corrompido",
			prepararCabecalho: func() string {
				return "Bearer cabecalho.corrompido.assinatura"
			},
			erroEsperado: "Token invalido ou expirado.",
		},
	}

	for _, cenario := range cenarios {
		t.Run(cenario.nomeCenario, func(t *testing.T) {
			manipuladorDestino := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
				t.Error("O manipulador de destino não deveria ter sido chamado para token inválido")
			})

			manipuladorComAutenticacao := middlewareAutenticacao(manipuladorDestino)

			requisicao, erro := http.NewRequest(http.MethodGet, "/api/usuarios/me", nil)
			if erro != nil {
				t.Fatalf("Falha ao criar requisição: %v", erro)
			}

			cabecalhoAutorizacao := cenario.prepararCabecalho()
			if cabecalhoAutorizacao != "" {
				requisicao.Header.Set("Authorization", cabecalhoAutorizacao)
			}

			gravadorResposta := httptest.NewRecorder()
			manipuladorComAutenticacao.ServeHTTP(gravadorResposta, requisicao)

			// Valida se barrou com 401 Unauthorized
			if gravadorResposta.Code != http.StatusUnauthorized {
				t.Errorf("Esperava status 401 Unauthorized, mas obteve %d", gravadorResposta.Code)
			}

			// Valida o corpo do JSON de erro em português
			var respostaCorpo map[string]string
			erroDecodificacao := json.NewDecoder(gravadorResposta.Body).Decode(&respostaCorpo)
			if erroDecodificacao != nil {
				t.Fatalf("Falha ao decodificar corpo de erro: %v", erroDecodificacao)
			}

			mensagemErroObtida := respostaCorpo["erro"]
			if !strings.EqualFold(mensagemErroObtida, cenario.erroEsperado) {
				t.Errorf("Esperava mensagem de erro '%s', mas obteve '%s'", cenario.erroEsperado, mensagemErroObtida)
			}
		})
	}
}

// TesteMiddlewareAutenticacao_RotaPublica valida que requisições direcionadas
// para rotas públicas permitidas dão bypass na autenticação, sem exigir token.
func TesteMiddlewareAutenticacao_RotaPublica(t *testing.T) {
	configuracaoAutenticacao := &configuracao.Configuracao{
		ChaveSecretaJWT: "qualquer_chave",
	}

	middlewareAutenticacao := MiddlewareAutenticacao(configuracaoAutenticacao)

	rotasPublicasTeste := []struct {
		metodo  string
		caminho string
	}{
		{http.MethodPost, "/api/autenticacao/cadastro"},
		{http.MethodPost, "/api/autenticacao/login"},
		{http.MethodGet, "/saude"},
		{http.MethodGet, "/pronto"},
	}

	for _, rota := range rotasPublicasTeste {
		t.Run(rota.metodo+" "+rota.caminho, func(t *testing.T) {
			foiChamado := false
			manipuladorDestino := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
				foiChamado = true
				w.WriteHeader(http.StatusOK)
			})

			manipuladorComAutenticacao := middlewareAutenticacao(manipuladorDestino)

			// Cria requisição para rota pública sem token (sem header Authorization)
			requisicao, erro := http.NewRequest(rota.metodo, rota.caminho, nil)
			if erro != nil {
				t.Fatalf("Falha ao criar requisição: %v", erro)
			}

			gravadorResposta := httptest.NewRecorder()
			manipuladorComAutenticacao.ServeHTTP(gravadorResposta, requisicao)

			if gravadorResposta.Code != http.StatusOK {
				t.Errorf("Esperava status 200 OK para rota pública, mas obteve %d", gravadorResposta.Code)
			}

			if !foiChamado {
				t.Error("O manipulador de destino deveria ter sido executado para a rota pública")
			}
		})
	}
}

// TesteMiddlewareAutenticacao_PrevenirSpoofing valida que o middleware de autenticação
// limpa preventivamente quaisquer cabeçalhos que iniciem com X-Usuario- inseridos de
// forma maliciosa pelo cliente externo original.
func TesteMiddlewareAutenticacao_PrevenirSpoofing(t *testing.T) {
	chaveSecretaTeste := "chave_de_teste_segura_gateway_123"
	configuracaoAutenticacao := &configuracao.Configuracao{
		ChaveSecretaJWT: chaveSecretaTeste,
	}

	middlewareAutenticacao := MiddlewareAutenticacao(configuracaoAutenticacao)
	cabecalhosVerificados := false

	manipuladorDestino := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		cabecalhosVerificados = true

		// Deve limpar os cabeçalhos de spoofing originais.
		// Como não enviamos token de autenticação e a rota é pública, os cabeçalhos devem ser vazios
		// (removidos pela função limparCabecalhosSpoofing).
		idUsuarioFalsificado := r.Header.Get("X-Usuario-ID")
		if idUsuarioFalsificado != "" {
			t.Errorf("O cabeçalho X-Usuario-ID deveria ter sido limpo, mas obteve '%s'", idUsuarioFalsificado)
		}

		permissaoFalsificada := r.Header.Get("X-Usuario-Permissao")
		if permissaoFalsificada != "" {
			t.Errorf("O cabeçalho X-Usuario-Permissao deveria ter sido limpo, mas obteve '%s'", permissaoFalsificada)
		}

		w.WriteHeader(http.StatusOK)
	})

	manipuladorComAutenticacao := middlewareAutenticacao(manipuladorDestino)

	// Enviamos uma requisição para rota pública, contendo cabeçalhos maliciosos (spoofing)
	requisicao, erro := http.NewRequest(http.MethodGet, "/saude", nil)
	if erro != nil {
		t.Fatalf("Falha ao criar requisição: %v", erro)
	}
	requisicao.Header.Set("X-Usuario-ID", "99999")
	requisicao.Header.Set("X-Usuario-Permissao", "administrador_falso")

	gravadorResposta := httptest.NewRecorder()
	manipuladorComAutenticacao.ServeHTTP(gravadorResposta, requisicao)

	if gravadorResposta.Code != http.StatusOK {
		t.Errorf("Esperava status 200 OK, obtido %d", gravadorResposta.Code)
	}

	if !cabecalhosVerificados {
		t.Error("O manipulador de destino deveria ter sido executado")
	}
}

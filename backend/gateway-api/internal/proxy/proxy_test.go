package proxy_test

import (
	"bytes"
	"encoding/json"
	"io"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
	"time"

	"github.com/golang-jwt/jwt/v5"

	"nosso-livro/gateway-api/internal/configuracao"
	"nosso-livro/gateway-api/internal/middleware"
	"nosso-livro/gateway-api/internal/proxy"
)

// TesteProxyRoteamento_FluxoCompleto realiza testes integrados verificando
// o roteamento de solicitações públicas e protegidas por meio do Gateway de API
// para servidores mockados representando os microsserviços do monorepo.
func TesteProxyRoteamento_FluxoCompleto(t *testing.T) {
	chaveSecretaTeste := "chave_secreta_de_integracao_do_gateway_123"

	// 1. Inicializa o Microsserviço de Usuário simulado (Mock)
	servidorUsuarioMock := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// Valida se o cabeçalho de spoofing foi limpo pelo Gateway
		if r.Header.Get("X-Usuario-ID") != "" && r.URL.Path == "/api/autenticacao/cadastro" {
			t.Error("O cabeçalho X-Usuario-ID deveria estar vazio para rota pública")
		}

		// Se for a rota de cadastro, valida o payload recebido
		if r.URL.Path == "/api/autenticacao/cadastro" {
			corpo, erroLeitura := io.ReadAll(r.Body)
			if erroLeitura != nil {
				t.Fatalf("Erro ao ler corpo no mock de usuário: %v", erroLeitura)
			}
			if !strings.Contains(string(corpo), "usuario_teste") {
				t.Errorf("Esperava corpo contendo 'usuario_teste', obtido '%s'", string(corpo))
			}
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusCreated)
			w.Write([]byte(`{"mensagem": "Cadastro realizado com sucesso"}`))
			return
		}

		w.WriteHeader(http.StatusNotFound)
	}))
	defer servidorUsuarioMock.Close()

	// 2. Inicializa o Microsserviço de Catálogo simulado (Mock)
	servidorCatalogoMock := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// Verifica se os cabeçalhos propagados do contexto de autenticação estão corretos
		idUsuario := r.Header.Get("X-Usuario-ID")
		emailUsuario := r.Header.Get("X-Usuario-Email")
		permissaoUsuario := r.Header.Get("X-Usuario-Permissao")

		if idUsuario != "usuario_123" {
			t.Errorf("Esperava X-Usuario-ID 'usuario_123', obtido '%s'", idUsuario)
		}
		if emailUsuario != "usuario@teste.com" {
			t.Errorf("Esperava X-Usuario-Email 'usuario@teste.com', obtido '%s'", emailUsuario)
		}
		if permissaoUsuario != "membro" {
			t.Errorf("Esperava X-Usuario-Permissao 'membro', obtido '%s'", permissaoUsuario)
		}

		// Garante que cabeçalhos extras de spoofing enviados pelo cliente não estejam presentes
		if r.Header.Get("X-Usuario-Falsificado") != "" {
			t.Error("Detectado cabeçalho de spoofing que deveria ter sido limpo")
		}

		if r.URL.Path == "/api/livros/123" {
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusOK)
			w.Write([]byte(`{"id": 123, "titulo": "O Senhor dos Anéis"}`))
			return
		}

		w.WriteHeader(http.StatusNotFound)
	}))
	defer servidorCatalogoMock.Close()

	// 3. Cria a configuração apontando para os servidores mockados
	cfg := &configuracao.Configuracao{
		ChaveSecretaJWT:       chaveSecretaTeste,
		CorsOrigensPermitidas: "*",
		UrlServicoUsuario:      servidorUsuarioMock.URL,
		UrlServicoCatalogo:     servidorCatalogoMock.URL,
	}

	// 4. Cria os proxies usando o pacote de proxy interno
	proxyUsuario, erroProxyUsuario := proxy.NovoProxyReverso(cfg.UrlServicoUsuario)
	if erroProxyUsuario != nil {
		t.Fatalf("Erro ao criar proxy do usuário: %v", erroProxyUsuario)
	}

	proxyCatalogo, erroProxyCatalogo := proxy.NovoProxyReverso(cfg.UrlServicoCatalogo)
	if erroProxyCatalogo != nil {
		t.Fatalf("Erro ao criar proxy do catálogo: %v", erroProxyCatalogo)
	}

	// 5. Configura o Roteador Mux do Gateway
	mux := http.NewServeMux()
	mux.Handle("/api/autenticacao/", proxyUsuario)
	mux.Handle("/api/usuarios/", proxyUsuario)
	mux.Handle("/api/livros/", proxyCatalogo)

	// Encadeia os middlewares globais na ordem correta
	var handlerGlobal http.Handler = mux
	handlerGlobal = middleware.MiddlewareAutenticacao(cfg)(handlerGlobal)
	handlerGlobal = middleware.MiddlewareCORS(cfg)(handlerGlobal)
	handlerGlobal = middleware.MiddlewareSeguranca(handlerGlobal)

	// Inicializa o servidor Gateway de teste
	servidorGateway := httptest.NewServer(handlerGlobal)
	defer servidorGateway.Close()

	clienteHTTP := &http.Client{Timeout: 5 * time.Second}

	// Cenário A: Requisição para Rota Pública (Cadastro) sem Token
	t.Run("Rota Pública - Cadastro", func(t *testing.T) {
		corpoRequisicao := `{"usuario_teste": "cadastro_valido", "senha": "123"}`
		requisicao, erro := http.NewRequest(http.MethodPost, servidorGateway.URL+"/api/autenticacao/cadastro", bytes.NewBufferString(corpoRequisicao))
		if erro != nil {
			t.Fatalf("Falha ao criar requisição: %v", erro)
		}
		requisicao.Header.Set("Content-Type", "application/json")
		// Tentativa de spoofing simulado
		requisicao.Header.Set("X-Usuario-ID", "999")

		resposta, erroEnvio := clienteHTTP.Do(requisicao)
		if erroEnvio != nil {
			t.Fatalf("Falha ao enviar requisição ao Gateway: %v", erroEnvio)
		}
		defer resposta.Body.Close()

		if resposta.StatusCode != http.StatusCreated {
			t.Errorf("Esperava status 201 Created no Gateway, obtido %d", resposta.StatusCode)
		}

		corpoResposta, _ := io.ReadAll(resposta.Body)
		if !strings.Contains(string(corpoResposta), "Cadastro realizado com sucesso") {
			t.Errorf("Resposta inesperada do Gateway: %s", string(corpoResposta))
		}
	})

	// Cenário B: Requisição para Rota Protegida (Catálogo) com Token Válido
	t.Run("Rota Protegida - Catálogo com Token Válido", func(t *testing.T) {
		tokenClaims := jwt.MapClaims{
			"sub":      "usuario_123",
			"email":    "usuario@teste.com",
			"permissao": "membro",
			"exp":      time.Now().Add(time.Hour).Unix(),
		}
		token := jwt.NewWithClaims(jwt.SigningMethodHMAC256, tokenClaims)
		tokenAssinado, _ := token.SignedString([]byte(chaveSecretaTeste))

		requisicao, erro := http.NewRequest(http.MethodGet, servidorGateway.URL+"/api/livros/123", nil)
		if erro != nil {
			t.Fatalf("Falha ao criar requisição: %v", erro)
		}
		requisicao.Header.Set("Authorization", "Bearer "+tokenAssinado)
		// Envia cabeçalhos extras para testar limpeza de spoofing de outros cabeçalhos X-Usuario- personalizados
		requisicao.Header.Set("X-Usuario-Falsificado", "valor_falso")

		resposta, erroEnvio := clienteHTTP.Do(requisicao)
		if erroEnvio != nil {
			t.Fatalf("Falha ao enviar requisição ao Gateway: %v", erroEnvio)
		}
		defer resposta.Body.Close()

		if resposta.StatusCode != http.StatusOK {
			t.Errorf("Esperava status 200 OK no Gateway, obtido %d", resposta.StatusCode)
		}

		corpoResposta, _ := io.ReadAll(resposta.Body)
		if !strings.Contains(string(corpoResposta), "O Senhor dos Anéis") {
			t.Errorf("Resposta inesperada do catálogo no Gateway: %s", string(corpoResposta))
		}
	})
}

// TesteProxyRoteamento_IndisponibilidadeServico valida que o Gateway trata erros de rede
// graciosamente quando o microsserviço de destino está indisponível/offline.
func TesteProxyRoteamento_IndisponibilidadeServico(t *testing.T) {
	// Cria uma configuração apontando para um endereço inalcançável
	cfg := &configuracao.Configuracao{
		ChaveSecretaJWT:       "chave_secreta_qualquer",
		CorsOrigensPermitidas: "*",
		UrlServicoUsuario:      "http://localhost:59999", // Porta inativa/offline
	}

	proxyUsuario, erroProxy := proxy.NovoProxyReverso(cfg.UrlServicoUsuario)
	if erroProxy != nil {
		t.Fatalf("Erro ao criar proxy: %v", erroProxy)
	}

	mux := http.NewServeMux()
	mux.Handle("/api/autenticacao/", proxyUsuario)

	var handlerGlobal http.Handler = mux
	handlerGlobal = middleware.MiddlewareAutenticacao(cfg)(handlerGlobal)

	servidorGateway := httptest.NewServer(handlerGlobal)
	defer servidorGateway.Close()

	clienteHTTP := &http.Client{Timeout: 5 * time.Second}

	// Envia requisição para a rota pública
	requisicao, erro := http.NewRequest(http.MethodPost, servidorGateway.URL+"/api/autenticacao/cadastro", bytes.NewBufferString(`{}`))
	if erro != nil {
		t.Fatalf("Falha ao criar requisição: %v", erro)
	}

	resposta, erroEnvio := clienteHTTP.Do(requisicao)
	if erroEnvio != nil {
		t.Fatalf("Falha ao enviar requisição ao Gateway: %v", erroEnvio)
	}
	defer resposta.Body.Close()

	// Deve retornar 503 Service Unavailable conforme M5.2
	if resposta.StatusCode != http.StatusServiceUnavailable {
		t.Errorf("Esperava status 503 Service Unavailable, obtido %d", resposta.StatusCode)
	}

	corpoResposta, _ := io.ReadAll(resposta.Body)
	var respostaErro map[string]string
	if erroJson := json.Unmarshal(corpoResposta, &respostaErro); erroJson != nil {
		t.Fatalf("Erro ao decodificar JSON de erro: %v", erroJson)
	}

	mensagemEsperada := "Serviço interno temporariamente indisponível. Tente novamente mais tarde."
	if respostaErro["erro"] != mensagemEsperada {
		t.Errorf("Esperava mensagem de erro '%s', obtida '%s'", mensagemEsperada, respostaErro["erro"])
	}
}

package middleware

import (
	"fmt"
	"net/http"
	"strings"

	"github.com/golang-jwt/jwt/v5"

	"nosso-livro/gateway-api/internal/configuracao"
)

// verificarRotaPublica verifica se a rota atual ignora a obrigatoriedade do token.
func verificarRotaPublica(metodo, caminho string) bool {
	rotasPublicas := map[string]bool{
		"POST /api/autenticacao/cadastro": true,
		"POST /api/autenticacao/login":    true,
		"GET /saude":                      true,
		"GET /pronto":                     true,
	}

	chave := fmt.Sprintf("%s %s", metodo, caminho)
	if rotasPublicas[chave] {
		return true
	}
	
	// Tratar rotas sem metodo especifico (Health/Readiness probes tambem podem ser diretas)
	if caminho == "/saude" || caminho == "/pronto" {
		return true
	}

	return false
}

// limparCabecalhosSpoofing remove qualquer cabecalho interno enviado maliciosamente pelo cliente.
func limparCabecalhosSpoofing(r *http.Request) {
	for chave := range r.Header {
		if strings.HasPrefix(strings.ToUpper(chave), "X-USUARIO-") {
			r.Header.Del(chave)
		}
	}
}

// erroNaoAutorizado responde a requisicao com status 401 e um JSON padronizado em PT-BR.
func erroNaoAutorizado(w http.ResponseWriter, mensagem string) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusUnauthorized)
	fmt.Fprintf(w, `{"erro": "%s"}`, mensagem)
}

// MiddlewareAutenticacao intercepta as requisicoes para extrair e validar o token JWT.
func MiddlewareAutenticacao(cfg *configuracao.Configuracao) func(http.Handler) http.Handler {
	return func(proximo http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			// 1. Limpa cabecalhos falsificados de spoofing antes de qualquer processamento (M4.3)
			limparCabecalhosSpoofing(r)

			// 2. Verifica se a rota eh publica e pode pular a autenticacao (M4.2)
			if verificarRotaPublica(r.Method, r.URL.Path) {
				proximo.ServeHTTP(w, r)
				return
			}

			// 3. Extrai o token do cabecalho Authorization (M4.1)
			cabecalhoAuth := r.Header.Get("Authorization")
			if cabecalhoAuth == "" {
				erroNaoAutorizado(w, "Token de autenticacao nao fornecido.")
				return
			}

			partes := strings.Split(cabecalhoAuth, " ")
			if len(partes) != 2 || strings.ToLower(partes[0]) != "bearer" {
				erroNaoAutorizado(w, "Formato de token invalido. Use 'Bearer <token>'.")
				return
			}
			tokenString := partes[1]

			// 4. Valida a assinatura e decodifica as claims do token (M4.1)
			token, err := jwt.Parse(tokenString, func(token *jwt.Token) (interface{}, error) {
				// Verifica o metodo de assinatura esperado
				if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
					return nil, fmt.Errorf("metodo de assinatura inesperado: %v", token.Header["alg"])
				}
				return []byte(cfg.ChaveSecretaJWT), nil
			})

			if err != nil || !token.Valid {
				erroNaoAutorizado(w, "Token invalido ou expirado.")
				return
			}

			// 5. Extrai as claims e injeta nos cabecalhos internos da requisicao (M4.3)
			if claims, ok := token.Claims.(jwt.MapClaims); ok {
				// ID do Usuario (sub)
				if sub, ok := claims["sub"]; ok {
					r.Header.Set("X-Usuario-ID", fmt.Sprintf("%v", sub))
				}
				// Email
				if email, ok := claims["email"]; ok {
					r.Header.Set("X-Usuario-Email", fmt.Sprintf("%v", email))
				}
				// WhatsApp
				if whatsapp, ok := claims["whatsapp"]; ok {
					r.Header.Set("X-Usuario-WhatsApp", fmt.Sprintf("%v", whatsapp))
				}
				// Permissao
				if permissao, ok := claims["permissao"]; ok {
					r.Header.Set("X-Usuario-Permissao", fmt.Sprintf("%v", permissao))
				}
			} else {
				erroNaoAutorizado(w, "Falha ao extrair dados do token.")
				return
			}

			// 6. Continua para o proximo handler ou roteador
			proximo.ServeHTTP(w, r)
		})
	}
}

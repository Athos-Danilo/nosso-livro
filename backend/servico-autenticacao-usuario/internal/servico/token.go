package servico

import (
	"fmt"
	"time"

	"github.com/golang-jwt/jwt/v5"

	"nosso-livro/servico-autenticacao-usuario/internal/dominio"
)

// ClaimsUsuario representa o conjunto de informações do usuário embutidas no payload do token JWT
type ClaimsUsuario struct {
	Permissao string `json:"permissao"`
	WhatsApp  string `json:"whatsapp"`
	jwt.RegisteredClaims
}

// GerarTokenAutenticacao cria e assina um novo token JWT para o usuário com validade de 24 horas
func GerarTokenAutenticacao(usuario *dominio.Usuario, chaveSecreta string) (string, error) {
	if chaveSecreta == "" {
		return "", fmt.Errorf("a chave secreta para assinatura do token não pode ser vazia")
	}

	tempoAtual := time.Now()
	expiracao := tempoAtual.Add(24 * time.Hour) // Vencimento padrão de 24 horas

	claims := ClaimsUsuario{
		Permissao: usuario.Permissao,
		WhatsApp:  usuario.WhatsApp,
		RegisteredClaims: jwt.RegisteredClaims{
			Subject:   usuario.ID,
			ExpiresAt: jwt.NewNumericDate(expiracao),
			IssuedAt:  jwt.NewNumericDate(tempoAtual),
			NotBefore: jwt.NewNumericDate(tempoAtual),
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	tokenAssinado, err := token.SignedString([]byte(chaveSecreta))
	if err != nil {
		return "", fmt.Errorf("falha ao assinar o token JWT: %w", err)
	}

	return tokenAssinado, nil
}

// ValidarTokenAutenticacao valida a assinatura e expiração de um token JWT string e retorna seus claims
func ValidarTokenAutenticacao(tokenStr string, chaveSecreta string) (*ClaimsUsuario, error) {
	if tokenStr == "" {
		return nil, fmt.Errorf("o token de autenticação está vazio")
	}
	if chaveSecreta == "" {
		return nil, fmt.Errorf("a chave secreta para validação do token não pode ser vazia")
	}

	token, err := jwt.ParseWithClaims(tokenStr, &ClaimsUsuario{}, func(t *jwt.Token) (interface{}, error) {
		// Validação estrita do método de assinatura
		if _, ok := t.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fmt.Errorf("método de assinatura do token inválido: %v", t.Header["alg"])
		}
		return []byte(chaveSecreta), nil
	})

	if err != nil {
		return nil, fmt.Errorf("falha ao parsear ou validar o token: %w", err)
	}

	claims, ok := token.Claims.(*ClaimsUsuario)
	if !ok || !token.Valid {
		return nil, fmt.Errorf("token de autenticação inválido ou corrompido")
	}

	return claims, nil
}

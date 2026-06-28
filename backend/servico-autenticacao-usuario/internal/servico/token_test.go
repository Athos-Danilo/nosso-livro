package servico

import (
	"testing"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"nosso-livro/servico-autenticacao-usuario/internal/dominio"
)

// TestTokenFluxoCompleto valida a geração e decodificação bem-sucedida de um token JWT
func TestTokenFluxoCompleto(t *testing.T) {
	usuario := &dominio.Usuario{
		ID:        "usuario-uuid-teste-123",
		WhatsApp:  "5511999999999",
		Email:     "teste@exemplo.com",
		Permissao: "membro",
	}
	chaveSecreta := "segredo_super_seguro_de_teste"

	// 1. Gera o token
	tokenStr, err := GerarTokenAutenticacao(usuario, chaveSecreta)
	if err != nil {
		t.Fatalf("esperava sucesso ao gerar token, obteve erro: %v", err)
	}

	if len(tokenStr) == 0 {
		t.Fatal("esperava token assinado não vazio")
	}

	// 2. Valida o token gerado
	claims, err := ValidarTokenAutenticacao(tokenStr, chaveSecreta)
	if err != nil {
		t.Fatalf("esperava validação de token bem-sucedida, obteve erro: %v", err)
	}

	// 3. Valida os dados injetados nos claims
	if claims.Subject != usuario.ID {
		t.Errorf("esperava Subject '%s', obteve '%s'", usuario.ID, claims.Subject)
	}

	if claims.Permissao != usuario.Permissao {
		t.Errorf("esperava Permissao '%s', obteve '%s'", usuario.Permissao, claims.Permissao)
	}

	if claims.WhatsApp != usuario.WhatsApp {
		t.Errorf("esperava WhatsApp '%s', obteve '%s'", usuario.WhatsApp, claims.WhatsApp)
	}
}

// TestGerarTokenErros valida falhas na geração do token JWT
func TestGerarTokenErros(t *testing.T) {
	usuario := &dominio.Usuario{
		ID:        "uuid-123",
		Permissao: "membro",
	}

	// 1. Geração com chave vazia
	_, err := GerarTokenAutenticacao(usuario, "")
	if err == nil {
		t.Error("esperava erro ao gerar token com chave secreta vazia, obteve nil")
	}
}

// TestValidarTokenFalhas valida cenários de tokens expirados, assinaturas inválidas e dados vazios
func TestValidarTokenFalhas(t *testing.T) {
	chaveSecreta := "chave_secreta_teste"

	// 1. Validação com token vazio
	_, err := ValidarTokenAutenticacao("", chaveSecreta)
	if err == nil {
		t.Error("esperava erro ao validar token vazio, obteve nil")
	}

	// 2. Validação com chave secreta vazia
	_, err = ValidarTokenAutenticacao("token_teste", "")
	if err == nil {
		t.Error("esperava erro ao validar token com chave secreta vazia, obteve nil")
	}

	// 3. Validação com assinatura corrompida (chave secreta diferente)
	usuario := &dominio.Usuario{ID: "uuid-1", Permissao: "membro"}
	tokenValido, _ := GerarTokenAutenticacao(usuario, chaveSecreta)

	_, err = ValidarTokenAutenticacao(tokenValido, "chave_errada_de_validacao")
	if err == nil {
		t.Error("esperava erro ao validar token com chave secreta incorreta, obteve nil")
	}

	// 4. Validação com token expirado
	claimsExpirados := ClaimsUsuario{
		Permissao: "membro",
		RegisteredClaims: jwt.RegisteredClaims{
			Subject:   "uuid-expirado",
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(-1 * time.Hour)), // Expirou há 1 hora
		},
	}
	tokenExpiradoObj := jwt.NewWithClaims(jwt.SigningMethodHS256, claimsExpirados)
	tokenExpiradoStr, _ := tokenExpiradoObj.SignedString([]byte(chaveSecreta))

	_, err = ValidarTokenAutenticacao(tokenExpiradoStr, chaveSecreta)
	if err == nil {
		t.Error("esperava erro ao validar token expirado, obteve nil")
	}
}

package servico

import (
	"testing"
)

// TestGerarHashSenha valida a geração de hash a partir de senhas válidas e vazias
func TestGerarHashSenha(t *testing.T) {
	senhaValida := "minha_senha_secreta"

	// 1. Testa geração bem-sucedida
	hash, err := GerarHashSenha(senhaValida)
	if err != nil {
		t.Fatalf("esperava sucesso ao gerar hash de senha válida, obteve erro: %v", err)
	}

	if len(hash) == 0 {
		t.Error("esperava hash gerado não vazio")
	}

	// 2. Testa geração com senha vazia
	_, err = GerarHashSenha("")
	if err == nil {
		t.Error("esperava erro ao tentar gerar hash de senha vazia, obteve nil")
	}
}

// TestCompararSenhaHash valida a comparação correta entre senha pura e hash criptográfico
func TestCompararSenhaHash(t *testing.T) {
	senhaCorreta := "senha_secreta_123"
	senhaIncorreta := "senha_errada_456"

	hash, err := GerarHashSenha(senhaCorreta)
	if err != nil {
		t.Fatalf("falha ao preparar hash de teste: %v", err)
	}

	// 1. Comparação correta
	err = CompararSenhaHash(senhaCorreta, hash)
	if err != nil {
		t.Errorf("esperava sucesso na comparação da senha correta, obteve erro: %v", err)
	}

	// 2. Comparação incorreta
	err = CompararSenhaHash(senhaIncorreta, hash)
	if err == nil {
		t.Error("esperava erro ao comparar com senha incorreta, obteve nil")
	}

	// 3. Comparação com hash inválido
	err = CompararSenhaHash(senhaCorreta, "hash_malformado")
	if err == nil {
		t.Error("esperava erro ao comparar com hash malformado, obteve nil")
	}
}

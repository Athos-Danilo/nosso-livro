package servico

import (
	"fmt"

	"golang.org/x/crypto/bcrypt"
)

// GerarHashSenha transforma a senha pura do usuário em um hash criptográfico usando o algoritmo bcrypt
func GerarHashSenha(senha string) (string, error) {
	if senha == "" {
		return "", fmt.Errorf("a senha não pode ser vazia para geração do hash")
	}

	bytesHash, err := bcrypt.GenerateFromPassword([]byte(senha), bcrypt.DefaultCost)
	if err != nil {
		return "", fmt.Errorf("erro ao gerar o hash criptográfico da senha: %w", err)
	}

	return string(bytesHash), nil
}

// CompararSenhaHash compara uma senha pura fornecida com o hash criptográfico salvo no banco
func CompararSenhaHash(senha, hash string) error {
	err := bcrypt.CompareHashAndPassword([]byte(hash), []byte(senha))
	if err != nil {
		if err == bcrypt.ErrMismatchedHashAndPassword {
			return fmt.Errorf("senha incorreta")
		}
		return fmt.Errorf("falha ao comparar hash da senha: %w", err)
	}
	return nil
}

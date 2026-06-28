package servico

import (
	"fmt"
	"regexp"
	"strings"
)

// regexEmail padrão para validação de formato de e-mail comercial
var regexEmail = regexp.MustCompile(`^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$`)

// SanitizarWhatsApp remove qualquer caractere não numérico do número de telefone fornecido
func SanitizarWhatsApp(whatsapp string) string {
	var resultado strings.Builder
	for _, char := range whatsapp {
		if char >= '0' && char <= '9' {
			resultado.WriteRune(char)
		}
	}
	return resultado.String()
}

// ValidarWhatsApp verifica se o número de WhatsApp (já sanitizado) é válido para o Brasil
func ValidarWhatsApp(whatsappSanitizado string) error {
	tamanho := len(whatsappSanitizado)
	// Formatos aceitos após sanitização:
	// - DDD (2 dígitos) + número fixo/celular (8 ou 9 dígitos): 10 ou 11 dígitos
	// - DDI 55 + DDD (2 dígitos) + número fixo/celular (8 ou 9 dígitos): 12 ou 13 dígitos
	if tamanho < 10 || tamanho > 13 {
		return fmt.Errorf("número de WhatsApp inválido: deve conter de 10 a 13 dígitos numéricos após remoção de caracteres especiais")
	}
	return nil
}

// ValidarEmail verifica se o e-mail possui um formato válido comercialmente
func ValidarEmail(email string) error {
	if !regexEmail.MatchString(email) {
		return fmt.Errorf("formato de e-mail inválido")
	}
	return nil
}

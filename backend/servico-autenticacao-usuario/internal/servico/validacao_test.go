package servico

import (
	"testing"
)

// TestSanitizarWhatsApp valida a remoção de formatação de telefone
func TestSanitizarWhatsApp(t *testing.T) {
	casos := []struct {
		entrada  string
		esperado string
	}{
		{"+55 (11) 98765-4321", "5511987654321"},
		{"  11-98765 4321  ", "11987654321"},
		{"(11)33334444", "1133334444"},
		{"texto123abc456", "123456"},
		{"sem_numeros", ""},
	}

	for _, caso := range casos {
		t.Run("Sanitizar: "+caso.entrada, func(t *testing.T) {
			resultado := SanitizarWhatsApp(caso.entrada)
			if resultado != caso.esperado {
				t.Errorf("esperava '%s', obteve '%s'", caso.esperado, resultado)
			}
		})
	}
}

// TestValidarWhatsApp valida a consistência de comprimento do WhatsApp sanitizado
func TestValidarWhatsApp(t *testing.T) {
	// Casos válidos (10 a 13 dígitos numéricos)
	casosValidos := []string{
		"1133334444",    // 10 dígitos (DDD + fixo)
		"11987654321",   // 11 dígitos (DDD + celular)
		"551133334444",  // 12 dígitos (DDI + DDD + fixo)
		"5511987654321", // 13 dígitos (DDI + DDD + celular)
	}

	for _, numero := range casosValidos {
		t.Run("Válido: "+numero, func(t *testing.T) {
			if err := ValidarWhatsApp(numero); err != nil {
				t.Errorf("esperava sucesso para '%s', obteve erro: %v", numero, err)
			}
		})
	}

	// Casos inválidos (menores que 10 ou maiores que 13 dígitos numéricos)
	casosInvalidos := []string{
		"123456789",      // 9 dígitos (muito curto)
		"55511987654321", // 14 dígitos (muito longo)
		"",               // vazio
	}

	for _, numero := range casosInvalidos {
		t.Run("Inválido: "+numero, func(t *testing.T) {
			if err := ValidarWhatsApp(numero); err == nil {
				t.Errorf("esperava erro para '%s', obteve nil", numero)
			}
		})
	}
}

// TestValidarEmail valida a conformidade do endereço de e-mail com a regex
func TestValidarEmail(t *testing.T) {
	casosValidos := []string{
		"usuario@email.com",
		"usuario.nome@provedor.org.br",
		"usuario+marcador@sub.dominio.net",
		"123_usuario@email.co",
	}

	for _, email := range casosValidos {
		t.Run("Válido: "+email, func(t *testing.T) {
			if err := ValidarEmail(email); err != nil {
				t.Errorf("esperava sucesso para '%s', obteve erro: %v", email, err)
			}
		})
	}

	casosInvalidos := []string{
		"usuario.com",
		"usuario@com",
		"usuario@.com",
		"@provedor.com",
		"usuario @provedor.com",
		"",
	}

	for _, email := range casosInvalidos {
		t.Run("Inválido: "+email, func(t *testing.T) {
			if err := ValidarEmail(email); err == nil {
				t.Errorf("esperava erro para '%s', obteve nil", email)
			}
		})
	}
}

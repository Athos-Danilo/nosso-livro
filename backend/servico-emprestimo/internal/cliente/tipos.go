package cliente

import "time"

// RespostaUsuario representa o payload público retornado pelo Serviço de Autenticação e Usuário
type RespostaUsuario struct {
	ID        string    `json:"id"`
	Nome      string    `json:"nome"`
	WhatsApp  string    `json:"whatsapp"`
	Email     string    `json:"email"`
	Permissao string    `json:"permissao"`
	Ativo     bool      `json:"ativo"`
	CriadoEm  time.Time `json:"criado_em"`
}

// RespostaLivro representa o payload de saída detalhado retornado pelo Serviço de Catálogo e Biblioteca
type RespostaLivro struct {
	ID                   interface{} `json:"id"` // Aceita número ou string para máxima flexibilidade
	Titulo               string      `json:"titulo"`
	Autor                string      `json:"autor"`
	Isbn                 string      `json:"isbn"`
	Categoria            string      `json:"categoria"`
	QuantidadeTotal      int         `json:"quantidade_total"`
	QuantidadeDisponivel int         `json:"quantidade_disponivel"`
	IDBiblioteca         interface{} `json:"id_biblioteca"`
	Ativo                bool        `json:"ativo"`
}

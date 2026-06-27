package dominio

import (
	"context"
	"errors"
	"time"
)

// Erros de domínio mapeados para o negócio
var (
	ErrUsuarioNaoEncontrado = errors.New("usuário não encontrado")
	ErrWhatsAppDuplicado    = errors.New("WhatsApp já cadastrado")
	ErrEmailDuplicado       = errors.New("e-mail já cadastrado")
)

// Usuario representa a entidade de usuário no sistema
type Usuario struct {
	ID           string    `json:"id"`
	WhatsApp     string    `json:"whatsapp"`
	Email        string    `json:"email"`
	SenhaHash    string    `json:"-"` // Ocultada no JSON por questões de segurança
	Nome         string    `json:"nome"`
	Permissao    string    `json:"permissao"`
	Ativo        bool      `json:"ativo"`
	CriadoEm     time.Time `json:"criado_em"`
	AtualizadoEm time.Time `json:"atualizado_em"`
}

// RepositorioUsuario define os contratos de persistência do domínio de Usuários
type RepositorioUsuario interface {
	Criar(ctx context.Context, usuario *Usuario) error
	BuscarPorID(ctx context.Context, id string) (*Usuario, error)
	BuscarPorWhatsApp(ctx context.Context, whatsapp string) (*Usuario, error)
	BuscarPorEmail(ctx context.Context, email string) (*Usuario, error)
}

// RequisicaoCadastro representa o payload para cadastrar um novo usuário
type RequisicaoCadastro struct {
	Nome     string `json:"nome"`
	WhatsApp string `json:"whatsapp"`
	Email    string `json:"email"`
	Senha    string `json:"senha"`
}

// RequisicaoLogin representa as credenciais para o login do usuário
type RequisicaoLogin struct {
	WhatsApp string `json:"whatsapp,omitempty"`
	Email    string `json:"email,omitempty"`
	Senha    string `json:"senha"`
}

// RespostaUsuario representa o payload de retorno público de dados do usuário
type RespostaUsuario struct {
	ID        string    `json:"id"`
	Nome      string    `json:"nome"`
	WhatsApp  string    `json:"whatsapp"`
	Email     string    `json:"email"`
	Permissao string    `json:"permissao"`
	Ativo     bool      `json:"ativo"`
	CriadoEm  time.Time `json:"criado_em"`
}

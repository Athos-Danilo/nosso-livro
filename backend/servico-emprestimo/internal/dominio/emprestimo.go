package dominio

import (
	"context"
	"errors"
	"time"
)

// Erros de domínio relacionados a empréstimos
var (
	ErrEmprestimoNaoEncontrado = errors.New("empréstimo não encontrado")
	ErrLivroJaEmprestado       = errors.New("o livro já se encontra emprestado e ativo")
	ErrUsuarioInativo          = errors.New("o usuário está inativo")
	ErrLimiteEmprestimos       = errors.New("o usuário atingiu o limite máximo de empréstimos ativos")
	ErrLivroNaoEncontrado      = errors.New("livro não encontrado")
)

// Emprestimo representa o registro transacional de um empréstimo de livro
type Emprestimo struct {
	ID                    string     `json:"id"`
	IDUsuario             string     `json:"id_usuario"`
	IDLivro               string     `json:"id_livro"`
	IDBiblioteca          string     `json:"id_biblioteca"`
	DataEmprestimo        time.Time  `json:"data_emprestimo"`
	DataDevolucaoPrevista time.Time  `json:"data_devolucao_prevista"`
	DataDevolucaoReal     *time.Time `json:"data_devolucao_real,omitempty"`
	Estado                string     `json:"estado"` // ATIVO, DEVOLVIDO, ATRASADO
	CriadoEm              time.Time  `json:"criado_em"`
	AtualizadoEm          time.Time  `json:"atualizado_em"`
}

// RepositorioEmprestimo define os contratos para persistência de empréstimos
type RepositorioEmprestimo interface {
	Criar(ctx context.Context, emprestimo *Emprestimo) error
	BuscarPorID(ctx context.Context, id string) (*Emprestimo, error)
	BuscarAtivosPorUsuario(ctx context.Context, idUsuario string) ([]*Emprestimo, error)
	BuscarAtivoPorLivro(ctx context.Context, idLivro string) (*Emprestimo, error)
	Atualizar(ctx context.Context, emprestimo *Emprestimo) error
}

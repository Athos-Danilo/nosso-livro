package repositorio

import (
	"context"
	"errors"
	"fmt"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
	"nosso-livro/servico-emprestimo/internal/dominio"
)

// RepositorioEmprestimoPostgres implementa dominio.RepositorioEmprestimo para PostgreSQL
type RepositorioEmprestimoPostgres struct {
	pool *pgxpool.Pool
}

// NovoRepositorioEmprestimoPostgres cria uma nova instância do repositório
func NovoRepositorioEmprestimoPostgres(pool *pgxpool.Pool) *RepositorioEmprestimoPostgres {
	return &RepositorioEmprestimoPostgres{
		pool: pool,
	}
}

// Criar insere um novo empréstimo no banco de dados
func (r *RepositorioEmprestimoPostgres) Criar(ctx context.Context, e *dominio.Emprestimo) error {
	query := `
		INSERT INTO emprestimos (id_usuario, id_livro, id_biblioteca, data_devolucao_prevista, estado)
		VALUES ($1, $2, $3, $4, $5)
		RETURNING id, data_emprestimo, criado_em, atualizado_em`

	err := r.pool.QueryRow(ctx, query, e.IDUsuario, e.IDLivro, e.IDBiblioteca, e.DataDevolucaoPrevista, e.Estado).
		Scan(&e.ID, &e.DataEmprestimo, &e.CriadoEm, &e.AtualizadoEm)

	if err != nil {
		return fmt.Errorf("erro ao inserir empréstimo no banco de dados: %w", err)
	}
	return nil
}

// BuscarPorID encontra um empréstimo específico por ID
func (r *RepositorioEmprestimoPostgres) BuscarPorID(ctx context.Context, id string) (*dominio.Emprestimo, error) {
	query := `
		SELECT id, id_usuario, id_livro, id_biblioteca, data_emprestimo, data_devolucao_prevista, data_devolucao_real, estado, criado_em, atualizado_em
		FROM emprestimos
		WHERE id = $1`

	var e dominio.Emprestimo
	err := r.pool.QueryRow(ctx, query, id).Scan(
		&e.ID, &e.IDUsuario, &e.IDLivro, &e.IDBiblioteca, &e.DataEmprestimo, &e.DataDevolucaoPrevista, &e.DataDevolucaoReal, &e.Estado, &e.CriadoEm, &e.AtualizadoEm,
	)

	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, dominio.ErrEmprestimoNaoEncontrado
		}
		return nil, fmt.Errorf("erro ao buscar empréstimo por id %s: %w", id, err)
	}
	return &e, nil
}

// BuscarAtivosPorUsuario encontra todos os empréstimos ativos ou atrasados de um usuário específico
func (r *RepositorioEmprestimoPostgres) BuscarAtivosPorUsuario(ctx context.Context, idUsuario string) ([]*dominio.Emprestimo, error) {
	query := `
		SELECT id, id_usuario, id_livro, id_biblioteca, data_emprestimo, data_devolucao_prevista, data_devolucao_real, estado, criado_em, atualizado_em
		FROM emprestimos
		WHERE id_usuario = $1 AND estado IN ('ATIVO', 'ATRASADO')`

	rows, err := r.pool.Query(ctx, query, idUsuario)
	if err != nil {
		return nil, fmt.Errorf("erro ao consultar empréstimos ativos do usuário %s: %w", idUsuario, err)
	}
	defer rows.Close()

	var emprestimos []*dominio.Emprestimo
	for rows.Next() {
		var e dominio.Emprestimo
		err := rows.Scan(
			&e.ID, &e.IDUsuario, &e.IDLivro, &e.IDBiblioteca, &e.DataEmprestimo, &e.DataDevolucaoPrevista, &e.DataDevolucaoReal, &e.Estado, &e.CriadoEm, &e.AtualizadoEm,
		)
		if err != nil {
			return nil, fmt.Errorf("erro ao escanear linha de empréstimo: %w", err)
		}
		emprestimos = append(emprestimos, &e)
	}

	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("erro após iterar resultados de empréstimo: %w", err)
	}

	return emprestimos, nil
}

// BuscarAtivoPorLivro encontra o empréstimo ativo/atrasado de um determinado livro, se existir
func (r *RepositorioEmprestimoPostgres) BuscarAtivoPorLivro(ctx context.Context, idLivro string) (*dominio.Emprestimo, error) {
	query := `
		SELECT id, id_usuario, id_livro, id_biblioteca, data_emprestimo, data_devolucao_prevista, data_devolucao_real, estado, criado_em, atualizado_em
		FROM emprestimos
		WHERE id_livro = $1 AND estado IN ('ATIVO', 'ATRASADO')
		LIMIT 1`

	var e dominio.Emprestimo
	err := r.pool.QueryRow(ctx, query, idLivro).Scan(
		&e.ID, &e.IDUsuario, &e.IDLivro, &e.IDBiblioteca, &e.DataEmprestimo, &e.DataDevolucaoPrevista, &e.DataDevolucaoReal, &e.Estado, &e.CriadoEm, &e.AtualizadoEm,
	)

	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, dominio.ErrEmprestimoNaoEncontrado
		}
		return nil, fmt.Errorf("erro ao buscar empréstimo ativo do livro %s: %w", idLivro, err)
	}
	return &e, nil
}

// Atualizar altera os campos mutáveis do empréstimo (devolução real, estado e atualizado_em)
func (r *RepositorioEmprestimoPostgres) Atualizar(ctx context.Context, e *dominio.Emprestimo) error {
	query := `
		UPDATE emprestimos
		SET data_devolucao_real = $1, estado = $2, atualizado_em = CURRENT_TIMESTAMP
		WHERE id = $3`

	comando, err := r.pool.Exec(ctx, query, e.DataDevolucaoReal, e.Estado, e.ID)
	if err != nil {
		return fmt.Errorf("erro ao atualizar empréstimo %s: %w", e.ID, err)
	}

	if comando.RowsAffected() == 0 {
		return dominio.ErrEmprestimoNaoEncontrado
	}
	return nil
}

// BuscarTodos lista os empréstimos cadastrados com filtros e paginação
func (r *RepositorioEmprestimoPostgres) BuscarTodos(ctx context.Context, idUsuario, idLivro, estado string, limite, offset int) ([]*dominio.Emprestimo, error) {
	query := `
		SELECT id, id_usuario, id_livro, id_biblioteca, data_emprestimo, data_devolucao_prevista, data_devolucao_real, estado, criado_em, atualizado_em
		FROM emprestimos
		WHERE 1=1`

	var args []interface{}
	posicaoParam := 1

	if idUsuario != "" {
		query += fmt.Sprintf(" AND id_usuario = $%d", posicaoParam)
		args = append(args, idUsuario)
		posicaoParam++
	}

	if idLivro != "" {
		query += fmt.Sprintf(" AND id_livro = $%d", posicaoParam)
		args = append(args, idLivro)
		posicaoParam++
	}

	if estado != "" {
		query += fmt.Sprintf(" AND estado = $%d", posicaoParam)
		args = append(args, estado)
		posicaoParam++
	}

	query += fmt.Sprintf(" ORDER BY criado_em DESC LIMIT $%d OFFSET $%d", posicaoParam, posicaoParam+1)
	args = append(args, limite, offset)

	rows, err := r.pool.Query(ctx, query, args...)
	if err != nil {
		return nil, fmt.Errorf("erro ao buscar todos os empréstimos com filtros: %w", err)
	}
	defer rows.Close()

	var emprestimos []*dominio.Emprestimo
	for rows.Next() {
		var e dominio.Emprestimo
		err := rows.Scan(
			&e.ID, &e.IDUsuario, &e.IDLivro, &e.IDBiblioteca, &e.DataEmprestimo, &e.DataDevolucaoPrevista, &e.DataDevolucaoReal, &e.Estado, &e.CriadoEm, &e.AtualizadoEm,
		)
		if err != nil {
			return nil, fmt.Errorf("erro ao escanear linha do empréstimo buscado: %w", err)
		}
		emprestimos = append(emprestimos, &e)
	}

	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("erro pós-iteração de empréstimos buscados: %w", err)
	}

	return emprestimos, nil
}

// BuscarHistorico retorna logs consolidados de empréstimos por usuário e/ou livro
func (r *RepositorioEmprestimoPostgres) BuscarHistorico(ctx context.Context, idUsuario, idLivro string) ([]*dominio.Emprestimo, error) {
	query := `
		SELECT id, id_usuario, id_livro, id_biblioteca, data_emprestimo, data_devolucao_prevista, data_devolucao_real, estado, criado_em, atualizado_em
		FROM emprestimos
		WHERE 1=1`

	var args []interface{}
	posicaoParam := 1

	if idUsuario != "" {
		query += fmt.Sprintf(" AND id_usuario = $%d", posicaoParam)
		args = append(args, idUsuario)
		posicaoParam++
	}

	if idLivro != "" {
		query += fmt.Sprintf(" AND id_livro = $%d", posicaoParam)
		args = append(args, idLivro)
		posicaoParam++
	}

	// Ordena por data_emprestimo decrescente para mostrar histórico do mais recente ao mais antigo
	query += " ORDER BY data_emprestimo DESC"

	rows, err := r.pool.Query(ctx, query, args...)
	if err != nil {
		return nil, fmt.Errorf("erro ao buscar histórico de empréstimos: %w", err)
	}
	defer rows.Close()

	var emprestimos []*dominio.Emprestimo
	for rows.Next() {
		var e dominio.Emprestimo
		err := rows.Scan(
			&e.ID, &e.IDUsuario, &e.IDLivro, &e.IDBiblioteca, &e.DataEmprestimo, &e.DataDevolucaoPrevista, &e.DataDevolucaoReal, &e.Estado, &e.CriadoEm, &e.AtualizadoEm,
		)
		if err != nil {
			return nil, fmt.Errorf("erro ao escanear linha de histórico de empréstimo: %w", err)
		}
		emprestimos = append(emprestimos, &e)
	}

	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("erro pós-iteração de histórico de empréstimos: %w", err)
	}

	return emprestimos, nil
}


package repositorio

import (
	"context"
	"errors"
	"fmt"
	"strings"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgconn"
	"github.com/jackc/pgx/v5/pgxpool"

	"nosso-livro/servico-autenticacao-usuario/internal/dominio"
)

// RepositorioUsuarioPostgres implementa a persistência de usuários utilizando o PostgreSQL
type RepositorioUsuarioPostgres struct {
	pool *pgxpool.Pool
}

// NovoRepositorioUsuarioPostgres inicializa o repositório PostgreSQL de usuários
func NovoRepositorioUsuarioPostgres(pool *pgxpool.Pool) *RepositorioUsuarioPostgres {
	return &RepositorioUsuarioPostgres{pool: pool}
}

// Criar persiste um novo usuário no banco de dados e atualiza a struct com ID e datas geradas
func (r *RepositorioUsuarioPostgres) Criar(ctx context.Context, usuario *dominio.Usuario) error {
	comando := `
		INSERT INTO usuarios (whatsapp, email, senha_hash, nome, permissao, ativo)
		VALUES ($1, $2, $3, $4, $5, $6)
		RETURNING id, criado_em, atualizado_em
	`

	err := r.pool.QueryRow(
		ctx,
		comando,
		usuario.WhatsApp,
		usuario.Email,
		usuario.SenhaHash,
		usuario.Nome,
		usuario.Permissao,
		usuario.Ativo,
	).Scan(&usuario.ID, &usuario.CriadoEm, &usuario.AtualizadoEm)

	if err != nil {
		// Tratamento específico de erro de violação de restrição única (código PG 23505)
		var pgErr *pgconn.PgError
		if errors.As(err, &pgErr) && pgErr.Code == "23505" {
			if strings.Contains(pgErr.ConstraintName, "whatsapp") {
				return dominio.ErrWhatsAppDuplicado
			}
			if strings.Contains(pgErr.ConstraintName, "email") {
				return dominio.ErrEmailDuplicado
			}
			return fmt.Errorf("usuário com dados únicos duplicados já existe: %w", err)
		}
		return fmt.Errorf("falha ao salvar usuário no banco de dados: %w", err)
	}

	return nil
}

// BuscarPorID retorna os dados de um usuário buscando pela sua chave primária UUID
func (r *RepositorioUsuarioPostgres) BuscarPorID(ctx context.Context, id string) (*dominio.Usuario, error) {
	consulta := `
		SELECT id, whatsapp, email, senha_hash, nome, permissao, ativo, criado_em, atualizado_em
		FROM usuarios
		WHERE id = $1
	`

	var usuario dominio.Usuario
	err := r.pool.QueryRow(ctx, consulta, id).Scan(
		&usuario.ID,
		&usuario.WhatsApp,
		&usuario.Email,
		&usuario.SenhaHash,
		&usuario.Nome,
		&usuario.Permissao,
		&usuario.Ativo,
		&usuario.CriadoEm,
		&usuario.AtualizadoEm,
	)

	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, dominio.ErrUsuarioNaoEncontrado
		}
		return nil, fmt.Errorf("falha ao buscar usuário por ID: %w", err)
	}

	return &usuario, nil
}

// BuscarPorWhatsApp busca um usuário a partir do número do telefone/WhatsApp cadastrado
func (r *RepositorioUsuarioPostgres) BuscarPorWhatsApp(ctx context.Context, whatsapp string) (*dominio.Usuario, error) {
	consulta := `
		SELECT id, whatsapp, email, senha_hash, nome, permissao, ativo, criado_em, atualizado_em
		FROM usuarios
		WHERE whatsapp = $1
	`

	var usuario dominio.Usuario
	err := r.pool.QueryRow(ctx, consulta, whatsapp).Scan(
		&usuario.ID,
		&usuario.WhatsApp,
		&usuario.Email,
		&usuario.SenhaHash,
		&usuario.Nome,
		&usuario.Permissao,
		&usuario.Ativo,
		&usuario.CriadoEm,
		&usuario.AtualizadoEm,
	)

	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, dominio.ErrUsuarioNaoEncontrado
		}
		return nil, fmt.Errorf("falha ao buscar usuário por WhatsApp: %w", err)
	}

	return &usuario, nil
}

// BuscarPorEmail busca um usuário a partir do e-mail cadastrado
func (r *RepositorioUsuarioPostgres) BuscarPorEmail(ctx context.Context, email string) (*dominio.Usuario, error) {
	consulta := `
		SELECT id, whatsapp, email, senha_hash, nome, permissao, ativo, criado_em, atualizado_em
		FROM usuarios
		WHERE email = $1
	`

	var usuario dominio.Usuario
	err := r.pool.QueryRow(ctx, consulta, email).Scan(
		&usuario.ID,
		&usuario.WhatsApp,
		&usuario.Email,
		&usuario.SenhaHash,
		&usuario.Nome,
		&usuario.Permissao,
		&usuario.Ativo,
		&usuario.CriadoEm,
		&usuario.AtualizadoEm,
	)

	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, dominio.ErrUsuarioNaoEncontrado
		}
		return nil, fmt.Errorf("falha ao buscar usuário por e-mail: %w", err)
	}

	return &usuario, nil
}

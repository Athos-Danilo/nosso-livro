package servico

import (
	"context"
	"fmt"
	"log/slog"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
	"nosso-livro/servico-emprestimo/internal/cliente"
	"nosso-livro/servico-emprestimo/internal/dominio"
	"nosso-livro/servico-emprestimo/internal/evento"
)

// ServicoEmprestimo coordena a lógica de negócios e as integrações síncronas/assíncronas
type ServicoEmprestimo struct {
	repo        dominio.RepositorioEmprestimo
	cliUsuario  *cliente.ClienteUsuario
	cliCatalogo *cliente.ClienteCatalogo
	publicador  *evento.PublicadorEventos
	pool        *pgxpool.Pool
}

// NovoServicoEmprestimo inicializa o coordenador de empréstimos
func NovoServicoEmprestimo(
	repo dominio.RepositorioEmprestimo,
	cliUsuario *cliente.ClienteUsuario,
	cliCatalogo *cliente.ClienteCatalogo,
	publicador *evento.PublicadorEventos,
	pool *pgxpool.Pool,
) *ServicoEmprestimo {
	return &ServicoEmprestimo{
		repo:        repo,
		cliUsuario:  cliUsuario,
		cliCatalogo: cliCatalogo,
		publicador:  publicador,
		pool:        pool,
	}
}

// CriarEmprestimo executa o fluxo síncrono e transacional de empréstimo de um livro físico
func (s *ServicoEmprestimo) CriarEmprestimo(
	ctx context.Context,
	idUsuario string,
	idLivro string,
	idBiblioteca string,
	token string,
) (*dominio.Emprestimo, error) {
	// 1. Validações externas síncronas ANTES de abrir a transação de banco.
	// Isso evita segurar conexões no pool do PostgreSQL durante chamadas HTTP de rede.

	// Consulta o Serviço de Usuário
	usuarioRemoto, err := s.cliUsuario.BuscarUsuarioPorID(ctx, idUsuario, token)
	if err != nil {
		return nil, fmt.Errorf("falha ao validar usuário: %w", err)
	}
	if !usuarioRemoto.Ativo {
		return nil, dominio.ErrUsuarioInativo
	}

	// Consulta o Serviço de Catálogo
	livroRemoto, err := s.cliCatalogo.BuscarLivroPorID(ctx, idLivro)
	if err != nil {
		return nil, fmt.Errorf("falha ao validar livro: %w", err)
	}
	if !livroRemoto.Ativo || livroRemoto.QuantidadeDisponivel <= 0 {
		return nil, dominio.ErrLivroJaEmprestado // livro inativo ou sem estoque físico disponível
	}

	// 2. Inicia transação no banco de dados para garantir consistência local
	tx, err := s.pool.Begin(ctx)
	if err != nil {
		return nil, fmt.Errorf("erro ao iniciar transação de empréstimo: %w", err)
	}
	defer tx.Rollback(ctx)

	// Adquire lock consultivo pessimista baseado no ID do livro
	// Impede que duas transações concorrentes tentem emprestar o mesmo exemplar físico simultaneamente
	_, err = tx.Exec(ctx, "SELECT pg_advisory_xact_lock(hashtext($1))", idLivro)
	if err != nil {
		return nil, fmt.Errorf("erro ao adquirir lock consultivo pessimista do livro: %w", err)
	}

	// Valida se o usuário possui pendências de livros em atraso
	var temAtrasos bool
	queryAtrasos := `
		SELECT EXISTS (
			SELECT 1 FROM emprestimos 
			WHERE id_usuario = $1 
			  AND (estado = 'ATRASADO' OR (estado = 'ATIVO' AND data_devolucao_prevista < CURRENT_TIMESTAMP))
		)`
	err = tx.QueryRow(ctx, queryAtrasos, idUsuario).Scan(&temAtrasos)
	if err != nil {
		return nil, fmt.Errorf("erro ao checar atrasos pendentes do usuário: %w", err)
	}
	if temAtrasos {
		return nil, fmt.Errorf("usuário não pode realizar empréstimo pois possui pendências de livros em atraso")
	}

	// Valida se o livro já está emprestado e ativo localmente no banco
	var temEmprestimoAtivo bool
	queryEmprestimoAtivo := `
		SELECT EXISTS (
			SELECT 1 FROM emprestimos 
			WHERE id_livro = $1 AND estado IN ('ATIVO', 'ATRASADO')
		)`
	err = tx.QueryRow(ctx, queryEmprestimoAtivo, idLivro).Scan(&temEmprestimoAtivo)
	if err != nil {
		return nil, fmt.Errorf("erro ao checar empréstimo ativo do livro: %w", err)
	}
	if temEmprestimoAtivo {
		return nil, dominio.ErrLivroJaEmprestado
	}

	// Define os dados do novo empréstimo
	// Prazo padrão de empréstimo: 14 dias
	dataDevPrevista := time.Now().Add(14 * 24 * time.Hour)
	var emp dominio.Emprestimo
	emp.IDUsuario = idUsuario
	emp.IDLivro = idLivro
	emp.IDBiblioteca = idBiblioteca
	emp.DataDevolucaoPrevista = dataDevPrevista
	emp.Estado = "ATIVO"

	queryInserir := `
		INSERT INTO emprestimos (id_usuario, id_livro, id_biblioteca, data_devolucao_prevista, estado)
		VALUES ($1, $2, $3, $4, $5)
		RETURNING id, data_emprestimo, criado_em, atualizado_em`

	err = tx.QueryRow(ctx, queryInserir, emp.IDUsuario, emp.IDLivro, emp.IDBiblioteca, emp.DataDevolucaoPrevista, emp.Estado).
		Scan(&emp.ID, &emp.DataEmprestimo, &emp.CriadoEm, &emp.AtualizadoEm)
	if err != nil {
		return nil, fmt.Errorf("erro ao registrar empréstimo no banco de dados: %w", err)
	}

	// Confirma a transação
	if err := tx.Commit(ctx); err != nil {
		return nil, fmt.Errorf("erro ao commitar transação de empréstimo: %w", err)
	}

	// 3. Dispara o evento assíncrono para o RabbitMQ
	// Executado em goroutine para não bloquear a resposta da API ao usuário final
	msg := evento.MensagemEmprestimoCriado{
		IDEmprestimo:        emp.ID,
		IDUsuario:           emp.IDUsuario,
		IDLivro:             emp.IDLivro,
		IDBiblioteca:        emp.IDBiblioteca,
		DataLimiteDevolucao: emp.DataDevolucaoPrevista.Format(time.RFC3339),
		CriadoEm:            emp.CriadoEm.Format(time.RFC3339),
	}

	go func() {
		ctxBG := context.Background()
		if err := s.publicador.PublicarEmprestimoCriado(ctxBG, msg); err != nil {
			slog.Error("Falha ao publicar evento de empréstimo criado no broker",
				slog.String("id_emprestimo", emp.ID),
				slog.String("erro", err.Error()),
			)
		}
	}()

	return &emp, nil
}

// DevolverEmprestimo encerra um empréstimo ativo no banco e publica o evento de devolução
func (s *ServicoEmprestimo) DevolverEmprestimo(ctx context.Context, idEmprestimo string) (*dominio.Emprestimo, error) {
	// Inicia transação de banco de dados
	tx, err := s.pool.Begin(ctx)
	if err != nil {
		return nil, fmt.Errorf("erro ao iniciar transação de devolução: %w", err)
	}
	defer tx.Rollback(ctx)

	// Busca o empréstimo travando a linha para escrita (FOR UPDATE)
	// Evita concorrência na devolução do mesmo empréstimo
	query := `
		SELECT id, id_usuario, id_livro, id_biblioteca, data_emprestimo, data_devolucao_prevista, data_devolucao_real, estado, criado_em, atualizado_em
		FROM emprestimos
		WHERE id = $1
		FOR UPDATE`

	var emp dominio.Emprestimo
	err = tx.QueryRow(ctx, query, idEmprestimo).Scan(
		&emp.ID, &emp.IDUsuario, &emp.IDLivro, &emp.IDBiblioteca, &emp.DataEmprestimo, &emp.DataDevolucaoPrevista, &emp.DataDevolucaoReal, &emp.Estado, &emp.CriadoEm, &emp.AtualizadoEm,
	)
	if err != nil {
		return nil, dominio.ErrEmprestimoNaoEncontrado
	}

	// Valida se já não foi devolvido
	if emp.Estado == "DEVOLVIDO" {
		return nil, fmt.Errorf("este empréstimo já se encontra finalizado (estado DEVOLVIDO)")
	}

	agora := time.Now()
	emp.DataDevolucaoReal = &agora
	emp.Estado = "DEVOLVIDO"

	queryUpdate := `
		UPDATE emprestimos
		SET data_devolucao_real = $1, estado = $2, atualizado_em = CURRENT_TIMESTAMP
		WHERE id = $3`

	_, err = tx.Exec(ctx, queryUpdate, emp.DataDevolucaoReal, emp.Estado, emp.ID)
	if err != nil {
		return nil, fmt.Errorf("erro ao atualizar dados de devolução no banco: %w", err)
	}

	// Confirma a transação
	if err := tx.Commit(ctx); err != nil {
		return nil, fmt.Errorf("erro ao commitar transação de devolução: %w", err)
	}

	// Publica evento de livro devolvido no RabbitMQ de forma assíncrona
	msg := evento.MensagemEmprestimoDevolvido{
		IDEmprestimo:      emp.ID,
		IDUsuario:         emp.IDUsuario,
		IDLivro:           emp.IDLivro,
		DataDevolucaoReal: emp.DataDevolucaoReal.Format(time.RFC3339),
	}

	go func() {
		ctxBG := context.Background()
		if err := s.publicador.PublicarEmprestimoDevolvido(ctxBG, msg); err != nil {
			slog.Error("Falha ao publicar evento de empréstimo devolvido no broker",
				slog.String("id_emprestimo", emp.ID),
				slog.String("erro", err.Error()),
			)
		}
	}()

	return &emp, nil
}

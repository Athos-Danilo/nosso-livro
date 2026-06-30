package servico_test

import (
	"context"
	"fmt"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
	"nosso-livro/servico-emprestimo/internal/cliente"
	"nosso-livro/servico-emprestimo/internal/dominio"
	"nosso-livro/servico-emprestimo/internal/evento"
	"nosso-livro/servico-emprestimo/internal/repositorio"
	"nosso-livro/servico-emprestimo/internal/servico"
)

func TestServicoEmprestimoFluxo(t *testing.T) {
	ctx := context.Background()

	// 1. Inicializa banco de testes utilizando o helper híbrido
	pool, cleanup := repositorio.ObterPoolBancoTeste(ctx, t)
	defer cleanup()

	// Limpa tabela de empréstimos antes do teste
	limparTabelaEmprestimos(t, pool)
	defer limparTabelaEmprestimos(t, pool)

	repo := repositorio.NovoRepositorioEmprestimoPostgres(pool)

	// 2. Cria servidores de mock HTTP para simular microsserviços de Usuário e Catálogo
	servidorUsuario := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.Method == http.MethodGet && strings.Contains(r.URL.Path, "/api/usuarios/") {
			idUsuario := r.URL.Path[strings.LastIndex(r.URL.Path, "/")+1:]

			if idUsuario == "usuario-inativo-id" {
				w.Header().Set("Content-Type", "application/json")
				w.WriteHeader(http.StatusOK)
				fmt.Fprint(w, `{"id": "usuario-inativo-id", "nome": "Usuario Inativo", "ativo": false, "permissao": "MEMBRO"}`)
				return
			}

			if idUsuario == "usuario-nao-encontrado-id" {
				w.WriteHeader(http.StatusNotFound)
				return
			}

			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusOK)
			fmt.Fprintf(w, `{"id": "%s", "nome": "Usuario Ativo", "ativo": true, "permissao": "MEMBRO"}`, idUsuario)
			return
		}
		w.WriteHeader(http.StatusNotFound)
	}))
	defer servidorUsuario.Close()

	servidorCatalogo := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.Method == http.MethodGet && strings.Contains(r.URL.Path, "/api/livros/") {
			idLivro := r.URL.Path[strings.LastIndex(r.URL.Path, "/")+1:]

			if idLivro == "livro-indisponivel-id" {
				w.Header().Set("Content-Type", "application/json")
				w.WriteHeader(http.StatusOK)
				fmt.Fprint(w, `{"id": "livro-indisponivel-id", "titulo": "Livro Indisponivel", "quantidade_disponivel": 0, "ativo": true}`)
				return
			}

			if idLivro == "livro-inativo-id" {
				w.Header().Set("Content-Type", "application/json")
				w.WriteHeader(http.StatusOK)
				fmt.Fprint(w, `{"id": "livro-inativo-id", "titulo": "Livro Inativo", "quantidade_disponivel": 10, "ativo": false}`)
				return
			}

			if idLivro == "livro-nao-encontrado-id" {
				w.WriteHeader(http.StatusNotFound)
				return
			}

			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusOK)
			fmt.Fprintf(w, `{"id": "%s", "titulo": "Livro de Teste", "quantidade_disponivel": 5, "ativo": true}`, idLivro)
			return
		}
		w.WriteHeader(http.StatusNotFound)
	}))
	defer servidorCatalogo.Close()

	// 3. Inicializa os clientes HTTP resilientes apontando para as URLs de Mock
	cliHTTP := cliente.NovoClienteHTTPResiliente()
	cliUsuario := cliente.NovoClienteUsuario(servidorUsuario.URL, cliHTTP)
	cliCatalogo := cliente.NovoClienteCatalogo(servidorCatalogo.URL, cliHTTP)

	// Instancia gerenciador e publicador de mensageria sem conectar de fato
	gerenciadorRabbit := evento.NovoGerenciadorRabbitMQ("amqp://guest:guest@localhost:5672")
	publicador := evento.NovoPublicadorEventos(gerenciadorRabbit)

	// Instancia o serviço de empréstimo
	servicoEmp := servico.NovoServicoEmprestimo(repo, cliUsuario, cliCatalogo, publicador, pool)

	// 4. Cenários de teste de lógica de negócio
	
	// Caso A: Empréstimo bem-sucedido seguido de devolução bem-sucedida
	t.Run("Criar Empréstimo com Sucesso e Devolver", func(t *testing.T) {
		idUsuario := "usuario-teste-sucesso-id"
		idLivro := "livro-teste-sucesso-id"
		idBiblioteca := "biblioteca-teste-id"

		emp, err := servicoEmp.CriarEmprestimo(ctx, idUsuario, idLivro, idBiblioteca, "token-teste")
		if err != nil {
			t.Fatalf("esperava sucesso ao criar empréstimo, obteve erro: %v", err)
		}

		if emp.ID == "" {
			t.Error("ID do empréstimo deveria ter sido preenchido")
		}
		if emp.Estado != "ATIVO" {
			t.Errorf("esperava estado ATIVO, obteve %s", emp.Estado)
		}

		// Testa devolução do mesmo empréstimo
		empDevolvido, err := servicoEmp.DevolverEmprestimo(ctx, emp.ID)
		if err != nil {
			t.Fatalf("esperava sucesso na devolução, obteve erro: %v", err)
		}
		if empDevolvido.Estado != "DEVOLVIDO" {
			t.Errorf("esperava estado DEVOLVIDO, obteve %s", empDevolvido.Estado)
		}
		if empDevolvido.DataDevolucaoReal == nil {
			t.Error("DataDevolucaoReal não deveria ser nula após devolução")
		}
	})

	// Caso B: Erro por usuário inativo
	t.Run("Erro com Usuário Inativo", func(t *testing.T) {
		idUsuario := "usuario-inativo-id"
		idLivro := "livro-teste-sucesso-id"
		idBiblioteca := "biblioteca-teste-id"

		_, err := servicoEmp.CriarEmprestimo(ctx, idUsuario, idLivro, idBiblioteca, "token-teste")
		if err == nil || !strings.Contains(err.Error(), dominio.ErrUsuarioInativo.Error()) {
			t.Errorf("esperava erro de usuário inativo (%v), obteve: %v", dominio.ErrUsuarioInativo, err)
		}
	})

	// Caso C: Erro por livro sem estoque
	t.Run("Erro com Livro Indisponivel", func(t *testing.T) {
		idUsuario := "usuario-teste-sucesso-id"
		idLivro := "livro-indisponivel-id"
		idBiblioteca := "biblioteca-teste-id"

		_, err := servicoEmp.CriarEmprestimo(ctx, idUsuario, idLivro, idBiblioteca, "token-teste")
		if err == nil || !strings.Contains(err.Error(), dominio.ErrLivroJaEmprestado.Error()) {
			t.Errorf("esperava erro de livro ja emprestado/sem estoque (%v), obteve: %v", dominio.ErrLivroJaEmprestado, err)
		}
	})

	// Caso D: Erro por livro inativo
	t.Run("Erro com Livro Inativo", func(t *testing.T) {
		idUsuario := "usuario-teste-sucesso-id"
		idLivro := "livro-inativo-id"
		idBiblioteca := "biblioteca-teste-id"

		_, err := servicoEmp.CriarEmprestimo(ctx, idUsuario, idLivro, idBiblioteca, "token-teste")
		if err == nil || !strings.Contains(err.Error(), dominio.ErrLivroJaEmprestado.Error()) {
			t.Errorf("esperava erro de livro ja emprestado/inativo (%v), obteve: %v", dominio.ErrLivroJaEmprestado, err)
		}
	})

	// Caso E: Usuário com empréstimo atrasado tentando criar novo empréstimo
	t.Run("Erro com Usuário com Atrasos Pendentes", func(t *testing.T) {
		idUsuario := "usuario-com-atraso-id"
		idLivro := "livro-teste-sucesso-id"
		idBiblioteca := "biblioteca-teste-id"

		// Insere manualmente um empréstimo ATRASADO direto no banco de testes
		queryInserirAtrasado := `
			INSERT INTO emprestimos (id_usuario, id_livro, id_biblioteca, data_devolucao_prevista, estado)
			VALUES ($1, $2, $3, $4, 'ATRASADO')`
		_, err := pool.Exec(ctx, queryInserirAtrasado, idUsuario, "livro-ja-atrasado-id", idBiblioteca, time.Now().Add(-24*time.Hour))
		if err != nil {
			t.Fatalf("erro ao preparar dados de atraso no banco: %v", err)
		}

		_, err = servicoEmp.CriarEmprestimo(ctx, idUsuario, idLivro, idBiblioteca, "token-teste")
		if err == nil || !strings.Contains(err.Error(), "usuário não pode realizar empréstimo pois possui pendências de livros em atraso") {
			t.Errorf("esperava erro de pendência de livros em atraso, obteve: %v", err)
		}
	})
}

func limparTabelaEmprestimos(t *testing.T, pool *pgxpool.Pool) {
	ctx := context.Background()
	_, err := pool.Exec(ctx, "DELETE FROM emprestimos")
	if err != nil {
		t.Logf("[Aviso] Falha ao limpar tabela de empréstimos de testes: %v", err)
	}
}

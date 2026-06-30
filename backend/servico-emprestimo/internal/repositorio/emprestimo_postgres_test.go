package repositorio_test

import (
	"context"
	"errors"
	"fmt"
	"net/http"
	"net/http/httptest"
	"strings"
	"sync"
	"testing"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
	"nosso-livro/servico-emprestimo/internal/cliente"
	"nosso-livro/servico-emprestimo/internal/dominio"
	"nosso-livro/servico-emprestimo/internal/evento"
	"nosso-livro/servico-emprestimo/internal/repositorio"
	"nosso-livro/servico-emprestimo/internal/servico"
)

// TestRepositorioFluxoCompleto valida o CRUD, filtros de busca paginada e histórico do repositório
func TestRepositorioFluxoCompleto(t *testing.T) {
	ctx := context.Background()

	pool, cleanup := repositorio.ObterPoolBancoTeste(ctx, t)
	defer cleanup()

	limparTabelaEmprestimos(t, pool)
	defer limparTabelaEmprestimos(t, pool)

	repo := repositorio.NovoRepositorioEmprestimoPostgres(pool)

	idUsuario := "usuario-teste-repositorio-id"
	idLivro := "livro-teste-repositorio-id"
	idBiblioteca := "biblioteca-teste-repositorio-id"

	emp := &dominio.Emprestimo{
		IDUsuario:             idUsuario,
		IDLivro:               idLivro,
		IDBiblioteca:          idBiblioteca,
		DataDevolucaoPrevista: time.Now().Add(14 * 24 * time.Hour),
		Estado:                "ATIVO",
	}

	// 1. Testar inserção (Criar)
	err := repo.Criar(ctx, emp)
	if err != nil {
		t.Fatalf("falha ao inserir empréstimo no banco: %v", err)
	}

	if emp.ID == "" {
		t.Error("esperava ID gerado e preenchido na struct")
	}

	// 2. Testar busca por ID
	buscado, err := repo.BuscarPorID(ctx, emp.ID)
	if err != nil {
		t.Fatalf("falha ao buscar empréstimo por ID: %v", err)
	}
	if buscado.IDUsuario != idUsuario || buscado.IDLivro != idLivro {
		t.Errorf("dados buscados incorretos. Obtido: %+v", buscado)
	}

	// 3. Testar busca de ativos por Usuário
	ativosUsr, err := repo.BuscarAtivosPorUsuario(ctx, idUsuario)
	if err != nil {
		t.Fatalf("falha ao buscar ativos por usuário: %v", err)
	}
	if len(ativosUsr) != 1 || ativosUsr[0].ID != emp.ID {
		t.Errorf("esperava 1 empréstimo ativo no retorno, obteve %d", len(ativosUsr))
	}

	// 4. Testar busca de ativo por Livro
	ativoLivro, err := repo.BuscarAtivoPorLivro(ctx, idLivro)
	if err != nil {
		t.Fatalf("falha ao buscar ativo por livro: %v", err)
	}
	if ativoLivro.ID != emp.ID {
		t.Errorf("esperava ID de empréstimo %s, obteve %s", emp.ID, ativoLivro.ID)
	}

	// 5. Testar paginação e listagem geral (BuscarTodos)
	todos, err := repo.BuscarTodos(ctx, idUsuario, idLivro, "ATIVO", 10, 0)
	if err != nil {
		t.Fatalf("falha ao listar empréstimos filtrados: %v", err)
	}
	if len(todos) != 1 {
		t.Errorf("esperava 1 empréstimo listado, obteve %d", len(todos))
	}

	// 6. Testar histórico (BuscarHistorico)
	historico, err := repo.BuscarHistorico(ctx, idUsuario, idLivro)
	if err != nil {
		t.Fatalf("falha ao obter histórico de empréstimos: %v", err)
	}
	if len(historico) != 1 {
		t.Errorf("esperava 1 item no histórico, obteve %d", len(historico))
	}

	// 7. Testar alteração (Atualizar / Devolver)
	agora := time.Now()
	emp.DataDevolucaoReal = &agora
	emp.Estado = "DEVOLVIDO"

	err = repo.Atualizar(ctx, emp)
	if err != nil {
		t.Fatalf("falha ao atualizar empréstimo no banco: %v", err)
	}

	// Valida se o estado foi devidamente atualizado no banco
	atualizado, err := repo.BuscarPorID(ctx, emp.ID)
	if err != nil {
		t.Fatalf("falha ao rebuscar empréstimo atualizado: %v", err)
	}
	if atualizado.Estado != "DEVOLVIDO" || atualizado.DataDevolucaoReal == nil {
		t.Errorf("atualização falhou no banco de dados. Obtido: %+v", atualizado)
	}
}

// TestStressConcorrenciaEmprestimo executa 50 goroutines simultâneas tentando emprestar o mesmo livro físico
func TestStressConcorrenciaEmprestimo(t *testing.T) {
	ctx := context.Background()

	pool, cleanup := repositorio.ObterPoolBancoTeste(ctx, t)
	defer cleanup()

	limparTabelaEmprestimos(t, pool)
	defer limparTabelaEmprestimos(t, pool)

	repo := repositorio.NovoRepositorioEmprestimoPostgres(pool)

	// 1. Mock de APIs síncronas externas (sempre ativos e disponíveis)
	servidorUsuario := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)
		idUsuario := r.URL.Path[strings.LastIndex(r.URL.Path, "/")+1:]
		fmt.Fprintf(w, `{"id": "%s", "nome": "Usuario Concorrente", "ativo": true, "permissao": "MEMBRO"}`, idUsuario)
	}))
	defer servidorUsuario.Close()

	servidorCatalogo := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)
		idLivro := r.URL.Path[strings.LastIndex(r.URL.Path, "/")+1:]
		// Retorna que o livro tem 1 unidade em estoque
		fmt.Fprintf(w, `{"id": "%s", "titulo": "Livro Concorrente", "quantidade_disponivel": 1, "ativo": true}`, idLivro)
	}))
	defer servidorCatalogo.Close()

	cliHTTP := cliente.NovoClienteHTTPResiliente()
	cliUsuario := cliente.NovoClienteUsuario(servidorUsuario.URL, cliHTTP)
	cliCatalogo := cliente.NovoClienteCatalogo(servidorCatalogo.URL, cliHTTP)

	gerenciadorRabbit := evento.NovoGerenciadorRabbitMQ("amqp://guest:guest@localhost:5672")
	publicador := evento.NovoPublicadorEventos(gerenciadorRabbit)

	servicoEmp := servico.NovoServicoEmprestimo(repo, cliUsuario, cliCatalogo, publicador, pool)

	idLivroConcorrente := "livro-concorrencia-id"
	idBiblioteca := "biblioteca-concorrencia-id"

	// 2. Dispara 50 Goroutines simultâneas
	totalGoroutines := 50
	var wg sync.WaitGroup
	var mu sync.Mutex

	sucessos := 0
	errosLivroEmprestado := 0
	outrosErros := 0

	wg.Add(totalGoroutines)
	for i := 0; i < totalGoroutines; i++ {
		go func(indice int) {
			defer wg.Done()

			idUsuario := fmt.Sprintf("usuario-concorrente-%d", indice)
			_, err := servicoEmp.CriarEmprestimo(ctx, idUsuario, idLivroConcorrente, idBiblioteca, "token-teste")

			mu.Lock()
			defer mu.Unlock()

			if err == nil {
				sucessos++
			} else if errors.Is(err, dominio.ErrLivroJaEmprestado) || strings.Contains(err.Error(), dominio.ErrLivroJaEmprestado.Error()) {
				errosLivroEmprestado++
			} else {
				outrosErros++
				t.Logf("Outro erro detectado: %v", err)
			}
		}(i)
	}

	wg.Wait()

	// 3. Validações estritas de Concorrência
	if sucessos != 1 {
		t.Errorf("TESTE DE CONCORRÊNCIA FALHOU: Esperava que exatamente 1 empréstimo fosse aceito, obteve %d", sucessos)
	}

	esperadoErros := totalGoroutines - 1
	if errosLivroEmprestado != esperadoErros {
		t.Errorf("TESTE DE CONCORRÊNCIA FALHOU: Esperava que %d requisições retornassem livro já emprestado, obteve %d", esperadoErros, errosLivroEmprestado)
	}

	if outrosErros > 0 {
		t.Errorf("TESTE DE CONCORRÊNCIA FALHOU: Houve %d erros inesperados de rede ou banco", outrosErros)
	}
}

func limparTabelaEmprestimos(t *testing.T, pool *pgxpool.Pool) {
	ctx := context.Background()
	_, err := pool.Exec(ctx, "DELETE FROM emprestimos")
	if err != nil {
		t.Logf("[Aviso] Falha ao limpar banco de testes: %v", err)
	}
}

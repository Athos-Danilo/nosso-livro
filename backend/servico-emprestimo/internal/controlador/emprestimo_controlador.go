package controlador

import (
	"encoding/json"
	"errors"
	"fmt"
	"log/slog"
	"net/http"
	"strconv"

	"nosso-livro/servico-emprestimo/internal/dominio"
	"nosso-livro/servico-emprestimo/internal/servico"
)

// ControladorEmprestimo gerencia as requisições HTTP REST do serviço de empréstimos
type ControladorEmprestimo struct {
	servico *servico.ServicoEmprestimo
	repo    dominio.RepositorioEmprestimo
}

// NovoControladorEmprestimo cria uma instância do controlador de rotas
func NovoControladorEmprestimo(servico *servico.ServicoEmprestimo, repo dominio.RepositorioEmprestimo) *ControladorEmprestimo {
	return &ControladorEmprestimo{
		servico: servico,
		repo:    repo,
	}
}

// RequisicaoCriarEmprestimo define os dados recebidos para criar um novo empréstimo
type RequisicaoCriarEmprestimo struct {
	IDLivro      string `json:"id_livro"`
	IDBiblioteca string `json:"id_biblioteca"`
}

// CriarEmprestimo processa a rota POST /api/emprestimos
func (c *ControladorEmprestimo) CriarEmprestimo(w http.ResponseWriter, r *http.Request) {
	usuario, ok := r.Context().Value(ChaveUsuario).(*UsuarioAutenticado)
	if !ok || usuario == nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusUnauthorized)
		fmt.Fprint(w, `{"erro": "Usuário não autenticado"}`)
		return
	}

	// Validação de perfil/permissão do usuário
	if usuario.Permissao != "MEMBRO" {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusForbidden)
		fmt.Fprint(w, `{"erro": "Apenas membros têm permissão para criar empréstimos"}`)
		return
	}

	var req RequisicaoCriarEmprestimo
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusBadRequest)
		fmt.Fprint(w, `{"erro": "Corpo da requisição JSON inválido"}`)
		return
	}

	if req.IDLivro == "" || req.IDBiblioteca == "" {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusBadRequest)
		fmt.Fprint(w, `{"erro": "Os campos id_livro e id_biblioteca são obrigatórios"}`)
		return
	}

	// Obtém o token JWT original do Authorization para propagar a chamada interna
	tokenOriginal := r.Header.Get("Authorization")

	emprestimo, err := c.servico.CriarEmprestimo(r.Context(), usuario.ID, req.IDLivro, req.IDBiblioteca, tokenOriginal)
	if err != nil {
		w.Header().Set("Content-Type", "application/json")

		// Mapeia erros de domínio para códigos HTTP correspondentes
		if errors.Is(err, dominio.ErrLivroJaEmprestado) {
			w.WriteHeader(http.StatusConflict)
			json.NewEncoder(w).Encode(map[string]string{"erro": err.Error()})
			return
		}
		if errors.Is(err, dominio.ErrUsuarioInativo) {
			w.WriteHeader(http.StatusForbidden)
			json.NewEncoder(w).Encode(map[string]string{"erro": err.Error()})
			return
		}
		if errors.Is(err, dominio.ErrLivroNaoEncontrado) || errors.Is(err, dominio.ErrUsuarioNaoEncontrado) {
			w.WriteHeader(http.StatusNotFound)
			json.NewEncoder(w).Encode(map[string]string{"erro": err.Error()})
			return
		}

		// Caso de erro de negócio gerenciado (ex: pendências de atraso)
		w.WriteHeader(http.StatusUnprocessableEntity)
		json.NewEncoder(w).Encode(map[string]string{"erro": err.Error()})
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(emprestimo)
}

// DevolverEmprestimo processa a rota POST /api/emprestimos/{id}/devolucao
func (c *ControladorEmprestimo) DevolverEmprestimo(w http.ResponseWriter, r *http.Request) {
	usuario, ok := r.Context().Value(ChaveUsuario).(*UsuarioAutenticado)
	if !ok || usuario == nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusUnauthorized)
		fmt.Fprint(w, `{"erro": "Usuário não autenticado"}`)
		return
	}

	// Permissão concedida tanto para MEMBRO quanto para ADMINISTRADOR
	if usuario.Permissao != "MEMBRO" && usuario.Permissao != "ADMINISTRADOR" {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusForbidden)
		fmt.Fprint(w, `{"erro": "Apenas membros ou administradores têm permissão para devolver empréstimos"}`)
		return
	}

	idEmprestimo := r.PathValue("id")
	if idEmprestimo == "" {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusBadRequest)
		fmt.Fprint(w, `{"erro": "ID do empréstimo é obrigatório na URL"}`)
		return
	}

	emprestimo, err := c.servico.DevolverEmprestimo(r.Context(), idEmprestimo)
	if err != nil {
		w.Header().Set("Content-Type", "application/json")
		if errors.Is(err, dominio.ErrEmprestimoNaoEncontrado) {
			w.WriteHeader(http.StatusNotFound)
			json.NewEncoder(w).Encode(map[string]string{"erro": err.Error()})
			return
		}
		w.WriteHeader(http.StatusUnprocessableEntity)
		json.NewEncoder(w).Encode(map[string]string{"erro": err.Error()})
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(emprestimo)
}

// ListarEmprestimos processa a rota GET /api/emprestimos
func (c *ControladorEmprestimo) ListarEmprestimos(w http.ResponseWriter, r *http.Request) {
	_, ok := r.Context().Value(ChaveUsuario).(*UsuarioAutenticado)
	if !ok {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusUnauthorized)
		fmt.Fprint(w, `{"erro": "Usuário não autenticado"}`)
		return
	}

	valoresQuery := r.URL.Query()
	usuarioID := valoresQuery.Get("usuario_id")
	livroID := valoresQuery.Get("livro_id")
	estado := valoresQuery.Get("estado")

	limiteStr := valoresQuery.Get("limite")
	paginaStr := valoresQuery.Get("pagina")

	limite := 10
	pagina := 1

	if limiteStr != "" {
		if l, err := strconv.Atoi(limiteStr); err == nil && l > 0 {
			limite = l
		}
	}
	if limite > 100 {
		limite = 100 // Teto de segurança
	}

	if paginaStr != "" {
		if p, err := strconv.Atoi(paginaStr); err == nil && p > 0 {
			pagina = p
		}
	}

	offset := (pagina - 1) * limite

	emprestimos, err := c.repo.BuscarTodos(r.Context(), usuarioID, livroID, estado, limite, offset)
	if err != nil {
		slog.Error("Erro ao listar empréstimos", slog.String("erro", err.Error()))
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusInternalServerError)
		fmt.Fprint(w, `{"erro": "Erro interno ao processar a listagem de empréstimos"}`)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(emprestimos)
}

// ObterHistorico processa a rota GET /api/emprestimos/historico
func (c *ControladorEmprestimo) ObterHistorico(w http.ResponseWriter, r *http.Request) {
	_, ok := r.Context().Value(ChaveUsuario).(*UsuarioAutenticado)
	if !ok {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusUnauthorized)
		fmt.Fprint(w, `{"erro": "Usuário não autenticado"}`)
		return
	}

	valoresQuery := r.URL.Query()
	usuarioID := valoresQuery.Get("usuario_id")
	livroID := valoresQuery.Get("livro_id")

	if usuarioID == "" && livroID == "" {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusBadRequest)
		fmt.Fprint(w, `{"erro": "É obrigatório fornecer usuario_id ou livro_id para consultar o histórico"}`)
		return
	}

	emprestimos, err := c.repo.BuscarHistorico(r.Context(), usuarioID, livroID)
	if err != nil {
		slog.Error("Erro ao buscar histórico de empréstimos", slog.String("erro", err.Error()))
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusInternalServerError)
		fmt.Fprint(w, `{"erro": "Erro interno ao buscar o histórico de empréstimos"}`)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(emprestimos)
}

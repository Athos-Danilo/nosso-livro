package controlador

import (
	"errors"
	"net/http"
	"strings"

	"nosso-livro/servico-autenticacao-usuario/internal/dominio"
)

// ChaveContexto representa o tipo customizado para chaves no contexto das requisições
type ChaveContexto string

// Constantes de chave de contexto para evitar colisão
const (
	ChaveContextoUsuarioID ChaveContexto = "usuario_id"
)

// ControladorUsuario gerencia requisições relacionadas a dados de perfis de usuários
type ControladorUsuario struct {
	repoUsuario dominio.RepositorioUsuario
}

// NovoControladorUsuario inicializa o controlador de usuários
func NovoControladorUsuario(repo dominio.RepositorioUsuario) *ControladorUsuario {
	return &ControladorUsuario{
		repoUsuario: repo,
	}
}

// ObterPerfil retorna o perfil completo do usuário autenticado no token (GET /api/usuarios/me)
func (cu *ControladorUsuario) ObterPerfil(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		responderComErro(w, http.StatusMethodNotAllowed, "método não permitido")
		return
	}

	// Extrai o ID do usuário injetado no contexto pelo middleware de autenticação
	usuarioID, ok := r.Context().Value(ChaveContextoUsuarioID).(string)
	if !ok || usuarioID == "" {
		responderComErro(w, http.StatusUnauthorized, "usuário não autenticado")
		return
	}

	usuario, err := cu.repoUsuario.BuscarPorID(r.Context(), usuarioID)
	if err != nil {
		if errors.Is(err, dominio.ErrUsuarioNaoEncontrado) {
			responderComErro(w, http.StatusNotFound, "usuário não encontrado")
			return
		}
		responderComErro(w, http.StatusInternalServerError, "erro ao obter perfil do usuário")
		return
	}

	resposta := dominio.RespostaUsuario{
		ID:        usuario.ID,
		Nome:      usuario.Nome,
		WhatsApp:  usuario.WhatsApp,
		Email:     usuario.Email,
		Permissao: usuario.Permissao,
		Ativo:     usuario.Ativo,
		CriadoEm:  usuario.CriadoEm,
	}

	responderComJSON(w, http.StatusOK, resposta)
}

// ObterPorID retorna dados públicos de um usuário específico por ID (GET /api/usuarios/{id})
func (cu *ControladorUsuario) ObterPorID(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		responderComErro(w, http.StatusMethodNotAllowed, "método não permitido")
		return
	}

	// Recupera o parâmetro ID usando a API de rotas nativa do Go 1.22+
	id := strings.TrimSpace(r.PathValue("id"))
	if id == "" {
		responderComErro(w, http.StatusBadRequest, "o parâmetro ID do usuário é obrigatório")
		return
	}

	usuario, err := cu.repoUsuario.BuscarPorID(r.Context(), id)
	if err != nil {
		if errors.Is(err, dominio.ErrUsuarioNaoEncontrado) {
			responderComErro(w, http.StatusNotFound, "usuário não encontrado")
			return
		}
		responderComErro(w, http.StatusInternalServerError, "erro ao buscar usuário por ID")
		return
	}

	resposta := dominio.RespostaUsuario{
		ID:        usuario.ID,
		Nome:      usuario.Nome,
		WhatsApp:  usuario.WhatsApp,
		Email:     usuario.Email,
		Permissao: usuario.Permissao,
		Ativo:     usuario.Ativo,
		CriadoEm:  usuario.CriadoEm,
	}

	responderComJSON(w, http.StatusOK, resposta)
}

package controlador

import (
	"encoding/json"
	"errors"
	"net/http"
	"strings"

	"nosso-livro/servico-autenticacao-usuario/internal/dominio"
	"nosso-livro/servico-autenticacao-usuario/internal/servico"
)

// ControladorAutenticacao gerencia requisições relacionadas a cadastro e login de usuários
type ControladorAutenticacao struct {
	repoUsuario  dominio.RepositorioUsuario
	chaveSecreta string
}

// NovoControladorAutenticacao inicializa o controlador de autenticação
func NovoControladorAutenticacao(repo dominio.RepositorioUsuario, chaveSecreta string) *ControladorAutenticacao {
	return &ControladorAutenticacao{
		repoUsuario:  repo,
		chaveSecreta: chaveSecreta,
	}
}

// RespostaLogin estruturada em português do Brasil
type RespostaLogin struct {
	Token   string                  `json:"token"`
	Usuario dominio.RespostaUsuario `json:"usuario"`
}

// Cadastrar lida com o registro de um novo usuário (POST /api/autenticacao/cadastro)
func (ca *ControladorAutenticacao) Cadastrar(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		responderComErro(w, http.StatusMethodNotAllowed, "método não permitido")
		return
	}

	var req dominio.RequisicaoCadastro
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		responderComErro(w, http.StatusBadRequest, "corpo da requisição inválido")
		return
	}

	// Validações básicas de campos obrigatórios
	req.Nome = strings.TrimSpace(req.Nome)
	req.WhatsApp = strings.TrimSpace(req.WhatsApp)
	req.Email = strings.TrimSpace(req.Email)
	req.Senha = strings.TrimSpace(req.Senha)

	if req.Nome == "" || req.WhatsApp == "" || req.Email == "" || req.Senha == "" {
		responderComErro(w, http.StatusBadRequest, "todos os campos (nome, whatsapp, email, senha) são obrigatórios")
		return
	}

	// Criptografa a senha fornecida pelo usuário
	senhaHash, err := servico.GerarHashSenha(req.Senha)
	if err != nil {
		responderComErro(w, http.StatusInternalServerError, "erro interno ao processar cadastro")
		return
	}

	// Cria struct do novo usuário com permissão padrão 'membro' e ativo
	usuario := &dominio.Usuario{
		Nome:      req.Nome,
		WhatsApp:  req.WhatsApp,
		Email:     req.Email,
		SenhaHash: senhaHash,
		Permissao: "membro",
		Ativo:     true,
	}

	// Persiste o usuário no banco de dados
	err = ca.repoUsuario.Criar(r.Context(), usuario)
	if err != nil {
		if errors.Is(err, dominio.ErrWhatsAppDuplicado) {
			responderComErro(w, http.StatusConflict, "WhatsApp já cadastrado")
			return
		}
		if errors.Is(err, dominio.ErrEmailDuplicado) {
			responderComErro(w, http.StatusConflict, "e-mail já cadastrado")
			return
		}
		responderComErro(w, http.StatusInternalServerError, err.Error())
		return
	}

	// Prepara a resposta pública formatada
	resposta := dominio.RespostaUsuario{
		ID:        usuario.ID,
		Nome:      usuario.Nome,
		WhatsApp:  usuario.WhatsApp,
		Email:     usuario.Email,
		Permissao: usuario.Permissao,
		Ativo:     usuario.Ativo,
		CriadoEm:  usuario.CriadoEm,
	}

	responderComJSON(w, http.StatusCreated, resposta)
}

// Login lida com a autenticação e geração de token JWT (POST /api/autenticacao/login)
func (ca *ControladorAutenticacao) Login(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		responderComErro(w, http.StatusMethodNotAllowed, "método não permitido")
		return
	}

	var req dominio.RequisicaoLogin
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		responderComErro(w, http.StatusBadRequest, "corpo da requisição inválido")
		return
	}

	req.WhatsApp = strings.TrimSpace(req.WhatsApp)
	req.Email = strings.TrimSpace(req.Email)
	req.Senha = strings.TrimSpace(req.Senha)

	if (req.WhatsApp == "" && req.Email == "") || req.Senha == "" {
		responderComErro(w, http.StatusBadRequest, "é necessário fornecer whatsapp ou email, além da senha")
		return
	}

	var usuario *dominio.Usuario
	var err error

	// Busca usuário por WhatsApp ou por E-mail conforme fornecido
	if req.WhatsApp != "" {
		usuario, err = ca.repoUsuario.BuscarPorWhatsApp(r.Context(), req.WhatsApp)
	} else {
		usuario, err = ca.repoUsuario.BuscarPorEmail(r.Context(), req.Email)
	}

	if err != nil {
		if errors.Is(err, dominio.ErrUsuarioNaoEncontrado) {
			responderComErro(w, http.StatusUnauthorized, "credenciais inválidas")
			return
		}
		responderComErro(w, http.StatusInternalServerError, "erro interno ao processar login")
		return
	}

	// Compara o hash da senha
	if err := servico.CompararSenhaHash(req.Senha, usuario.SenhaHash); err != nil {
		responderComErro(w, http.StatusUnauthorized, "credenciais inválidas")
		return
	}

	// Verifica se a conta do usuário está ativa
	if !usuario.Ativo {
		responderComErro(w, http.StatusForbidden, "conta de usuário inativa")
		return
	}

	// Gera o token de autenticação JWT
	token, err := servico.GerarTokenAutenticacao(usuario, ca.chaveSecreta)
	if err != nil {
		responderComErro(w, http.StatusInternalServerError, "erro ao gerar token de acesso")
		return
	}

	// Prepara a resposta de sucesso com dados do usuário e o token gerado
	resposta := RespostaLogin{
		Token: token,
		Usuario: dominio.RespostaUsuario{
			ID:        usuario.ID,
			Nome:      usuario.Nome,
			WhatsApp:  usuario.WhatsApp,
			Email:     usuario.Email,
			Permissao: usuario.Permissao,
			Ativo:     usuario.Ativo,
			CriadoEm:  usuario.CriadoEm,
		},
	}

	responderComJSON(w, http.StatusOK, resposta)
}

package cliente

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"strings"

	"nosso-livro/servico-emprestimo/internal/dominio"
)

// ClienteUsuario gerencia a comunicação síncrona com o Serviço de Autenticação e Usuário
type ClienteUsuario struct {
	urlBase string
	cliente *ClienteHTTPResiliente
}

// NovoClienteUsuario inicializa o cliente de integração de usuários
func NovoClienteUsuario(urlBase string, cliente *ClienteHTTPResiliente) *ClienteUsuario {
	if urlBase == "" {
		urlBase = "http://localhost:8080"
	}
	urlBase = strings.TrimSuffix(urlBase, "/")
	return &ClienteUsuario{
		urlBase: urlBase,
		cliente: cliente,
	}
}

// BuscarUsuarioPorID consulta os detalhes do usuário pelo ID síncronamente via HTTP GET
func (cu *ClienteUsuario) BuscarUsuarioPorID(ctx context.Context, idUsuario string, token string) (*RespostaUsuario, error) {
	url := fmt.Sprintf("%s/api/usuarios/%s", cu.urlBase, idUsuario)

	req, err := http.NewRequestWithContext(ctx, http.MethodGet, url, nil)
	if err != nil {
		return nil, fmt.Errorf("erro ao criar requisição para obter usuário: %w", err)
	}

	req.Header.Set("Content-Type", "application/json")
	if token != "" {
		if !strings.HasPrefix(token, "Bearer ") {
			token = "Bearer " + token
		}
		req.Header.Set("Authorization", token)
	}

	resp, err := cu.cliente.ExecutarRequisicaoComRetry(ctx, req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode == http.StatusNotFound {
		return nil, dominio.ErrUsuarioNaoEncontrado
	}

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("serviço de usuário retornou erro com status HTTP %d", resp.StatusCode)
	}

	var resposta RespostaUsuario
	if err := json.NewDecoder(resp.Body).Decode(&resposta); err != nil {
		return nil, fmt.Errorf("erro ao decodificar payload de resposta de usuário: %w", err)
	}

	return &resposta, nil
}

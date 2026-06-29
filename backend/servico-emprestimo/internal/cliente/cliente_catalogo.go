package cliente

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"strings"

	"nosso-livro/servico-emprestimo/internal/dominio"
)

// ClienteCatalogo gerencia a comunicação síncrona com o Serviço de Catálogo e Biblioteca
type ClienteCatalogo struct {
	urlBase string
	cliente *ClienteHTTPResiliente
}

// NovoClienteCatalogo inicializa o cliente de integração de catálogo
func NovoClienteCatalogo(urlBase string, cliente *ClienteHTTPResiliente) *ClienteCatalogo {
	if urlBase == "" {
		urlBase = "http://localhost:3002"
	}
	urlBase = strings.TrimSuffix(urlBase, "/")
	return &ClienteCatalogo{
		urlBase: urlBase,
		cliente: cliente,
	}
}

// BuscarLivroPorID consulta os detalhes do livro pelo ID síncronamente via HTTP GET
func (cc *ClienteCatalogo) BuscarLivroPorID(ctx context.Context, idLivro string) (*RespostaLivro, error) {
	url := fmt.Sprintf("%s/api/livros/%s", cc.urlBase, idLivro)

	req, err := http.NewRequestWithContext(ctx, http.MethodGet, url, nil)
	if err != nil {
		return nil, fmt.Errorf("erro ao criar requisição para obter livro: %w", err)
	}

	req.Header.Set("Content-Type", "application/json")

	resp, err := cc.cliente.ExecutarRequisicaoComRetry(ctx, req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode == http.StatusNotFound {
		return nil, dominio.ErrLivroNaoEncontrado
	}

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("serviço de catálogo retornou erro com status HTTP %d", resp.StatusCode)
	}

	var resposta RespostaLivro
	if err := json.NewDecoder(resp.Body).Decode(&resposta); err != nil {
		return nil, fmt.Errorf("erro ao decodificar payload de resposta de livro: %w", err)
	}

	return &resposta, nil
}

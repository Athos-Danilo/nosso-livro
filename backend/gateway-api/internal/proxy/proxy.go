package proxy

import (
	"log/slog"
	"net/http"
	"net/http/httputil"
	"net/url"
)

// NovoProxyReverso cria e configura uma instancia de ReverseProxy para um microsservico de destino.
//
// O proxy reescreve o cabecalho Host para corresponder ao destino e gera logs estruturados
// no nivel Debug para monitoramento do fluxo de roteamento do monorepo.
func NovoProxyReverso(enderecoDestino string) (*httputil.ReverseProxy, error) {
	destino, err := url.Parse(enderecoDestino)
	if err != nil {
		return nil, err
	}

	proxy := httputil.NewSingleHostReverseProxy(destino)

	// Customiza o Director do proxy reverso
	diretorOriginal := proxy.Director
	proxy.Director = func(req *http.Request) {
		diretorOriginal(req)

		// Ajusta o cabecalho Host da requisicao para o host de destino
		req.Host = destino.Host

		slog.Debug("Encaminhando requisicao para o microsservico",
			slog.String("metodo", req.Method),
			slog.String("caminho", req.URL.Path),
			slog.String("destino", destino.String()),
		)
	}

	return proxy, nil
}

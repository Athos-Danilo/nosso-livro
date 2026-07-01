package proxy

import (
	"context"
	"errors"
	"fmt"
	"log/slog"
	"net"
	"net/http"
	"net/http/httputil"
	"net/url"
	"time"
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

	// M5.1: Configura timeouts de resiliencia no Transport
	proxy.Transport = &http.Transport{
		Proxy: http.ProxyFromEnvironment,
		DialContext: func(ctx context.Context, network, addr string) (net.Conn, error) {
			dialer := &net.Dialer{
				Timeout:   2 * time.Second, // Timeout de conexao de 2s
				KeepAlive: 30 * time.Second,
			}
			return dialer.DialContext(ctx, network, addr)
		},
		ForceAttemptHTTP2:     true,
		MaxIdleConns:          100,
		IdleConnTimeout:       90 * time.Second,
		TLSHandshakeTimeout:   10 * time.Second,
		ExpectContinueTimeout: 1 * time.Second,
		ResponseHeaderTimeout: 5 * time.Second, // Timeout de resposta de 5s
	}

	// M5.2: Manipulador de Erros do Proxy (ErrorHandler)
	proxy.ErrorHandler = func(w http.ResponseWriter, r *http.Request, err error) {
		// Evita logar como erro caso o cliente (frontend/navegador) tenha cancelado a requisicao
		if errors.Is(err, context.Canceled) {
			slog.Debug("Requisicao cancelada pelo cliente antes do termino",
				slog.String("destino", destino.String()),
			)
			return
		}

		slog.Error("Falha de rede no proxy reverso ao contatar microsservico",
			slog.String("destino", destino.String()),
			slog.String("erro", err.Error()),
		)
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusServiceUnavailable)
		fmt.Fprint(w, `{"erro": "Serviço interno temporariamente indisponível. Tente novamente mais tarde."}`)
	}

	return proxy, nil
}

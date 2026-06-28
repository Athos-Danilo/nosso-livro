package controlador

import (
	"net"
	"net/http"
	"sync"
	"time"

	"golang.org/x/time/rate"
)

// limiteCliente mantém o limitador individual e o carimbo de data/hora do último acesso
type limiteCliente struct {
	limitador    *rate.Limiter
	ultimoAcesso time.Time
}

// LimitadorIP gerencia os limitadores de taxa para múltiplos endereços IP
type LimitadorIP struct {
	clientes map[string]*limiteCliente
	mu       sync.RWMutex
	taxa     rate.Limit
	burst    int
}

// NovoLimitadorIP inicializa um novo gerenciador de limites por IP.
// 'requisicoesPorSegundo' define quantas requisições são permitidas por segundo, por IP.
// 'burst' define a tolerância de rajada acumulada de requisições permitida.
func NovoLimitadorIP(requisicoesPorSegundo float64, burst int) *LimitadorIP {
	lim := &LimitadorIP{
		clientes: make(map[string]*limiteCliente),
		taxa:     rate.Limit(requisicoesPorSegundo),
		burst:    burst,
	}

	// Inicializa rotina em segundo plano para limpar IPs inativos e evitar vazamento de memória
	go lim.limparClientesInativos()

	return lim
}

// obterLimitador recupera ou cria um limitador de taxa para o IP fornecido
func (l *LimitadorIP) obterLimitador(ip string) *rate.Limiter {
	l.mu.Lock()
	defer l.mu.Unlock()

	cliente, existe := l.clientes[ip]
	if !existe {
		limiter := rate.NewLimiter(l.taxa, l.burst)
		cliente = &limiteCliente{
			limitador: limiter,
		}
		l.clientes[ip] = cliente
	}

	cliente.ultimoAcesso = time.Now()
	return cliente.limitador
}

// limparClientesInativos monitora e exclui limitadores de IPs inativos há mais de 5 minutos
func (l *LimitadorIP) limparClientesInativos() {
	for {
		time.Sleep(1 * time.Minute)

		l.mu.Lock()
		for ip, cliente := range l.clientes {
			if time.Since(cliente.ultimoAcesso) > 5*time.Minute {
				delete(l.clientes, ip)
			}
		}
		l.mu.Unlock()
	}
}

// MiddlewareLimitadorTaxa retorna um middleware HTTP que aplica a limitação de requisições por IP de origem
func MiddlewareLimitadorTaxa(limitador *LimitadorIP) func(http.Handler) http.Handler {
	return func(proximo http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			// Extrai o IP de origem ignorando a porta da requisição
			ip, _, err := net.SplitHostPort(r.RemoteAddr)
			if err != nil {
				ip = r.RemoteAddr
			}

			lim := limitador.obterLimitador(ip)
			if !lim.Allow() {
				responderComErro(w, http.StatusTooManyRequests, "limite de requisições excedido. Tente novamente mais tarde.")
				return
			}

			proximo.ServeHTTP(w, r)
		})
	}
}

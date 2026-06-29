package evento

import (
	"context"
	"fmt"
	"log/slog"
	"sync"
	"time"

	amqp "github.com/rabbitmq/amqp091-go"
)

const (
	NomeExchange           = "nosso-livro"
	EsperaInicialReconexao = 2 * time.Second
	FatorBackoff           = 2
	EsperaMaximaReconexao  = 30 * time.Second
)

// GerenciadorRabbitMQ gerencia o ciclo de vida da conexão e do canal com o RabbitMQ
type GerenciadorRabbitMQ struct {
	url      string
	conexao  *amqp.Connection
	canal    *amqp.Channel
	mu       sync.RWMutex
	fechando bool
}

// NovoGerenciadorRabbitMQ instancia o gerenciador com a URL de conexão do broker
func NovoGerenciadorRabbitMQ(url string) *GerenciadorRabbitMQ {
	if url == "" {
		url = "amqp://guest:guest@localhost:5672"
	}
	return &GerenciadorRabbitMQ{
		url: url,
	}
}

// Iniciar dispara o fluxo assíncrono de conexão e reconexão automática
func (g *GerenciadorRabbitMQ) Iniciar(ctx context.Context) {
	go g.conectarEAutoReconectar(ctx)
}

// ObterCanal retorna o canal ativo se estiver disponível
func (g *GerenciadorRabbitMQ) ObterCanal() (*amqp.Channel, error) {
	g.mu.RLock()
	defer g.mu.RUnlock()
	if g.canal == nil {
		return nil, fmt.Errorf("canal do RabbitMQ não disponível. O broker pode estar offline ou reconectando")
	}
	return g.canal, nil
}

// Fechar encerra conexões e canais de forma controlada
func (g *GerenciadorRabbitMQ) Fechar() {
	g.mu.Lock()
	g.fechando = true
	g.mu.Unlock()

	g.mu.RLock()
	defer g.mu.RUnlock()
	if g.canal != nil {
		g.canal.Close()
	}
	if g.conexao != nil {
		g.conexao.Close()
	}
}

func (g *GerenciadorRabbitMQ) conectarEAutoReconectar(ctx context.Context) {
	tentativa := 0
	espera := EsperaInicialReconexao

	for {
		g.mu.RLock()
		fechando := g.fechando
		g.mu.RUnlock()
		if fechando {
			return
		}

		slog.Info("Tentando conectar ao broker RabbitMQ...", slog.Int("tentativa", tentativa+1))
		conn, err := amqp.Dial(g.url)
		if err != nil {
			slog.Error("Falha ao conectar ao RabbitMQ", slog.String("erro", err.Error()))
			tentativa++
			espera = time.Duration(float64(espera) * FatorBackoff)
			if espera > EsperaMaximaReconexao {
				espera = EsperaMaximaReconexao
			}
			slog.Warn("Aguardando para tentar nova conexão com o broker...", slog.Duration("espera", espera))
			select {
			case <-ctx.Done():
				return
			case <-time.After(espera):
				continue
			}
		}

		ch, err := conn.Channel()
		if err != nil {
			slog.Error("Falha ao criar canal no RabbitMQ", slog.String("erro", err.Error()))
			conn.Close()
			tentativa++
			select {
			case <-ctx.Done():
				return
			case <-time.After(espera):
				continue
			}
		}

		// Ativa Publisher Confirms no canal para publicações resilientes
		if err := ch.Confirm(false); err != nil {
			slog.Error("Falha ao ativar Publisher Confirms no canal", slog.String("erro", err.Error()))
			ch.Close()
			conn.Close()
			tentativa++
			select {
			case <-ctx.Done():
				return
			case <-time.After(espera):
				continue
			}
		}

		// Declara a exchange principal (tipo topic) do projeto
		err = ch.ExchangeDeclare(
			NomeExchange, // nome
			"topic",      // tipo
			true,         // durável
			false,        // auto-deletar
			false,        // interna
			false,        // no-wait
			nil,          // argumentos
		)
		if err != nil {
			slog.Error("Falha ao declarar a exchange principal", slog.String("erro", err.Error()))
			ch.Close()
			conn.Close()
			tentativa++
			select {
			case <-ctx.Done():
				return
			case <-time.After(espera):
				continue
			}
		}

		g.mu.Lock()
		g.conexao = conn
		g.canal = ch
		g.mu.Unlock()

		slog.Info("Conexão com o broker RabbitMQ estabelecida e canal configurado com Publisher Confirms!")
		tentativa = 0
		espera = EsperaInicialReconexao

		// Escuta notificações de encerramento da conexão e canal para engatilhar reconexão
		fecharConexaoChan := conn.NotifyClose(make(chan *amqp.Error))
		fecharCanalChan := ch.NotifyClose(make(chan *amqp.Error))

		select {
		case <-ctx.Done():
			return
		case errClose := <-fecharConexaoChan:
			if errClose != nil {
				slog.Warn("Conexão com o RabbitMQ fechada devido a erro", slog.String("erro", errClose.Error()))
			} else {
				slog.Info("Conexão com o RabbitMQ fechada de forma limpa")
			}
		case errClose := <-fecharCanalChan:
			if errClose != nil {
				slog.Warn("Canal do RabbitMQ fechado devido a erro", slog.String("erro", errClose.Error()))
			} else {
				slog.Info("Canal do RabbitMQ fechado")
			}
		}

		g.mu.Lock()
		g.canal = nil
		g.conexao = nil
		g.mu.Unlock()
	}
}

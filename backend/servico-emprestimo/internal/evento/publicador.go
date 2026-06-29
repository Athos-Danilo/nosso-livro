package evento

import (
	"context"
	"encoding/json"
	"fmt"
	"log/slog"

	amqp "github.com/rabbitmq/amqp091-go"
)

// PublicadorEventos gerencia o envio de eventos assíncronos para a exchange
type PublicadorEventos struct {
	gerenciador *GerenciadorRabbitMQ
}

// NovoPublicadorEventos instancia o publicador com o gerenciador de conexões
func NovoPublicadorEventos(gerenciador *GerenciadorRabbitMQ) *PublicadorEventos {
	return &PublicadorEventos{
		gerenciador: gerenciador,
	}
}

// MensagemEmprestimoCriado define o payload para o evento emprestimo.criado
type MensagemEmprestimoCriado struct {
	IDEmprestimo        string `json:"id_emprestimo"`
	IDUsuario           string `json:"id_usuario"`
	IDLivro             string `json:"id_livro"`
	IDBiblioteca        string `json:"id_biblioteca"`
	DataLimiteDevolucao string `json:"data_limite_devolucao"`
	CriadoEm            string `json:"criado_em"`
}

// MensagemEmprestimoDevolvido define o payload para o evento emprestimo.devolvido
type MensagemEmprestimoDevolvido struct {
	IDEmprestimo      string `json:"id_emprestimo"`
	IDUsuario         string `json:"id_usuario"`
	IDLivro           string `json:"id_livro"`
	DataDevolucaoReal string `json:"data_devolucao_real"`
}

// Publicar envia um evento serializado para a exchange com confirmação de recebimento (Publisher Confirms)
func (p *PublicadorEventos) Publicar(ctx context.Context, chaveRoteamento string, payload interface{}) error {
	canal, err := p.gerenciador.ObterCanal()
	if err != nil {
		return fmt.Errorf("não foi possível publicar o evento, canal do broker indisponível: %w", err)
	}

	corpo, err := json.Marshal(payload)
	if err != nil {
		return fmt.Errorf("falha ao serializar payload do evento %s: %w", chaveRoteamento, err)
	}

	slog.Info("Disparando publicação de evento no RabbitMQ...", slog.String("evento", chaveRoteamento))

	// Publica utilizando confirmação diferida (Publisher Confirms ativado)
	confirmacao, err := canal.PublishWithDeferredConfirmWithContext(
		ctx,
		NomeExchange,
		chaveRoteamento,
		false, // mandatory
		false, // immediate
		amqp.Publishing{
			ContentType:  "application/json",
			Body:         corpo,
			DeliveryMode: amqp.Persistent, // Mensagem persistente
		},
	)
	if err != nil {
		return fmt.Errorf("falha ao publicar o evento %s no RabbitMQ: %w", chaveRoteamento, err)
	}

	// Bloqueia e aguarda a confirmação (ACK) do broker
	confirmado := confirmacao.Wait()
	if !confirmado {
		return fmt.Errorf("broker RabbitMQ rejeitou a mensagem (NACK) para o evento %s", chaveRoteamento)
	}

	slog.Info("Evento publicado e confirmado com sucesso pelo broker!", slog.String("evento", chaveRoteamento))
	return nil
}

// PublicarEmprestimoCriado despacha o evento correspondente à criação de empréstimo
func (p *PublicadorEventos) PublicarEmprestimoCriado(ctx context.Context, msg MensagemEmprestimoCriado) error {
	return p.Publicar(ctx, "emprestimo.criado", msg)
}

// PublicarEmprestimoDevolvido despacha o evento correspondente à devolução de livro
func (p *PublicadorEventos) PublicarEmprestimoDevolvido(ctx context.Context, msg MensagemEmprestimoDevolvido) error {
	return p.Publicar(ctx, "emprestimo.devolvido", msg)
}

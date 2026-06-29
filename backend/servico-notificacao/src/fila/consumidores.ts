import type { ConsumeMessage } from 'amqplib';
import { obterCanal, NOME_FILA } from './rabbitmq';
import type {
  MensagemEmprestimoCriado,
  MensagemEmprestimoDevolvido,
  MensagemReservaCriada,
  MensagemReservaAtribuida,
} from './tipos';
import logger from '../logger';

// ─── Tipo do handler de processamento ────────────────────────────────────────
/**
 * Função responsável por processar um evento específico.
 * Recebe o payload já deserializado e a routing key do evento.
 */
type HandlerEvento = (payload: unknown, chaveRoteamento: string) => Promise<void>;

// ─── Mapa de handlers por evento ─────────────────────────────────────────────
/**
 * Registro dos handlers de processamento de cada evento.
 * As fases subsequentes (4 e 5) implementarão a lógica real de envio.
 * Por ora, cada handler apenas registra o evento recebido via log.
 */
const handlers: Record<string, HandlerEvento> = {
  'emprestimo.criado': async (payload) => {
    const dados = payload as MensagemEmprestimoCriado;
    logger.info(
      {
        idEmprestimo: dados.id_emprestimo,
        idUsuario: dados.id_usuario,
        idLivro: dados.id_livro,
        dataLimite: dados.data_limite_devolucao,
      },
      'Evento "emprestimo.criado" recebido. Notificação de empréstimo será enviada.'
    );
    // TODO (Fase 5): chamar processarNotificacao() com template de empréstimo
  },

  'emprestimo.devolvido': async (payload) => {
    const dados = payload as MensagemEmprestimoDevolvido;
    logger.info(
      {
        idEmprestimo: dados.id_emprestimo,
        idUsuario: dados.id_usuario,
        idLivro: dados.id_livro,
        dataDevolucao: dados.data_devolucao_real,
      },
      'Evento "emprestimo.devolvido" recebido. Notificação de devolução será enviada.'
    );
    // TODO (Fase 5): chamar processarNotificacao() com template de devolução
  },

  'reserva.criada': async (payload) => {
    const dados = payload as MensagemReservaCriada;
    logger.info(
      {
        idReserva: dados.id_reserva,
        idUsuario: dados.id_usuario,
        idLivro: dados.id_livro,
        posicao: dados.posicao,
      },
      'Evento "reserva.criada" recebido. Notificação de ingresso na fila será enviada.'
    );
    // TODO (Fase 5): chamar processarNotificacao() com template de fila de espera
  },

  'reserva.atribuida': async (payload) => {
    const dados = payload as MensagemReservaAtribuida;
    logger.info(
      {
        idReserva: dados.id_reserva,
        idUsuario: dados.id_usuario,
        idLivro: dados.id_livro,
        prazoRetirada: dados.prazo_retirada,
      },
      'Evento "reserva.atribuida" recebido. Notificação de livro liberado será enviada.'
    );
    // TODO (Fase 5): chamar processarNotificacao() com template de livro liberado
  },
};

// ─── Processamento genérico de mensagens ─────────────────────────────────────

/**
 * Processa uma mensagem recebida da fila `fila_notificacoes`.
 *
 * Fluxo:
 * 1. Identifica o tipo do evento pela routing key da mensagem.
 * 2. Deserializa o payload JSON de forma segura.
 * 3. Despacha para o handler correspondente.
 * 4. Confirma (ack) a mensagem após processamento bem-sucedido.
 * 5. Em caso de erro, rejeita (nack) para reprocessamento.
 *
 * @param mensagem - Mensagem bruta recebida do RabbitMQ
 */
async function processarMensagem(mensagem: ConsumeMessage): Promise<void> {
  const canal = obterCanal();
  const chaveRoteamento = mensagem.fields.routingKey;

  // ─── Deserialização segura do payload ────────────────────────────────
  let payload: unknown;
  try {
    payload = JSON.parse(mensagem.content.toString());
  } catch {
    logger.warn(
      { conteudo: mensagem.content.toString().slice(0, 200), evento: chaveRoteamento },
      'Payload JSON inválido recebido via RabbitMQ — descartando mensagem.'
    );
    // Rejeita sem requeue: mensagem malformada não pode ser reprocessada
    canal.nack(mensagem, false, false);
    return;
  }

  // ─── Despacho para o handler do evento ───────────────────────────────
  const handler = handlers[chaveRoteamento];

  if (!handler) {
    logger.warn(
      { evento: chaveRoteamento },
      `Evento desconhecido recebido: "${chaveRoteamento}". Descartando mensagem.`
    );
    canal.nack(mensagem, false, false);
    return;
  }

  try {
    await handler(payload, chaveRoteamento);
    // Confirma processamento bem-sucedido
    canal.ack(mensagem);
  } catch (erro) {
    logger.error(
      { erro: erro instanceof Error ? erro.message : erro, evento: chaveRoteamento },
      `Erro ao processar evento "${chaveRoteamento}". Mensagem será reprocessada.`
    );
    // Rejeita com requeue para nova tentativa futura
    canal.nack(mensagem, false, true);
  }
}

// ─── Registro do consumidor ───────────────────────────────────────────────────

/**
 * Registra o consumidor na fila `fila_notificacoes`.
 * Deve ser chamado após a conexão com o broker ser estabelecida
 * e é re-chamado automaticamente em caso de reconexão.
 *
 * O `noAck: false` garante que o ack manual seja exigido — mensagens só
 * são removidas da fila após confirmação explícita do processamento.
 */
export async function iniciarConsumidor(): Promise<void> {
  const canal = obterCanal();

  await canal.consume(
    NOME_FILA,
    (mensagem) => {
      if (!mensagem) {
        logger.warn('Mensagem nula recebida — consumer pode ter sido cancelado pelo broker.');
        return;
      }
      // Processa de forma assíncrona sem bloquear o loop de eventos
      processarMensagem(mensagem).catch((erro) => {
        logger.error({ erro }, 'Erro não tratado no processamento de mensagem do RabbitMQ.');
      });
    },
    { noAck: false } // ack manual — garantia de entrega
  );

  logger.info(
    { fila: NOME_FILA },
    'Consumidor de notificações registrado. Aguardando eventos...'
  );
}

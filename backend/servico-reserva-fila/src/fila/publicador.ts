import { obterCanal, NOME_EXCHANGE } from './rabbitmq';
import type { MensagemReservaCriada, MensagemReservaAtribuida } from './tipos';
import logger from '../logger';

// ─── Opções de publicação ─────────────────────────────────────────────────────
/** Mensagens persistentes sobrevivem a reinicializações do broker */
const OPCOES_PUBLICACAO = { persistent: true };

/**
 * Serializa e publica um payload JSON na exchange principal do projeto.
 *
 * @param chaveRoteamento - Routing key do evento (ex: 'reserva.criada')
 * @param payload - Objeto a ser serializado como JSON
 */
function publicar(chaveRoteamento: string, payload: unknown): void {
  const canal = obterCanal();
  const conteudo = Buffer.from(JSON.stringify(payload));

  const publicado = canal.publish(
    NOME_EXCHANGE,
    chaveRoteamento,
    conteudo,
    OPCOES_PUBLICACAO
  );

  if (publicado) {
    logger.info({ evento: chaveRoteamento }, `Evento "${chaveRoteamento}" publicado com sucesso.`);
  } else {
    // O buffer interno do canal está cheio — backpressure do RabbitMQ
    logger.warn(
      { evento: chaveRoteamento },
      `Buffer do canal cheio ao publicar "${chaveRoteamento}". A mensagem pode ter sido descartada.`
    );
  }
}

/**
 * Publica o evento `reserva.criada` quando um usuário entra na fila de espera.
 * Consumidor: Serviço de Notificação (confirma ingresso na fila ao usuário).
 *
 * @param dados - Dados da reserva recém-criada
 */
export function publicarReservaCriada(dados: MensagemReservaCriada): void {
  publicar('reserva.criada', dados);
}

/**
 * Publica o evento `reserva.atribuida` quando um livro é liberado para o
 * próximo usuário da fila.
 * Consumidor: Serviço de Notificação (alerta o usuário que o livro está disponível).
 *
 * @param dados - Dados da reserva atribuída e prazo de retirada
 */
export function publicarReservaAtribuida(dados: MensagemReservaAtribuida): void {
  publicar('reserva.atribuida', dados);
}

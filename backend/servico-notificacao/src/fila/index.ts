// ─── Barrel de exportações do módulo de fila (RabbitMQ) ──────────────────────
// Centraliza as importações para o restante da aplicação.

export {
  iniciarConexaoRabbitMQ,
  fecharConexaoRabbitMQ,
  obterCanal,
  aoReconectar,
  NOME_EXCHANGE,
  NOME_FILA,
} from './rabbitmq';

export { iniciarConsumidor } from './consumidores';

export type {
  MensagemEmprestimoCriado,
  MensagemEmprestimoDevolvido,
  MensagemReservaCriada,
  MensagemReservaAtribuida,
} from './tipos';

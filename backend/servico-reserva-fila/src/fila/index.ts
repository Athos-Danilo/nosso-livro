// ─── Barrel de exportações do módulo de fila (RabbitMQ) ──────────────────────
// Centraliza as importações para o restante da aplicação.

export { iniciarConexaoRabbitMQ, fecharConexaoRabbitMQ, obterCanal, NOME_EXCHANGE } from './rabbitmq';
export { publicarReservaCriada, publicarReservaAtribuida } from './publicador';
export { iniciarConsumidor } from './consumidor';
export type {
  MensagemEmprestimoDevolvido,
  MensagemReservaCriada,
  MensagemReservaAtribuida,
} from './tipos';

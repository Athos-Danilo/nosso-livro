// ─── Interfaces das mensagens trocadas via RabbitMQ ──────────────────────────
// Define os contratos dos payloads JSON de cada evento do catálogo.
// PT-BR: campos em snake_case para compatibilidade entre serviços poliglotas.

/**
 * Payload do evento `emprestimo.devolvido`
 * Publicado pelo: Serviço de Empréstimo (Go)
 * Consumido por: este serviço (Reserva e Fila)
 */
export interface MensagemEmprestimoDevolvido {
  /** UUID do livro que foi devolvido */
  id_livro: string;
  /** UUID do empréstimo encerrado */
  id_emprestimo: string;
  /** ISO 8601 — momento da devolução */
  devolvido_em: string;
}

/**
 * Payload do evento `reserva.criada`
 * Publicado por: este serviço (Reserva e Fila)
 * Consumido por: Serviço de Notificação
 */
export interface MensagemReservaCriada {
  /** UUID da reserva recém-criada */
  id_reserva: string;
  /** UUID do usuário que entrou na fila */
  id_usuario: string;
  /** UUID do livro reservado */
  id_livro: string;
  /** Posição numérica na fila de espera */
  posicao: number;
  /** ISO 8601 — momento de criação */
  criado_em: string;
}

/**
 * Payload do evento `reserva.atribuida`
 * Publicado por: este serviço (Reserva e Fila)
 * Consumido por: Serviço de Notificação
 */
export interface MensagemReservaAtribuida {
  /** UUID da reserva que foi atribuída */
  id_reserva: string;
  /** UUID do usuário que deve retirar o livro */
  id_usuario: string;
  /** UUID do livro disponível para retirada */
  id_livro: string;
  /** ISO 8601 — prazo limite para retirada (48h após atribuição) */
  prazo_retirada: string;
}

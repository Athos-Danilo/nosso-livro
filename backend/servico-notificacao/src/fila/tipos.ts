// ─── Interfaces das mensagens consumidas via RabbitMQ ────────────────────────
// Define os contratos dos payloads JSON de cada evento consumido por este serviço.
// PT-BR: campos em snake_case para compatibilidade entre serviços poliglotas
// (Go, Python, Node.js).

/**
 * Payload do evento `emprestimo.criado`
 * Publicado por: Serviço de Empréstimo (Go)
 * Ação: Notificar o usuário sobre o empréstimo realizado e a data limite de devolução.
 */
export interface MensagemEmprestimoCriado {
  /** UUID do empréstimo registrado */
  id_emprestimo: string;
  /** UUID do usuário que efetuou o empréstimo */
  id_usuario: string;
  /** UUID do livro emprestado */
  id_livro: string;
  /** UUID da biblioteca de coleta */
  id_biblioteca: string;
  /** ISO 8601 — data limite para devolução */
  data_limite_devolucao: string;
  /** ISO 8601 — momento do empréstimo */
  criado_em: string;
}

/**
 * Payload do evento `emprestimo.devolvido`
 * Publicado por: Serviço de Empréstimo (Go)
 * Ação: Notificar o usuário sobre a devolução efetuada com sucesso.
 */
export interface MensagemEmprestimoDevolvido {
  /** UUID do empréstimo encerrado */
  id_emprestimo: string;
  /** UUID do usuário que devolveu */
  id_usuario: string;
  /** UUID do livro devolvido */
  id_livro: string;
  /** ISO 8601 — momento real da devolução */
  data_devolucao_real: string;
}

/**
 * Payload do evento `reserva.criada`
 * Publicado por: Serviço de Reserva e Fila (Node.js)
 * Ação: Confirmar ao usuário o ingresso na fila de espera com sua posição.
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
 * Publicado por: Serviço de Reserva e Fila (Node.js)
 * Ação: Alertar o próximo usuário que o livro está disponível para retirada.
 */
export interface MensagemReservaAtribuida {
  /** UUID da reserva atribuída */
  id_reserva: string;
  /** UUID do usuário que deve retirar o livro */
  id_usuario: string;
  /** UUID do livro disponível para retirada */
  id_livro: string;
  /** ISO 8601 — prazo limite para retirada (48h após atribuição) */
  prazo_retirada: string;
}

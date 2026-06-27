// ─── Erros de Domínio / Regras de Negócio ──────────────────────────────────────
// Estes erros são lançados pela camada de serviço quando as regras de negócio
// são violadas. Eles serão mapeados para HTTP 400 ou 409 (Conflict) nos controllers.

/**
 * Lançado quando o usuário tenta reservar um livro para o qual já possui
 * uma reserva ativa (PENDENTE ou ATRIBUIDO).
 */
export class ErroReservaDuplicada extends Error {
  constructor(public readonly idLivro: string, public readonly idUsuario: string) {
    super(`O usuário "${idUsuario}" já possui uma reserva ativa para o livro "${idLivro}".`);
    this.name = 'ErroReservaDuplicada';
  }
}

/**
 * Lançado quando uma operação é tentada em uma reserva que não existe.
 */
export class ErroReservaNaoEncontrada extends Error {
  constructor(public readonly idReserva: string) {
    super(`A reserva com ID "${idReserva}" não foi encontrada.`);
    this.name = 'ErroReservaNaoEncontrada';
  }
}

/**
 * Lançado quando um usuário tenta cancelar ou manipular uma reserva que não lhe pertence.
 */
export class ErroAcessoNegadoReserva extends Error {
  constructor(public readonly idReserva: string, public readonly idUsuario: string) {
    super(`O usuário "${idUsuario}" não tem permissão para alterar a reserva "${idReserva}".`);
    this.name = 'ErroAcessoNegadoReserva';
  }
}

/**
 * Lançado quando se tenta cancelar uma reserva que já está CONCLUIDA ou CANCELADA.
 */
export class ErroEstadoInvalidoParaCancelamento extends Error {
  constructor(public readonly idReserva: string, public readonly estadoAtual: string) {
    super(`A reserva "${idReserva}" não pode ser cancelada pois encontra-se no estado "${estadoAtual}".`);
    this.name = 'ErroEstadoInvalidoParaCancelamento';
  }
}

import { EstadoReserva, type Reserva } from '@prisma/client';
import prisma from '../banco/prisma';
import { buscarUsuarioPorId, buscarLivroPorId } from '../clientes';
import { publicarReservaCriada, publicarReservaAtribuida } from '../fila';
import {
  ErroReservaDuplicada,
  ErroReservaNaoEncontrada,
  ErroAcessoNegadoReserva,
  ErroEstadoInvalidoParaCancelamento,
} from './errosNegocio';

// ─── Constantes ──────────────────────────────────────────────────────────────
/** Prazo de retirada após atribuição: 48 horas em milissegundos */
const PRAZO_RETIRADA_MS = 48 * 60 * 60 * 1000;

// ─── Função de Ingressão na Fila (M4.1) ──────────────────────────────────────

/**
 * Insere um usuário na fila de espera para um determinado livro.
 * Fluxo:
 * 1. Valida a existência do usuário e livro (HTTP síncrono).
 * 2. Transação Prisma (Serializable):
 *    a. Verifica se já existe reserva ativa.
 *    b. Conta quantos usuários já estão na fila para o livro.
 *    c. Cria a reserva com posição = contagem + 1.
 * 3. Publica evento 'reserva.criada'.
 */
export async function ingressarNaFila(idUsuario: string, idLivro: string): Promise<Reserva> {
  // 1. Validações remotas (lançam erro se não existirem)
  await Promise.all([
    buscarUsuarioPorId(idUsuario),
    buscarLivroPorId(idLivro),
  ]);

  // 2. Transação atômica (com nível Serializable para evitar race conditions no cálculo de posição)
  const reservaCriada = await prisma.$transaction(async (tx) => {
    // a. Impedir reservas duplicadas ativas (PENDENTE ou ATRIBUIDO)
    const reservaAtiva = await tx.reserva.findFirst({
      where: {
        idUsuario,
        idLivro,
        estado: { in: [EstadoReserva.PENDENTE, EstadoReserva.ATRIBUIDO] },
      },
    });

    if (reservaAtiva) {
      throw new ErroReservaDuplicada(idLivro, idUsuario);
    }

    // b. Calcular a posição (contagem de reservas PENDENTES para o mesmo livro)
    const contagemFila = await tx.reserva.count({
      where: {
        idLivro,
        estado: EstadoReserva.PENDENTE,
      },
    });

    const novaPosicao = contagemFila + 1;

    // c. Gravar a nova reserva
    return await tx.reserva.create({
      data: {
        idUsuario,
        idLivro,
        estado: EstadoReserva.PENDENTE,
        posicao: novaPosicao,
      },
    });
  }, {
    // Usamos um nível de isolamento forte no PostgreSQL para garantir
    // a consistência do count() em alta concorrência.
    isolationLevel: 'Serializable',
  });

  // 3. Dispara evento assíncrono informando o ingresso na fila
  publicarReservaCriada({
    id_reserva: reservaCriada.id,
    id_usuario: reservaCriada.idUsuario,
    id_livro: reservaCriada.idLivro,
    posicao: reservaCriada.posicao,
    criado_em: reservaCriada.criadoEm.toISOString(),
  });

  return reservaCriada;
}

// ─── Função de Cancelamento de Reserva (M4.2) ────────────────────────────────

/**
 * Cancela uma reserva existente (manualmente pelo usuário ou por expiração de tempo).
 * Fluxo depende do estado atual:
 * - Se PENDENTE: Cancela e decrementa a posição de todos atrás na fila.
 * - Se ATRIBUIDO: Cancela e reatribui o livro para o próximo da fila.
 */
export async function cancelarReserva(idReserva: string, idUsuarioSolicitante?: string): Promise<Reserva> {
  const resultado = await prisma.$transaction(async (tx) => {
    // Busca a reserva com bloqueio para update
    const reserva = await tx.reserva.findUnique({
      where: { id: idReserva },
    });

    if (!reserva) {
      throw new ErroReservaNaoEncontrada(idReserva);
    }

    // Se informou usuário solicitante, valida permissão
    if (idUsuarioSolicitante && reserva.idUsuario !== idUsuarioSolicitante) {
      throw new ErroAcessoNegadoReserva(idReserva, idUsuarioSolicitante);
    }

    if (reserva.estado === EstadoReserva.CANCELADO || reserva.estado === EstadoReserva.CONCLUIDO) {
      throw new ErroEstadoInvalidoParaCancelamento(idReserva, reserva.estado);
    }

    // Efetua o cancelamento
    const reservaCancelada = await tx.reserva.update({
      where: { id: idReserva },
      data: { estado: EstadoReserva.CANCELADO, posicao: 0, prazoRetirada: null },
    });

    let proximaReservaAtribuida: Reserva | null = null;

    if (reserva.estado === EstadoReserva.PENDENTE) {
      // Regra: Reserva no meio da fila. Decrementar posição de quem está atrás.
      await tx.reserva.updateMany({
        where: {
          idLivro: reserva.idLivro,
          estado: EstadoReserva.PENDENTE,
          posicao: { gt: reserva.posicao }, // Posições maiores que a do cancelado
        },
        data: {
          posicao: { decrement: 1 },
        },
      });
    } else if (reserva.estado === EstadoReserva.ATRIBUIDO) {
      // Regra: O livro estava guardado para este usuário. Passar para o próximo da fila.
      const proximaReserva = await tx.reserva.findFirst({
        where: {
          idLivro: reserva.idLivro,
          estado: EstadoReserva.PENDENTE,
        },
        orderBy: {
          criadoEm: 'asc',
        },
      });

      if (proximaReserva) {
        const prazoRetirada = new Date(Date.now() + PRAZO_RETIRADA_MS);
        proximaReservaAtribuida = await tx.reserva.update({
          where: { id: proximaReserva.id },
          data: {
            estado: EstadoReserva.ATRIBUIDO,
            posicao: 0,
            prazoRetirada,
          },
        });
      }
    }

    return { reservaCancelada, proximaReservaAtribuida };
  }, {
    isolationLevel: 'Serializable',
  });

  // Se o cancelamento resultou em nova atribuição, publica o evento fora da transação
  if (resultado.proximaReservaAtribuida) {
    publicarReservaAtribuida({
      id_reserva: resultado.proximaReservaAtribuida.id,
      id_usuario: resultado.proximaReservaAtribuida.idUsuario,
      id_livro: resultado.proximaReservaAtribuida.idLivro,
      prazo_retirada: resultado.proximaReservaAtribuida.prazoRetirada!.toISOString(),
    });
  }

  return resultado.reservaCancelada;
}

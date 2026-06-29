import { EstadoReserva, type Reserva } from '@prisma/client';
import prisma from '../banco/prisma';
import { buscarUsuarioPorId, buscarLivroPorId } from '../clientes';
import { publicarReservaCriada, publicarReservaAtribuida } from '../fila';
import logger from '../logger';
import {
  ErroReservaDuplicada,
  ErroReservaNaoEncontrada,
  ErroAcessoNegadoReserva,
  ErroEstadoInvalidoParaCancelamento,
} from './errosNegocio';

// ─── Constantes ──────────────────────────────────────────────────────────────
/** Prazo de retirada após atribuição: 48 horas em milissegundos */
const PRAZO_RETIRADA_MS = 48 * 60 * 60 * 1000;

/** Número máximo de retentativas em caso de conflito de serialização */
const MAX_TENTATIVAS_TRANSACAO = 3;

// ─── Auxiliar: executa transação com retry em caso de conflito (P2034) ────────

/**
 * Executa uma função dentro de uma transação Prisma com retentativas
 * automáticas em caso de erro de serialização do PostgreSQL (código P2034).
 *
 * Esse padrão é necessário quando usamos isolationLevel: 'Serializable',
 * pois o PostgreSQL pode abortar transações concorrentes por conflito de
 * serialização e espera que a aplicação tente novamente.
 */
async function executarComRetry<T>(
  fn: (tx: Parameters<Parameters<typeof prisma.$transaction>[0]>[0]) => Promise<T>
): Promise<T> {
  let tentativa = 0;
  while (true) {
    try {
      return await prisma.$transaction(fn, { isolationLevel: 'Serializable' });
    } catch (erro: unknown) {
      const codigoErro = (erro as { code?: string })?.code;
      // P2034: Transaction failed due to a write conflict or a deadlock
      if (codigoErro === 'P2034' && tentativa < MAX_TENTATIVAS_TRANSACAO - 1) {
        tentativa++;
        // Espera exponencial entre tentativas: 50ms, 100ms, 200ms...
        const espera = 50 * Math.pow(2, tentativa);
        await new Promise((r) => setTimeout(r, espera));
        logger.warn(
          { tentativa: tentativa + 1, totalTentativas: MAX_TENTATIVAS_TRANSACAO, esperaMs: espera },
          'Conflito de serialização detectado. Retentando transação...'
        );
        continue;
      }
      throw erro;
    }
  }
}

// ─── Função de Ingressão na Fila (M4.1) ──────────────────────────────────────

/**
 * Insere um usuário na fila de espera para um determinado livro.
 *
 * Fluxo:
 * 1. Valida a existência do usuário e livro (HTTP síncrono, paralelo).
 * 2. Transação Serializable com retry:
 *    a. Verifica se já existe reserva ativa (PENDENTE ou ATRIBUIDO) — evita duplicatas.
 *    b. Conta quantos usuários já estão na fila (somente PENDENTES).
 *    c. Cria a reserva com posição = contagem + 1.
 * 3. Publica evento assíncrono 'reserva.criada'.
 */
export async function ingressarNaFila(idUsuario: string, idLivro: string): Promise<Reserva> {
  // 1. Validações remotas simultâneas (lançam erro semântico se não existirem)
  await Promise.all([
    buscarUsuarioPorId(idUsuario),
    buscarLivroPorId(idLivro),
  ]);

  // 2. Transação atômica com retry em conflito de serialização
  const reservaCriada = await executarComRetry(async (tx) => {
    // a. Verificar reservas duplicadas ativas (PENDENTE ou ATRIBUIDO)
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

    // b. Calcular posição: quantidade atual de PENDENTES + 1
    const contagemFila = await tx.reserva.count({
      where: {
        idLivro,
        estado: EstadoReserva.PENDENTE,
      },
    });

    const novaPosicao = contagemFila + 1;

    // c. Criar a reserva na posição calculada
    return await tx.reserva.create({
      data: {
        idUsuario,
        idLivro,
        estado: EstadoReserva.PENDENTE,
        posicao: novaPosicao,
      },
    });
  });

  // 3. Dispara evento assíncrono após confirmação da transação
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
 * Cancela uma reserva existente, aplicando a lógica de reordenamento da fila.
 *
 * Fluxo depende do estado atual da reserva:
 * - PENDENTE → Cancela e decrementa a posição de todos atrás na fila.
 * - ATRIBUIDO → Cancela e reatribui o livro para o próximo PENDENTE (se houver).
 *
 * @param idReserva - UUID da reserva a ser cancelada
 * @param idUsuarioSolicitante - Quando fornecido, verifica se o usuário é dono da reserva.
 *        Se omitido (cancelamento por expiração interno), pula a verificação de posse.
 */
export async function cancelarReserva(
  idReserva: string,
  idUsuarioSolicitante?: string
): Promise<Reserva> {

  const resultado = await executarComRetry(async (tx) => {
    // Lê o estado original da reserva (antes de qualquer update)
    const reserva = await tx.reserva.findUnique({
      where: { id: idReserva },
    });

    if (!reserva) {
      throw new ErroReservaNaoEncontrada(idReserva);
    }

    // Verifica permissão apenas para cancelamentos manuais (com usuário informado)
    if (idUsuarioSolicitante && reserva.idUsuario !== idUsuarioSolicitante) {
      throw new ErroAcessoNegadoReserva(idReserva, idUsuarioSolicitante);
    }

    // Não é possível cancelar estados terminais
    if (reserva.estado === EstadoReserva.CANCELADO || reserva.estado === EstadoReserva.CONCLUIDO) {
      throw new ErroEstadoInvalidoParaCancelamento(idReserva, reserva.estado);
    }

    // Guarda o estado e posição ANTES do cancelamento para usar nas regras abaixo
    const estadoOriginal = reserva.estado;
    const posicaoOriginal = reserva.posicao;

    // Efetua o cancelamento da reserva
    const reservaCancelada = await tx.reserva.update({
      where: { id: idReserva },
      data: { estado: EstadoReserva.CANCELADO, posicao: 0, prazoRetirada: null },
    });

    let proximaReservaAtribuida: Reserva | null = null;

    if (estadoOriginal === EstadoReserva.PENDENTE) {
      // ── Regra: reserva no meio da fila ─────────────────────────────────
      // Decrementa a posição de todos os PENDENTES que estavam atrás do cancelado.
      // Como a reserva já foi cancelada (estado = CANCELADO) ela não é afetada.
      await tx.reserva.updateMany({
        where: {
          idLivro: reserva.idLivro,
          estado: EstadoReserva.PENDENTE,
          posicao: { gt: posicaoOriginal },
        },
        data: {
          posicao: { decrement: 1 },
        },
      });

    } else if (estadoOriginal === EstadoReserva.ATRIBUIDO) {
      // ── Regra: livro estava reservado aguardando retirada ───────────────
      // Passa o livro para o próximo PENDENTE mais antigo da fila.
      const proximaReserva = await tx.reserva.findFirst({
        where: {
          idLivro: reserva.idLivro,
          estado: EstadoReserva.PENDENTE,
        },
        orderBy: { criadoEm: 'asc' },
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
  });

  // Publica evento de reatribuição FORA da transação (somente após commit confirmado)
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

// ─── Função de Expiração Automática de Reservas (M4.2 — expiração por prazo) ─

/**
 * Cancela automaticamente todas as reservas no estado ATRIBUIDO cujo prazo
 * de retirada (prazoRetirada) já tenha vencido.
 *
 * Deve ser chamado periodicamente por um job agendado (ex: cron ou setTimeout).
 * Para cada reserva expirada, reutiliza a lógica completa de `cancelarReserva`
 * (inclusive reatribuição automática para o próximo da fila).
 */
export async function cancelarReservasExpiradas(): Promise<void> {
  // Busca todas as reservas ATRIBUIDAS com prazo vencido
  const expiradas = await prisma.reserva.findMany({
    where: {
      estado: EstadoReserva.ATRIBUIDO,
      prazoRetirada: { lt: new Date() }, // prazo anterior ao momento atual
    },
    select: { id: true },
  });

  if (expiradas.length === 0) return;

  logger.info({ quantidade: expiradas.length }, 'Reservas expiradas encontradas. Iniciando cancelamento...');

  // Cancela cada uma sequencialmente (sem idUsuarioSolicitante = cancelamento interno)
  for (const { id } of expiradas) {
    try {
      await cancelarReserva(id);
      logger.info({ idReserva: id }, 'Reserva cancelada por prazo de retirada vencido.');
    } catch (erro) {
      logger.error({ erro, idReserva: id }, 'Erro ao cancelar reserva expirada.');
    }
  }
}

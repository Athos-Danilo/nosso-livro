import type { ConsumeMessage } from 'amqplib';
import { EstadoReserva } from '@prisma/client';
import { obterCanal } from './rabbitmq';
import { publicarReservaAtribuida } from './publicador';
import type { MensagemEmprestimoDevolvido } from './tipos';
import prisma from '../banco/prisma';
import logger from '../logger';

// ─── Constantes de negócio ────────────────────────────────────────────────────
/** Nome da fila que este serviço escuta */
const FILA_EMPRESTIMO_DEVOLVIDO = 'reserva-fila.emprestimo.devolvido';

/** Prazo de retirada após atribuição: 48 horas em milissegundos */
const PRAZO_RETIRADA_MS = 48 * 60 * 60 * 1000;

// ─── Handler principal do evento emprestimo.devolvido ────────────────────────

/**
 * Processa o evento `emprestimo.devolvido` recebido do Serviço de Empréstimo.
 *
 * Fluxo:
 * 1. Deserializa o payload e extrai o ID do livro devolvido.
 * 2. Dentro de uma transação atômica, busca a próxima reserva PENDENTE
 *    ordenada pela data de criação (quem entrou primeiro na fila).
 * 3. Se existir próxima reserva: atualiza para ATRIBUIDO + define prazo de 48h.
 * 4. Publica o evento `reserva.atribuida` para o Serviço de Notificação.
 * 5. Confirma (ack) a mensagem apenas após o processamento completo.
 *    Em caso de erro, rejeita (nack) para reprocessamento.
 */
async function processarEmprestimoDevolvido(mensagem: ConsumeMessage): Promise<void> {
  const canal = obterCanal();
  let payload: MensagemEmprestimoDevolvido;

  // ─── Desserialização segura ───────────────────────────────────────────
  try {
    payload = JSON.parse(mensagem.content.toString()) as MensagemEmprestimoDevolvido;
  } catch {
    logger.warn(
      { conteudo: mensagem.content.toString().slice(0, 100) },
      'Payload inválido recebido via RabbitMQ — descartando mensagem.'
    );
    // Rejeita sem requeue: mensagem malformada não pode ser reprocessada
    canal.nack(mensagem, false, false);
    return;
  }

  const { id_livro: idLivro, id_emprestimo: idEmprestimo } = payload;
  logger.info(
    { idLivro, idEmprestimo },
    'Evento "emprestimo.devolvido" recebido. Processando fila de espera...'
  );

  try {
    // ─── Transação: buscar e atribuir próxima reserva ─────────────────
    const reservaAtribuida = await prisma.$transaction(async (tx) => {
      // Busca o próximo usuário na fila: PENDENTE + mais antigo (FIFO)
      const proximaReserva = await tx.reserva.findFirst({
        where: {
          idLivro,
          estado: EstadoReserva.PENDENTE,
        },
        orderBy: {
          criadoEm: 'asc', // quem entrou primeiro na fila tem prioridade
        },
      });

      if (!proximaReserva) {
        logger.info({ idLivro }, 'Nenhuma reserva pendente encontrada para o livro devolvido.');
        return null; // Nenhuma reserva aguardando — fluxo encerrado
      }

      const prazoRetirada = new Date(Date.now() + PRAZO_RETIRADA_MS);

      // Atualiza a reserva: PENDENTE → ATRIBUIDO, posição zerada, prazo definido
      const reservaAtualizada = await tx.reserva.update({
        where: { id: proximaReserva.id },
        data: {
          estado: EstadoReserva.ATRIBUIDO,
          posicao: 0,
          prazoRetirada,
        },
      });

      logger.info(
        {
          idReserva: reservaAtualizada.id,
          idUsuario: reservaAtualizada.idUsuario,
          idLivro: reservaAtualizada.idLivro,
          prazoRetirada: prazoRetirada.toISOString(),
        },
        'Reserva atribuída com sucesso ao próximo usuário da fila.'
      );

      return reservaAtualizada;
    });

    // ─── Publicar evento de atribuição (fora da transação) ────────────
    if (reservaAtribuida) {
      publicarReservaAtribuida({
        id_reserva: reservaAtribuida.id,
        id_usuario: reservaAtribuida.idUsuario,
        id_livro: reservaAtribuida.idLivro,
        prazo_retirada: reservaAtribuida.prazoRetirada!.toISOString(),
      });
    }

    // ─── Confirmação da mensagem (ack) ────────────────────────────────
    // Só confirmamos após o processamento completo — garante consistência
    canal.ack(mensagem);
  } catch (erro) {
    logger.error(
      { erro: erro instanceof Error ? erro.message : erro, idLivro },
      'Erro ao processar evento "emprestimo.devolvido". Mensagem será reprocessada.'
    );

    // Rejeita a mensagem e solicita requeue para nova tentativa futura
    canal.nack(mensagem, false, true);
  }
}

// ─── Registro do consumidor ───────────────────────────────────────────────────

/**
 * Registra o consumidor na fila `reserva-fila.emprestimo.devolvido`.
 * Deve ser chamado após a conexão com o broker ser estabelecida.
 *
 * O `noAck: false` garante que o ack manual seja exigido — mensagens só
 * são removidas da fila após confirmação explícita do processamento.
 */
export async function iniciarConsumidor(): Promise<void> {
  const canal = obterCanal();

  await canal.consume(
    FILA_EMPRESTIMO_DEVOLVIDO,
    (mensagem) => {
      if (!mensagem) {
        logger.warn('Mensagem nula recebida — consumer pode ter sido cancelado pelo broker.');
        return;
      }
      // Processa de forma assíncrona sem bloquear o loop de eventos
      processarEmprestimoDevolvido(mensagem).catch((erro) => {
        logger.error({ erro }, 'Erro não tratado no processamento de mensagem do RabbitMQ.');
      });
    },
    { noAck: false } // ack manual — garantia de entrega exactly-once
  );

  logger.info(
    { fila: FILA_EMPRESTIMO_DEVOLVIDO },
    'Consumidor de eventos registrado. Aguardando mensagens...'
  );
}

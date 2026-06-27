import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { autenticarJWT } from '../middlewares/autenticacao';
import {
  ingressarNaFila,
  cancelarReserva,
} from '../regras/reservaServico';
import prisma from '../banco/prisma';
import { EstadoReserva } from '@prisma/client';

const roteador = Router();

// ─── Esquemas de validação Zod ────────────────────────────────────────────────

/** Valida o corpo da requisição de criação de reserva */
const esquemaCriarReserva = z.object({
  idLivro: z.string().uuid({ message: 'O campo "idLivro" deve ser um UUID válido.' }),
});

/** Valida o parâmetro de rota `:id` */
const esquemaParamId = z.object({
  id: z.string().uuid({ message: 'O parâmetro "id" deve ser um UUID válido.' }),
});

/** Valida o parâmetro de rota `:idLivro` */
const esquemaParamIdLivro = z.object({
  idLivro: z.string().uuid({ message: 'O parâmetro "idLivro" deve ser um UUID válido.' }),
});

// ─── POST /api/reservas ───────────────────────────────────────────────────────
/**
 * Ingresso na fila de espera.
 * Protegido: requer autenticação JWT (usuário logado).
 *
 * Body: { idLivro: string (UUID) }
 * Resposta 201: dados da reserva criada com posição na fila.
 */
roteador.post(
  '/',
  autenticarJWT,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { idLivro } = esquemaCriarReserva.parse(req.body);
      const idUsuario = req.usuario!.id;

      const reserva = await ingressarNaFila(idUsuario, idLivro);

      res.status(201).json({
        mensagem: 'Reserva criada com sucesso. Você entrou na fila de espera.',
        dados: reserva,
      });
    } catch (erro) {
      next(erro);
    }
  }
);

// ─── DELETE /api/reservas/:id ─────────────────────────────────────────────────
/**
 * Cancelamento de uma reserva.
 * Protegido: requer autenticação JWT. O usuário só pode cancelar suas próprias reservas.
 *
 * Resposta 200: confirmação com dados da reserva cancelada.
 */
roteador.delete(
  '/:id',
  autenticarJWT,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = esquemaParamId.parse(req.params);
      const idUsuario = req.usuario!.id;

      const reserva = await cancelarReserva(id, idUsuario);

      res.status(200).json({
        mensagem: 'Reserva cancelada com sucesso.',
        dados: reserva,
      });
    } catch (erro) {
      next(erro);
    }
  }
);

// ─── GET /api/reservas/me ─────────────────────────────────────────────────────
/**
 * Lista todas as reservas do usuário autenticado.
 * Protegido: requer autenticação JWT.
 *
 * Retorna reservas ordenadas por data de criação (mais recentes primeiro),
 * incluindo a posição atual na fila para cada reserva ativa.
 */
roteador.get(
  '/me',
  autenticarJWT,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const idUsuario = req.usuario!.id;

      const reservas = await prisma.reserva.findMany({
        where: { idUsuario },
        orderBy: { criadoEm: 'desc' },
      });

      res.status(200).json({
        total: reservas.length,
        dados: reservas,
      });
    } catch (erro) {
      next(erro);
    }
  }
);

// ─── GET /api/reservas/livro/:idLivro ────────────────────────────────────────
/**
 * Consulta pública da fila de espera de um livro específico.
 * Não requer autenticação.
 *
 * Retorna o tamanho atual da fila (apenas PENDENTES) e se há alguém
 * com o livro ATRIBUIDO aguardando retirada.
 */
roteador.get(
  '/livro/:idLivro',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { idLivro } = esquemaParamIdLivro.parse(req.params);

      const [totalFila, reservaAtribuida] = await Promise.all([
        // Conta quantos usuários estão na fila aguardando (PENDENTE)
        prisma.reserva.count({
          where: { idLivro, estado: EstadoReserva.PENDENTE },
        }),
        // Verifica se há alguém com o livro ATRIBUIDO (aguardando retirada)
        prisma.reserva.findFirst({
          where: { idLivro, estado: EstadoReserva.ATRIBUIDO },
          select: { prazoRetirada: true },
        }),
      ]);

      res.status(200).json({
        idLivro,
        totalNaFila: totalFila,
        livroAtribuidoAguardandoRetirada: reservaAtribuida !== null,
        prazoRetiradaAtual: reservaAtribuida?.prazoRetirada ?? null,
      });
    } catch (erro) {
      next(erro);
    }
  }
);

export default roteador;

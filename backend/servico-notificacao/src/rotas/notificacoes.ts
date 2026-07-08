import { Router, Request, Response, NextFunction } from 'express';
import prisma from '../banco/prisma';
import { autenticarJWT } from '../middlewares/autenticacao';

const roteador = Router();

// ─── GET / ──────────────────────────────────────────────────────────
/**
 * Retorna as notificações do usuário logado.
 * Protegido: requer autenticação JWT (via gateway).
 */
roteador.get(
  '/',
  autenticarJWT,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const idUsuario = req.usuario!.id;

      const notificacoes = await prisma.notificacao.findMany({
        where: { idUsuario },
        orderBy: { criadoEm: 'desc' },
        take: 20, // Limitar a quantidade de notificações recentes
      });

      res.status(200).json({
        total: notificacoes.length,
        dados: notificacoes,
      });
    } catch (erro) {
      next(erro);
    }
  }
);

export default roteador;

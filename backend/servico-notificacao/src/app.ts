/**
 * Configuração do app Express — Serviço de Notificação
 *
 * Exporta APENAS a instância do Express com middlewares e rotas de saúde,
 * SEM iniciar o servidor HTTP nem conectar ao RabbitMQ ou banco de dados.
 * Isso permite o uso seguro em testes de integração via supertest.
 */
import express, { Request, Response } from 'express';
import cors from 'cors';
import prisma from './banco/prisma';

const app = express();

// ─── Middlewares globais ─────────────────────────────────────────────────────
app.use(cors({
  origin: process.env.CORS_ORIGEM ?? '*',
  methods: ['GET', 'OPTIONS'],
  allowedHeaders: ['Content-Type'],
}));
app.use(express.json());

// ─── Middleware de log de requisições ────────────────────────────────────────
app.use((req: Request, _res, next) => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const logger = require('./logger').default;
  logger.debug(
    { metodo: req.method, rota: req.path, ip: req.ip },
    'Requisição HTTP recebida.'
  );
  next();
});

// ─── Rotas de saúde ──────────────────────────────────────────────────────────

/**
 * GET /saude — Liveness Probe
 * Verifica se o processo está vivo e respondendo.
 */
app.get('/saude', (_req: Request, res: Response) => {
  res.status(200).json({
    status: 'ativo',
    servico: 'servico-notificacao',
    versao: '1.0.0',
    horario: new Date().toISOString(),
  });
});

/**
 * GET /pronto — Readiness Probe
 * Verifica conectividade com o banco de dados.
 */
app.get('/pronto', async (_req: Request, res: Response) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.status(200).json({ status: 'pronto' });
  } catch {
    res.status(503).json({
      status: 'indisponivel',
      motivo: 'banco de dados inacessivel',
    });
  }
});

export default app;

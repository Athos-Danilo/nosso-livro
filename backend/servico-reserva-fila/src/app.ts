/**
 * Configuração da instância Express (app).
 *
 * Este módulo exporta APENAS o app Express configurado com middlewares e rotas,
 * SEM iniciar o servidor HTTP, sem conectar ao RabbitMQ e sem acessar o banco.
 *
 * Separar o app do ponto de entrada (servidor.ts) permite que os testes de
 * integração importem o app e o usem com o supertest sem efeitos colaterais.
 */
import express, { Request, Response } from 'express';
import cors from 'cors';
import rotasReservas from './rotas/reservas';
import { tratadorDeErros } from './middlewares/tratadorDeErros';
import prisma from './banco/prisma';

const app = express();

// ─── Middlewares globais ─────────────────────────────────────────────────────
app.use(cors({
  origin: process.env.CORS_ORIGEM ?? '*',
  methods: ['GET', 'POST', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-usuario-dados'],
}));
app.use(express.json());

// ─── Middleware de log de requisições HTTP ────────────────────────────────────
// Registra cada requisição recebida com método, rota e IP do solicitante
app.use((req: Request, _res, next) => {
  // Importação lazy do logger para evitar dependência circular e permitir mocks nos testes
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const logger = require('./logger').default;
  logger.debug(
    { metodo: req.method, rota: req.path, ip: req.ip },
    'Requisição HTTP recebida.'
  );
  next();
});

// ─── Rotas de saúde (M7.3) ───────────────────────────────────────────────────

/**
 * GET /saude — Liveness Probe
 * Verifica se o processo está vivo e respondendo.
 * Usado pelo Docker HEALTHCHECK e Kubernetes liveness probe.
 */
app.get('/saude', (_req: Request, res: Response) => {
  res.status(200).json({
    status: 'ativo',
    servico: 'servico-reserva-fila',
    versao: '1.0.0',
    horario: new Date().toISOString(),
  });
});

/**
 * GET /pronto — Readiness Probe
 * Verifica se o serviço está pronto para receber tráfego.
 * Falha se o banco de dados estiver inacessível.
 * Usado pelo Docker HEALTHCHECK e Kubernetes readiness probe.
 */
app.get('/pronto', async (_req: Request, res: Response) => {
  try {
    // Verifica conectividade com o banco (query leve sem impacto)
    await prisma.$queryRaw`SELECT 1`;
    res.status(200).json({ status: 'pronto' });
  } catch {
    res.status(503).json({
      status: 'indisponivel',
      motivo: 'banco de dados inacessivel',
    });
  }
});

// ─── Rotas do domínio ────────────────────────────────────────────────────────
app.use('/api/reservas', rotasReservas);

// ─── Middleware de erros (deve ser o último) ─────────────────────────────────
app.use(tratadorDeErros);

export default app;

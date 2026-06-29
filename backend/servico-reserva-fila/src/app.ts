/**
 * Configuração da instância Express (app).
 *
 * Este módulo exporta APENAS o app Express configurado com middlewares e rotas,
 * SEM iniciar o servidor HTTP, sem conectar ao RabbitMQ e sem acessar o banco.
 *
 * Separar o app do ponto de entrada (servidor.ts) permite que os testes de
 * integração importem o app e o usem com o supertest sem efeitos colaterais.
 */
import express from 'express';
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

// ─── Rotas de saúde ──────────────────────────────────────────────────────────
// GET /saude — verifica se o processo está vivo (liveness probe)
app.get('/saude', (_req, res) => {
  res.status(200).json({
    status: 'ativo',
    servico: 'servico-reserva-fila',
    versao: '1.0.0',
    horario: new Date().toISOString(),
  });
});

// GET /pronto — verifica se o serviço está pronto para receber tráfego (readiness probe)
app.get('/pronto', async (_req, res) => {
  try {
    // Verifica conectividade com o banco (query leve)
    await prisma.$queryRaw`SELECT 1`;
    res.status(200).json({ status: 'pronto' });
  } catch {
    res.status(503).json({ status: 'indisponivel', motivo: 'banco de dados inacessivel' });
  }
});

// ─── Rotas do domínio ────────────────────────────────────────────────────────
app.use('/api/reservas', rotasReservas);

// ─── Middleware de erros (deve ser o último) ─────────────────────────────────
app.use(tratadorDeErros);

export default app;

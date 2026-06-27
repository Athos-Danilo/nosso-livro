import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { iniciarConexaoRabbitMQ, fecharConexaoRabbitMQ, iniciarConsumidor } from './fila';
import prisma from './banco/prisma';
import rotasReservas from './rotas/reservas';
import { tratadorDeErros } from './middlewares/tratadorDeErros';
import { cancelarReservasExpiradas } from './regras/reservaServico';

// Carrega as variáveis de ambiente do arquivo .env
dotenv.config();

const porta = Number(process.env.PORTA) || 3001;
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

// ─── Job de expiração automática de reservas ─────────────────────────────────
// Verifica a cada 30 minutos se há reservas ATRIBUIDAS com prazo vencido.
const INTERVALO_EXPIRACAO_MS = 30 * 60 * 1000;

function iniciarJobExpiracao(): void {
  setInterval(async () => {
    try {
      await cancelarReservasExpiradas();
    } catch (erro) {
      console.error('[Job] Erro ao executar verificação de expiração:', erro);
    }
  }, INTERVALO_EXPIRACAO_MS);

  console.log('[Job] Verificador de expiração de reservas iniciado (intervalo: 30min).');
}

// ─── Inicialização do servidor e dependências ────────────────────────────────
async function iniciar(): Promise<void> {
  // 1. Inicia o servidor HTTP
  await new Promise<void>((resolve) => {
    servidor.listen(porta, () => {
      console.log(`[Reserva e Fila] Servidor iniciado na porta ${porta}`);
      resolve();
    });
  });

  // 2. Conecta ao broker RabbitMQ (com auto-reconexão em background)
  await iniciarConexaoRabbitMQ();

  // 3. Registra o consumidor de eventos após estrutura do broker declarada
  setTimeout(async () => {
    try {
      await iniciarConsumidor();
    } catch (erro) {
      console.error('[Reserva e Fila] Erro ao iniciar consumidor:', erro);
    }
  }, 1_000);

  // 4. Inicia o job de verificação de expiração de reservas
  iniciarJobExpiracao();
}

const servidor = app.listen(porta);
servidor.close(); // Fecha imediatamente para reabrir via iniciar()

iniciar().catch((erro) => {
  console.error('[Reserva e Fila] Erro fatal na inicialização:', erro);
  process.exit(1);
});

// ─── Desligamento gracioso (Graceful Shutdown) ───────────────────────────────
const desligar = async () => {
  console.log('[Reserva e Fila] Sinal de desligamento recebido. Encerrando...');

  servidor.close(() => {
    console.log('[Reserva e Fila] Servidor HTTP encerrado.');
  });

  await fecharConexaoRabbitMQ();

  await prisma.$disconnect();
  console.log('[Reserva e Fila] Banco de dados desconectado.');

  console.log('[Reserva e Fila] Desligamento concluído.');
  process.exit(0);
};

process.on('SIGINT', () => { desligar().catch(console.error); });
process.on('SIGTERM', () => { desligar().catch(console.error); });

export default app;

import express from 'express';
import dotenv from 'dotenv';
import { iniciarConexaoRabbitMQ, fecharConexaoRabbitMQ, iniciarConsumidor } from './fila';
import prisma from './banco/prisma';

// Carrega as variáveis de ambiente do arquivo .env
dotenv.config();

const porta = Number(process.env.PORTA) || 3001;
const app = express();

// ─── Middlewares globais ─────────────────────────────────────────────────────
app.use(express.json());

// ─── Rota de verificação de saúde (health check básico) ──────────────────────
app.get('/saude', (_req, res) => {
  res.status(200).json({
    status: 'ativo',
    servico: 'servico-reserva-fila',
    versao: '1.0.0',
    horario: new Date().toISOString(),
  });
});

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

  // 3. Registra o consumidor de eventos (aguarda eventos do Serviço de Empréstimo)
  // Pequena espera para garantir que a estrutura do broker foi declarada
  setTimeout(async () => {
    try {
      await iniciarConsumidor();
    } catch (erro) {
      console.error('[Reserva e Fila] Erro ao iniciar consumidor:', erro);
    }
  }, 1_000);
}

const servidor = app.listen(porta);
servidor.close(); // Fecha imediatamente para reouvrir via iniciar()

iniciar().catch((erro) => {
  console.error('[Reserva e Fila] Erro fatal na inicialização:', erro);
  process.exit(1);
});

// ─── Desligamento gracioso (Graceful Shutdown) ───────────────────────────────
const desligar = async () => {
  console.log('[Reserva e Fila] Sinal de desligamento recebido. Encerrando...');

  // Fecha o servidor HTTP (para de aceitar novas requisições)
  servidor.close(() => {
    console.log('[Reserva e Fila] Servidor HTTP encerrado.');
  });

  // Fecha a conexão com o RabbitMQ
  await fecharConexaoRabbitMQ();

  // Fecha a conexão com o banco de dados
  await prisma.$disconnect();
  console.log('[Reserva e Fila] Banco de dados desconectado.');

  console.log('[Reserva e Fila] Desligamento concluído.');
  process.exit(0);
};

process.on('SIGINT', () => { desligar().catch(console.error); });
process.on('SIGTERM', () => { desligar().catch(console.error); });

export default app;

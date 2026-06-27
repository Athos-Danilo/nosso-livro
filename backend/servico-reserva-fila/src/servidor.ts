import express from 'express';
import dotenv from 'dotenv';

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

// ─── Inicialização do servidor ───────────────────────────────────────────────
const servidor = app.listen(porta, () => {
  console.log(`[Reserva e Fila] Servidor iniciado na porta ${porta}`);
});

// ─── Desligamento gracioso (Graceful Shutdown) ───────────────────────────────
// Será expandido nas fases seguintes para fechar conexões com Prisma e RabbitMQ
const desligar = () => {
  console.log('[Reserva e Fila] Sinal de desligamento recebido. Encerrando servidor...');
  servidor.close(() => {
    console.log('[Reserva e Fila] Servidor encerrado com sucesso.');
    process.exit(0);
  });
};

process.on('SIGINT', desligar);
process.on('SIGTERM', desligar);

export default app;

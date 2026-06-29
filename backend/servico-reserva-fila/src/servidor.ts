/**
 * Ponto de entrada do servidor — inicialização e efeitos colaterais.
 *
 * Este módulo é responsável por:
 * 1. Iniciar o servidor HTTP na porta configurada.
 * 2. Conectar ao broker RabbitMQ.
 * 3. Registrar o consumidor de eventos.
 * 4. Iniciar o job de expiração automática de reservas.
 * 5. Gerenciar o desligamento gracioso (SIGINT / SIGTERM).
 *
 * A lógica do app Express está em `./app.ts`, separada dos efeitos colaterais
 * para permitir testes de integração sem inicialização de infraestrutura.
 */
import dotenv from 'dotenv';
import app from './app';
import { iniciarConexaoRabbitMQ, fecharConexaoRabbitMQ, iniciarConsumidor } from './fila';
import prisma from './banco/prisma';
import { cancelarReservasExpiradas } from './regras/reservaServico';

// Carrega as variáveis de ambiente do arquivo .env
dotenv.config();

const porta = Number(process.env.PORTA) || 3001;

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

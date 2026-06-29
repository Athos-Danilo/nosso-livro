/**
 * Ponto de entrada do servidor — inicialização e efeitos colaterais.
 *
 * Responsabilidades deste módulo:
 * 1. Iniciar o servidor HTTP na porta configurada.
 * 2. Conectar ao broker RabbitMQ com auto-reconexão.
 * 3. Registrar o consumidor de eventos.
 * 4. Iniciar o job de expiração automática de reservas.
 * 5. Gerenciar o desligamento gracioso (SIGINT / SIGTERM / SIGUSR2).
 *
 * A lógica do app Express está em `./app.ts`, separada dos efeitos colaterais
 * para permitir testes de integração sem inicialização de infraestrutura.
 */
import dotenv from 'dotenv';

// Carrega variáveis de ambiente antes de qualquer importação que as utilize
dotenv.config();

import app from './app';
import logger from './logger';
import { iniciarConexaoRabbitMQ, fecharConexaoRabbitMQ, iniciarConsumidor } from './fila';
import prisma from './banco/prisma';
import { cancelarReservasExpiradas } from './regras/reservaServico';

// ─── Configurações da porta ───────────────────────────────────────────────────
const porta = Number(process.env.PORTA) || 3001;

// ─── Job de expiração automática de reservas (M4.2) ─────────────────────────
/** Intervalo de verificação: a cada 30 minutos */
const INTERVALO_EXPIRACAO_MS = 30 * 60 * 1000;

function iniciarJobExpiracao(): void {
  setInterval(async () => {
    try {
      await cancelarReservasExpiradas();
    } catch (erro) {
      logger.error({ erro }, 'Erro ao executar verificação de expiração de reservas.');
    }
  }, INTERVALO_EXPIRACAO_MS);

  logger.info('Job de expiração de reservas iniciado (intervalo: 30min).');
}

// ─── Referência ao servidor HTTP ──────────────────────────────────────────────
// Inicializado aqui para ser acessível pelo graceful shutdown
const servidor = app.listen(porta);

// Fecha imediatamente — reabre de forma controlada via `iniciar()`
servidor.close();

// ─── Inicialização sequencial do servidor e dependências ─────────────────────
async function iniciar(): Promise<void> {
  // 1. Inicia o servidor HTTP e aguarda estar pronto
  await new Promise<void>((resolve, reject) => {
    servidor.listen(porta, () => {
      logger.info({ porta }, 'Servidor HTTP iniciado com sucesso.');
      resolve();
    });

    servidor.once('error', (erro) => {
      logger.error({ erro }, 'Falha ao iniciar o servidor HTTP.');
      reject(erro);
    });
  });

  // 2. Conecta ao broker RabbitMQ (auto-reconexão em background se falhar)
  await iniciarConexaoRabbitMQ();

  // 3. Registra o consumidor de eventos após broker estar disponível
  // Delay de 1s para garantir que a exchange e fila foram declaradas
  setTimeout(async () => {
    try {
      await iniciarConsumidor();
    } catch (erro) {
      logger.error({ erro }, 'Erro ao iniciar consumidor de eventos do RabbitMQ.');
    }
  }, 1_000);

  // 4. Inicia o job de verificação de expiração de reservas
  iniciarJobExpiracao();

  logger.info('Serviço de Reserva e Fila inicializado e pronto para receber tráfego.');
}

// ─── Desligamento Gracioso (M7.2) ─────────────────────────────────────────────
/**
 * Encerra o serviço de forma segura, garantindo que:
 * - Requisições HTTP em andamento sejam concluídas antes de fechar o servidor.
 * - A conexão com o RabbitMQ seja encerrada (sem perda de mensagens).
 * - O Prisma Client se desconecte do PostgreSQL corretamente.
 *
 * Timeout de segurança: se o desligamento não concluir em 10s, força saída.
 */
const desligar = async (sinal: string): Promise<void> => {
  logger.warn({ sinal }, 'Sinal de desligamento recebido. Iniciando encerramento gracioso...');

  // Timeout de segurança: força saída após 10 segundos caso algo trave
  const timeoutForcado = setTimeout(() => {
    logger.error('Encerramento gracioso excedeu o tempo limite (10s). Forçando saída.');
    process.exit(1);
  }, 10_000);

  // Garante que o timeout não impeça o processo de sair naturalmente
  timeoutForcado.unref();

  try {
    // 1. Para de aceitar novas requisições HTTP
    await new Promise<void>((resolve, reject) => {
      servidor.close((erro) => {
        if (erro) {
          logger.warn({ erro }, 'Erro ao fechar servidor HTTP.');
          reject(erro);
        } else {
          logger.info('Servidor HTTP encerrado com sucesso.');
          resolve();
        }
      });
    });

    // 2. Encerra a conexão com o broker (aguarda acks pendentes)
    await fecharConexaoRabbitMQ();

    // 3. Desconecta o pool de conexões do PostgreSQL
    await prisma.$disconnect();
    logger.info('Conexão com o banco de dados encerrada.');

    logger.info('Desligamento gracioso concluído. Até logo!');
    process.exit(0);
  } catch (erro) {
    logger.error({ erro }, 'Erro durante o desligamento gracioso.');
    process.exit(1);
  }
};

// Intercepta sinais do sistema operacional
process.on('SIGTERM', () => desligar('SIGTERM').catch(console.error)); // Docker / Kubernetes
process.on('SIGINT', () => desligar('SIGINT').catch(console.error));   // Ctrl+C em terminal
process.on('SIGUSR2', () => desligar('SIGUSR2').catch(console.error)); // nodemon restart

// Captura exceções não tratadas para evitar saída silenciosa
process.on('uncaughtException', (erro) => {
  logger.fatal({ erro }, 'Exceção não capturada. O processo será encerrado.');
  process.exit(1);
});

process.on('unhandledRejection', (motivo) => {
  logger.fatal({ motivo }, 'Promise rejeitada sem tratamento. O processo será encerrado.');
  process.exit(1);
});

// ─── Ponto de entrada ─────────────────────────────────────────────────────────
iniciar().catch((erro) => {
  logger.fatal({ erro }, 'Erro fatal durante a inicialização do serviço.');
  process.exit(1);
});

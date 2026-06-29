/**
 * Ponto de entrada do servidor — Serviço de Notificação
 *
 * Responsabilidades:
 * 1. Iniciar o servidor HTTP Express (health check).
 * 2. Conectar ao broker RabbitMQ.
 * 3. Registrar consumidores de eventos.
 * 4. Gerenciar desligamento gracioso (SIGINT / SIGTERM / SIGUSR2).
 *
 * A lógica do app Express está em `./app.ts` para permitir testes isolados.
 */
import dotenv from 'dotenv';

// Carrega variáveis de ambiente antes de qualquer outra importação
dotenv.config();

import app from './app';
import logger from './logger';
import prisma from './banco/prisma';
import {
  iniciarConexaoRabbitMQ,
  fecharConexaoRabbitMQ,
  aoReconectar,
  iniciarConsumidor,
} from './fila';

// ─── Configurações ────────────────────────────────────────────────────────────
const porta = Number(process.env.PORTA) || 3002;

// ─── Referência ao servidor HTTP ──────────────────────────────────────────────
const servidor = app.listen(porta);
servidor.close(); // Fecha imediatamente — reabre de forma controlada em `iniciar()`

// ─── Inicialização sequencial ─────────────────────────────────────────────────
async function iniciar(): Promise<void> {
  // 1. Inicia o servidor HTTP
  await new Promise<void>((resolve, reject) => {
    servidor.listen(porta, () => {
      logger.info({ porta }, 'Servidor HTTP do Serviço de Notificação iniciado.');
      resolve();
    });

    servidor.once('error', (erro) => {
      logger.error({ erro }, 'Falha ao iniciar o servidor HTTP.');
      reject(erro);
    });
  });

  // 2. Conecta ao broker RabbitMQ e declara filas/bindings
  await iniciarConexaoRabbitMQ();

  // 3. Registra os consumidores de eventos na fila
  await iniciarConsumidor();

  // 4. Configura re-registro automático de consumidores em caso de reconexão
  aoReconectar(async () => {
    logger.info('Reconexão detectada. Re-registrando consumidores...');
    await iniciarConsumidor();
  });

  logger.info('Serviço de Notificação inicializado e pronto para receber eventos.');
}

// ─── Desligamento Gracioso ────────────────────────────────────────────────────
const desligar = async (sinal: string): Promise<void> => {
  logger.warn({ sinal }, 'Sinal de desligamento recebido. Encerrando serviço...');

  // Timeout de segurança: força saída após 10 segundos
  const timeoutForcado = setTimeout(() => {
    logger.error('Encerramento excedeu 10s. Forçando saída.');
    process.exit(1);
  }, 10_000);
  timeoutForcado.unref();

  try {
    // 1. Para de aceitar novas requisições HTTP
    await new Promise<void>((resolve) => {
      servidor.close(() => {
        logger.info('Servidor HTTP encerrado.');
        resolve();
      });
    });

    // 2. Desconecta o Prisma Client
    await prisma.$disconnect();
    logger.info('Conexão com o banco de dados encerrada.');

    // 3. Encerra conexão com o broker RabbitMQ
    await fecharConexaoRabbitMQ();
    logger.info('Conexão com o broker RabbitMQ encerrada.');

    logger.info('Desligamento gracioso concluído.');
    process.exit(0);
  } catch (erro) {
    logger.error({ erro }, 'Erro durante o desligamento gracioso.');
    process.exit(1);
  }
};

// Intercepta sinais do sistema operacional
process.on('SIGTERM', () => desligar('SIGTERM').catch(console.error));
process.on('SIGINT', () => desligar('SIGINT').catch(console.error));
process.on('SIGUSR2', () => desligar('SIGUSR2').catch(console.error));

// Captura exceções não tratadas
process.on('uncaughtException', (erro) => {
  logger.fatal({ erro }, 'Exceção não capturada. Encerrando processo.');
  process.exit(1);
});

process.on('unhandledRejection', (motivo) => {
  logger.fatal({ motivo }, 'Promise rejeitada sem tratamento. Encerrando processo.');
  process.exit(1);
});

// ─── Ponto de partida ─────────────────────────────────────────────────────────
iniciar().catch((erro) => {
  logger.fatal({ erro }, 'Erro fatal durante a inicialização.');
  process.exit(1);
});

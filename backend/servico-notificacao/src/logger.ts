/**
 * Módulo de Logger Estruturado — Serviço de Notificação
 *
 * Utiliza o Pino configurado para emitir logs JSON estruturados em produção
 * e saída colorida legível (pino-pretty) em desenvolvimento.
 *
 * Campos presentes em todos os registros:
 * - `servico`: identificador do microsserviço
 * - `ambiente`: NODE_ENV atual
 */
import pino from 'pino';

// Detecta o ambiente de execução
const ehDesenvolvimento =
  process.env.NODE_ENV === 'development' || !process.env.NODE_ENV;

// Nível configurável por variável de ambiente
const nivelLog = process.env.LOG_NIVEL ?? (ehDesenvolvimento ? 'debug' : 'info');

const logger = pino({
  level: nivelLog,

  // Campos estáticos em todos os logs
  base: {
    servico: 'servico-notificacao',
    ambiente: process.env.NODE_ENV ?? 'development',
  },

  // Timestamp ISO 8601
  timestamp: pino.stdTimeFunctions.isoTime,

  // Dev: pino-pretty colorido | Produção: JSON puro
  transport: ehDesenvolvimento
    ? {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'SYS:dd/MM/yyyy HH:mm:ss',
          ignore: 'pid,hostname,servico,ambiente',
          messageFormat: '[{servico}] {msg}',
        },
      }
    : undefined,
});

export default logger;

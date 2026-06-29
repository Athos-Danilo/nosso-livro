/**
 * Módulo de Logger Estruturado — Serviço de Reserva e Fila
 *
 * Utiliza o Pino, o logger mais rápido do ecossistema Node.js, configurado
 * para emitir logs em formato JSON estruturado em produção e em formato
 * legível (colorido) no ambiente de desenvolvimento.
 *
 * Campos adicionais em todos os logs:
 * - `servico`: identificador do microsserviço
 * - `ambiente`: NODE_ENV atual
 *
 * Níveis de log em uso:
 * - `logger.info`  → Operações bem-sucedidas e eventos do ciclo de vida
 * - `logger.warn`  → Situações inesperadas mas recuperáveis (reconexão, etc.)
 * - `logger.error` → Falhas e exceções que requerem atenção
 * - `logger.debug` → Detalhes internos (habilitado apenas com LOG_NIVEL=debug)
 */
import pino from 'pino';

// ─── Detecta o ambiente de execução ──────────────────────────────────────────
const ehDesenvolvimento =
  process.env.NODE_ENV === 'development' || !process.env.NODE_ENV;

// ─── Nível de log configurável via variável de ambiente ───────────────────────
// Padrão: 'info' em produção, 'debug' em desenvolvimento
const nivelLog = process.env.LOG_NIVEL ?? (ehDesenvolvimento ? 'debug' : 'info');

// ─── Instância do logger ──────────────────────────────────────────────────────
const logger = pino({
  level: nivelLog,

  // Campos estáticos presentes em todos os registros de log
  base: {
    servico: 'servico-reserva-fila',
    ambiente: process.env.NODE_ENV ?? 'development',
  },

  // Formata o timestamp como ISO 8601 legível (ex: "2024-01-01T10:00:00.000Z")
  timestamp: pino.stdTimeFunctions.isoTime,

  // Em desenvolvimento: usa pino-pretty para saída colorida e legível no terminal
  // Em produção: saída JSON pura (mais eficiente para coleta por ferramentas como Datadog, Loki)
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

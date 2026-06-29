import amqplib, { type Channel } from 'amqplib';
import logger from '../logger';

// ─── Configurações do broker ──────────────────────────────────────────────────
/** Nome da exchange principal do projeto (tipo: topic) */
export const NOME_EXCHANGE = 'nosso-livro';

/** Nome da fila exclusiva do serviço de notificação */
export const NOME_FILA = 'fila_notificacoes';

/** Eventos consumidos por este serviço — vinculados à fila via binding */
export const EVENTOS_CONSUMIDOS = [
  'emprestimo.criado',
  'emprestimo.devolvido',
  'reserva.criada',
  'reserva.atribuida',
] as const;

/** Espera inicial entre tentativas de reconexão (em ms) */
const ESPERA_INICIAL_RECONEXAO_MS = 2_000;

/** Fator multiplicador do backoff exponencial */
const FATOR_BACKOFF = 2;

/** Espera máxima entre tentativas (em ms) — evita intervalos infinitos */
const ESPERA_MAXIMA_MS = 30_000;

// ─── Tipo interno para o ChannelModel retornado pelo amqplib >=0.10 ──────────
type ModeloCanal = Awaited<ReturnType<typeof amqplib.connect>>;

// ─── Estado interno do gerenciador ───────────────────────────────────────────
let modelo: ModeloCanal | null = null;
let canal: Channel | null = null;
let tentandoReconectar = false;
let tentativaAtual = 0;

/**
 * Callback chamado após cada reconexão bem-sucedida.
 * Permite que o consumidor se registre novamente automaticamente.
 */
let callbackReconexao: (() => Promise<void>) | null = null;

/**
 * Registra um callback que será invocado após cada reconexão com o broker.
 * Útil para re-registrar consumidores que são perdidos quando o canal fecha.
 *
 * @param callback - Função assíncrona a ser executada após reconexão
 */
export function aoReconectar(callback: () => Promise<void>): void {
  callbackReconexao = callback;
}

/**
 * Declara a exchange principal, a fila exclusiva do serviço de notificação
 * e os bindings para os 4 eventos do ecossistema.
 * Deve ser chamado após cada reconexão bem-sucedida.
 */
async function declararEstrutura(canalAtivo: Channel): Promise<void> {
  // Exchange tipo 'topic' — roteamento por padrões de chave (ex: emprestimo.*)
  await canalAtivo.assertExchange(NOME_EXCHANGE, 'topic', { durable: true });

  // Fila dedicada do serviço de notificação (durável — sobrevive a restarts)
  await canalAtivo.assertQueue(NOME_FILA, {
    durable: true,
  });

  // Vincula a fila a todos os eventos que o serviço de notificação consome
  for (const evento of EVENTOS_CONSUMIDOS) {
    await canalAtivo.bindQueue(NOME_FILA, NOME_EXCHANGE, evento);
  }

  logger.info(
    { fila: NOME_FILA, eventos: EVENTOS_CONSUMIDOS },
    'Exchange, fila e bindings do RabbitMQ declarados com sucesso.'
  );
}

/**
 * Tenta estabelecer conexão com o broker RabbitMQ.
 * Em caso de falha, agenda nova tentativa com backoff exponencial.
 */
async function conectar(): Promise<void> {
  const urlBroker = process.env.URL_RABBITMQ ?? 'amqp://guest:guest@localhost:5672';

  try {
    logger.info({ tentativa: tentativaAtual + 1 }, 'Tentando conectar ao broker RabbitMQ...');

    // amqplib >=0.10 retorna ChannelModel (referenciado aqui como ModeloCanal)
    modelo = await amqplib.connect(urlBroker);
    canal = await modelo.createChannel();

    // Prefetch: processa 1 mensagem por vez — evita sobrecarga no envio de e-mails
    await canal.prefetch(1);

    await declararEstrutura(canal);

    // Reseta o contador de tentativas após conexão bem-sucedida
    tentativaAtual = 0;
    tentandoReconectar = false;

    logger.info('Conexão com o broker RabbitMQ estabelecida com sucesso.');

    // Executa o callback de reconexão (re-registro de consumidores)
    if (callbackReconexao) {
      await callbackReconexao();
    }

    // ─── Tratamento de erros na conexão ativa ──────────────────────────
    modelo.on('error', (erro: Error) => {
      logger.error({ erro: erro.message }, 'Erro na conexão com o RabbitMQ.');
      agendarReconexao();
    });

    modelo.on('close', () => {
      logger.warn('Conexão com o RabbitMQ encerrada inesperadamente. Reconectando...');
      agendarReconexao();
    });

    canal.on('error', (erro: Error) => {
      logger.error({ erro: erro.message }, 'Erro no canal do RabbitMQ.');
    });

    canal.on('close', () => {
      logger.warn('Canal do RabbitMQ fechado. Aguardando reconexão da conexão...');
    });
  } catch (erro) {
    logger.error(
      { erro: erro instanceof Error ? erro.message : erro },
      'Falha ao conectar ao broker RabbitMQ.'
    );
    agendarReconexao();
  }
}

/**
 * Agenda nova tentativa de conexão usando backoff exponencial.
 * Evita múltiplas reconexões paralelas com o flag `tentandoReconectar`.
 */
function agendarReconexao(): void {
  if (tentandoReconectar) return;

  tentandoReconectar = true;
  canal = null;
  modelo = null;

  // Calcula o tempo de espera: 2s, 4s, 8s, 16s... até no máximo 30s
  const espera = Math.min(
    ESPERA_INICIAL_RECONEXAO_MS * Math.pow(FATOR_BACKOFF, tentativaAtual),
    ESPERA_MAXIMA_MS
  );
  tentativaAtual++;

  logger.warn(
    { proximaTentativaMs: espera },
    `Próxima tentativa de reconexão com o broker em ${espera / 1000}s.`
  );
  setTimeout(() => conectar(), espera);
}

/**
 * Inicializa a conexão com o broker RabbitMQ.
 * Deve ser chamado uma vez na inicialização do servidor.
 */
export async function iniciarConexaoRabbitMQ(): Promise<void> {
  await conectar();
}

/**
 * Retorna o canal ativo para uso nos consumidores.
 * @throws {Error} Se o canal ainda não estiver disponível (broker offline)
 */
export function obterCanal(): Channel {
  if (!canal) {
    throw new Error(
      'Canal do RabbitMQ não disponível. O broker pode estar offline ou reconectando.'
    );
  }
  return canal;
}

/**
 * Encerra a conexão com o broker de forma controlada.
 * Chamado pelo graceful shutdown do servidor.
 */
export async function fecharConexaoRabbitMQ(): Promise<void> {
  try {
    if (canal) await canal.close();
    if (modelo) await modelo.close();
    logger.info('Conexão com o broker RabbitMQ encerrada com sucesso.');
  } catch (erro) {
    logger.error({ erro }, 'Erro ao encerrar conexão com o RabbitMQ.');
  }
}

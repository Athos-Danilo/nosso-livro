import amqplib, { type Channel } from 'amqplib';

// ─── Configurações do broker ──────────────────────────────────────────────────
/** Nome da exchange principal do projeto (tipo: topic) */
export const NOME_EXCHANGE = 'nosso-livro';

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
 * Declara a exchange principal e estruturas de fila utilizadas por este serviço.
 * Deve ser chamado após cada reconexão bem-sucedida.
 */
async function declararEstrutura(canalAtivo: Channel): Promise<void> {
  // Exchange tipo 'topic' — roteamento por padrões de chave (ex: reserva.*)
  await canalAtivo.assertExchange(NOME_EXCHANGE, 'topic', { durable: true });

  // Fila dedicada deste serviço para receber eventos de devolução de empréstimos
  await canalAtivo.assertQueue('reserva-fila.emprestimo.devolvido', {
    durable: true, // sobrevive a reinicializações do broker
  });

  // Ligação: fila escuta mensagens com routing key 'emprestimo.devolvido' na exchange
  await canalAtivo.bindQueue(
    'reserva-fila.emprestimo.devolvido',
    NOME_EXCHANGE,
    'emprestimo.devolvido'
  );

  console.log('[RabbitMQ] Exchange e fila declaradas com sucesso.');
}

/**
 * Tenta estabelecer conexão com o broker RabbitMQ.
 * Em caso de falha, agenda nova tentativa com backoff exponencial.
 */
async function conectar(): Promise<void> {
  const urlBroker = process.env.URL_RABBITMQ ?? 'amqp://guest:guest@localhost:5672';

  try {
    console.log(`[RabbitMQ] Tentativa ${tentativaAtual + 1} de conexão com o broker...`);

    // amqplib >=0.10 retorna ChannelModel (referenciado aqui como ModeloCanal)
    modelo = await amqplib.connect(urlBroker);
    canal = await modelo.createChannel();

    // Prefetch: processa 1 mensagem por vez — garante entrega ordenada
    await canal.prefetch(1);

    await declararEstrutura(canal);

    // Reseta o contador de tentativas após conexão bem-sucedida
    tentativaAtual = 0;
    tentandoReconectar = false;

    console.log('[RabbitMQ] Conexão estabelecida com sucesso.');

    // ─── Tratamento de erros na conexão ativa ──────────────────────────
    modelo.on('error', (erro: Error) => {
      console.error('[RabbitMQ] Erro na conexão:', erro.message);
      agendarReconexao();
    });

    modelo.on('close', () => {
      console.warn('[RabbitMQ] Conexão encerrada inesperadamente. Reconectando...');
      agendarReconexao();
    });

    canal.on('error', (erro: Error) => {
      console.error('[RabbitMQ] Erro no canal:', erro.message);
    });

    canal.on('close', () => {
      console.warn('[RabbitMQ] Canal fechado. Aguardando reconexão da conexão...');
    });
  } catch (erro) {
    console.error(
      '[RabbitMQ] Falha ao conectar:',
      erro instanceof Error ? erro.message : erro
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

  console.log(`[RabbitMQ] Próxima tentativa em ${espera / 1000}s...`);
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
 * Retorna o canal ativo para uso em publicadores e consumidores.
 * @throws {Error} Se o canal ainda não estiver disponível (broker offline)
 */
export function obterCanal(): Channel {
  if (!canal) {
    throw new Error(
      '[RabbitMQ] Canal não disponível. O broker pode estar offline ou reconectando.'
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
    console.log('[RabbitMQ] Conexão encerrada com sucesso.');
  } catch (erro) {
    console.error('[RabbitMQ] Erro ao encerrar conexão:', erro);
  }
}

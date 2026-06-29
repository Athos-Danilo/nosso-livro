import axios, { AxiosInstance, isAxiosError } from 'axios';
import axiosRetry from 'axios-retry';
import logger from '../logger';

// ─── Constantes de resiliência ────────────────────────────────────────────────
/** Tempo máximo de espera por resposta de um serviço externo (em ms). */
const TIMEOUT_MS = 3_000;

/** Número máximo de tentativas antes de desistir da chamada. */
const MAX_TENTATIVAS = 3;

/**
 * Fábrica de instâncias Axios configuradas com:
 * - Timeout de 3 segundos (evita travamento do consumidor de filas)
 * - Retry automático com backoff exponencial (até 3 tentativas)
 * - Retry apenas em erros de rede ou respostas 5xx (serviço fora do ar)
 *
 * @param urlBase - URL base do microsserviço de destino (ex: http://localhost:3000)
 * @returns Instância Axios pronta para uso
 */
export function criarClienteHttp(urlBase: string): AxiosInstance {
  const instancia = axios.create({
    baseURL: urlBase,
    timeout: TIMEOUT_MS,
    headers: {
      'Content-Type': 'application/json',
    },
  });

  // ─── Configuração do retry com backoff exponencial ───────────────────────
  axiosRetry(instancia, {
    retries: MAX_TENTATIVAS,

    // Estratégia: espera exponencial entre tentativas
    // Tentativa 1: ~100ms, Tentativa 2: ~200ms, Tentativa 3: ~400ms
    retryDelay: axiosRetry.exponentialDelay,

    // Condição de retry: apenas erros de rede (timeout, ECONNREFUSED) ou 5xx
    retryCondition: (erro) => {
      const ehErroDeRede = axiosRetry.isNetworkError(erro);
      const ehErro5xx =
        isAxiosError(erro) &&
        erro.response !== undefined &&
        erro.response.status >= 500;

      return ehErroDeRede || ehErro5xx;
    },

    // Log de cada tentativa para rastreabilidade
    onRetry: (numeroDaTentativa, erro, configuracao) => {
      logger.warn(
        {
          tentativa: numeroDaTentativa,
          maxTentativas: MAX_TENTATIVAS,
          url: `${configuracao.baseURL}${configuracao.url}`,
          motivo: erro.message,
        },
        `Tentativa ${numeroDaTentativa}/${MAX_TENTATIVAS} de chamada HTTP.`
      );
    },
  });

  return instancia;
}

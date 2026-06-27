import { isAxiosError } from 'axios';
import { criarClienteHttp } from './httpBase';
import {
  ErroRecursoNaoEncontrado,
  ErroServicoIndisponivel,
  ErroTimeoutServico,
} from './errosHttp';
import type { RespostaUsuario } from './tipos';

// ─── Nome do serviço (usado nas mensagens de erro e logs) ────────────────────
const NOME_SERVICO = 'Serviço de Autenticação e Usuário';

// ─── Instância HTTP configurada para o Serviço de Usuário ────────────────────
// A URL base é lida da variável de ambiente. O cliente é criado uma única vez
// (singleton de módulo) para reutilizar a configuração de timeout e retry.
const urlServico = process.env.URL_SERVICO_USUARIO ?? 'http://localhost:3000';
const http = criarClienteHttp(urlServico);

/**
 * Valida a existência de um usuário no Serviço de Autenticação e Usuário.
 *
 * Realiza uma chamada síncrona (HTTP GET) e retorna os dados básicos do usuário
 * se ele existir. Lança erros semânticos para os casos de falha.
 *
 * @param idUsuario - UUID do usuário a ser validado
 * @returns Dados básicos do usuário
 * @throws {ErroRecursoNaoEncontrado} Se o usuário não for encontrado (HTTP 404)
 * @throws {ErroTimeoutServico} Se a chamada exceder o tempo limite (3s)
 * @throws {ErroServicoIndisponivel} Se o serviço estiver fora do ar
 */
export async function buscarUsuarioPorId(idUsuario: string): Promise<RespostaUsuario> {
  try {
    const resposta = await http.get<RespostaUsuario>(`/api/usuarios/${idUsuario}`);
    return resposta.data;
  } catch (erro) {
    // ─── Usuário não encontrado ──────────────────────────────────────────
    if (isAxiosError(erro) && erro.response?.status === 404) {
      throw new ErroRecursoNaoEncontrado(NOME_SERVICO, 'Usuário', idUsuario);
    }

    // ─── Timeout de rede ────────────────────────────────────────────────
    if (isAxiosError(erro) && erro.code === 'ECONNABORTED') {
      throw new ErroTimeoutServico(NOME_SERVICO);
    }

    // ─── Serviço indisponível (após retries esgotados) ──────────────────
    throw new ErroServicoIndisponivel(NOME_SERVICO, erro);
  }
}

import { isAxiosError } from 'axios';
import { criarClienteHttp } from './httpBase';
import {
  ErroRecursoNaoEncontrado,
  ErroServicoIndisponivel,
  ErroTimeoutServico,
} from './errosHttp';
import type { RespostaLivro } from './tipos';

// ─── Nome do serviço (usado nas mensagens de erro e logs) ────────────────────
const NOME_SERVICO = 'Serviço de Catálogo e Biblioteca';

// ─── Instância HTTP configurada para o Serviço de Catálogo ───────────────────
// A URL base é lida da variável de ambiente. O cliente é criado uma única vez
// (singleton de módulo) para reutilizar a configuração de timeout e retry.
const urlServico = process.env.URL_SERVICO_CATALOGO ?? 'http://localhost:3002';
const http = criarClienteHttp(urlServico);

/**
 * Valida a existência de um livro no Serviço de Catálogo e Biblioteca.
 *
 * Realiza uma chamada síncrona (HTTP GET) e retorna os dados básicos do livro
 * se ele existir. Lança erros semânticos para os casos de falha.
 *
 * @param idLivro - UUID do livro a ser validado
 * @returns Dados básicos do livro, incluindo flag de disponibilidade
 * @throws {ErroRecursoNaoEncontrado} Se o livro não for encontrado (HTTP 404)
 * @throws {ErroTimeoutServico} Se a chamada exceder o tempo limite (3s)
 * @throws {ErroServicoIndisponivel} Se o serviço estiver fora do ar
 */
export async function buscarLivroPorId(idLivro: string): Promise<RespostaLivro> {
  try {
    const resposta = await http.get<RespostaLivro>(`/api/livros/${idLivro}`);
    return resposta.data;
  } catch (erro) {
    // ─── Livro não encontrado ────────────────────────────────────────────
    if (isAxiosError(erro) && erro.response?.status === 404) {
      throw new ErroRecursoNaoEncontrado(NOME_SERVICO, 'Livro', idLivro);
    }

    // ─── Timeout de rede ────────────────────────────────────────────────
    if (isAxiosError(erro) && erro.code === 'ECONNABORTED') {
      throw new ErroTimeoutServico(NOME_SERVICO);
    }

    // ─── Serviço indisponível (após retries esgotados) ──────────────────
    throw new ErroServicoIndisponivel(NOME_SERVICO, erro);
  }
}

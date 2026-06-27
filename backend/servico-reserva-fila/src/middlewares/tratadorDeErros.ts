import { Request, Response, NextFunction } from 'express';
import {
  ErroReservaDuplicada,
  ErroReservaNaoEncontrada,
  ErroAcessoNegadoReserva,
  ErroEstadoInvalidoParaCancelamento,
} from '../regras/errosNegocio';
import {
  ErroRecursoNaoEncontrado,
  ErroTimeoutServico,
  ErroServicoIndisponivel,
} from '../clientes/errosHttp';

// ─── Middleware Centralizador de Erros ────────────────────────────────────────

/**
 * Captura todos os erros lançados nos controllers e os converte em respostas
 * HTTP com código de status e mensagem adequados.
 *
 * Deve ser o ÚLTIMO middleware registrado no app (após todas as rotas).
 *
 * Mapeamento de erros:
 * - Erros de negócio (duplicata, acesso negado) → 409 / 403
 * - Erros de integração (recurso não encontrado) → 404 / 503 / 504
 * - Erros de validação (Zod)                    → 400
 * - Erros desconhecidos                          → 500
 */
export function tratadorDeErros(
  erro: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  // ── Erros de negócio ────────────────────────────────────────────────────
  if (erro instanceof ErroReservaDuplicada) {
    res.status(409).json({ erro: erro.message });
    return;
  }

  if (erro instanceof ErroReservaNaoEncontrada) {
    res.status(404).json({ erro: erro.message });
    return;
  }

  if (erro instanceof ErroAcessoNegadoReserva) {
    res.status(403).json({ erro: erro.message });
    return;
  }

  if (erro instanceof ErroEstadoInvalidoParaCancelamento) {
    res.status(409).json({ erro: erro.message });
    return;
  }

  // ── Erros de integração HTTP ────────────────────────────────────────────
  if (erro instanceof ErroRecursoNaoEncontrado) {
    res.status(404).json({ erro: erro.message });
    return;
  }

  if (erro instanceof ErroTimeoutServico) {
    res.status(504).json({ erro: erro.message });
    return;
  }

  if (erro instanceof ErroServicoIndisponivel) {
    res.status(503).json({ erro: erro.message });
    return;
  }

  // ── Erros de validação Zod ──────────────────────────────────────────────
  if (
    typeof erro === 'object' &&
    erro !== null &&
    'name' in erro &&
    (erro as { name: string }).name === 'ZodError'
  ) {
    res.status(400).json({ erro: 'Dados de entrada inválidos.', detalhes: erro });
    return;
  }

  // ── Erro desconhecido ───────────────────────────────────────────────────
  console.error('[Erro] Erro não tratado:', erro);
  res.status(500).json({ erro: 'Erro interno do servidor.' });
}

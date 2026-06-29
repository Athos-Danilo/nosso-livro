// ─── Erros de integração HTTP entre microsserviços ──────────────────────────
// Estes erros são lançados pelos clientes HTTP quando chamadas a outros
// serviços falham, permitindo tratamento semântico nas camadas superiores.

/**
 * Lançado quando um recurso não é encontrado no serviço remoto (HTTP 404).
 * Ex: usuário com o ID informado não existe no Serviço de Autenticação.
 */
export class ErroRecursoNaoEncontrado extends Error {
  constructor(
    public readonly servico: string,
    public readonly recurso: string,
    public readonly id: string
  ) {
    super(`[${servico}] ${recurso} com ID "${id}" não encontrado.`);
    this.name = 'ErroRecursoNaoEncontrado';
  }
}

/**
 * Lançado quando o serviço remoto está indisponível ou retornou erro
 * inesperado mesmo após todas as tentativas de retry.
 */
export class ErroServicoIndisponivel extends Error {
  constructor(
    public readonly servico: string,
    public readonly causa?: unknown
  ) {
    super(
      `[${servico}] Serviço indisponível após múltiplas tentativas de reconexão.`
    );
    this.name = 'ErroServicoIndisponivel';
    if (causa instanceof Error) {
      this.stack = `${this.stack}\nCausado por: ${causa.stack}`;
    }
  }
}

/**
 * Lançado quando a chamada ao serviço remoto excede o tempo limite (timeout).
 */
export class ErroTimeoutServico extends Error {
  constructor(public readonly servico: string) {
    super(`[${servico}] Tempo limite de 3 segundos excedido na chamada ao serviço.`);
    this.name = 'ErroTimeoutServico';
  }
}

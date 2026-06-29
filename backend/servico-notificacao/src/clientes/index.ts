// ─── Barrel de exportações dos clientes de integração HTTP ───────────────────
// Centraliza as importações para o restante da aplicação.
// Uso: import { buscarUsuarioPorId, ErroRecursoNaoEncontrado } from './clientes';

export { buscarUsuarioPorId } from './clienteUsuario';
export {
  ErroRecursoNaoEncontrado,
  ErroServicoIndisponivel,
  ErroTimeoutServico,
} from './errosHttp';
export type { RespostaUsuario } from './tipos';

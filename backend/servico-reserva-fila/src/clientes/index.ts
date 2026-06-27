// ─── Barrel de exportações dos clientes de integração HTTP ───────────────────
// Centraliza as importações para o restante da aplicação.
// Uso: import { buscarUsuarioPorId, buscarLivroPorId } from '@/clientes';

export { buscarUsuarioPorId } from './clienteUsuario';
export { buscarLivroPorId } from './clienteCatalogo';
export {
  ErroRecursoNaoEncontrado,
  ErroServicoIndisponivel,
  ErroTimeoutServico,
} from './errosHttp';
export type { RespostaUsuario, RespostaLivro } from './tipos';

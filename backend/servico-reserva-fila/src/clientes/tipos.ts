// ─── Tipos das respostas dos microsserviços externos ─────────────────────────
// Representam apenas os campos necessários para validação de integridade.
// Os serviços externos podem retornar mais campos; apenas estes são mapeados.

/**
 * Dados mínimos do usuário retornados pelo Serviço de Autenticação e Usuário.
 * Rota: GET /api/usuarios/{id}
 */
export interface RespostaUsuario {
  id: string;
  nome: string;
  email: string;
}

/**
 * Dados mínimos do livro retornados pelo Serviço de Catálogo e Biblioteca.
 * Rota: GET /api/livros/{id}
 */
export interface RespostaLivro {
  id: string;
  titulo: string;
  autor: string;
  disponivel: boolean;
}

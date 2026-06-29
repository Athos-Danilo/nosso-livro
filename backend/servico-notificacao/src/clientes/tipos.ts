// ─── Tipos das respostas dos microsserviços externos ─────────────────────────
// Representam apenas os campos necessários para o envio de notificações.
// O serviço externo pode retornar mais campos; apenas estes são mapeados.

/**
 * Dados do usuário retornados pelo Serviço de Autenticação e Usuário.
 * Rota: GET /api/usuarios/{id}
 *
 * Campos utilizados pelo serviço de notificação para:
 * - `nome`: personalizar saudações nos templates de e-mail
 * - `email`: endereço de destino do disparo SMTP
 * - `whatsapp`: número para envio de alertas via WhatsApp (mock)
 * - `ativo`: verificar se o usuário ainda está habilitado para receber notificações
 */
export interface RespostaUsuario {
  id: string;
  nome: string;
  email: string;
  whatsapp?: string;
  ativo: boolean;
}

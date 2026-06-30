// ─── Barrel de exportações dos serviços de envio ─────────────────────────────
// Centraliza importações do módulo de serviços para o restante da aplicação.

// Serviço de e-mail (SMTP via Nodemailer)
export { enviarEmail } from './email.servico';
export type { OpcoesEmail, ResultadoEnvio } from './email.servico';

// Templates de e-mail HTML
export {
  templateEmprestimo,
  templateDevolucao,
  templateFilaEspera,
  templateLivroLiberado,
} from './templates';
export type {
  DadosTemplateEmprestimo,
  DadosTemplateDevolucao,
  DadosTemplateFilaEspera,
  DadosTemplateLivroLiberado,
} from './templates';

// Mock de WhatsApp
export { enviarWhatsApp } from './whatsapp.servico';
export type { OpcoesWhatsApp, ResultadoWhatsApp } from './whatsapp.servico';

// Processador de notificações (pipeline completo — Fase 5)
export {
  processarEmprestimoCriado,
  processarEmprestimoDevolvido,
  processarReservaCriada,
  processarReservaAtribuida,
} from './processador.notificacao';

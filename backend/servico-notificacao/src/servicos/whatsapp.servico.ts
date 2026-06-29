import logger from '../logger';

// ─── Mock de Disparo de WhatsApp ─────────────────────────────────────────────
// Classe mockada que simula o envio de alertas por WhatsApp.
// Em vez de integrar com uma API real (ex: Twilio, WhatsApp Business API),
// registra os logs estruturados no console para fins de demonstração.

/**
 * Opções para o envio simulado de mensagem WhatsApp.
 */
export interface OpcoesWhatsApp {
  /** Número de WhatsApp do destinatário (formato: +55...) */
  destinatario: string;
  /** Nome do destinatário (para personalização da mensagem) */
  nomeDestinatario: string;
  /** Título resumido da notificação */
  titulo: string;
  /** Corpo da mensagem em texto puro */
  conteudo: string;
}

/**
 * Resultado do envio simulado de WhatsApp.
 */
export interface ResultadoWhatsApp {
  /** Sempre true neste mock — simulação bem-sucedida */
  sucesso: boolean;
  /** Identificador fictício do envio */
  idMensagem: string;
}

/**
 * Simula o envio de uma mensagem via WhatsApp.
 *
 * Esta é uma implementação mock que apenas registra os dados do envio
 * via logger estruturado. Em produção, seria substituída por uma integração
 * real com a API do WhatsApp Business ou serviço equivalente (Twilio, etc.).
 *
 * @param opcoes - Dados da mensagem: destinatário, título e conteúdo
 * @returns Resultado simulado (sempre sucesso)
 */
export async function enviarWhatsApp(opcoes: OpcoesWhatsApp): Promise<ResultadoWhatsApp> {
  // Gera um ID fictício para rastreabilidade nos logs
  const idMensagem = `whatsapp-mock-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

  logger.info(
    {
      canal: 'WHATSAPP',
      mock: true,
      idMensagem,
      destinatario: opcoes.destinatario,
      nomeDestinatario: opcoes.nomeDestinatario,
      titulo: opcoes.titulo,
    },
    `[MOCK WhatsApp] Mensagem simulada para ${opcoes.nomeDestinatario} (${opcoes.destinatario}).`
  );

  logger.debug(
    {
      idMensagem,
      conteudo: opcoes.conteudo,
    },
    '[MOCK WhatsApp] Conteúdo da mensagem simulada.'
  );

  return {
    sucesso: true,
    idMensagem,
  };
}

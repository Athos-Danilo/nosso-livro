import nodemailer, { type Transporter } from 'nodemailer';
import logger from '../logger';

// ─── Singleton do transporte SMTP ────────────────────────────────────────────
let transporte: Transporter | null = null;

/**
 * Retorna a instância singleton do transporte Nodemailer.
 * Configurado com credenciais SMTP carregadas das variáveis de ambiente.
 *
 * Variáveis esperadas:
 * - SMTP_HOST: endereço do servidor SMTP (ex: smtp.ethereal.email)
 * - SMTP_PORT: porta do servidor SMTP (ex: 587)
 * - SMTP_USUARIO: usuário de autenticação SMTP
 * - SMTP_SENHA: senha de autenticação SMTP
 */
function obterTransporte(): Transporter {
  if (!transporte) {
    const host = process.env.SMTP_HOST;
    const porta = Number(process.env.SMTP_PORT) || 587;
    const usuario = process.env.SMTP_USUARIO;
    const senha = process.env.SMTP_SENHA;

    if (!host || !usuario || !senha) {
      throw new Error(
        '[Notificação] Variáveis SMTP não configuradas. ' +
        'Defina SMTP_HOST, SMTP_USUARIO e SMTP_SENHA no .env.'
      );
    }

    transporte = nodemailer.createTransport({
      host,
      port: porta,
      secure: porta === 465, // SSL automático na porta 465, STARTTLS nas demais
      auth: {
        user: usuario,
        pass: senha,
      },
    });

    logger.info(
      { host, porta },
      'Transporte SMTP do Nodemailer configurado com sucesso.'
    );
  }

  return transporte;
}

// ─── Interface de opções de envio ────────────────────────────────────────────
export interface OpcoesEmail {
  /** Endereço de e-mail do destinatário */
  destinatario: string;
  /** Assunto/título do e-mail */
  titulo: string;
  /** Corpo do e-mail em HTML */
  conteudoHtml: string;
}

/**
 * Resultado do envio de e-mail.
 * Contém informações sobre o sucesso ou falha do disparo.
 */
export interface ResultadoEnvio {
  /** Se o envio foi bem-sucedido */
  sucesso: boolean;
  /** ID da mensagem retornado pelo servidor SMTP (se enviado com sucesso) */
  idMensagem?: string;
  /** URL de preview (disponível apenas com Ethereal Email em desenvolvimento) */
  urlPreview?: string;
  /** Mensagem de erro em caso de falha */
  erro?: string;
}

/**
 * Envia um e-mail via SMTP utilizando o Nodemailer.
 *
 * O remetente é configurado pela variável de ambiente SMTP_REMETENTE.
 * Em caso de falha, retorna o erro sem lançar exceção (para permitir
 * tratamento controlado na camada de retentativas — Fase 5).
 *
 * @param opcoes - Dados do e-mail: destinatário, título e HTML
 * @returns Resultado do envio com sucesso/erro
 */
export async function enviarEmail(opcoes: OpcoesEmail): Promise<ResultadoEnvio> {
  const remetente = process.env.SMTP_REMETENTE ?? 'Nosso Livro <naoresponda@nossolivro.com>';

  try {
    const smtp = obterTransporte();

    const info = await smtp.sendMail({
      from: remetente,
      to: opcoes.destinatario,
      subject: opcoes.titulo,
      html: opcoes.conteudoHtml,
    });

    // Em desenvolvimento com Ethereal, gera URL de preview do e-mail
    const urlPreview = nodemailer.getTestMessageUrl(info) || undefined;

    logger.info(
      {
        destinatario: opcoes.destinatario,
        titulo: opcoes.titulo,
        idMensagem: info.messageId,
        urlPreview,
      },
      'E-mail enviado com sucesso.'
    );

    return {
      sucesso: true,
      idMensagem: info.messageId,
      urlPreview: typeof urlPreview === 'string' ? urlPreview : undefined,
    };
  } catch (erro) {
    const mensagemErro = erro instanceof Error ? erro.message : String(erro);

    logger.error(
      {
        destinatario: opcoes.destinatario,
        titulo: opcoes.titulo,
        erro: mensagemErro,
      },
      'Falha ao enviar e-mail via SMTP.'
    );

    return {
      sucesso: false,
      erro: mensagemErro,
    };
  }
}

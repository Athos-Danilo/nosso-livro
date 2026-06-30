// ─── Processador de Notificações — Serviço de Notificação ───────────────────
// Módulo central que orquestra o pipeline completo de processamento:
// Evento RabbitMQ → Busca de Usuário → Template → Envio → Registro no Banco
//
// Responsável por:
// - Buscar dados do destinatário via HTTP (Serviço de Autenticação e Usuário)
// - Renderizar o template de e-mail correto com os dados reais do evento
// - Disparar o envio de e-mail com política de retentativas (backoff exponencial)
// - Disparar o mock de WhatsApp (quando disponível)
// - Registrar o resultado final na tabela `notificacoes` do banco de dados

import prisma from '../banco/prisma';
import logger from '../logger';
import { buscarUsuarioPorId, ErroRecursoNaoEncontrado } from '../clientes';
import { enviarEmail } from './email.servico';
import { enviarWhatsApp } from './whatsapp.servico';
import {
  templateEmprestimo,
  templateDevolucao,
  templateFilaEspera,
  templateLivroLiberado,
} from './templates';
import type {
  MensagemEmprestimoCriado,
  MensagemEmprestimoDevolvido,
  MensagemReservaCriada,
  MensagemReservaAtribuida,
} from '../fila/tipos';

// ─── Constantes de retentativas ──────────────────────────────────────────────

/** Número máximo de tentativas de envio SMTP antes de desistir */
const MAX_TENTATIVAS_SMTP = 3;

/** Intervalo base entre tentativas de envio (em ms) — backoff: 1s, 2s, 4s */
const INTERVALO_BASE_MS = 1_000;

// ─── Interface interna do resultado de template ──────────────────────────────

interface ResultadoTemplate {
  titulo: string;
  html: string;
}

// ─── Utilitário: espera assíncrona ───────────────────────────────────────────

/**
 * Aguarda o tempo especificado antes de continuar a execução.
 * Utilizado entre tentativas de envio SMTP para backoff exponencial.
 */
function aguardar(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ─── Envio com retentativas (M5.2) ──────────────────────────────────────────

/**
 * Tenta enviar um e-mail via SMTP com política de retentativas.
 *
 * Estratégia: backoff exponencial — 1s, 2s, 4s entre tentativas.
 * Se todas as tentativas falharem, retorna o último erro e o número total.
 *
 * @param destinatario - Endereço de e-mail do destinatário
 * @param titulo - Assunto do e-mail
 * @param conteudoHtml - Corpo do e-mail em HTML
 * @returns Resultado com sucesso/erro e número de tentativas realizadas
 */
async function enviarComRetentativas(
  destinatario: string,
  titulo: string,
  conteudoHtml: string
): Promise<{ sucesso: boolean; tentativas: number; erro?: string }> {
  let ultimoErro = '';

  for (let tentativa = 1; tentativa <= MAX_TENTATIVAS_SMTP; tentativa++) {
    const resultado = await enviarEmail({
      destinatario,
      titulo,
      conteudoHtml,
    });

    if (resultado.sucesso) {
      logger.info(
        { destinatario, tentativa, idMensagem: resultado.idMensagem },
        `E-mail enviado com sucesso na tentativa ${tentativa}.`
      );
      return { sucesso: true, tentativas: tentativa };
    }

    // Registra a falha da tentativa
    ultimoErro = resultado.erro ?? 'Erro desconhecido no envio SMTP';
    logger.warn(
      {
        destinatario,
        tentativa,
        maxTentativas: MAX_TENTATIVAS_SMTP,
        erro: ultimoErro,
      },
      `Tentativa ${tentativa}/${MAX_TENTATIVAS_SMTP} de envio SMTP falhou.`
    );

    // Aplica backoff exponencial entre tentativas (exceto na última)
    if (tentativa < MAX_TENTATIVAS_SMTP) {
      const espera = INTERVALO_BASE_MS * Math.pow(2, tentativa - 1);
      logger.debug(
        { esperaMs: espera },
        `Aguardando ${espera}ms antes da próxima tentativa de envio.`
      );
      await aguardar(espera);
    }
  }

  // Todas as tentativas falharam
  logger.error(
    { destinatario, totalTentativas: MAX_TENTATIVAS_SMTP, erro: ultimoErro },
    'Todas as tentativas de envio SMTP esgotadas.'
  );

  return { sucesso: false, tentativas: MAX_TENTATIVAS_SMTP, erro: ultimoErro };
}

// ─── Processadores por tipo de evento ────────────────────────────────────────

/**
 * Processa o evento `emprestimo.criado`.
 * Busca o usuário, renderiza o template de empréstimo e dispara as notificações.
 */
export async function processarEmprestimoCriado(
  dados: MensagemEmprestimoCriado
): Promise<void> {
  const template = (nomeUsuario: string): ResultadoTemplate =>
    templateEmprestimo({
      nomeUsuario,
      idLivro: dados.id_livro,
      idBiblioteca: dados.id_biblioteca,
      dataLimiteDevolucao: dados.data_limite_devolucao,
      criadoEm: dados.criado_em,
    });

  await executarPipeline(dados.id_usuario, template, 'emprestimo.criado');
}

/**
 * Processa o evento `emprestimo.devolvido`.
 * Busca o usuário, renderiza o template de devolução e dispara as notificações.
 */
export async function processarEmprestimoDevolvido(
  dados: MensagemEmprestimoDevolvido
): Promise<void> {
  const template = (nomeUsuario: string): ResultadoTemplate =>
    templateDevolucao({
      nomeUsuario,
      idLivro: dados.id_livro,
      dataDevolucao: dados.data_devolucao_real,
    });

  await executarPipeline(dados.id_usuario, template, 'emprestimo.devolvido');
}

/**
 * Processa o evento `reserva.criada`.
 * Busca o usuário, renderiza o template de fila de espera e dispara as notificações.
 */
export async function processarReservaCriada(
  dados: MensagemReservaCriada
): Promise<void> {
  const template = (nomeUsuario: string): ResultadoTemplate =>
    templateFilaEspera({
      nomeUsuario,
      idLivro: dados.id_livro,
      posicao: dados.posicao,
    });

  await executarPipeline(dados.id_usuario, template, 'reserva.criada');
}

/**
 * Processa o evento `reserva.atribuida`.
 * Busca o usuário, renderiza o template de livro liberado e dispara as notificações.
 */
export async function processarReservaAtribuida(
  dados: MensagemReservaAtribuida
): Promise<void> {
  const template = (nomeUsuario: string): ResultadoTemplate =>
    templateLivroLiberado({
      nomeUsuario,
      idLivro: dados.id_livro,
      prazoRetirada: dados.prazo_retirada,
    });

  await executarPipeline(dados.id_usuario, template, 'reserva.atribuida');
}

// ─── Pipeline central de processamento (M5.1) ──────────────────────────────

/**
 * Executa o pipeline completo de processamento de uma notificação.
 *
 * Fluxo:
 * 1. Busca dados do usuário destinatário via HTTP
 * 2. Valida se o usuário está ativo
 * 3. Renderiza o template de e-mail com os dados reais
 * 4. Tenta enviar o e-mail via SMTP com retentativas
 * 5. Se o usuário tiver WhatsApp, dispara o mock em paralelo
 * 6. Registra o resultado final no banco de dados
 *
 * Falhas não-retentáveis (usuário não encontrado, inativo, serviço indisponível)
 * são registradas diretamente como FALHOU sem acionar retentativas SMTP.
 *
 * @param idUsuario - UUID do destinatário
 * @param fabricaTemplate - Função que recebe o nome do usuário e retorna o template renderizado
 * @param nomeEvento - Nome do evento para logs (ex: "emprestimo.criado")
 */
async function executarPipeline(
  idUsuario: string,
  fabricaTemplate: (nomeUsuario: string) => ResultadoTemplate,
  nomeEvento: string
): Promise<void> {
  logger.info(
    { idUsuario, evento: nomeEvento },
    `Iniciando processamento de notificação para o evento "${nomeEvento}".`
  );

  // ─── 1. Busca dados do usuário ──────────────────────────────────────
  let nomeUsuario: string;
  let emailUsuario: string;
  let whatsappUsuario: string | undefined;

  try {
    const usuario = await buscarUsuarioPorId(idUsuario);

    // Verifica se o usuário está ativo antes de notificar
    if (!usuario.ativo) {
      logger.warn(
        { idUsuario, evento: nomeEvento },
        'Usuário está inativo. Notificação será registrada como FALHOU.'
      );

      await registrarNotificacao({
        idUsuario,
        titulo: `[${nomeEvento}] Notificação não enviada`,
        conteudo: 'Usuário inativo — notificação suprimida.',
        estado: 'FALHOU',
        mensagemErro: 'Usuário inativo no momento do envio.',
        tentativas: 0,
      });
      return;
    }

    nomeUsuario = usuario.nome;
    emailUsuario = usuario.email;
    whatsappUsuario = usuario.whatsapp;
  } catch (erro) {
    // Falha ao buscar usuário — não-retentável (o Axios já tentou 3x)
    const mensagemErro =
      erro instanceof ErroRecursoNaoEncontrado
        ? erro.message
        : erro instanceof Error
          ? erro.message
          : 'Erro desconhecido ao buscar dados do usuário';

    logger.error(
      { idUsuario, evento: nomeEvento, erro: mensagemErro },
      'Falha ao buscar dados do usuário. Notificação registrada como FALHOU.'
    );

    await registrarNotificacao({
      idUsuario,
      titulo: `[${nomeEvento}] Notificação não enviada`,
      conteudo: 'Falha ao obter dados do destinatário.',
      estado: 'FALHOU',
      mensagemErro,
      tentativas: 0,
    });
    return;
  }

  // ─── 2. Renderiza o template ────────────────────────────────────────
  const { titulo, html } = fabricaTemplate(nomeUsuario);

  // ─── 3. Envia e-mail com retentativas (M5.2) ───────────────────────
  const resultadoEmail = await enviarComRetentativas(emailUsuario, titulo, html);

  // ─── 4. Dispara mock de WhatsApp (se disponível) ───────────────────
  if (whatsappUsuario) {
    try {
      await enviarWhatsApp({
        destinatario: whatsappUsuario,
        nomeDestinatario: nomeUsuario,
        titulo,
        conteudo: `Notificação: ${titulo}`,
      });
    } catch (erroWhatsApp) {
      // WhatsApp é secundário — apenas loga o erro sem impactar o fluxo principal
      logger.warn(
        {
          idUsuario,
          erro: erroWhatsApp instanceof Error ? erroWhatsApp.message : erroWhatsApp,
        },
        'Falha ao enviar mock de WhatsApp. Fluxo principal não afetado.'
      );
    }
  }

  // ─── 5. Registra resultado no banco de dados ───────────────────────
  await registrarNotificacao({
    idUsuario,
    titulo,
    conteudo: html,
    estado: resultadoEmail.sucesso ? 'ENVIADO' : 'FALHOU',
    mensagemErro: resultadoEmail.erro,
    tentativas: resultadoEmail.tentativas,
  });

  // Log final do processamento
  if (resultadoEmail.sucesso) {
    logger.info(
      { idUsuario, evento: nomeEvento, tentativas: resultadoEmail.tentativas },
      `Notificação do evento "${nomeEvento}" processada com SUCESSO.`
    );
  } else {
    logger.error(
      { idUsuario, evento: nomeEvento, tentativas: resultadoEmail.tentativas, erro: resultadoEmail.erro },
      `Notificação do evento "${nomeEvento}" processada com FALHA após ${resultadoEmail.tentativas} tentativas.`
    );
  }
}

// ─── Registro de notificação no banco de dados ──────────────────────────────

/**
 * Dados necessários para criar um registro de notificação no banco.
 */
interface DadosRegistroNotificacao {
  idUsuario: string;
  titulo: string;
  conteudo: string;
  estado: 'ENVIADO' | 'FALHOU' | 'PENDENTE';
  mensagemErro?: string;
  tentativas: number;
}

/**
 * Persiste o registro da notificação na tabela `notificacoes` do banco.
 * Registra o estado final do envio (ENVIADO, FALHOU ou PENDENTE),
 * a mensagem de erro (se houver) e o número de tentativas realizadas.
 *
 * @param dados - Dados do registro a ser criado
 */
async function registrarNotificacao(dados: DadosRegistroNotificacao): Promise<void> {
  try {
    const registro = await prisma.notificacao.create({
      data: {
        idUsuario: dados.idUsuario,
        tipo: 'EMAIL',
        estado: dados.estado,
        titulo: dados.titulo,
        conteudo: dados.conteudo,
        mensagemErro: dados.mensagemErro ?? null,
        tentativas: dados.tentativas,
      },
    });

    logger.info(
      {
        idNotificacao: registro.id,
        idUsuario: dados.idUsuario,
        estado: dados.estado,
        tentativas: dados.tentativas,
      },
      `Notificação registrada no banco com estado "${dados.estado}".`
    );
  } catch (erroBanco) {
    // Falha no banco não deve interromper o fluxo — o e-mail já foi (ou não) enviado
    logger.error(
      {
        idUsuario: dados.idUsuario,
        estado: dados.estado,
        erro: erroBanco instanceof Error ? erroBanco.message : erroBanco,
      },
      'ERRO CRÍTICO: Falha ao registrar notificação no banco de dados.'
    );
  }
}

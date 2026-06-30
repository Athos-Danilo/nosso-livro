// ─── Testes de Integração com Ethereal Email (M6.1) ─────────────────────────
// Valida o envio real de e-mails através de contas temporárias do Ethereal Email.
// Cada teste cria uma conta dinâmica, envia um e-mail com template real
// e valida a entrega (messageId, URL de preview) e o conteúdo HTML.
//
// NOTA: Estes testes fazem chamadas de rede reais ao smtp.ethereal.email.
// Timeout configurado para 20s por teste em jest.config.ts.

import nodemailer from 'nodemailer';
import {
  templateEmprestimo,
  templateDevolucao,
  templateFilaEspera,
  templateLivroLiberado,
} from '../servicos/templates';

// ─── Tipos auxiliares ────────────────────────────────────────────────────────

interface ContaEthereal {
  usuario: string;
  senha: string;
  host: string;
  porta: number;
}

interface ResultadoEnvioTeste {
  sucesso: boolean;
  idMensagem?: string;
  urlPreview?: string | false;
}

// ─── Utilitário: cria conta Ethereal e envia e-mail ──────────────────────────

/**
 * Cria uma conta temporária no Ethereal Email para uso nos testes.
 * Cada chamada gera credenciais únicas que duram apenas durante a sessão.
 */
async function criarContaEthereal(): Promise<ContaEthereal> {
  const conta = await nodemailer.createTestAccount();
  return {
    usuario: conta.user,
    senha: conta.pass,
    host: conta.smtp.host,
    porta: conta.smtp.port,
  };
}

/**
 * Envia um e-mail de teste usando as credenciais Ethereal fornecidas.
 * Retorna o resultado com ID da mensagem e URL de preview.
 */
async function enviarEmailTeste(
  conta: ContaEthereal,
  destinatario: string,
  titulo: string,
  html: string
): Promise<ResultadoEnvioTeste> {
  const transporte = nodemailer.createTransport({
    host: conta.host,
    port: conta.porta,
    secure: false,
    auth: {
      user: conta.usuario,
      pass: conta.senha,
    },
  });

  const info = await transporte.sendMail({
    from: 'Nosso Livro <naoresponda@nossolivro.com>',
    to: destinatario,
    subject: titulo,
    html,
  });

  const urlPreview = nodemailer.getTestMessageUrl(info);

  return {
    sucesso: true,
    idMensagem: info.messageId,
    urlPreview,
  };
}

// ─── Dados fictícios para os templates ───────────────────────────────────────

const USUARIO_TESTE = 'Maria Silva';
const EMAIL_TESTE = 'maria.silva@teste.com';
const ID_LIVRO = '550e8400-e29b-41d4-a716-446655440000';
const ID_BIBLIOTECA = '660e8400-e29b-41d4-a716-446655440001';

// ─── Suíte de testes ─────────────────────────────────────────────────────────

describe('M6.1 — Integração com Ethereal Email', () => {
  let conta: ContaEthereal;

  // Cria uma conta Ethereal antes de todos os testes da suíte
  beforeAll(async () => {
    conta = await criarContaEthereal();
    console.log(`\n📧 Conta Ethereal criada: ${conta.usuario}`);
  });

  // ─── Teste 1: Template de Empréstimo ─────────────────────────────────

  it('deve enviar e-mail de confirmação de empréstimo com sucesso', async () => {
    const { titulo, html } = templateEmprestimo({
      nomeUsuario: USUARIO_TESTE,
      idLivro: ID_LIVRO,
      idBiblioteca: ID_BIBLIOTECA,
      dataLimiteDevolucao: '2026-07-15T23:59:59Z',
      criadoEm: '2026-06-30T14:00:00Z',
    });

    const resultado = await enviarEmailTeste(conta, EMAIL_TESTE, titulo, html);

    expect(resultado.sucesso).toBe(true);
    expect(resultado.idMensagem).toBeDefined();
    expect(resultado.urlPreview).toBeTruthy();

    console.log(`  ✅ Empréstimo — Preview: ${resultado.urlPreview}`);
  });

  // ─── Teste 2: Template de Devolução ──────────────────────────────────

  it('deve enviar e-mail de confirmação de devolução com sucesso', async () => {
    const { titulo, html } = templateDevolucao({
      nomeUsuario: USUARIO_TESTE,
      idLivro: ID_LIVRO,
      dataDevolucao: '2026-07-10T09:30:00Z',
    });

    const resultado = await enviarEmailTeste(conta, EMAIL_TESTE, titulo, html);

    expect(resultado.sucesso).toBe(true);
    expect(resultado.idMensagem).toBeDefined();
    expect(resultado.urlPreview).toBeTruthy();

    console.log(`  ✅ Devolução — Preview: ${resultado.urlPreview}`);
  });

  // ─── Teste 3: Template de Fila de Espera ─────────────────────────────

  it('deve enviar e-mail de ingresso na fila de espera com sucesso', async () => {
    const { titulo, html } = templateFilaEspera({
      nomeUsuario: USUARIO_TESTE,
      idLivro: ID_LIVRO,
      posicao: 3,
    });

    const resultado = await enviarEmailTeste(conta, EMAIL_TESTE, titulo, html);

    expect(resultado.sucesso).toBe(true);
    expect(resultado.idMensagem).toBeDefined();
    expect(resultado.urlPreview).toBeTruthy();

    console.log(`  ✅ Fila de Espera — Preview: ${resultado.urlPreview}`);
  });

  // ─── Teste 4: Template de Livro Liberado ─────────────────────────────

  it('deve enviar e-mail de livro liberado para retirada com sucesso', async () => {
    const { titulo, html } = templateLivroLiberado({
      nomeUsuario: USUARIO_TESTE,
      idLivro: ID_LIVRO,
      prazoRetirada: '2026-07-02T14:00:00Z',
    });

    const resultado = await enviarEmailTeste(conta, EMAIL_TESTE, titulo, html);

    expect(resultado.sucesso).toBe(true);
    expect(resultado.idMensagem).toBeDefined();
    expect(resultado.urlPreview).toBeTruthy();

    console.log(`  ✅ Livro Liberado — Preview: ${resultado.urlPreview}`);
  });

  // ─── Teste 5: Validação do conteúdo HTML ─────────────────────────────

  it('deve gerar HTML com os elementos esperados nos templates', () => {
    // Template de empréstimo
    const emprestimo = templateEmprestimo({
      nomeUsuario: USUARIO_TESTE,
      idLivro: ID_LIVRO,
      idBiblioteca: ID_BIBLIOTECA,
      dataLimiteDevolucao: '2026-07-15T23:59:59Z',
      criadoEm: '2026-06-30T14:00:00Z',
    });

    expect(emprestimo.html).toContain(USUARIO_TESTE);
    expect(emprestimo.html).toContain(ID_LIVRO);
    expect(emprestimo.html).toContain('Nosso Livro');
    expect(emprestimo.html).toContain('Empréstimo Confirmado');
    expect(emprestimo.html).toContain('Data limite');
    expect(emprestimo.titulo).toContain('Empréstimo confirmado');

    // Template de devolução
    const devolucao = templateDevolucao({
      nomeUsuario: USUARIO_TESTE,
      idLivro: ID_LIVRO,
      dataDevolucao: '2026-07-10T09:30:00Z',
    });

    expect(devolucao.html).toContain(USUARIO_TESTE);
    expect(devolucao.html).toContain('Devolução Registrada');
    expect(devolucao.titulo).toContain('Devolução confirmada');

    // Template de fila de espera
    const filaEspera = templateFilaEspera({
      nomeUsuario: USUARIO_TESTE,
      idLivro: ID_LIVRO,
      posicao: 3,
    });

    expect(filaEspera.html).toContain(USUARIO_TESTE);
    expect(filaEspera.html).toContain('3º lugar');
    expect(filaEspera.html).toContain('fila de espera');
    expect(filaEspera.titulo).toContain('Reserva registrada');

    // Template de livro liberado
    const livroLiberado = templateLivroLiberado({
      nomeUsuario: USUARIO_TESTE,
      idLivro: ID_LIVRO,
      prazoRetirada: '2026-07-02T14:00:00Z',
    });

    expect(livroLiberado.html).toContain(USUARIO_TESTE);
    expect(livroLiberado.html).toContain('disponível');
    expect(livroLiberado.html).toContain('retirada');
    expect(livroLiberado.titulo).toContain('Livro disponível');
  });
});

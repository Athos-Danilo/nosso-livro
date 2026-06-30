// ─── Testes de Integração do Pipeline de Mensageria (M6.2) ──────────────────
// Valida que os consumidores acionam corretamente o motor de e-mail e
// gravam o histórico correspondente no banco de dados.
//
// Estratégia de mocks:
// - `buscarUsuarioPorId` (HTTP): retorna dados fictícios sem rede
// - `enviarEmail` (SMTP): simula sucesso/falha sem rede
// - `prisma.notificacao.create` (banco): captura os dados sem BD real
// - `enviarWhatsApp`: captura chamadas ao mock de WhatsApp

// ─── Mocks de módulos (devem ser declarados ANTES dos imports) ───────────────

jest.mock('../clientes', () => ({
  buscarUsuarioPorId: jest.fn(),
  ErroRecursoNaoEncontrado: class ErroRecursoNaoEncontrado extends Error {
    constructor(
      public readonly servico: string,
      public readonly recurso: string,
      public readonly id: string
    ) {
      super(`[${servico}] ${recurso} com ID "${id}" não encontrado.`);
      this.name = 'ErroRecursoNaoEncontrado';
    }
  },
}));

jest.mock('../servicos/email.servico', () => ({
  enviarEmail: jest.fn(),
}));

jest.mock('../servicos/whatsapp.servico', () => ({
  enviarWhatsApp: jest.fn(),
}));

jest.mock('../banco/prisma', () => ({
  __esModule: true,
  default: {
    notificacao: {
      create: jest.fn(),
    },
  },
}));

// Silencia o logger durante os testes
jest.mock('../logger', () => ({
  __esModule: true,
  default: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
    fatal: jest.fn(),
  },
}));

// ─── Imports (carregados APÓS os mocks) ──────────────────────────────────────

import { buscarUsuarioPorId } from '../clientes';
import { ErroRecursoNaoEncontrado } from '../clientes';
import { enviarEmail } from '../servicos/email.servico';
import { enviarWhatsApp } from '../servicos/whatsapp.servico';
import prisma from '../banco/prisma';
import {
  processarEmprestimoCriado,
  processarEmprestimoDevolvido,
  processarReservaCriada,
  processarReservaAtribuida,
} from '../servicos/processador.notificacao';
import type {
  MensagemEmprestimoCriado,
  MensagemEmprestimoDevolvido,
  MensagemReservaCriada,
  MensagemReservaAtribuida,
} from '../fila/tipos';
import type { RespostaUsuario } from '../clientes/tipos';

// ─── Referências tipadas dos mocks ───────────────────────────────────────────

const mockBuscarUsuario = buscarUsuarioPorId as jest.MockedFunction<typeof buscarUsuarioPorId>;
const mockEnviarEmail = enviarEmail as jest.MockedFunction<typeof enviarEmail>;
const mockEnviarWhatsApp = enviarWhatsApp as jest.MockedFunction<typeof enviarWhatsApp>;
const mockCriarNotificacao = prisma.notificacao.create as jest.MockedFunction<typeof prisma.notificacao.create>;

// ─── Dados fictícios ─────────────────────────────────────────────────────────

const USUARIO_ATIVO: RespostaUsuario = {
  id: '111e1111-e11b-11d1-a111-111111111111',
  nome: 'João Testes',
  email: 'joao@teste.com',
  whatsapp: '+5511999999999',
  ativo: true,
};

const USUARIO_SEM_WHATSAPP: RespostaUsuario = {
  ...USUARIO_ATIVO,
  id: '222e2222-e22b-22d2-a222-222222222222',
  whatsapp: undefined,
};

const USUARIO_INATIVO: RespostaUsuario = {
  ...USUARIO_ATIVO,
  id: '333e3333-e33b-33d3-a333-333333333333',
  ativo: false,
};

const PAYLOAD_EMPRESTIMO: MensagemEmprestimoCriado = {
  id_emprestimo: 'emp-001',
  id_usuario: USUARIO_ATIVO.id,
  id_livro: 'livro-001',
  id_biblioteca: 'bib-001',
  data_limite_devolucao: '2026-07-15T23:59:59Z',
  criado_em: '2026-06-30T14:00:00Z',
};

const PAYLOAD_DEVOLUCAO: MensagemEmprestimoDevolvido = {
  id_emprestimo: 'emp-001',
  id_usuario: USUARIO_ATIVO.id,
  id_livro: 'livro-001',
  data_devolucao_real: '2026-07-10T09:30:00Z',
};

const PAYLOAD_RESERVA: MensagemReservaCriada = {
  id_reserva: 'res-001',
  id_usuario: USUARIO_ATIVO.id,
  id_livro: 'livro-001',
  posicao: 2,
  criado_em: '2026-06-30T14:00:00Z',
};

const PAYLOAD_ATRIBUIDA: MensagemReservaAtribuida = {
  id_reserva: 'res-001',
  id_usuario: USUARIO_ATIVO.id,
  id_livro: 'livro-001',
  prazo_retirada: '2026-07-02T14:00:00Z',
};

// ─── Helpers de setup ────────────────────────────────────────────────────────

/**
 * Configura os mocks para simular o cenário de sucesso padrão:
 * - Usuário ativo encontrado
 * - E-mail enviado com sucesso na primeira tentativa
 * - Registro no banco realizado com sucesso
 */
function configurarCenarioSucesso(usuario: RespostaUsuario = USUARIO_ATIVO): void {
  mockBuscarUsuario.mockResolvedValue(usuario);
  mockEnviarEmail.mockResolvedValue({
    sucesso: true,
    idMensagem: 'msg-test-001',
  });
  mockEnviarWhatsApp.mockResolvedValue({
    sucesso: true,
    idMensagem: 'whatsapp-mock-001',
  });
  mockCriarNotificacao.mockResolvedValue({
    id: 'notif-001',
    idUsuario: usuario.id,
    tipo: 'EMAIL',
    estado: 'ENVIADO',
    titulo: 'Teste',
    conteudo: '<html>Teste</html>',
    mensagemErro: null,
    tentativas: 1,
    criadoEm: new Date(),
  } as any);
}

// ─── Suíte de testes ─────────────────────────────────────────────────────────

describe('M6.2 — Pipeline de Processamento de Notificações', () => {

  // ─── 1. Empréstimo criado — sucesso ────────────────────────────────

  describe('Evento emprestimo.criado', () => {
    it('deve buscar usuário, enviar e-mail e gravar ENVIADO no banco', async () => {
      configurarCenarioSucesso();

      await processarEmprestimoCriado(PAYLOAD_EMPRESTIMO);

      // Valida que buscou o usuário correto
      expect(mockBuscarUsuario).toHaveBeenCalledWith(PAYLOAD_EMPRESTIMO.id_usuario);

      // Valida que enviou e-mail com dados do template de empréstimo
      expect(mockEnviarEmail).toHaveBeenCalledTimes(1);
      const chamadaEmail = mockEnviarEmail.mock.calls[0][0];
      expect(chamadaEmail.destinatario).toBe(USUARIO_ATIVO.email);
      expect(chamadaEmail.titulo).toContain('Empréstimo confirmado');
      expect(chamadaEmail.conteudoHtml).toContain(USUARIO_ATIVO.nome);

      // Valida gravação no banco com estado ENVIADO
      expect(mockCriarNotificacao).toHaveBeenCalledTimes(1);
      const dadosBanco = mockCriarNotificacao.mock.calls[0][0] as any;
      expect(dadosBanco.data.estado).toBe('ENVIADO');
      expect(dadosBanco.data.idUsuario).toBe(PAYLOAD_EMPRESTIMO.id_usuario);
      expect(dadosBanco.data.tipo).toBe('EMAIL');
      expect(dadosBanco.data.tentativas).toBe(1);
    });
  });

  // ─── 2. Devolução — sucesso ────────────────────────────────────────

  describe('Evento emprestimo.devolvido', () => {
    it('deve processar devolução e gravar ENVIADO no banco', async () => {
      configurarCenarioSucesso();

      await processarEmprestimoDevolvido(PAYLOAD_DEVOLUCAO);

      expect(mockBuscarUsuario).toHaveBeenCalledWith(PAYLOAD_DEVOLUCAO.id_usuario);
      expect(mockEnviarEmail).toHaveBeenCalledTimes(1);

      const chamadaEmail = mockEnviarEmail.mock.calls[0][0];
      expect(chamadaEmail.titulo).toContain('Devolução confirmada');
      expect(chamadaEmail.conteudoHtml).toContain(USUARIO_ATIVO.nome);

      const dadosBanco = mockCriarNotificacao.mock.calls[0][0] as any;
      expect(dadosBanco.data.estado).toBe('ENVIADO');
    });
  });

  // ─── 3. Reserva criada — sucesso ───────────────────────────────────

  describe('Evento reserva.criada', () => {
    it('deve processar reserva e gravar ENVIADO no banco', async () => {
      configurarCenarioSucesso();

      await processarReservaCriada(PAYLOAD_RESERVA);

      expect(mockBuscarUsuario).toHaveBeenCalledWith(PAYLOAD_RESERVA.id_usuario);
      expect(mockEnviarEmail).toHaveBeenCalledTimes(1);

      const chamadaEmail = mockEnviarEmail.mock.calls[0][0];
      expect(chamadaEmail.titulo).toContain('Reserva registrada');
      expect(chamadaEmail.conteudoHtml).toContain('2º lugar');

      const dadosBanco = mockCriarNotificacao.mock.calls[0][0] as any;
      expect(dadosBanco.data.estado).toBe('ENVIADO');
    });
  });

  // ─── 4. Reserva atribuída — sucesso ────────────────────────────────

  describe('Evento reserva.atribuida', () => {
    it('deve processar atribuição e gravar ENVIADO no banco', async () => {
      configurarCenarioSucesso();

      await processarReservaAtribuida(PAYLOAD_ATRIBUIDA);

      expect(mockBuscarUsuario).toHaveBeenCalledWith(PAYLOAD_ATRIBUIDA.id_usuario);
      expect(mockEnviarEmail).toHaveBeenCalledTimes(1);

      const chamadaEmail = mockEnviarEmail.mock.calls[0][0];
      expect(chamadaEmail.titulo).toContain('Livro disponível');

      const dadosBanco = mockCriarNotificacao.mock.calls[0][0] as any;
      expect(dadosBanco.data.estado).toBe('ENVIADO');
    });
  });

  // ─── 5. Usuário não encontrado ─────────────────────────────────────

  describe('Cenário de falha: Usuário não encontrado', () => {
    it('deve gravar FALHOU sem tentar enviar e-mail quando o usuário não existe', async () => {
      mockBuscarUsuario.mockRejectedValue(
        new ErroRecursoNaoEncontrado(
          'Serviço de Autenticação e Usuário',
          'Usuário',
          PAYLOAD_EMPRESTIMO.id_usuario
        )
      );
      mockCriarNotificacao.mockResolvedValue({} as any);

      await processarEmprestimoCriado(PAYLOAD_EMPRESTIMO);

      // Não deve ter tentado enviar e-mail
      expect(mockEnviarEmail).not.toHaveBeenCalled();

      // Deve gravar FALHOU no banco
      expect(mockCriarNotificacao).toHaveBeenCalledTimes(1);
      const dadosBanco = mockCriarNotificacao.mock.calls[0][0] as any;
      expect(dadosBanco.data.estado).toBe('FALHOU');
      expect(dadosBanco.data.mensagemErro).toContain('não encontrado');
      expect(dadosBanco.data.tentativas).toBe(0);
    });
  });

  // ─── 6. Usuário inativo ────────────────────────────────────────────

  describe('Cenário de falha: Usuário inativo', () => {
    it('deve gravar FALHOU com mensagem "Usuário inativo" sem tentar enviar', async () => {
      mockBuscarUsuario.mockResolvedValue(USUARIO_INATIVO);
      mockCriarNotificacao.mockResolvedValue({} as any);

      await processarEmprestimoCriado(PAYLOAD_EMPRESTIMO);

      // Não deve ter tentado enviar e-mail
      expect(mockEnviarEmail).not.toHaveBeenCalled();

      // Deve gravar FALHOU no banco
      expect(mockCriarNotificacao).toHaveBeenCalledTimes(1);
      const dadosBanco = mockCriarNotificacao.mock.calls[0][0] as any;
      expect(dadosBanco.data.estado).toBe('FALHOU');
      expect(dadosBanco.data.mensagemErro).toContain('inativo');
      expect(dadosBanco.data.tentativas).toBe(0);
    });
  });

  // ─── 7. Falha SMTP com retentativas parciais ──────────────────────

  describe('Cenário de retentativa: SMTP falha 2x e acerta na 3ª', () => {
    it('deve gravar ENVIADO com tentativas = 3 após 2 falhas e 1 sucesso', async () => {
      configurarCenarioSucesso();

      // Simula: falha → falha → sucesso
      mockEnviarEmail
        .mockResolvedValueOnce({ sucesso: false, erro: 'Timeout SMTP' })
        .mockResolvedValueOnce({ sucesso: false, erro: 'Conexão recusada' })
        .mockResolvedValueOnce({ sucesso: true, idMensagem: 'msg-003' });

      await processarEmprestimoCriado(PAYLOAD_EMPRESTIMO);

      // Deve ter tentado 3 vezes
      expect(mockEnviarEmail).toHaveBeenCalledTimes(3);

      // Deve gravar ENVIADO com 3 tentativas
      const dadosBanco = mockCriarNotificacao.mock.calls[0][0] as any;
      expect(dadosBanco.data.estado).toBe('ENVIADO');
      expect(dadosBanco.data.tentativas).toBe(3);
    });
  });

  // ─── 8. Falha SMTP total (3 tentativas) ────────────────────────────

  describe('Cenário de retentativa: SMTP falha em todas as 3 tentativas', () => {
    it('deve gravar FALHOU com tentativas = 3 e a mensagem do último erro', async () => {
      configurarCenarioSucesso();

      // Simula: 3 falhas consecutivas
      mockEnviarEmail
        .mockResolvedValueOnce({ sucesso: false, erro: 'Erro 1' })
        .mockResolvedValueOnce({ sucesso: false, erro: 'Erro 2' })
        .mockResolvedValueOnce({ sucesso: false, erro: 'Erro 3 — servidor SMTP fora do ar' });

      await processarEmprestimoCriado(PAYLOAD_EMPRESTIMO);

      // Deve ter tentado 3 vezes
      expect(mockEnviarEmail).toHaveBeenCalledTimes(3);

      // Deve gravar FALHOU com 3 tentativas e o último erro
      const dadosBanco = mockCriarNotificacao.mock.calls[0][0] as any;
      expect(dadosBanco.data.estado).toBe('FALHOU');
      expect(dadosBanco.data.tentativas).toBe(3);
      expect(dadosBanco.data.mensagemErro).toContain('Erro 3');
    });
  });

  // ─── 9. WhatsApp paralelo ──────────────────────────────────────────

  describe('Envio paralelo de WhatsApp', () => {
    it('deve chamar enviarWhatsApp quando o usuário possui número cadastrado', async () => {
      configurarCenarioSucesso(USUARIO_ATIVO);

      await processarEmprestimoCriado(PAYLOAD_EMPRESTIMO);

      // WhatsApp deve ter sido chamado com o número do usuário
      expect(mockEnviarWhatsApp).toHaveBeenCalledTimes(1);
      expect(mockEnviarWhatsApp).toHaveBeenCalledWith(
        expect.objectContaining({
          destinatario: USUARIO_ATIVO.whatsapp,
          nomeDestinatario: USUARIO_ATIVO.nome,
        })
      );
    });

    it('NÃO deve chamar enviarWhatsApp quando o usuário não possui número', async () => {
      configurarCenarioSucesso(USUARIO_SEM_WHATSAPP);

      await processarEmprestimoCriado(PAYLOAD_EMPRESTIMO);

      // WhatsApp NÃO deve ter sido chamado
      expect(mockEnviarWhatsApp).not.toHaveBeenCalled();
    });
  });
});

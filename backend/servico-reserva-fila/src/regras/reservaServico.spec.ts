/**
 * Testes Unitários — Lógica de Negócio da Fila de Espera
 *
 * Estratégia: todos os módulos externos (Prisma, clientes HTTP e publicadores
 * RabbitMQ) são mockados com vi.mock, permitindo que os testes rodem de forma
 * totalmente isolada, sem banco de dados ou broker real.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { EstadoReserva, type Reserva } from '@prisma/client';

// ─── Mocks de módulos externos ────────────────────────────────────────────────

// Mock do Prisma Client: todas as queries retornam undefined por padrão;
// cada teste define o retorno esperado via mockResolvedValue / mockResolvedValueOnce.
vi.mock('../banco/prisma', () => ({
  default: {
    $transaction: vi.fn(),
    reserva: {
      findFirst: vi.fn(),
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
      count: vi.fn(),
    },
  },
}));

// Mock dos clientes HTTP: por padrão resolve com sucesso (usuário/livro encontrados)
vi.mock('../clientes', () => ({
  buscarUsuarioPorId: vi.fn().mockResolvedValue({ id: 'usuario-1', nome: 'Teste' }),
  buscarLivroPorId: vi.fn().mockResolvedValue({ id: 'livro-1', titulo: 'Livro Teste' }),
  // Exporta as classes de erro como reais para que instanceof funcione nos testes
  ErroRecursoNaoEncontrado: class ErroRecursoNaoEncontrado extends Error {
    constructor(servico: string, _recurso: string, _id: string) {
      super(`Recurso não encontrado no serviço "${servico}".`);
      this.name = 'ErroRecursoNaoEncontrado';
    }
  },
  ErroTimeoutServico: class ErroTimeoutServico extends Error {
    constructor(servico: string) {
      super(`Timeout ao acessar o serviço "${servico}".`);
      this.name = 'ErroTimeoutServico';
    }
  },
  ErroServicoIndisponivel: class ErroServicoIndisponivel extends Error {
    constructor(servico: string) {
      super(`Serviço "${servico}" indisponível.`);
      this.name = 'ErroServicoIndisponivel';
    }
  },
}));

// Mock dos publicadores RabbitMQ: apenas registra as chamadas, não abre conexão
vi.mock('../fila', () => ({
  publicarReservaCriada: vi.fn(),
  publicarReservaAtribuida: vi.fn(),
}));

// ─── Importações após mocks (ordem importa no vi.mock) ───────────────────────
import prisma from '../banco/prisma';
import { buscarUsuarioPorId, buscarLivroPorId, ErroRecursoNaoEncontrado } from '../clientes';
import { publicarReservaCriada, publicarReservaAtribuida } from '../fila';
import {
  ingressarNaFila,
  cancelarReserva,
  cancelarReservasExpiradas,
} from './reservaServico';
import {
  ErroReservaDuplicada,
  ErroReservaNaoEncontrada,
  ErroAcessoNegadoReserva,
  ErroEstadoInvalidoParaCancelamento,
} from './errosNegocio';

// ─── Fábrica de reservas de teste ─────────────────────────────────────────────
function criarReservaFake(sobrescrever: Partial<Reserva> = {}): Reserva {
  return {
    id: 'reserva-uuid-1',
    idUsuario: 'usuario-uuid-1',
    idLivro: 'livro-uuid-1',
    estado: EstadoReserva.PENDENTE,
    posicao: 1,
    prazoRetirada: null,
    criadoEm: new Date('2024-01-01T10:00:00Z'),
    atualizadoEm: new Date('2024-01-01T10:00:00Z'),
    ...sobrescrever,
  };
}

// ─── Helper: simula o comportamento de prisma.$transaction ───────────────────
// Executa a função de callback com um objeto que replica o tx do Prisma mockado
function simularTransacao() {
  (prisma.$transaction as ReturnType<typeof vi.fn>).mockImplementation(
    async (fn: (tx: typeof prisma) => Promise<unknown>) => fn(prisma)
  );
}

// ─── Limpa todos os mocks antes de cada teste ────────────────────────────────
beforeEach(() => {
  vi.clearAllMocks();
  simularTransacao();
});

// ════════════════════════════════════════════════════════════════════════════════
// Grupo 1 — ingressarNaFila
// ════════════════════════════════════════════════════════════════════════════════
describe('ingressarNaFila', () => {
  it('deve criar reserva com posição 1 quando fila está vazia', async () => {
    // Arrange: sem reserva ativa, fila com 0 PENDENTES
    (prisma.reserva.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue(null);
    (prisma.reserva.count as ReturnType<typeof vi.fn>).mockResolvedValue(0);

    const reservaEsperada = criarReservaFake({ posicao: 1 });
    (prisma.reserva.create as ReturnType<typeof vi.fn>).mockResolvedValue(reservaEsperada);

    // Act
    const resultado = await ingressarNaFila('usuario-uuid-1', 'livro-uuid-1');

    // Assert
    expect(resultado.posicao).toBe(1);
    expect(resultado.estado).toBe(EstadoReserva.PENDENTE);
  });

  it('deve criar reserva com posição N+1 quando fila tem N usuários', async () => {
    // Arrange: 4 usuários já na fila (PENDENTES)
    (prisma.reserva.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue(null);
    (prisma.reserva.count as ReturnType<typeof vi.fn>).mockResolvedValue(4);

    const reservaEsperada = criarReservaFake({ posicao: 5 });
    (prisma.reserva.create as ReturnType<typeof vi.fn>).mockResolvedValue(reservaEsperada);

    // Act
    const resultado = await ingressarNaFila('usuario-uuid-1', 'livro-uuid-1');

    // Assert
    expect(resultado.posicao).toBe(5);
  });

  it('deve lançar ErroReservaDuplicada se usuário já tem reserva PENDENTE', async () => {
    // Arrange: retorna reserva ativa existente
    (prisma.reserva.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue(
      criarReservaFake({ estado: EstadoReserva.PENDENTE })
    );

    // Act & Assert
    await expect(ingressarNaFila('usuario-uuid-1', 'livro-uuid-1')).rejects.toBeInstanceOf(
      ErroReservaDuplicada
    );
  });

  it('deve lançar ErroReservaDuplicada se usuário já tem reserva ATRIBUIDA', async () => {
    // Arrange: reserva já atribuída (livro aguardando retirada)
    (prisma.reserva.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue(
      criarReservaFake({ estado: EstadoReserva.ATRIBUIDO, posicao: 0 })
    );

    // Act & Assert
    await expect(ingressarNaFila('usuario-uuid-1', 'livro-uuid-1')).rejects.toBeInstanceOf(
      ErroReservaDuplicada
    );
  });

  it('deve publicar evento reserva.criada após criação bem-sucedida', async () => {
    // Arrange
    (prisma.reserva.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue(null);
    (prisma.reserva.count as ReturnType<typeof vi.fn>).mockResolvedValue(0);

    const reservaCriada = criarReservaFake({ posicao: 1 });
    (prisma.reserva.create as ReturnType<typeof vi.fn>).mockResolvedValue(reservaCriada);

    // Act
    await ingressarNaFila('usuario-uuid-1', 'livro-uuid-1');

    // Assert: o publicador deve ter sido chamado com os dados corretos
    expect(publicarReservaCriada).toHaveBeenCalledOnce();
    expect(publicarReservaCriada).toHaveBeenCalledWith(
      expect.objectContaining({
        id_reserva: reservaCriada.id,
        id_usuario: reservaCriada.idUsuario,
        id_livro: reservaCriada.idLivro,
        posicao: 1,
      })
    );
  });

  it('deve validar usuário e livro via HTTP antes de criar reserva', async () => {
    // Arrange
    (prisma.reserva.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue(null);
    (prisma.reserva.count as ReturnType<typeof vi.fn>).mockResolvedValue(0);
    (prisma.reserva.create as ReturnType<typeof vi.fn>).mockResolvedValue(criarReservaFake());

    // Act
    await ingressarNaFila('usuario-uuid-1', 'livro-uuid-1');

    // Assert: ambos os clientes HTTP devem ter sido consultados
    expect(buscarUsuarioPorId).toHaveBeenCalledWith('usuario-uuid-1');
    expect(buscarLivroPorId).toHaveBeenCalledWith('livro-uuid-1');
  });

  it('não deve criar reserva se o usuário não for encontrado', async () => {
    // Arrange: cliente HTTP lança erro de recurso não encontrado
    (buscarUsuarioPorId as ReturnType<typeof vi.fn>).mockRejectedValue(
      new ErroRecursoNaoEncontrado('Serviço de Usuário', 'Usuário', 'usuario-uuid-1')
    );

    // Act & Assert
    await expect(ingressarNaFila('usuario-uuid-1', 'livro-uuid-1')).rejects.toMatchObject({
      name: 'ErroRecursoNaoEncontrado',
    });
    // O create nunca deve ter sido chamado
    expect(prisma.reserva.create).not.toHaveBeenCalled();
  });
});

// ════════════════════════════════════════════════════════════════════════════════
// Grupo 2 — cancelarReserva: reserva PENDENTE (no meio da fila)
// ════════════════════════════════════════════════════════════════════════════════
describe('cancelarReserva — reserva PENDENTE', () => {
  it('deve cancelar reserva e decrementar posições dos usuários atrás na fila', async () => {
    // Arrange: reserva na posição 2
    const reservaPendente = criarReservaFake({
      id: 'reserva-2',
      estado: EstadoReserva.PENDENTE,
      posicao: 2,
    });
    const reservaCancelada = { ...reservaPendente, estado: EstadoReserva.CANCELADO, posicao: 0 };

    (prisma.reserva.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(reservaPendente);
    (prisma.reserva.update as ReturnType<typeof vi.fn>).mockResolvedValue(reservaCancelada);
    (prisma.reserva.updateMany as ReturnType<typeof vi.fn>).mockResolvedValue({ count: 3 });

    // Act
    const resultado = await cancelarReserva('reserva-2', reservaPendente.idUsuario);

    // Assert
    expect(resultado.estado).toBe(EstadoReserva.CANCELADO);
    // Deve decrementar posições dos que estavam ATRÁS (posicao > 2)
    expect(prisma.reserva.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          idLivro: reservaPendente.idLivro,
          estado: EstadoReserva.PENDENTE,
          posicao: { gt: 2 },
        }),
        data: { posicao: { decrement: 1 } },
      })
    );
  });

  it('não deve publicar evento reserva.atribuida ao cancelar reserva PENDENTE', async () => {
    // Arrange
    const reservaPendente = criarReservaFake({ estado: EstadoReserva.PENDENTE, posicao: 1 });
    const reservaCancelada = { ...reservaPendente, estado: EstadoReserva.CANCELADO, posicao: 0 };

    (prisma.reserva.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(reservaPendente);
    (prisma.reserva.update as ReturnType<typeof vi.fn>).mockResolvedValue(reservaCancelada);
    (prisma.reserva.updateMany as ReturnType<typeof vi.fn>).mockResolvedValue({ count: 0 });

    // Act
    await cancelarReserva('reserva-uuid-1', reservaPendente.idUsuario);

    // Assert: nenhuma reatribuição deve ocorrer para reserva PENDENTE
    expect(publicarReservaAtribuida).not.toHaveBeenCalled();
  });

  it('deve lançar ErroReservaNaoEncontrada para ID inexistente', async () => {
    // Arrange: banco retorna null
    (prisma.reserva.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(null);

    // Act & Assert
    await expect(cancelarReserva('id-fantasma')).rejects.toBeInstanceOf(
      ErroReservaNaoEncontrada
    );
  });

  it('deve lançar ErroAcessoNegadoReserva se o usuário não é dono da reserva', async () => {
    // Arrange: reserva pertence a outro usuário
    const reservaDeOutroUsuario = criarReservaFake({ idUsuario: 'usuario-dono-uuid' });
    (prisma.reserva.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(
      reservaDeOutroUsuario
    );

    // Act & Assert: solicitante é diferente do dono
    await expect(
      cancelarReserva('reserva-uuid-1', 'usuario-intruso-uuid')
    ).rejects.toBeInstanceOf(ErroAcessoNegadoReserva);
  });

  it('deve lançar ErroEstadoInvalidoParaCancelamento para reserva já CANCELADA', async () => {
    // Arrange
    const reservaCancelada = criarReservaFake({ estado: EstadoReserva.CANCELADO });
    (prisma.reserva.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(reservaCancelada);

    // Act & Assert
    await expect(cancelarReserva('reserva-uuid-1')).rejects.toBeInstanceOf(
      ErroEstadoInvalidoParaCancelamento
    );
  });

  it('deve lançar ErroEstadoInvalidoParaCancelamento para reserva já CONCLUIDA', async () => {
    // Arrange
    const reservaConcluida = criarReservaFake({ estado: EstadoReserva.CONCLUIDO });
    (prisma.reserva.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(reservaConcluida);

    // Act & Assert
    await expect(cancelarReserva('reserva-uuid-1')).rejects.toBeInstanceOf(
      ErroEstadoInvalidoParaCancelamento
    );
  });

  it('deve permitir cancelamento sem verificação de posse (cancelamento interno/expiração)', async () => {
    // Arrange: cancelamento sem idUsuarioSolicitante (expiração automática)
    const reserva = criarReservaFake({ idUsuario: 'qualquer-usuario', estado: EstadoReserva.PENDENTE });
    const reservaCancelada = { ...reserva, estado: EstadoReserva.CANCELADO, posicao: 0 };

    (prisma.reserva.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(reserva);
    (prisma.reserva.update as ReturnType<typeof vi.fn>).mockResolvedValue(reservaCancelada);
    (prisma.reserva.updateMany as ReturnType<typeof vi.fn>).mockResolvedValue({ count: 0 });

    // Act: sem passar idUsuarioSolicitante
    const resultado = await cancelarReserva('reserva-uuid-1');

    // Assert: cancela sem erro de acesso
    expect(resultado.estado).toBe(EstadoReserva.CANCELADO);
  });
});

// ════════════════════════════════════════════════════════════════════════════════
// Grupo 3 — cancelarReserva: reserva ATRIBUIDA (livro aguardando retirada)
// ════════════════════════════════════════════════════════════════════════════════
describe('cancelarReserva — reserva ATRIBUIDA', () => {
  it('deve reatribuir o livro para o próximo PENDENTE e publicar reserva.atribuida', async () => {
    // Arrange
    const prazoOriginal = new Date(Date.now() + 48 * 3600_000);
    const reservaAtribuida = criarReservaFake({
      id: 'reserva-atribuida-1',
      estado: EstadoReserva.ATRIBUIDO,
      posicao: 0,
      prazoRetirada: prazoOriginal,
    });
    const reservaCancelada = { ...reservaAtribuida, estado: EstadoReserva.CANCELADO };

    // Próximo PENDENTE que será reatribuído
    const proximoPendente = criarReservaFake({
      id: 'reserva-pendente-1',
      idUsuario: 'usuario-proximo',
      estado: EstadoReserva.PENDENTE,
      posicao: 1,
    });
    const proxReservaAtribuida = {
      ...proximoPendente,
      estado: EstadoReserva.ATRIBUIDO,
      posicao: 0,
      prazoRetirada: new Date(Date.now() + 48 * 3600_000),
    };

    (prisma.reserva.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(reservaAtribuida);
    // Primeira chamada update → cancela reserva atual
    // Segunda chamada update → atribui ao próximo
    (prisma.reserva.update as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce(reservaCancelada)
      .mockResolvedValueOnce(proxReservaAtribuida);
    (prisma.reserva.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue(proximoPendente);

    // Act
    const resultado = await cancelarReserva('reserva-atribuida-1', reservaAtribuida.idUsuario);

    // Assert
    expect(resultado.estado).toBe(EstadoReserva.CANCELADO);
    expect(publicarReservaAtribuida).toHaveBeenCalledOnce();
    expect(publicarReservaAtribuida).toHaveBeenCalledWith(
      expect.objectContaining({
        id_reserva: proxReservaAtribuida.id,
        id_usuario: 'usuario-proximo',
        id_livro: proxReservaAtribuida.idLivro,
      })
    );
  });

  it('não deve publicar evento se não houver próximo PENDENTE na fila', async () => {
    // Arrange: fila vazia após cancelamento
    const reservaAtribuida = criarReservaFake({
      estado: EstadoReserva.ATRIBUIDO,
      posicao: 0,
      prazoRetirada: new Date(),
    });
    const reservaCancelada = { ...reservaAtribuida, estado: EstadoReserva.CANCELADO };

    (prisma.reserva.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(reservaAtribuida);
    (prisma.reserva.update as ReturnType<typeof vi.fn>).mockResolvedValue(reservaCancelada);
    (prisma.reserva.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue(null); // fila vazia

    // Act
    await cancelarReserva('reserva-uuid-1', reservaAtribuida.idUsuario);

    // Assert: sem próximo na fila, nenhum evento deve ser disparado
    expect(publicarReservaAtribuida).not.toHaveBeenCalled();
  });

  it('deve definir novo prazo de 48h para o usuário reatribuído', async () => {
    // Arrange
    const reservaAtribuida = criarReservaFake({
      estado: EstadoReserva.ATRIBUIDO,
      posicao: 0,
      prazoRetirada: new Date(),
    });
    const reservaCancelada = { ...reservaAtribuida, estado: EstadoReserva.CANCELADO };

    const proximoPendente = criarReservaFake({
      id: 'proximo-uuid',
      idUsuario: 'proximo-usuario',
      estado: EstadoReserva.PENDENTE,
      posicao: 1,
    });
    const novoPrazo = new Date(Date.now() + 48 * 3600_000);
    const proxAtribuida = { ...proximoPendente, estado: EstadoReserva.ATRIBUIDO, posicao: 0, prazoRetirada: novoPrazo };

    (prisma.reserva.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(reservaAtribuida);
    (prisma.reserva.update as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce(reservaCancelada)
      .mockResolvedValueOnce(proxAtribuida);
    (prisma.reserva.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue(proximoPendente);

    // Act
    await cancelarReserva('reserva-uuid-1', reservaAtribuida.idUsuario);

    // Assert: o update do próximo deve ter sido chamado com prazoRetirada
    const chamadaUpdate = (prisma.reserva.update as ReturnType<typeof vi.fn>).mock.calls[1];
    expect(chamadaUpdate[0].data).toMatchObject({
      estado: EstadoReserva.ATRIBUIDO,
      posicao: 0,
      prazoRetirada: expect.any(Date),
    });
  });
});

// ════════════════════════════════════════════════════════════════════════════════
// Grupo 4 — cancelarReservasExpiradas
// ════════════════════════════════════════════════════════════════════════════════
describe('cancelarReservasExpiradas', () => {
  it('não deve fazer nada quando não há reservas expiradas', async () => {
    // Arrange: banco retorna lista vazia
    (prisma.reserva.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([]);

    // Act
    await cancelarReservasExpiradas();

    // Assert: nenhuma operação de update deve ter ocorrido
    expect(prisma.reserva.update).not.toHaveBeenCalled();
    expect(prisma.reserva.findUnique).not.toHaveBeenCalled();
  });

  it('deve cancelar todas as reservas expiradas encontradas', async () => {
    // Arrange: 2 reservas expiradas
    const expiradas = [
      { id: 'reserva-expirada-1' },
      { id: 'reserva-expirada-2' },
    ];
    (prisma.reserva.findMany as ReturnType<typeof vi.fn>).mockResolvedValue(expiradas);

    // Cada findUnique retorna a reserva correspondente, e cada update retorna cancelada
    (prisma.reserva.findUnique as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce(
        criarReservaFake({ id: 'reserva-expirada-1', estado: EstadoReserva.ATRIBUIDO, prazoRetirada: new Date('2024-01-01') })
      )
      .mockResolvedValueOnce(
        criarReservaFake({ id: 'reserva-expirada-2', estado: EstadoReserva.ATRIBUIDO, prazoRetirada: new Date('2024-01-01') })
      );

    (prisma.reserva.update as ReturnType<typeof vi.fn>)
      .mockResolvedValue(criarReservaFake({ estado: EstadoReserva.CANCELADO, posicao: 0 }));
    (prisma.reserva.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue(null);

    // Act
    await cancelarReservasExpiradas();

    // Assert: findUnique chamado 2x (uma por reserva expirada)
    expect(prisma.reserva.findUnique).toHaveBeenCalledTimes(2);
  });

  it('deve continuar processando as demais reservas mesmo se uma falhar', async () => {
    // Arrange: 2 reservas expiradas, mas a primeira causa erro
    const expiradas = [
      { id: 'reserva-com-erro' },
      { id: 'reserva-ok' },
    ];
    (prisma.reserva.findMany as ReturnType<typeof vi.fn>).mockResolvedValue(expiradas);

    (prisma.reserva.findUnique as ReturnType<typeof vi.fn>)
      .mockRejectedValueOnce(new Error('Erro simulado no banco'))
      .mockResolvedValueOnce(
        criarReservaFake({ id: 'reserva-ok', estado: EstadoReserva.ATRIBUIDO, prazoRetirada: new Date('2024-01-01') })
      );

    (prisma.reserva.update as ReturnType<typeof vi.fn>)
      .mockResolvedValue(criarReservaFake({ estado: EstadoReserva.CANCELADO, posicao: 0 }));
    (prisma.reserva.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue(null);

    // Act: não deve lançar exceção
    await expect(cancelarReservasExpiradas()).resolves.toBeUndefined();

    // Assert: tentou processar a segunda mesmo após falha da primeira
    expect(prisma.reserva.findUnique).toHaveBeenCalledTimes(2);
  });
});

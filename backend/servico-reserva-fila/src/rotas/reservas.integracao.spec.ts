/**
 * Testes de Integração — Endpoints HTTP do Serviço de Reserva e Fila
 *
 * Estratégia:
 * - Banco PostgreSQL real (banco_reservas_teste) — testa o comportamento
 *   real das transações Serializable e o mecanismo anti-concorrência.
 * - RabbitMQ totalmente mockado — nenhuma conexão de broker é aberta.
 * - Clientes HTTP (usuário/catálogo) mockados — isolamos o serviço.
 *
 * Pré-requisito: PostgreSQL disponível na URL_BANCO_DADOS do .env.test
 * com as migrations já aplicadas (ou aplicadas pelo beforeAll).
 */
import { describe, it, expect, vi, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import { execSync } from 'child_process';

// ─── Mocks de módulos externos ────────────────────────────────────────────────

// Mock do RabbitMQ — sem conexão real; publicadores registram chamadas apenas
vi.mock('../fila/rabbitmq', () => ({
  iniciarConexaoRabbitMQ: vi.fn().mockResolvedValue(undefined),
  fecharConexaoRabbitMQ: vi.fn().mockResolvedValue(undefined),
  obterCanal: vi.fn().mockReturnValue({
    publish: vi.fn().mockReturnValue(true),
    consume: vi.fn().mockResolvedValue(undefined),
    ack: vi.fn(),
    nack: vi.fn(),
  }),
  NOME_EXCHANGE: 'nosso-livro',
}));

// Mock do consumidor — não registra consumo real
vi.mock('../fila/consumidor', () => ({
  iniciarConsumidor: vi.fn().mockResolvedValue(undefined),
}));

// Mock dos publicadores de eventos
vi.mock('../fila/publicador', () => ({
  publicarReservaCriada: vi.fn(),
  publicarReservaAtribuida: vi.fn(),
}));

// Mock do barrel de exportações da fila (re-exporta os mocks acima)
vi.mock('../fila', () => ({
  iniciarConexaoRabbitMQ: vi.fn().mockResolvedValue(undefined),
  fecharConexaoRabbitMQ: vi.fn().mockResolvedValue(undefined),
  iniciarConsumidor: vi.fn().mockResolvedValue(undefined),
  publicarReservaCriada: vi.fn(),
  publicarReservaAtribuida: vi.fn(),
}));

// Mock dos clientes HTTP externos — simula serviços dependentes disponíveis
vi.mock('../clientes', () => ({
  buscarUsuarioPorId: vi.fn().mockResolvedValue({ id: 'usuario-mock', nome: 'Usuário Teste' }),
  buscarLivroPorId: vi.fn().mockResolvedValue({ id: 'livro-mock', titulo: 'Livro Teste' }),
  ErroRecursoNaoEncontrado: class extends Error { name = 'ErroRecursoNaoEncontrado'; },
  ErroTimeoutServico: class extends Error { name = 'ErroTimeoutServico'; },
  ErroServicoIndisponivel: class extends Error { name = 'ErroServicoIndisponivel'; },
}));

// ─── Importações após mocks ───────────────────────────────────────────────────
import app from '../app';
import prisma from '../banco/prisma';
import { buscarUsuarioPorId, buscarLivroPorId } from '../clientes';

// ─── Constantes de teste ──────────────────────────────────────────────────────
const SEGREDO_JWT = process.env.JWT_SEGREDO ?? 'segredo-de-testes-nao-usar-em-producao';

/** ID de livro fixo para os testes que não envolvem concorrência */
const ID_LIVRO_PADRAO = '00000000-0000-4000-a000-000000000001';

/** ID de livro exclusivo para o teste de concorrência (evita interferência) */
const ID_LIVRO_CONCORRENCIA = '00000000-0000-4000-a000-000000000050';

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Gera um token JWT válido para uso nos testes de endpoints protegidos.
 * Usa o mesmo segredo configurado no .env.test.
 */
function gerarTokenJWT(idUsuario: string, nome = 'Usuário de Teste'): string {
  return jwt.sign(
    { id: idUsuario, email: `${idUsuario}@teste.com`, nome },
    SEGREDO_JWT,
    { expiresIn: '1h' }
  );
}

/**
 * Gera um UUID v4 simples para uso nos testes.
 * Garante IDs únicos por chamada.
 */
function gerarUUID(): string {
  return crypto.randomUUID();
}

// ─── Setup e Teardown ─────────────────────────────────────────────────────────

beforeAll(async () => {
  // Aplica as migrations no banco de testes antes de rodar qualquer teste
  // Equivale a `npx prisma migrate deploy` apontando para o banco de testes
  try {
    execSync('npx prisma migrate deploy', {
      cwd: process.cwd(),
      env: { ...process.env, DATABASE_URL: process.env.URL_BANCO_DADOS },
      stdio: 'pipe',
    });
  } catch (erro) {
    console.warn('[Setup] Falha ao aplicar migrations — banco pode já estar atualizado:', erro);
  }
}, 60_000);

afterAll(async () => {
  // Desconecta o Prisma após todos os testes da suíte
  await prisma.$disconnect();
});

beforeEach(async () => {
  // Limpa a tabela de reservas antes de cada teste — garante isolamento total
  await prisma.reserva.deleteMany();
  // Reseta as chamadas registradas nos mocks
  vi.clearAllMocks();
});

// ════════════════════════════════════════════════════════════════════════════════
// POST /api/reservas — Criação de reserva / ingresso na fila
// ════════════════════════════════════════════════════════════════════════════════
describe('POST /api/reservas', () => {
  it('deve retornar 201 e criar reserva com posição 1 (fila vazia)', async () => {
    const idUsuario = gerarUUID();
    const token = gerarTokenJWT(idUsuario);

    (buscarUsuarioPorId as ReturnType<typeof vi.fn>).mockResolvedValue({ id: idUsuario, nome: 'Usuário' });
    (buscarLivroPorId as ReturnType<typeof vi.fn>).mockResolvedValue({ id: ID_LIVRO_PADRAO, titulo: 'Livro' });

    const resposta = await request(app)
      .post('/api/reservas')
      .set('Authorization', `Bearer ${token}`)
      .send({ idLivro: ID_LIVRO_PADRAO });

    expect(resposta.status).toBe(201);
    expect(resposta.body.dados.posicao).toBe(1);
    expect(resposta.body.dados.estado).toBe('PENDENTE');
    expect(resposta.body.dados.idUsuario).toBe(idUsuario);
    expect(resposta.body.dados.idLivro).toBe(ID_LIVRO_PADRAO);
  });

  it('deve atribuir posições corretas para múltiplos usuários sequenciais', async () => {
    const token1 = gerarTokenJWT(gerarUUID());
    const token2 = gerarTokenJWT(gerarUUID());

    (buscarUsuarioPorId as ReturnType<typeof vi.fn>).mockResolvedValue({ id: 'qualquer', nome: 'Usuário' });
    (buscarLivroPorId as ReturnType<typeof vi.fn>).mockResolvedValue({ id: ID_LIVRO_PADRAO });

    const resp1 = await request(app)
      .post('/api/reservas')
      .set('Authorization', `Bearer ${token1}`)
      .send({ idLivro: ID_LIVRO_PADRAO });

    const resp2 = await request(app)
      .post('/api/reservas')
      .set('Authorization', `Bearer ${token2}`)
      .send({ idLivro: ID_LIVRO_PADRAO });

    expect(resp1.status).toBe(201);
    expect(resp2.status).toBe(201);
    expect(resp1.body.dados.posicao).toBe(1);
    expect(resp2.body.dados.posicao).toBe(2);
  });

  it('deve retornar 409 ao tentar criar reserva duplicada para o mesmo livro', async () => {
    const idUsuario = gerarUUID();
    const token = gerarTokenJWT(idUsuario);

    (buscarUsuarioPorId as ReturnType<typeof vi.fn>).mockResolvedValue({ id: idUsuario });
    (buscarLivroPorId as ReturnType<typeof vi.fn>).mockResolvedValue({ id: ID_LIVRO_PADRAO });

    // Primeira reserva — deve funcionar
    await request(app)
      .post('/api/reservas')
      .set('Authorization', `Bearer ${token}`)
      .send({ idLivro: ID_LIVRO_PADRAO });

    // Segunda reserva para o mesmo livro — deve falhar
    const resposta = await request(app)
      .post('/api/reservas')
      .set('Authorization', `Bearer ${token}`)
      .send({ idLivro: ID_LIVRO_PADRAO });

    expect(resposta.status).toBe(409);
    expect(resposta.body).toHaveProperty('erro');
  });

  it('deve retornar 401 quando nenhum token é fornecido', async () => {
    const resposta = await request(app)
      .post('/api/reservas')
      .send({ idLivro: ID_LIVRO_PADRAO });

    expect(resposta.status).toBe(401);
  });

  it('deve retornar 400 quando idLivro não é um UUID válido', async () => {
    const token = gerarTokenJWT(gerarUUID());

    const resposta = await request(app)
      .post('/api/reservas')
      .set('Authorization', `Bearer ${token}`)
      .send({ idLivro: 'nao-e-uuid' });

    expect(resposta.status).toBe(400);
  });

  it('deve retornar 400 quando idLivro está ausente no corpo', async () => {
    const token = gerarTokenJWT(gerarUUID());

    const resposta = await request(app)
      .post('/api/reservas')
      .set('Authorization', `Bearer ${token}`)
      .send({});

    expect(resposta.status).toBe(400);
  });
});

// ════════════════════════════════════════════════════════════════════════════════
// DELETE /api/reservas/:id — Cancelamento de reserva
// ════════════════════════════════════════════════════════════════════════════════
describe('DELETE /api/reservas/:id', () => {
  it('deve retornar 200 ao cancelar reserva própria', async () => {
    const idUsuario = gerarUUID();
    const token = gerarTokenJWT(idUsuario);

    (buscarUsuarioPorId as ReturnType<typeof vi.fn>).mockResolvedValue({ id: idUsuario });
    (buscarLivroPorId as ReturnType<typeof vi.fn>).mockResolvedValue({ id: ID_LIVRO_PADRAO });

    // Cria a reserva
    const criacao = await request(app)
      .post('/api/reservas')
      .set('Authorization', `Bearer ${token}`)
      .send({ idLivro: ID_LIVRO_PADRAO });

    const idReserva = criacao.body.dados.id;

    // Cancela a reserva
    const resposta = await request(app)
      .delete(`/api/reservas/${idReserva}`)
      .set('Authorization', `Bearer ${token}`);

    expect(resposta.status).toBe(200);
    expect(resposta.body.dados.estado).toBe('CANCELADO');
  });

  it('deve retornar 403 ao tentar cancelar reserva de outro usuário', async () => {
    const idDono = gerarUUID();
    const idIntruso = gerarUUID();
    const tokenDono = gerarTokenJWT(idDono);
    const tokenIntruso = gerarTokenJWT(idIntruso);

    (buscarUsuarioPorId as ReturnType<typeof vi.fn>).mockResolvedValue({ id: idDono });
    (buscarLivroPorId as ReturnType<typeof vi.fn>).mockResolvedValue({ id: ID_LIVRO_PADRAO });

    // Cria reserva com o dono
    const criacao = await request(app)
      .post('/api/reservas')
      .set('Authorization', `Bearer ${tokenDono}`)
      .send({ idLivro: ID_LIVRO_PADRAO });

    const idReserva = criacao.body.dados.id;

    // Intruso tenta cancelar
    const resposta = await request(app)
      .delete(`/api/reservas/${idReserva}`)
      .set('Authorization', `Bearer ${tokenIntruso}`);

    expect(resposta.status).toBe(403);
  });

  it('deve retornar 404 para ID de reserva inexistente', async () => {
    const token = gerarTokenJWT(gerarUUID());
    const idFantasma = gerarUUID();

    const resposta = await request(app)
      .delete(`/api/reservas/${idFantasma}`)
      .set('Authorization', `Bearer ${token}`);

    expect(resposta.status).toBe(404);
  });

  it('deve retornar 401 quando nenhum token é fornecido', async () => {
    const resposta = await request(app)
      .delete(`/api/reservas/${gerarUUID()}`);

    expect(resposta.status).toBe(401);
  });

  it('deve retornar 400 para ID de formato inválido (não-UUID)', async () => {
    const token = gerarTokenJWT(gerarUUID());

    const resposta = await request(app)
      .delete('/api/reservas/nao-e-um-uuid')
      .set('Authorization', `Bearer ${token}`);

    expect(resposta.status).toBe(400);
  });

  it('deve reordenar a fila ao cancelar reserva intermediária', async () => {
    const [id1, id2, id3] = [gerarUUID(), gerarUUID(), gerarUUID()];

    (buscarUsuarioPorId as ReturnType<typeof vi.fn>).mockResolvedValue({ id: 'qualquer' });
    (buscarLivroPorId as ReturnType<typeof vi.fn>).mockResolvedValue({ id: ID_LIVRO_PADRAO });

    // Cria 3 reservas em sequência
    await request(app).post('/api/reservas').set('Authorization', `Bearer ${gerarTokenJWT(id1)}`).send({ idLivro: ID_LIVRO_PADRAO });
    const resp2 = await request(app).post('/api/reservas').set('Authorization', `Bearer ${gerarTokenJWT(id2)}`).send({ idLivro: ID_LIVRO_PADRAO });
    await request(app).post('/api/reservas').set('Authorization', `Bearer ${gerarTokenJWT(id3)}`).send({ idLivro: ID_LIVRO_PADRAO });

    const idReserva2 = resp2.body.dados.id;

    // Cancela a reserva do meio (posição 2)
    await request(app)
      .delete(`/api/reservas/${idReserva2}`)
      .set('Authorization', `Bearer ${gerarTokenJWT(id2)}`);

    // Verifica que o usuário 3 agora está na posição 2
    const filaFinal = await prisma.reserva.findMany({
      where: { idLivro: ID_LIVRO_PADRAO, estado: 'PENDENTE' },
      orderBy: { posicao: 'asc' },
    });

    expect(filaFinal).toHaveLength(2);
    expect(filaFinal[0].posicao).toBe(1);
    expect(filaFinal[1].posicao).toBe(2);
    expect(filaFinal[0].idUsuario).toBe(id1);
    expect(filaFinal[1].idUsuario).toBe(id3);
  });
});

// ════════════════════════════════════════════════════════════════════════════════
// GET /api/reservas/me — Reservas do usuário autenticado
// ════════════════════════════════════════════════════════════════════════════════
describe('GET /api/reservas/me', () => {
  it('deve retornar lista vazia quando usuário não tem reservas', async () => {
    const token = gerarTokenJWT(gerarUUID());

    const resposta = await request(app)
      .get('/api/reservas/me')
      .set('Authorization', `Bearer ${token}`);

    expect(resposta.status).toBe(200);
    expect(resposta.body.total).toBe(0);
    expect(resposta.body.dados).toEqual([]);
  });

  it('deve retornar apenas as reservas do usuário autenticado (e não de outros)', async () => {
    const idMeu = gerarUUID();
    const idOutro = gerarUUID();
    const idLivro2 = '00000000-0000-4000-a000-000000000002';
    const idLivro3 = '00000000-0000-4000-a000-000000000003';

    (buscarUsuarioPorId as ReturnType<typeof vi.fn>).mockResolvedValue({ id: 'qualquer' });
    (buscarLivroPorId as ReturnType<typeof vi.fn>).mockResolvedValue({ id: 'qualquer' });

    // Cria reserva do meu usuário
    await request(app)
      .post('/api/reservas')
      .set('Authorization', `Bearer ${gerarTokenJWT(idMeu)}`)
      .send({ idLivro: idLivro2 });

    // Cria reserva de outro usuário (não deve aparecer)
    await request(app)
      .post('/api/reservas')
      .set('Authorization', `Bearer ${gerarTokenJWT(idOutro)}`)
      .send({ idLivro: idLivro3 });

    // Consulta as minhas reservas
    const resposta = await request(app)
      .get('/api/reservas/me')
      .set('Authorization', `Bearer ${gerarTokenJWT(idMeu)}`);

    expect(resposta.status).toBe(200);
    expect(resposta.body.total).toBe(1);
    expect(resposta.body.dados[0].idUsuario).toBe(idMeu);
  });

  it('deve retornar 401 sem token', async () => {
    const resposta = await request(app).get('/api/reservas/me');
    expect(resposta.status).toBe(401);
  });
});

// ════════════════════════════════════════════════════════════════════════════════
// GET /api/reservas/livro/:idLivro — Consulta pública da fila
// ════════════════════════════════════════════════════════════════════════════════
describe('GET /api/reservas/livro/:idLivro', () => {
  it('deve retornar fila vazia para livro sem reservas', async () => {
    const resposta = await request(app)
      .get(`/api/reservas/livro/${ID_LIVRO_PADRAO}`);

    expect(resposta.status).toBe(200);
    expect(resposta.body.totalNaFila).toBe(0);
    expect(resposta.body.livroAtribuidoAguardandoRetirada).toBe(false);
  });

  it('deve retornar tamanho correto da fila', async () => {
    (buscarUsuarioPorId as ReturnType<typeof vi.fn>).mockResolvedValue({ id: 'qualquer' });
    (buscarLivroPorId as ReturnType<typeof vi.fn>).mockResolvedValue({ id: ID_LIVRO_PADRAO });

    // Insere 3 usuários na fila
    for (let i = 0; i < 3; i++) {
      await request(app)
        .post('/api/reservas')
        .set('Authorization', `Bearer ${gerarTokenJWT(gerarUUID())}`)
        .send({ idLivro: ID_LIVRO_PADRAO });
    }

    const resposta = await request(app)
      .get(`/api/reservas/livro/${ID_LIVRO_PADRAO}`);

    expect(resposta.status).toBe(200);
    expect(resposta.body.totalNaFila).toBe(3);
    expect(resposta.body.idLivro).toBe(ID_LIVRO_PADRAO);
  });

  it('deve retornar 400 para idLivro com formato inválido', async () => {
    const resposta = await request(app)
      .get('/api/reservas/livro/nao-e-uuid');

    expect(resposta.status).toBe(400);
  });

  it('deve ser acessível sem autenticação (rota pública)', async () => {
    // Não passa token — deve funcionar normalmente
    const resposta = await request(app)
      .get(`/api/reservas/livro/${ID_LIVRO_PADRAO}`);

    expect(resposta.status).toBe(200);
  });
});

// ════════════════════════════════════════════════════════════════════════════════
// Teste de Concorrência — 50 reservas simultâneas para o mesmo livro
// ════════════════════════════════════════════════════════════════════════════════
describe('Concorrência — 50 reservas simultâneas para o mesmo livro', () => {
  it(
    'deve atribuir posições únicas e sequenciais de 1 a 50 sem duplicatas',
    async () => {
      const TOTAL_USUARIOS = 50;

      // Configura mocks para aceitar qualquer usuário/livro
      (buscarUsuarioPorId as ReturnType<typeof vi.fn>).mockResolvedValue({ id: 'qualquer', nome: 'Usuário' });
      (buscarLivroPorId as ReturnType<typeof vi.fn>).mockResolvedValue({ id: ID_LIVRO_CONCORRENCIA });

      // Gera 50 tokens JWT distintos (um por "usuário" simulado)
      const tokens = Array.from({ length: TOTAL_USUARIOS }, () =>
        gerarTokenJWT(gerarUUID())
      );

      // Dispara todas as 50 requisições SIMULTANEAMENTE (sem await sequencial)
      const promessas = tokens.map((token) =>
        request(app)
          .post('/api/reservas')
          .set('Authorization', `Bearer ${token}`)
          .send({ idLivro: ID_LIVRO_CONCORRENCIA })
      );

      const respostas = await Promise.all(promessas);

      // ─── Verifica que todas as requisições foram aceitas com sucesso ───
      const falhas = respostas.filter((r) => r.status !== 201);
      expect(falhas).toHaveLength(0);

      // ─── Extrai e ordena as posições atribuídas ────────────────────────
      const posicoes = respostas
        .map((r) => r.body.dados.posicao as number)
        .sort((a, b) => a - b);

      // ─── Verifica que posições vão de 1 a 50 sem gaps ────────────────
      const posicoesEsperadas = Array.from({ length: TOTAL_USUARIOS }, (_, i) => i + 1);
      expect(posicoes).toEqual(posicoesEsperadas);

      // ─── Garante que não há posições duplicadas ────────────────────────
      const posicoesUnicas = new Set(posicoes);
      expect(posicoesUnicas.size).toBe(TOTAL_USUARIOS);

      // ─── Verifica no banco que os dados estão corretos ────────────────
      const reservasNoBanco = await prisma.reserva.findMany({
        where: { idLivro: ID_LIVRO_CONCORRENCIA, estado: 'PENDENTE' },
        orderBy: { posicao: 'asc' },
      });

      expect(reservasNoBanco).toHaveLength(TOTAL_USUARIOS);

      // Cada posição deve ser única e sequencial no banco
      reservasNoBanco.forEach((reserva, indice) => {
        expect(reserva.posicao).toBe(indice + 1);
      });
    },
    30_000 // timeout de 30s para o teste de concorrência
  );
});

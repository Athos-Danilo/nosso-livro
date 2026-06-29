import uuid
import json
import pytest
from unittest.mock import patch
from sqlalchemy.future import select

from app.modelos.historico import HistoricoLeitura
from app.modelos.popularidade import PopularidadeLivro
from app.servicos.recomendador import ServicoRecomendacao
from app.trabalhadores.consumidor_eventos import processar_mensagem

# Mock da mensagem do RabbitMQ (aio-pika.IncomingMessage)
class MensagemRabbitMQMockada:
    def __init__(self, corpo: dict, chave_roteamento: str):
        self.body = json.dumps(corpo).encode("utf-8")
        self.routing_key = chave_roteamento

    def process(self):
        return self

    async def __aenter__(self):
        return self

    async def __aexit__(self, exc_type, exc_val, exc_tb):
        pass

# Mock do provedor de sessão para o worker
class ProvedorSessaoTeste:
    def __init__(self, sessao):
        self.sessao = sessao

    async def __aenter__(self):
        return self.sessao

    async def __aexit__(self, exc_type, exc_val, exc_tb):
        pass

    def __call__(self):
        return self


@pytest.mark.asyncio
async def test_motor_recomendacao_heuristica(sessao_banco):
    """
    Testa se o motor de recomendação escolhe livros das categorias preferidas do usuário,
    ordena pela popularidade e exclui os que ele já consumiu.
    """
    id_usuario = uuid.uuid4()
    
    # 1. Criar livros fictícios na tabela de popularidade
    livro_fantasia_popular = PopularidadeLivro(
        id_livro=uuid.uuid4(), titulo="Fantasia Popular", categoria="Fantasia", total_emprestimos=50
    )
    livro_fantasia_comum = PopularidadeLivro(
        id_livro=uuid.uuid4(), titulo="Fantasia Comum", categoria="Fantasia", total_emprestimos=10
    )
    livro_ficcao_popular = PopularidadeLivro(
        id_livro=uuid.uuid4(), titulo="Ficção Popular", categoria="Ficção", total_emprestimos=100
    )
    livro_biografia = PopularidadeLivro(
        id_livro=uuid.uuid4(), titulo="Biografia", categoria="Biografia", total_emprestimos=5
    )
    
    sessao_banco.add_all([
        livro_fantasia_popular,
        livro_fantasia_comum,
        livro_ficcao_popular,
        livro_biografia
    ])
    
    # 2. Criar histórico do usuário. Ele já consumiu:
    # - 2 livros de "Fantasia" (um deles é o livro_fantasia_popular, que deve ser excluído)
    # - 1 livro de "Ficção" (um livro avulso de outra categoria para não excluir o ficcao_popular)
    historico_fantasia_lido = HistoricoLeitura(
        id_usuario=id_usuario, id_livro=livro_fantasia_popular.id_livro, categoria="Fantasia", estado="CONCLUIDO"
    )
    historico_fantasia_lendo = HistoricoLeitura(
        id_usuario=id_usuario, id_livro=uuid.uuid4(), categoria="Fantasia", estado="LENDO"
    )
    historico_ficcao = HistoricoLeitura(
        id_usuario=id_usuario, id_livro=uuid.uuid4(), categoria="Ficção", estado="CONCLUIDO"
    )
    
    sessao_banco.add_all([
        historico_fantasia_lido,
        historico_fantasia_lendo,
        historico_ficcao
    ])
    await sessao_banco.commit()
    
    # Executar a recomendação
    recomendador = ServicoRecomendacao()
    recomendacoes = await recomendador.gerar_recomendacoes_personalizadas(id_usuario, sessao_banco, limite=5)
    
    # Validações:
    # 1. livro_fantasia_popular deve ser excluído pois o usuário já o leu.
    assert livro_fantasia_popular.id_livro not in recomendacoes
    
    # 2. livro_ficcao_popular deve estar presente (categoria preferida e popular)
    assert livro_ficcao_popular.id_livro in recomendacoes
    
    # 3. livro_fantasia_comum deve estar presente (categoria preferida)
    assert livro_fantasia_comum.id_livro in recomendacoes
    
    # 4. A recomendação de livro_ficcao_popular deve vir antes de livro_fantasia_comum devido aos empréstimos (100 > 10)
    posicao_ficcao = recomendacoes.index(livro_ficcao_popular.id_livro)
    posicao_fantasia = recomendacoes.index(livro_fantasia_comum.id_livro)
    assert posicao_ficcao < posicao_fantasia

    # 5. Teste de Fallback Global para novo usuário
    id_novo_usuario = uuid.uuid4()
    recomendacoes_fallback = await recomendador.gerar_recomendacoes_personalizadas(id_novo_usuario, sessao_banco, limite=5)
    
    # Deve retornar os mais populares globais, independente da categoria
    assert recomendacoes_fallback[0] == livro_ficcao_popular.id_livro
    assert recomendacoes_fallback[1] == livro_fantasia_popular.id_livro
    assert recomendacoes_fallback[2] == livro_fantasia_comum.id_livro


@pytest.mark.asyncio
async def test_consumidor_eventos_integracao(sessao_banco):
    """
    Testa se o processamento dos eventos pelo worker de mensageria altera
    corretamente as tabelas HistoricoLeitura e PopularidadeLivro.
    """
    id_usuario = uuid.uuid4()
    id_livro = uuid.uuid4()
    
    # Payload do evento emprestimo.criado
    dados_criacao = {
        "id_usuario": str(id_usuario),
        "id_livro": str(id_livro),
        "categoria": "Mistério",
        "titulo": "O Mistério do Banco de Dados"
    }
    
    mensagem_criacao = MensagemRabbitMQMockada(dados_criacao, "emprestimo.criado")
    
    provedor_mock = ProvedorSessaoTeste(sessao_banco)
    with patch("app.trabalhadores.consumidor_eventos.sessao_local", new=provedor_mock):
        await processar_mensagem(mensagem_criacao)
        
    # Verificar se o histórico foi gravado como LENDO
    stmt_historico = select(HistoricoLeitura).where(
        HistoricoLeitura.id_usuario == id_usuario,
        HistoricoLeitura.id_livro == id_livro
    )
    resultado_historico = await sessao_banco.execute(stmt_historico)
    historico = resultado_historico.scalars().first()
    
    assert historico is not None
    assert historico.estado == "LENDO"
    assert historico.categoria == "Mistério"
    
    # Verificar se a popularidade foi registrada/incrementada
    stmt_popularidade = select(PopularidadeLivro).where(PopularidadeLivro.id_livro == id_livro)
    resultado_popularidade = await sessao_banco.execute(stmt_popularidade)
    popularidade = resultado_popularidade.scalars().first()
    
    assert popularidade is not None
    assert popularidade.total_emprestimos == 1
    assert popularidade.titulo == "O Mistério do Banco de Dados"
    
    # Agora envia o evento de devolução
    dados_devolucao = {
        "id_usuario": str(id_usuario),
        "id_livro": str(id_livro)
    }
    mensagem_devolucao = MensagemRabbitMQMockada(dados_devolucao, "emprestimo.devolvido")
    
    with patch("app.trabalhadores.consumidor_eventos.sessao_local", new=provedor_mock):
        await processar_mensagem(mensagem_devolucao)
        
    # Recarrega o histórico e valida se mudou para CONCLUIDO
    await sessao_banco.refresh(historico)
    assert historico.estado == "CONCLUIDO"
    assert historico.data_fim is not None


@pytest.mark.asyncio
async def test_endpoints_seguranca(cliente_http):
    """
    Testa se as rotas protegidas retornam erro 401 (Não Autorizado) quando
    não é fornecido um token JWT válido.
    """
    id_usuario = uuid.uuid4()
    
    # Rota 1: Recomendações personalizadas por usuário (Protegida)
    resposta_rec = await cliente_http.get(f"/api/recomendacoes/usuario/{id_usuario}")
    assert resposta_rec.status_code == 401
    assert resposta_rec.json()["detail"] == "Cabeçalho de autorização ausente."
    
    # Rota 2: Histórico de leitura por usuário (Protegida)
    resposta_hist = await cliente_http.get(f"/api/recomendacoes/historico/{id_usuario}")
    assert resposta_hist.status_code == 401
    assert resposta_hist.json()["detail"] == "Cabeçalho de autorização ausente."
    
    # Rota 3: Populares (Pública)
    resposta_pop = await cliente_http.get("/api/recomendacoes/populares")
    assert resposta_pop.status_code == 200

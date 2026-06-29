import logging
from uuid import UUID
from typing import List
from fastapi import APIRouter, Depends, status, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.core.banco import obter_banco
from app.core.seguranca import obter_usuario_atual
from app.modelos.historico import HistoricoLeitura
from app.modelos.popularidade import PopularidadeLivro
from app.servicos.recomendador import ServicoRecomendacao
from app.esquemas import RespostaPopularidadeLivro, RespostaHistoricoLeitura

# Configuração do registrador de logs
registrador = logging.getLogger("recomendacoes_api")

# Criação do roteador com prefixo e tags apropriadas
roteador = APIRouter(prefix="/api/recomendacoes", tags=["Recomendações"])

# Instanciação do serviço de recomendação
servico_recomendador = ServicoRecomendacao()

@roteador.get(
    "/usuario/{id_usuario}",
    response_model=List[UUID],
    status_code=status.HTTP_200_OK,
    summary="Obter recomendações personalizadas para um usuário específico."
)
async def obter_recomendacoes_usuario(
    id_usuario: UUID,
    usuario_sessao: dict = Depends(obter_usuario_atual),
    db: AsyncSession = Depends(obter_banco)
) -> List[UUID]:
    """
    Retorna uma lista de IDs de livros recomendados de forma personalizada para o usuário.
    Requer autenticação JWT do usuário.
    """
    registrador.info(f"Requisição de recomendações para o usuário {id_usuario} feita por {usuario_sessao.get('id')}")
    recomendacoes = await servico_recomendador.gerar_recomendacoes_personalizadas(
        id_usuario=id_usuario,
        sessao=db
    )
    return recomendacoes


@roteador.get(
    "/populares",
    response_model=List[RespostaPopularidadeLivro],
    status_code=status.HTTP_200_OK,
    summary="Obter livros populares globalmente."
)
async def obter_livros_populares(
    limite: int = 10,
    db: AsyncSession = Depends(obter_banco)
) -> List[RespostaPopularidadeLivro]:
    """
    Retorna a lista dos livros mais emprestados no sistema geral.
    Rota pública.
    """
    registrador.info("Requisição pública de livros populares recebida.")
    stmt = select(PopularidadeLivro).order_by(PopularidadeLivro.total_emprestimos.desc()).limit(limite)
    resultado = await db.execute(stmt)
    populares = resultado.scalars().all()
    return populares


@roteador.get(
    "/historico/{id_usuario}",
    response_model=List[RespostaHistoricoLeitura],
    status_code=status.HTTP_200_OK,
    summary="Obter histórico de leitura do usuário."
)
async def obter_historico_usuario(
    id_usuario: UUID,
    usuario_sessao: dict = Depends(obter_usuario_atual),
    db: AsyncSession = Depends(obter_banco)
) -> List[RespostaHistoricoLeitura]:
    """
    Retorna o histórico completo das leituras registradas para um usuário.
    Requer autenticação JWT do usuário.
    """
    registrador.info(f"Requisição de histórico de leitura do usuário {id_usuario} feita por {usuario_sessao.get('id')}")
    stmt = (
        select(HistoricoLeitura)
        .where(HistoricoLeitura.id_usuario == id_usuario)
        .order_by(HistoricoLeitura.data_inicio.desc())
    )
    resultado = await db.execute(stmt)
    historico = resultado.scalars().all()
    return historico

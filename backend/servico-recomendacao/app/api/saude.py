import logging
from fastapi import APIRouter, Depends, status, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.sql import text

from app.core.banco import obter_banco

# Configuração do registrador de logs
registrador = logging.getLogger("saude_api")

# Criação do roteador de saúde
roteador = APIRouter(tags=["Saúde"])

@roteador.get(
    "/saude",
    status_code=status.HTTP_200_OK,
    summary="Verifica a integridade básica do serviço (Liveness)."
)
async def verificar_saude():
    """Retorna o status simples de atividade do microsserviço."""
    return {"status": "saudavel"}

@roteador.get(
    "/pronto",
    status_code=status.HTTP_200_OK,
    summary="Verifica se o serviço está pronto para receber tráfego (Readiness)."
)
async def verificar_prontidao(db: AsyncSession = Depends(obter_banco)):
    """
    Verifica a conectividade assíncrona com o banco de dados executando uma consulta rápida.
    Retorna erro 503 Service Unavailable se a comunicação falhar.
    """
    try:
        # Executa uma consulta leve para atestar a comunicação
        await db.execute(text("SELECT 1"))
        return {"status": "pronto"}
    except Exception as erro:
        registrador.error(f"Falha de prontidão do serviço - Erro de banco de dados: {str(erro)}")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Serviço indisponível: erro ao conectar com o banco de dados."
        )

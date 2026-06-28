from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from app.core.banco import obter_banco

roteador = APIRouter()

@roteador.get("/saude", tags=["Integridade"])
async def verificar_liveness():
    """Endpoint de Liveness Probe - indica que a aplicação está em execução."""
    return {"status": "saudavel"}

@roteador.get("/pronto", tags=["Integridade"])
async def verificar_readiness(db: AsyncSession = Depends(obter_banco)):
    """Endpoint de Readiness Probe - verifica se a conexão com o banco está ativa."""
    try:
        # Executa uma instrução SQL simples para atestar a saúde da conexão
        await db.execute(select(1))
        return {"status": "pronto", "banco_dados": "conectado"}
    except Exception as erro:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Banco de dados indisponível: {str(erro)}"
        )

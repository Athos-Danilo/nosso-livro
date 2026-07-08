from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.banco import obter_banco
from app.esquemas.biblioteca import CriarBiblioteca, RespostaBiblioteca
from app.crud import biblioteca as crud_biblioteca
from app.crud import livro as crud_livro
from app.core.seguranca import exigir_administrador

roteador = APIRouter()

@roteador.post("/", response_model=RespostaBiblioteca, status_code=status.HTTP_201_CREATED)
async def cadastrar_biblioteca(
    dados: CriarBiblioteca,
    db: AsyncSession = Depends(obter_banco),
    usuario: dict = Depends(exigir_administrador)
):
    """Cadastra uma nova biblioteca física no sistema."""
    return await crud_biblioteca.criar_biblioteca(db=db, dados=dados)

@roteador.get("/estatisticas")
async def obter_estatisticas(db: AsyncSession = Depends(obter_banco)):
    """Retorna estatísticas do catálogo de bibliotecas para o dashboard."""
    total_livros = await crud_livro.contar_livros_disponiveis(db)
    return {"total": total_livros}

@roteador.get("/", response_model=list[RespostaBiblioteca])
async def listar_todas_bibliotecas(
    limite: int = 100,
    pulo: int = 0,
    db: AsyncSession = Depends(obter_banco)
):
    """Lista todas as bibliotecas físicas ativas cadastradas."""
    return await crud_biblioteca.listar_bibliotecas_ativas(db=db, limite=limite, pulo=pulo)

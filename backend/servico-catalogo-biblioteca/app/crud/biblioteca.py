from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from app.modelos.biblioteca import Biblioteca
from app.esquemas.biblioteca import CriarBiblioteca

async def criar_biblioteca(db: AsyncSession, dados: CriarBiblioteca) -> Biblioteca:
    """Cria uma nova biblioteca no banco de dados."""
    nova_biblioteca = Biblioteca(
        nome=dados.nome,
        localizacao=dados.localizacao
    )
    db.add(nova_biblioteca)
    await db.commit()
    await db.refresh(nova_biblioteca)
    return nova_biblioteca

async def listar_bibliotecas_ativas(db: AsyncSession, limite: int = 100, pulo: int = 0) -> list[Biblioteca]:
    """Lista todas as bibliotecas que estão ativas, com suporte a paginação."""
    resultado = await db.execute(
        select(Biblioteca)
        .where(Biblioteca.ativo == True)
        .offset(pulo)
        .limit(limite)
    )
    return list(resultado.scalars().all())

async def buscar_biblioteca_por_id(db: AsyncSession, id_biblioteca: int) -> Biblioteca | None:
    """Busca uma biblioteca pelo ID."""
    resultado = await db.execute(
        select(Biblioteca).where(Biblioteca.id == id_biblioteca)
    )
    return resultado.scalars().first()

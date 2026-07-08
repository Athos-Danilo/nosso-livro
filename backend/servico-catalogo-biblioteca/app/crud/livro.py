from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import joinedload
from app.modelos.livro import Livro
from app.modelos.biblioteca import Biblioteca
from app.esquemas.livro import CriarLivro

async def criar_livro(db: AsyncSession, dados: CriarLivro) -> Livro:
    """Cria um novo livro no banco, após validar a existência da biblioteca vinculada."""
    # Validação de existência da biblioteca
    query_biblioteca = await db.execute(
        select(Biblioteca).where(Biblioteca.id == dados.id_biblioteca)
    )
    biblioteca_existente = query_biblioteca.scalars().first()
    if not biblioteca_existente:
        raise ValueError("A biblioteca associada (id_biblioteca) não existe.")

    novo_livro = Livro(
        titulo=dados.titulo,
        autor=dados.autor,
        isbn=dados.isbn,
        categoria=dados.categoria,
        ano_publicacao=dados.ano_publicacao,
        capa_url=dados.capa_url,
        quantidade_total=dados.quantidade_total,
        quantidade_disponivel=dados.quantidade_disponivel,
        id_biblioteca=dados.id_biblioteca
    )
    db.add(novo_livro)
    await db.commit()
    return await buscar_livro_por_id(db, novo_livro.id)

async def buscar_livro_por_id(db: AsyncSession, id_livro: int) -> Livro | None:
    """Busca um livro por ID, carregando os dados da biblioteca vinculada via JOIN."""
    resultado = await db.execute(
        select(Livro)
        .options(joinedload(Livro.biblioteca))
        .where(Livro.id == id_livro)
    )
    return resultado.scalars().first()

async def listar_livros(
    db: AsyncSession,
    titulo: str | None = None,
    autor: str | None = None,
    categoria: str | None = None,
    id_biblioteca: int | None = None,
    limite: int = 100,
    pulo: int = 0
) -> list[Livro]:
    """Lista todos os livros ativos com suporte a filtros dinâmicos e paginação."""
    instrucao = select(Livro).options(joinedload(Livro.biblioteca)).where(Livro.ativo == True).order_by(Livro.id.desc())
    
    if titulo:
        instrucao = instrucao.where(Livro.titulo.ilike(f"%{titulo}%"))
    if autor:
        instrucao = instrucao.where(Livro.autor.ilike(f"%{autor}%"))
    if categoria:
        instrucao = instrucao.where(Livro.categoria.ilike(f"%{categoria}%"))
    if id_biblioteca:
        instrucao = instrucao.where(Livro.id_biblioteca == id_biblioteca)
        
    resultado = await db.execute(instrucao.offset(pulo).limit(limite))
    return list(resultado.scalars().all())

async def atualizar_estoque_livro(db: AsyncSession, id_livro: int, delta_quantidade: int) -> Livro | None:
    """Atualiza a quantidade disponível no estoque (lógica de incremento/decremento)."""
    resultado = await db.execute(
        select(Livro).where(Livro.id == id_livro)
    )
    livro = resultado.scalars().first()
    if not livro:
        return None
        
    novo_estoque = livro.quantidade_disponivel + delta_quantidade
    if novo_estoque < 0:
        raise ValueError("A quantidade disponível de livros no estoque não pode ser menor que zero.")
    if novo_estoque > livro.quantidade_total:
        raise ValueError("A quantidade disponível de livros no estoque não pode ser maior que a quantidade total.")
        
    livro.quantidade_disponivel = novo_estoque
    await db.commit()
    await db.refresh(livro)
    return livro

async def contar_livros_disponiveis(db: AsyncSession) -> int:
    """Retorna a soma de quantidade_disponivel de todos os livros ativos."""
    from sqlalchemy import func
    resultado = await db.execute(
        select(func.sum(Livro.quantidade_disponivel)).where(Livro.ativo == True)
    )
    total = resultado.scalar()
    return total or 0

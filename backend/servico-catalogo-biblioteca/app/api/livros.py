from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.banco import obter_banco
from app.esquemas.livro import CriarLivro, AtualizarLivro, RespostaLivro
from app.crud import livro as crud_livro
from app.modelos.livro import Livro
from app.core.seguranca import exigir_administrador

roteador = APIRouter()

# Dicionário global para cache de busca de livros em memória
CACHE_LIVROS = {}

@roteador.post("/", response_model=RespostaLivro, status_code=status.HTTP_201_CREATED)
async def cadastrar_livro(
    dados: CriarLivro,
    db: AsyncSession = Depends(obter_banco),
    usuario: dict = Depends(exigir_administrador)
):
    """Cadastra um novo livro físico no acervo de uma biblioteca."""
    try:
        novo_livro = await crud_livro.criar_livro(db=db, dados=dados)
        CACHE_LIVROS.clear() # Invalida o cache
        return novo_livro
    except ValueError as erro:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(erro))

@roteador.get("/", response_model=list[RespostaLivro])
async def pesquisar_livros(
    titulo: str | None = None,
    autor: str | None = None,
    categoria: str | None = None,
    id_biblioteca: int | None = None,
    limite: int = 100,
    pulo: int = 0,
    db: AsyncSession = Depends(obter_banco)
):
    """Pesquisa livros ativos com paginação e filtros dinâmicos."""
    # Chave do cache baseada nos filtros
    chave_cache = (titulo, autor, categoria, id_biblioteca, limite, pulo)
    
    if chave_cache in CACHE_LIVROS:
        return CACHE_LIVROS[chave_cache]
        
    resultado = await crud_livro.listar_livros(
        db=db,
        titulo=titulo,
        autor=autor,
        categoria=categoria,
        id_biblioteca=id_biblioteca,
        limite=limite,
        pulo=pulo
    )
    
    CACHE_LIVROS[chave_cache] = resultado
    return resultado

@roteador.get("/{id_livro}", response_model=RespostaLivro)
async def obter_detalhes_livro(id_livro: int, db: AsyncSession = Depends(obter_banco)):
    """
    Busca e retorna os detalhes de um livro físico específico pelo seu ID.

    Este endpoint retorna o payload limpo mapeado pelo RespostaLivro, incluindo os dados
    da biblioteca de origem. Ele é consumido síncronamente via requisições HTTP diretas
    por outros microsserviços do monorepo, especificamente pelo Serviço de Empréstimos (Loan Service),
    para fins de verificação rápida e síncrona de estoque e validade de livros.
    """
    livro = await crud_livro.buscar_livro_por_id(db=db, id_livro=id_livro)
    if not livro:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Livro não localizado.")
    return livro

@roteador.put("/{id_livro}", response_model=RespostaLivro)
async def atualizar_metadados_livro(
    id_livro: int,
    dados: AtualizarLivro,
    db: AsyncSession = Depends(obter_banco),
    usuario: dict = Depends(exigir_administrador)
):
    """Atualiza as informações de metadados de um livro cadastrado."""
    livro = await db.get(Livro, id_livro)
    if not livro:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Livro não localizado.")
        
    # Lógica de atualização dinâmica de campos
    campos_atualizar = dados.model_dump(exclude_unset=True)
    for chave, valor in campos_atualizar.items():
        setattr(livro, chave, valor)
        
    await db.commit()
    CACHE_LIVROS.clear() # Invalida o cache
    return await crud_livro.buscar_livro_por_id(db, id_livro)

@roteador.delete("/{id_livro}", status_code=status.HTTP_204_NO_CONTENT)
async def desativar_livro(
    id_livro: int,
    db: AsyncSession = Depends(obter_banco),
    usuario: dict = Depends(exigir_administrador)
):
    """Realiza a exclusão lógica do livro do catálogo (alterando o campo ativo para falso)."""
    livro = await db.get(Livro, id_livro)
    if not livro:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Livro não localizado.")
        
    livro.ativo = False
    await db.commit()
    CACHE_LIVROS.clear() # Invalida o cache
    return

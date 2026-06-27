import asyncio
from sqlalchemy.future import select
from app.core.banco import sessao_local
from app.modelos.biblioteca import Biblioteca
from app.modelos.livro import Livro

async def popular_banco():
    """Popular o banco de dados com bibliotecas e livros de exemplo caso esteja vazio."""
    async with sessao_local() as db:
        # Verifica se o banco já contém dados de bibliotecas
        resultado_bibliotecas = await db.execute(select(Biblioteca))
        total_bibliotecas = len(resultado_bibliotecas.scalars().all())
        
        if total_bibliotecas > 0:
            print("O banco de dados já possui registros de bibliotecas. Abortando semeadura.")
            return

        print("Iniciando semeadura de dados no banco de dados...")
        
        # 1. Criação das bibliotecas fictícias
        biblioteca_central = Biblioteca(
            nome="Biblioteca Central",
            localizacao="Prédio Principal, Campus I"
        )
        biblioteca_norte = Biblioteca(
            nome="Biblioteca Setor Norte",
            localizacao="Bloco Acadêmico 4, Campus II"
        )
        
        db.add_all([biblioteca_central, biblioteca_norte])
        
        # Salvando as bibliotecas no banco para gerar seus IDs
        await db.commit()
        await db.refresh(biblioteca_central)
        await db.refresh(biblioteca_norte)
        
        # 2. Criação dos livros de exemplo com ISBNs válidos (10 ou 13 dígitos numéricos)
        livro_1 = Livro(
            titulo="Introdução ao Python e SQLAlchemy",
            autor="Cauã Herculano",
            isbn="9788535288210",  # 13 dígitos
            categoria="Tecnologia",
            ano_publicacao=2026,
            quantidade_total=5,
            quantidade_disponivel=5,
            id_biblioteca=biblioteca_central.id
        )
        livro_2 = Livro(
            titulo="Construindo APIs Robustas com FastAPI",
            autor="Athos Inácio",
            isbn="9788535288227",  # 13 dígitos
            categoria="Tecnologia",
            ano_publicacao=2025,
            quantidade_total=3,
            quantidade_disponivel=3,
            id_biblioteca=biblioteca_central.id
        )
        livro_3 = Livro(
            titulo="Arquitetura Avançada de Microsserviços",
            autor="Marcus Vinícius",
            isbn="8535288235",  # 10 dígitos
            categoria="Engenharia de Software",
            ano_publicacao=2024,
            quantidade_total=4,
            quantidade_disponivel=4,
            id_biblioteca=biblioteca_norte.id
        )
        
        db.add_all([livro_1, livro_2, livro_3])
        await db.commit()
        print("Semeadura de dados concluída com sucesso!")

if __name__ == "__main__":
    # Permite executar o script direto pelo terminal
    asyncio.run(popular_banco())

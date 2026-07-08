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
        bibliotecas_existentes = resultado_bibliotecas.scalars().all()
        
        if len(bibliotecas_existentes) > 0:
            print("Bibliotecas já existem. Usando as existentes...")
            biblioteca_central = bibliotecas_existentes[0]
            if len(bibliotecas_existentes) > 1:
                biblioteca_norte = bibliotecas_existentes[1]
            else:
                biblioteca_norte = biblioteca_central
        else:
            print("Criando bibliotecas de exemplo...")
            biblioteca_central = Biblioteca(nome="Biblioteca Central", localizacao="Prédio Principal")
            biblioteca_norte = Biblioteca(nome="Biblioteca Setor Norte", localizacao="Bloco Acadêmico")
            db.add_all([biblioteca_central, biblioteca_norte])
            await db.commit()
            await db.refresh(biblioteca_central)
            await db.refresh(biblioteca_norte)
            print("Bibliotecas criadas.")

        import json
        import os
        caminho_json = os.path.join(os.path.dirname(__file__), 'livros_seed.json')
        
        if not os.path.exists(caminho_json):
            print("Arquivo livros_seed.json não encontrado. Abortando semeadura de livros.")
            return
            
        # Verifica se já existem livros
        resultado_livros = await db.execute(select(Livro))
        livros_existentes = resultado_livros.scalars().all()
        if len(livros_existentes) > 0:
            print("Livros já existem no banco. Pulando semeadura para evitar duplicatas.")
            return

        with open(caminho_json, 'r', encoding='utf-8') as f:
            dados_livros = json.load(f)
            
        print(f"Lendo {len(dados_livros)} livros do arquivo JSON...")
        
        livros_para_inserir = []
        for dado in dados_livros:
            id_bib = biblioteca_central.id if dado['id_biblioteca'] == 1 else biblioteca_norte.id
            livro = Livro(
                titulo=dado['titulo'][:150], # Limitando tamanho para segurança
                autor=dado['autor'][:100],
                isbn=dado['isbn'][:20],
                categoria=dado['categoria'][:50],
                ano_publicacao=dado['ano_publicacao'],
                capa_url=dado.get('capa_url'),
                quantidade_total=dado['quantidade_total'],
                quantidade_disponivel=dado['quantidade_total'],
                id_biblioteca=id_bib
            )
            livros_para_inserir.append(livro)
            
        db.add_all(livros_para_inserir)
        await db.commit()
        print("Semeadura de dados concluída com sucesso!")

if __name__ == "__main__":
    # Permite executar o script direto pelo terminal
    asyncio.run(popular_banco())

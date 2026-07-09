import logging
import random
from uuid import UUID
from typing import List
from sqlalchemy.future import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.modelos.historico import HistoricoLeitura
from app.modelos.popularidade import PopularidadeLivro
from app.esquemas.recomendacao import RespostaRecomendacaoItem

# Configuração do registrador de logs em português (PT-BR)
registrador = logging.getLogger("recomendador")

class ServicoRecomendacao:
    """Classe responsável pelas regras de negócio e geração de recomendações."""

    async def gerar_recomendacoes_personalizadas(
        self, id_usuario: UUID, sessao: AsyncSession, limite: int = 10
    ) -> List[RespostaRecomendacaoItem]:
        """
        Gera uma lista de livros recomendados para o usuário.
        
        A lógica de recomendação segue os seguintes passos:
        1. Busca as categorias que o usuário mais consumiu na tabela de histórico de leitura.
        2. Seleciona os livros mais populares nas mesmas categorias preferidas do usuário.
        3. Exclui livros que o usuário já leu ou está lendo no momento.
        4. Estratégia de Fallback: Se o usuário for novo ou não tiver histórico,
           retorna os livros mais populares globalmente no sistema.
        """
        registrador.info(f"Gerando recomendações personalizadas para o usuário: {id_usuario}")
        
        # Passo 1: Buscar o histórico de leitura do usuário
        stmt_historico = select(HistoricoLeitura).where(HistoricoLeitura.id_usuario == id_usuario)
        resultado_historico = await sessao.execute(stmt_historico)
        historicos = resultado_historico.scalars().all()
        
        # Mapeia todos os IDs dos livros já consumidos para exclusão posterior
        ids_excluir = {registro.id_livro for registro in historicos}
        
        recomendacoes = []
        
        # Caso de Fallback: Usuário sem histórico (usuário novo)
        if not historicos:
            registrador.info(f"Usuário {id_usuario} sem histórico de leitura. Aplicando estratégia de fallback global.")
            stmt_fallback = (
                select(PopularidadeLivro.id_livro)
                .order_by(PopularidadeLivro.total_emprestimos.desc())
                .limit(limite)
            )
            resultado_fallback = await sessao.execute(stmt_fallback)
            ids_fallback = list(resultado_fallback.scalars().all())
            
            for id_livro in ids_fallback:
                recomendacoes.append(RespostaRecomendacaoItem(
                    id_livro=id_livro,
                    porcentagem_compatibilidade=random.randint(70, 85),
                    motivo="Alta popularidade entre os leitores da comunidade."
                ))
            return recomendacoes
            
        # Passo 2: Mapear e contar as categorias preferidas do usuário
        contagem_categorias = {}
        for registro in historicos:
            if registro.categoria:
                contagem_categorias[registro.categoria] = contagem_categorias.get(registro.categoria, 0) + 1
                
        # Ordenar as categorias pelo total consumido (decrescente)
        categorias_preferidas = [
            categoria for categoria, _ in sorted(
                contagem_categorias.items(), key=lambda item: item[1], reverse=True
            )
        ]
        
        recomendacoes_ids = []
        
        # Passo 3: Buscar livros mais populares que pertencem a essas categorias preferidas
        if categorias_preferidas:
            stmt_populares = select(PopularidadeLivro).where(
                PopularidadeLivro.categoria.in_(categorias_preferidas)
            )
            if ids_excluir:
                stmt_populares = stmt_populares.where(PopularidadeLivro.id_livro.not_in(ids_excluir))
            
            stmt_populares = stmt_populares.order_by(PopularidadeLivro.total_emprestimos.desc()).limit(limite)
            resultado_populares = await sessao.execute(stmt_populares)
            livros_populares = list(resultado_populares.scalars().all())
            
            for livro in livros_populares:
                recomendacoes_ids.append(livro.id_livro)
                recomendacoes.append(RespostaRecomendacaoItem(
                    id_livro=livro.id_livro,
                    porcentagem_compatibilidade=random.randint(90, 99),
                    motivo=f"Baseado no seu alto interesse pela categoria {livro.categoria}."
                ))
            
        # Passo 4: Se o total de recomendações for inferior ao limite desejado,
        # preenchemos os itens restantes com os livros mais populares globais (excluindo os já consumidos e já recomendados)
        if len(recomendacoes) < limite:
            itens_restantes = limite - len(recomendacoes)
            excluir_adicional = ids_excluir.union(set(recomendacoes_ids))
            
            stmt_global = select(PopularidadeLivro)
            if excluir_adicional:
                stmt_global = stmt_global.where(PopularidadeLivro.id_livro.not_in(excluir_adicional))
                
            stmt_global = stmt_global.order_by(PopularidadeLivro.total_emprestimos.desc()).limit(itens_restantes)
            resultado_global = await sessao.execute(stmt_global)
            livros_globais = list(resultado_global.scalars().all())
            
            for livro in livros_globais:
                recomendacoes.append(RespostaRecomendacaoItem(
                    id_livro=livro.id_livro,
                    porcentagem_compatibilidade=random.randint(70, 85),
                    motivo="Alta popularidade entre os leitores da comunidade."
                ))
            
        registrador.info(f"Recomendações geradas com sucesso para {id_usuario}: {[r.id_livro for r in recomendacoes]}")
        return recomendacoes

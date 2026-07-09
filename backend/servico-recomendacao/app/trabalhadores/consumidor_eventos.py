import asyncio
import logging
import json
import uuid
from datetime import datetime
import aio_pika
from sqlalchemy.future import select

from app.core.configuracoes import configuracoes
from app.core.banco import sessao_local
from app.modelos.historico import HistoricoLeitura
from app.modelos.popularidade import PopularidadeLivro

# Configura o logger do trabalhador de eventos
logger = logging.getLogger("consumidor_eventos")

NOME_EXCHANGE = "nosso-livro"
NOME_FILA = "fila_recomendacoes"

async def processar_mensagem(mensagem: aio_pika.IncomingMessage) -> None:
    """
    Função de callback responsável por processar o payload JSON das mensagens.
    Trata eventos de criação e devolução de empréstimos atualizando o banco de dados.
    """
    async with mensagem.process():
        try:
            corpo_mensagem = mensagem.body.decode("utf-8")
            dados = json.loads(corpo_mensagem)
            chave_roteamento = mensagem.routing_key
            
            logger.info(f"Mensagem de evento capturada. Rota: '{chave_roteamento}' | Payload: {dados}")
            
            async with sessao_local() as db:
                if chave_roteamento == "emprestimo.criado":
                    id_usuario = uuid.UUID(dados.get("id_usuario"))
                    id_livro = str(dados.get("id_livro"))
                    categoria = dados.get("categoria")
                    titulo = dados.get("titulo", "Título Desconhecido")
                    
                    # 1. Registra o início da leitura no histórico em estado LENDO
                    novo_historico = HistoricoLeitura(
                        id_usuario=id_usuario,
                        id_livro=id_livro,
                        categoria=categoria,
                        data_inicio=datetime.utcnow(),
                        estado="LENDO"
                    )
                    db.add(novo_historico)
                    
                    # 2. Incrementa a popularidade do livro (cria o registro caso não exista)
                    query_popularidade = await db.execute(
                        select(PopularidadeLivro).where(PopularidadeLivro.id_livro == id_livro)
                    )
                    popularidade = query_popularidade.scalars().first()
                    
                    if popularidade:
                        popularidade.total_emprestimos += 1
                    else:
                        popularidade = PopularidadeLivro(
                            id_livro=id_livro,
                            titulo=titulo,
                            categoria=categoria,
                            total_emprestimos=1
                        )
                        db.add(popularidade)
                        
                    await db.commit()
                    logger.info(f"Histórico LENDO criado e popularidade incrementada para o livro {id_livro}.")
                    
                elif chave_roteamento == "emprestimo.devolvido":
                    id_usuario = uuid.UUID(dados.get("id_usuario"))
                    id_livro = str(dados.get("id_livro"))
                    
                    # Localiza o registro de leitura correspondente que esteja no estado LENDO
                    query_historico = await db.execute(
                        select(HistoricoLeitura)
                        .where(HistoricoLeitura.id_usuario == id_usuario)
                        .where(HistoricoLeitura.id_livro == id_livro)
                        .where(HistoricoLeitura.estado == "LENDO")
                    )
                    historico = query_historico.scalars().first()
                    
                    if historico:
                        historico.estado = "CONCLUIDO"
                        historico.data_fim = datetime.utcnow()
                        await db.commit()
                        logger.info(f"Histórico atualizado para CONCLUIDO para o usuário {id_usuario} e livro {id_livro}.")
                    else:
                        logger.warning(f"Nenhum histórico ativo LENDO localizado para o usuário {id_usuario} e livro {id_livro}.")
                        
        except Exception as erro:
            logger.error(f"Erro ao processar mensagem consumida do RabbitMQ: {str(erro)}")

async def iniciar_consumidor() -> None:
    """
    Laço persistente para conectar e consumir mensagens das chaves vinculadas.
    Possui tolerância a falhas com backoff exponencial caso o broker caia.
    """
    intervalo_espera = 2
    fator_multiplicador = 2
    espera_maxima = 30
    
    while True:
        try:
            logger.info("Iniciando conexão de mensageria robusta com o RabbitMQ...")
            conexao = await aio_pika.connect_robust(configuracoes.URL_RABBITMQ)
            
            async with conexao:
                canal = await conexao.channel()
                await canal.set_qos(prefetch_count=1)
                
                exchange = await canal.declare_exchange(
                    NOME_EXCHANGE,
                    aio_pika.ExchangeType.TOPIC,
                    durable=True
                )
                
                fila = await canal.declare_queue(NOME_FILA, durable=True)
                
                await fila.bind(exchange, routing_key="emprestimo.criado")
                await fila.bind(exchange, routing_key="emprestimo.devolvido")
                
                logger.info(f"Consumidor conectado com sucesso. Aguardando eventos na fila '{NOME_FILA}'...")
                
                # Reseta tempo de espera no sucesso
                intervalo_espera = 2
                
                async with fila.iterator() as iterador_fila:
                    async for mensagem in iterador_fila:
                        await processar_mensagem(mensagem)
                        
        except (asyncio.CancelledError, KeyboardInterrupt):
            logger.info("Processo de consumo cancelado. Finalizando conexão com o RabbitMQ.")
            break
        except Exception as erro:
            logger.error(f"Falha de comunicação com o broker: {str(erro)}. Reconectando em {intervalo_espera}s...")
            await asyncio.sleep(intervalo_espera)
            intervalo_espera = min(intervalo_espera * fator_multiplicador, espera_maxima)

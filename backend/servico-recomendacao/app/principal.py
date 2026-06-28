import asyncio
import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from app.trabalhadores.consumidor_eventos import iniciar_consumidor

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("principal")

@asynccontextmanager
async def ciclo_vida(aplicativo: FastAPI):
    """Gerencia a inicialização e encerramento de tarefas do microsserviço."""
    logger.info("Disparando o worker de consumo de eventos do RabbitMQ...")
    tarefa_consumidor = asyncio.create_task(iniciar_consumidor())
    yield
    logger.info("Solicitando cancelamento do consumidor de eventos...")
    tarefa_consumidor.cancel()
    try:
        await tarefa_consumidor
    except asyncio.CancelledError:
        logger.info("Consumidor de eventos finalizado de forma limpa.")

app = FastAPI(
    title="Serviço de Recomendação",
    description="Microsserviço responsável pela geração de históricos e popularidade de livros.",
    version="0.1.0",
    lifespan=ciclo_vida
)

@app.get("/", tags=["Raiz"])
async def obter_estado_servico():
    """Retorna o status atual do serviço de recomendações."""
    return {
        "servico": "Serviço de Recomendação",
        "estado": "operacional",
        "mensagem": "Microsserviço de recomendação ativo."
    }

import asyncio
import json
import logging
from datetime import datetime
from contextlib import asynccontextmanager
from fastapi import FastAPI

from app.trabalhadores.consumidor_eventos import iniciar_consumidor
from app.api.recomendacoes import roteador
from app.api.saude import roteador as roteador_saude
from app.core.banco import motor_assincrono

class FormatarLogJson(logging.Formatter):
    """Formatador de log customizado que gera a saída em formato JSON estruturado."""
    def format(self, registro: logging.LogRecord) -> str:
        dados_log = {
            "timestamp": datetime.utcnow().isoformat() + "Z",
            "nivel": registro.levelname,
            "mensagem": registro.getMessage(),
            "modulo": registro.module,
            "funcao": registro.funcName
        }
        if registro.exc_info:
            dados_log["excecao"] = self.formatException(registro.exc_info)
        return json.dumps(dados_log, ensure_ascii=False)

def configurar_logs():
    """Configura o logger raiz para usar o formatador JSON estruturado."""
    formatador = FormatarLogJson()
    manipulador = logging.StreamHandler()
    manipulador.setFormatter(formatador)
    
    logger_raiz = logging.getLogger()
    logger_raiz.setLevel(logging.INFO)
    
    # Remove outros manipuladores configurados anteriormente
    for h in list(logger_raiz.handlers):
        logger_raiz.removeHandler(h)
        
    logger_raiz.addHandler(manipulador)

# Aplica as configurações de logging estruturado
configurar_logs()
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
    
    logger.info("Encerrando pool de conexões do banco de dados (SQLAlchemy)...")
    await motor_assincrono.dispose()
    logger.info("Sessões do banco de dados limpas com sucesso.")

app = FastAPI(
    title="Serviço de Recomendação",
    description="Microsserviço responsável pela geração de históricos e popularidade de livros.",
    version="0.1.0",
    lifespan=ciclo_vida
)

# Registro dos roteadores de recomendação e saúde
app.include_router(roteador)
app.include_router(roteador_saude)

@app.get("/", tags=["Raiz"])
async def obter_estado_servico():
    """Retorna o status atual do serviço de recomendações."""
    return {
        "servico": "Serviço de Recomendação",
        "estado": "operacional",
        "mensagem": "Microsserviço de recomendação ativo."
    }


import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.bibliotecas import roteador as roteador_bibliotecas
from app.api.livros import roteador as roteador_livros
from app.api.saude import roteador as roteador_saude
from app.core.logs import configurar_logs
from app.core.banco import motor_assincrono

# Inicializa as configurações de log estruturado JSON
configurar_logs()
logger = logging.getLogger("principal")

@asynccontextmanager
async def ciclo_vida(aplicativo: FastAPI):
    """Gerencia o ciclo de vida do serviço, garantindo inicialização e encerramento limpos."""
    logger.info("Microsserviço de Catálogo e Biblioteca inicializado com sucesso.")
    yield
    logger.info("Sinal de desligamento recebido. Iniciando encerramento controlado (Graceful Shutdown)...")
    # Descarte limpo e seguro do pool de conexões do SQLAlchemy
    await motor_assincrono.dispose()
    logger.info("Microsserviço de Catálogo e Biblioteca finalizado com sucesso.")

app = FastAPI(
    title="Serviço de Catálogo e Biblioteca",
    description="Microsserviço para gestão de livros e bibliotecas físicas do sistema Nosso Livro.",
    version="0.1.0",
    openapi_tags=[
        {
            "name": "Raiz",
            "description": "Endpoints de diagnóstico e estado de saúde do microsserviço.",
        },
        {
            "name": "Bibliotecas",
            "description": "Operações de cadastro e listagem de bibliotecas físicas.",
        },
        {
            "name": "Livros",
            "description": "Operações de gerenciamento do acervo de livros do catálogo.",
        },
    ],
    lifespan=ciclo_vida
)

# Definição das origens permitidas pelo CORS
origens = [
    "http://localhost",
    "http://localhost:3000",  # Frontend padrão do React
    "http://localhost:8000",  # API Gateway ou acessos locais
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origens,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Inclusão dos roteadores da API
app.include_router(roteador_bibliotecas, prefix="/api/bibliotecas", tags=["Bibliotecas"])
app.include_router(roteador_livros, prefix="/api/livros", tags=["Livros"])
app.include_router(roteador_saude)

@app.get("/", tags=["Raiz"])
async def obter_estado_servico():
    """Retorna o status atual do microsserviço."""
    return {
        "servico": "Serviço de Catálogo e Biblioteca",
        "estado": "operacional",
        "mensagem": "Microsserviço de Catálogo e Biblioteca inicializado com sucesso."
    }

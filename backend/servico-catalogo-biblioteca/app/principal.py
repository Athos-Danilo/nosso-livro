from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(
    title="Serviço de Catálogo e Biblioteca",
    description="Microsserviço para gestão de livros e bibliotecas físicas do sistema Nosso Livro.",
    version="0.1.0",
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

@app.get("/", tags=["Raiz"])
async def obter_estado_servico():
    """Retorna o status atual do microsserviço."""
    return {
        "servico": "Serviço de Catálogo e Biblioteca",
        "estado": "operacional",
        "mensagem": "Microsserviço de Catálogo e Biblioteca inicializado com sucesso."
    }

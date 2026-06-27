from typing import AsyncGenerator
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy.orm import declarative_base
from app.core.configuracoes import configuracoes

# Configura o motor (engine) assíncrono do banco de dados
motor_assincrono = create_async_engine(
    configuracoes.URL_BANCO_DADOS,
    echo=True,  # Mostra as instruções SQL geradas no terminal de desenvolvimento
)

# Configura o criador de sessões locais assíncronas
sessao_local = async_sessionmaker(
    bind=motor_assincrono,
    autocommit=False,
    autoflush=False,
    expire_on_commit=False,
    class_=AsyncSession
)

# Classe declarativa base para os modelos do banco de dados
Base = declarative_base()

# Função geradora para obter a sessão do banco de dados de forma assíncrona
async def obter_banco() -> AsyncGenerator[AsyncSession, None]:
    """Obtém uma sessão ativa do banco de dados."""
    async with sessao_local() as sessao:
        yield sessao

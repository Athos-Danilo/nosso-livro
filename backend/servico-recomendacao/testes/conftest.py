import asyncio
from typing import AsyncGenerator
import pytest
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from httpx import AsyncClient, ASGITransport

from app.principal import app
from app.core.banco import Base, obter_banco

# URL para banco de dados SQLite assíncrono em memória para execução de testes
URL_BANCO_TESTES = "sqlite+aiosqlite:///:memory:"

motor_testes = create_async_engine(URL_BANCO_TESTES, echo=False)
sessao_local_testes = async_sessionmaker(
    bind=motor_testes,
    autocommit=False,
    autoflush=False,
    expire_on_commit=False,
    class_=AsyncSession
)

@pytest.fixture(scope="session", autouse=True)
async def inicializar_banco():
    """Inicializa a estrutura do banco de dados na memória antes de rodar os testes."""
    async with motor_testes.begin() as conexao:
        await conexao.run_sync(Base.metadata.create_all)
    yield
    async with motor_testes.begin() as conexao:
        await conexao.run_sync(Base.metadata.drop_all)

@pytest.fixture
async def sessao_banco() -> AsyncGenerator[AsyncSession, None]:
    """Fornece uma sessão assíncrona limpa do banco de dados para cada caso de teste."""
    async with sessao_local_testes() as sessao:
        yield sessao
        # Garante que as alterações efetuadas nos testes sejam limpas
        await sessao.rollback()

@pytest.fixture
async def cliente_http(sessao_banco: AsyncSession) -> AsyncGenerator[AsyncClient, None]:
    """
    Substitui a dependência do banco de dados e fornece um cliente HTTP
    assíncrono para interagir com o microsserviço FastAPI.
    """
    async def obter_banco_mockado() -> AsyncGenerator[AsyncSession, None]:
        yield sessao_banco

    app.dependency_overrides[obter_banco] = obter_banco_mockado
    
    transporte = ASGITransport(app=app)
    async with AsyncClient(transport=transporte, base_url="http://teste") as cliente:
        yield cliente
        
    app.dependency_overrides.clear()

import asyncio
from logging.config import fileConfig

from sqlalchemy import pool
from sqlalchemy.engine import Connection
from sqlalchemy.ext.asyncio import async_engine_from_config

from alembic import context

# Importações do nosso projeto
from app.core.configuracoes import configuracoes
from app.core.banco import Base
# Importar os modelos para registrar o metadata das tabelas
import app.modelos

# Este é o objeto de configuração do Alembic, que provê
# acesso aos valores contidos no arquivo .ini em uso.
config = context.config

# Sobrescreve a URL do banco com o valor das configurações do projeto, garantindo o driver assíncrono
url_banco = configuracoes.URL_BANCO_RECOMENDACOES
if url_banco.startswith("postgresql://"):
    url_banco = url_banco.replace("postgresql://", "postgresql+asyncpg://", 1)
config.set_main_option("sqlalchemy.url", url_banco)

# Interpreta o arquivo de configuração para o logging do Python.
# Esta linha configura os loggers basicamente.
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# Adicione o objeto MetaData do seu modelo aqui
# para suporte a 'autogenerate'
target_metadata = Base.metadata

# Outros valores da configuração, definidos pelas necessidades do env.py,
# podem ser obtidos:
# my_important_option = config.get_main_option("my_important_option")
# ... etc.


def run_migrations_offline() -> None:
    """Executa as migrações no modo 'offline'.

    Isso configura o contexto apenas com uma URL
    e não com um Engine, embora um Engine também seja aceitável
    aqui. Ao pular a criação do Engine,
    não precisamos nem de um DBAPI disponível.

    Chamadas para context.execute() aqui enviam a string fornecida
    para a saída do script.

    """
    url = config.get_main_option("sqlalchemy.url")
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )

    with context.begin_transaction():
        context.run_migrations()


def do_run_migrations(connection: Connection) -> None:
    context.configure(connection=connection, target_metadata=target_metadata)

    with context.begin_transaction():
        context.run_migrations()


async def run_async_migrations() -> None:
    """Neste cenário precisamos criar um Engine
    e associar uma conexão ao contexto.

    """

    connectable = async_engine_from_config(
        config.get_section(config.config_ini_section, {}),
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )

    async with connectable.connect() as connection:
        await connection.run_sync(do_run_migrations)

    await connectable.dispose()


def run_migrations_online() -> None:
    """Executa as migrações no modo 'online'."""

    asyncio.run(run_async_migrations())


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()

import os
from pydantic_settings import BaseSettings, SettingsConfigDict

# Localiza o arquivo .env de forma dinâmica independente do diretório de execução
diretorio_atual = os.path.dirname(os.path.abspath(__file__))
caminho_env = os.path.join(diretorio_atual, "..", "..", ".env")

class Configuracoes(BaseSettings):
    """Classe responsável por gerenciar as configurações da aplicação de recomendação."""
    URL_BANCO_RECOMENDACOES: str
    URL_RABBITMQ: str

    model_config = SettingsConfigDict(
        env_file=caminho_env,
        env_file_encoding="utf-8",
        extra="ignore"
    )

configuracoes = Configuracoes()

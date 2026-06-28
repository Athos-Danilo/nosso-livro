import os
from pydantic_settings import BaseSettings, SettingsConfigDict

# Localiza o arquivo .env de forma dinâmica independente do diretório de execução
diretorio_atual = os.path.dirname(os.path.abspath(__file__))
caminho_env = os.path.join(diretorio_atual, "..", "..", ".env")

class Configuracoes(BaseSettings):
    """Classe responsável por gerenciar as configurações da aplicação."""
    URL_BANCO_DADOS: str
    CHAVE_SECRETA_JWT: str = "chave_secreta_padrao_desenvolvimento_nosso_livro"

    model_config = SettingsConfigDict(
        env_file=caminho_env,
        env_file_encoding="utf-8",
        extra="ignore"
    )

configuracoes = Configuracoes()

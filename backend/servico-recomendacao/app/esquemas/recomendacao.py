from uuid import UUID
from datetime import datetime
from pydantic import BaseModel, ConfigDict

class RespostaPopularidadeLivro(BaseModel):
    """Estrutura de resposta contendo os dados de popularidade de um livro."""
    id_livro: UUID
    titulo: str
    categoria: str
    total_emprestimos: int

    model_config = ConfigDict(from_attributes=True)

class RespostaHistoricoLeitura(BaseModel):
    """Estrutura de resposta contendo o histórico de leitura de um usuário."""
    id: UUID
    id_usuario: UUID
    id_livro: UUID
    categoria: str
    data_inicio: datetime
    data_fim: datetime | None
    estado: str

    model_config = ConfigDict(from_attributes=True)

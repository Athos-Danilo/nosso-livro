from uuid import UUID
from datetime import datetime
from pydantic import BaseModel, ConfigDict

class RespostaPopularidadeLivro(BaseModel):
    """Estrutura de resposta contendo os dados de popularidade de um livro."""
    id_livro: str
    titulo: str
    categoria: str
    total_emprestimos: int

    model_config = ConfigDict(from_attributes=True)

class RespostaHistoricoLeitura(BaseModel):
    """Estrutura de resposta contendo o histórico de leitura de um usuário."""
    id: UUID
    id_usuario: UUID
    id_livro: str
    categoria: str
    data_inicio: datetime
    data_fim: datetime | None
    estado: str

    model_config = ConfigDict(from_attributes=True)

class RespostaRecomendacaoItem(BaseModel):
    """Estrutura enriquecida de um livro recomendado."""
    id_livro: str
    porcentagem_compatibilidade: int
    motivo: str

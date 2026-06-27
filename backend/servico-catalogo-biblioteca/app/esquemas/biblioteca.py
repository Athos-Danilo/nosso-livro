from datetime import datetime
from pydantic import BaseModel, ConfigDict

class CriarBiblioteca(BaseModel):
    """Schema de entrada para criação de uma biblioteca."""
    nome: str
    localizacao: str

class RespostaBiblioteca(CriarBiblioteca):
    """Schema de saída contendo os dados completos da biblioteca."""
    id: int
    ativo: bool
    criado_em: datetime
    atualizado_em: datetime

    # Habilita o modo de compatibilidade com ORM no Pydantic v2
    model_config = ConfigDict(from_attributes=True)

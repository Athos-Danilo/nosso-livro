from datetime import datetime
from pydantic import BaseModel, ConfigDict, field_validator
from app.esquemas.biblioteca import RespostaBiblioteca

class CriarLivro(BaseModel):
    """Schema de entrada para criação de um livro."""
    titulo: str
    autor: str
    isbn: str
    categoria: str
    ano_publicacao: int | None = None
    capa_url: str | None = None
    quantidade_total: int
    quantidade_disponivel: int
    id_biblioteca: int

    @field_validator("isbn")
    @classmethod
    def validar_isbn(cls, valor: str) -> str:
        # Limpa eventuais hifens ou espaços inseridos pelo usuário
        valor_limpo = valor.replace("-", "").replace(" ", "")
        
        # Garante que contenha apenas números
        if not valor_limpo.isdigit():
            raise ValueError("O ISBN deve conter apenas números.")
            
        # Garante o tamanho correto de 10 ou 13 dígitos
        if len(valor_limpo) not in (10, 13):
            raise ValueError("O ISBN deve ter exatamente 10 ou 13 dígitos.")
            
        return valor_limpo

class AtualizarLivro(BaseModel):
    """Schema de entrada para atualização de um livro."""
    titulo: str | None = None
    autor: str | None = None
    isbn: str | None = None
    categoria: str | None = None
    ano_publicacao: int | None = None
    capa_url: str | None = None
    quantidade_total: int | None = None
    quantidade_disponivel: int | None = None
    id_biblioteca: int | None = None

    @field_validator("isbn")
    @classmethod
    def validar_isbn(cls, valor: str | None) -> str | None:
        if valor is None:
            return None
            
        valor_limpo = valor.replace("-", "").replace(" ", "")
        if not valor_limpo.isdigit():
            raise ValueError("O ISBN deve conter apenas números.")
        if len(valor_limpo) not in (10, 13):
            raise ValueError("O ISBN deve ter exatamente 10 ou 13 dígitos.")
        return valor_limpo

class RespostaLivro(BaseModel):
    """Schema de saída contendo os dados completos do livro."""
    id: int
    titulo: str
    autor: str
    isbn: str
    categoria: str
    ano_publicacao: int | None
    capa_url: str | None
    quantidade_total: int
    quantidade_disponivel: int
    id_biblioteca: int
    ativo: bool
    criado_em: datetime
    atualizado_em: datetime
    
    # Campo opcional para incluir detalhes da biblioteca no payload
    biblioteca: RespostaBiblioteca | None = None

    model_config = ConfigDict(from_attributes=True)

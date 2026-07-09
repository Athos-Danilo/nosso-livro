from sqlalchemy import Column, String, Integer
from sqlalchemy.dialects.postgresql import UUID
from app.core.banco import Base

class PopularidadeLivro(Base):
    """Modelo físico da tabela de estatísticas de popularidade dos livros."""
    __tablename__ = "popularidades_livros"

    id_livro = Column(String(255), primary_key=True)
    titulo = Column(String(255), nullable=False)
    categoria = Column(String(100), nullable=False)
    total_emprestimos = Column(Integer, nullable=False, default=0, index=True)

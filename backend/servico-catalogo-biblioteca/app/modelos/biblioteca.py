from sqlalchemy import Column, Integer, String, Boolean, DateTime, func
from sqlalchemy.orm import relationship
from app.core.banco import Base

class Biblioteca(Base):
    """Modelo representativo de uma biblioteca física no sistema."""
    __tablename__ = "bibliotecas"

    id = Column(Integer, primary_key=True, autoincrement=True)
    nome = Column(String, nullable=False)
    localizacao = Column(String, nullable=False)
    ativo = Column(Boolean, default=True, nullable=False)
    criado_em = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    atualizado_em = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False
    )

    # Relacionamento: Uma biblioteca pode conter vários livros
    livros = relationship("Livro", back_populates="biblioteca", lazy="select")

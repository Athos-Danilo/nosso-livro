from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, func
from sqlalchemy.orm import relationship
from app.core.banco import Base

class Livro(Base):
    """Modelo representativo de um livro físico associado a uma biblioteca no sistema."""
    __tablename__ = "livros"

    id = Column(Integer, primary_key=True, autoincrement=True)
    titulo = Column(String, nullable=False, index=True)
    autor = Column(String, nullable=False)
    isbn = Column(String, nullable=False, index=True)
    categoria = Column(String, nullable=False)
    ano_publicacao = Column(Integer, nullable=True)
    capa_url = Column(String, nullable=True)
    quantidade_total = Column(Integer, nullable=False)
    quantidade_disponivel = Column(Integer, nullable=False)
    id_biblioteca = Column(Integer, ForeignKey("bibliotecas.id"), nullable=False, index=True)
    ativo = Column(Boolean, default=True, nullable=False)
    criado_em = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    atualizado_em = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False
    )

    # Relacionamento: Cada livro pertence a uma biblioteca
    biblioteca = relationship("Biblioteca", back_populates="livros")

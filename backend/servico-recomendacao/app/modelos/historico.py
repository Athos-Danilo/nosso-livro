import uuid
from datetime import datetime
from sqlalchemy import Column, String, DateTime
from sqlalchemy.dialects.postgresql import UUID
from app.core.banco import Base

class HistoricoLeitura(Base):
    """Modelo físico da tabela de histórico de leitura do usuário."""
    __tablename__ = "historicos_leitura"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    id_usuario = Column(UUID(as_uuid=True), nullable=False, index=True)
    id_livro = Column(UUID(as_uuid=True), nullable=False)
    categoria = Column(String(100), nullable=False)
    data_inicio = Column(DateTime, nullable=False, default=datetime.utcnow)
    data_fim = Column(DateTime, nullable=True)
    estado = Column(String(50), nullable=False) # Ex: 'LENDO', 'CONCLUIDO'

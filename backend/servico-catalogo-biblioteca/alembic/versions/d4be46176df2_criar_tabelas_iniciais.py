"""criar_tabelas_iniciais

Revision ID: d4be46176df2
Revises: 
Create Date: 2026-06-27 11:03:19.220225

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'd4be46176df2'
down_revision: Union[str, Sequence[str], None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # Criação da tabela bibliotecas
    op.create_table(
        'bibliotecas',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('nome', sa.String(), nullable=False),
        sa.Column('localizacao', sa.String(), nullable=False),
        sa.Column('ativo', sa.Boolean(), nullable=False, server_default=sa.text('true')),
        sa.Column('criado_em', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('atualizado_em', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.PrimaryKeyConstraint('id')
    )
    
    # Criação da tabela livros
    op.create_table(
        'livros',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('titulo', sa.String(), nullable=False),
        sa.Column('autor', sa.String(), nullable=False),
        sa.Column('isbn', sa.String(), nullable=False),
        sa.Column('categoria', sa.String(), nullable=False),
        sa.Column('ano_publicacao', sa.Integer(), nullable=True),
        sa.Column('capa_url', sa.String(), nullable=True),
        sa.Column('quantidade_total', sa.Integer(), nullable=False),
        sa.Column('quantidade_disponivel', sa.Integer(), nullable=False),
        sa.Column('id_biblioteca', sa.Integer(), nullable=False),
        sa.Column('ativo', sa.Boolean(), nullable=False, server_default=sa.text('true')),
        sa.Column('criado_em', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('atualizado_em', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['id_biblioteca'], ['bibliotecas.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    
    # Criação de índices para a tabela livros
    op.create_index('ix_livros_titulo', 'livros', ['titulo'], unique=False)
    op.create_index('ix_livros_isbn', 'livros', ['isbn'], unique=False)
    op.create_index('ix_livros_id_biblioteca', 'livros', ['id_biblioteca'], unique=False)


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_index('ix_livros_id_biblioteca', table_name='livros')
    op.drop_index('ix_livros_isbn', table_name='livros')
    op.drop_index('ix_livros_titulo', table_name='livros')
    op.drop_table('livros')
    op.drop_table('bibliotecas')

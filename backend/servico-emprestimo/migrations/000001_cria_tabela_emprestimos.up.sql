-- Criação da tabela de empréstimos
CREATE TABLE IF NOT EXISTS emprestimos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_usuario UUID NOT NULL,
    id_livro VARCHAR(100) NOT NULL,
    id_biblioteca VARCHAR(100) NOT NULL,
    data_emprestimo TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    data_devolucao_prevista TIMESTAMP WITH TIME ZONE NOT NULL,
    data_devolucao_real TIMESTAMP WITH TIME ZONE,
    estado VARCHAR(20) NOT NULL DEFAULT 'ATIVO',
    criado_em TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    atualizado_em TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Índices criados para otimização de consultas de relatórios e buscas
CREATE INDEX IF NOT EXISTS idx_emprestimos_id_usuario ON emprestimos(id_usuario);
CREATE INDEX IF NOT EXISTS idx_emprestimos_id_livro ON emprestimos(id_livro);
CREATE INDEX IF NOT EXISTS idx_emprestimos_estado ON emprestimos(estado);

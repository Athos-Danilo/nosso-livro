-- Remoção dos índices e tabela de empréstimos
DROP INDEX IF EXISTS idx_emprestimos_estado;
DROP INDEX IF EXISTS idx_emprestimos_id_livro;
DROP INDEX IF EXISTS idx_emprestimos_id_usuario;
DROP TABLE IF EXISTS emprestimos;

-- Habilitar a extensão pgcrypto se necessário (geralmente ativa no Neon para UUID)
CREATE TABLE IF NOT EXISTS usuarios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    whatsapp VARCHAR(20) NOT NULL UNIQUE,
    email VARCHAR(100) NOT NULL UNIQUE,
    senha_hash VARCHAR(255) NOT NULL,
    nome VARCHAR(100) NOT NULL,
    permissao VARCHAR(50) NOT NULL DEFAULT 'membro',
    ativo BOOLEAN NOT NULL DEFAULT TRUE,
    criado_em TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    atualizado_em TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Índices para melhorar a performance das buscas por email e whatsapp
CREATE INDEX IF NOT EXISTS idx_usuarios_whatsapp ON usuarios(whatsapp);
CREATE INDEX IF NOT EXISTS idx_usuarios_email ON usuarios(email);

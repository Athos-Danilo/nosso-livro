import path from 'node:path';
import { defineConfig } from 'prisma/config';
import 'dotenv/config';

// ─── Validação da variável obrigatória ───────────────────────────────────────
const urlBanco = process.env.URL_BANCO_DADOS;

if (!urlBanco) {
  throw new Error(
    '[Notificação] Variável de ambiente URL_BANCO_DADOS não definida.'
  );
}

// Configuração do Prisma 7+ para o Serviço de Notificação.
// A propriedade `datasource.url` é obrigatória para o CLI (prisma migrate dev).
// O `migrate.adapter` fornece o adapter pg utilizado na execução das migrations.
export default defineConfig({
  earlyAccess: true,
  schema: path.join('prisma', 'schema.prisma'),

  // URL do banco exigida pelo CLI para operações de migrate
  datasource: {
    url: urlBanco,
  },

  migrate: {
    async adapter() {
      const { PrismaPg } = await import('@prisma/adapter-pg');
      return new PrismaPg({ connectionString: urlBanco });
    },
  },
});

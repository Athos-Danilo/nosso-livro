import path from 'node:path';
import { defineConfig } from 'prisma/config';
import 'dotenv/config';

// Configuração do Prisma 7+ — a URL do banco é definida aqui,
// e não mais dentro do schema.prisma.
export default defineConfig({
  earlyAccess: true,
  schema: path.join('prisma', 'schema.prisma'),

  migrate: {
    async adapter() {
      // Importação dinâmica do adapter pg para PostgreSQL
      const { PrismaPg } = await import('@prisma/adapter-pg');
      const urlBanco = process.env.URL_BANCO_DADOS;

      if (!urlBanco) {
        throw new Error(
          '[Reserva e Fila] Variável de ambiente URL_BANCO_DADOS não definida.'
        );
      }

      return new PrismaPg({ connectionString: urlBanco });
    },
  },
});

/// <reference types="node" />
import path from 'node:path';
import { defineConfig } from 'prisma/config';
import 'dotenv/config';

// Configuração do Prisma 7+ — a URL do banco é definida aqui,
// e não mais dentro do schema.prisma.
export default defineConfig({
  schema: path.join('prisma', 'schema.prisma'),

  datasource: {
    url: process.env.URL_BANCO_DADOS,
  },

});

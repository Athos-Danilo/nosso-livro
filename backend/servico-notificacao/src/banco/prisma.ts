import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import dotenv from 'dotenv';

// Carrega variáveis de ambiente
dotenv.config();

// ─── Validação da variável obrigatória ───────────────────────────────────────
const urlBanco = process.env.URL_BANCO_DADOS;
if (!urlBanco) {
  throw new Error(
    '[Notificação] Variável de ambiente URL_BANCO_DADOS não definida.'
  );
}

// ─── Instância global do Prisma Client (Prisma 7 + adapter pg) ───────────────
// Utiliza o padrão Singleton para evitar múltiplas conexões em desenvolvimento.
const adaptadorPg = new PrismaPg({ connectionString: urlBanco });

const prisma = new PrismaClient({ adapter: adaptadorPg });

export default prisma;

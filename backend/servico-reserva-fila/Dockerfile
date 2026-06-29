# ═══════════════════════════════════════════════════════════════════════════════
# Dockerfile Multi-stage — Serviço de Reserva e Fila
# Plataforma: Nosso Livro
# ═══════════════════════════════════════════════════════════════════════════════
#
# Estágio 1 (construtor): instala todas as dependências e compila TypeScript → JS
# Estágio 2 (produção):   copia apenas os artefatos necessários, imagem enxuta
#
# Tamanho esperado da imagem final: ~180–220 MB (node:18-alpine base)
# ───────────────────────────────────────────────────────────────────────────────

# ──────────────────────────────────────────────────────
# Estágio 1: Construtor (builder)
# ──────────────────────────────────────────────────────
FROM node:18-alpine AS construtor

# Instala dependências nativas necessárias para pacotes com bindings nativos
# (ex: `pg` usa `libpq` internamente)
RUN apk add --no-cache python3 make g++

# Define o diretório de trabalho dentro do contêiner
WORKDIR /app

# Copia os arquivos de manifesto de dependências primeiro
# (aproveita o cache de camadas do Docker: só reinstala se esses arquivos mudarem)
COPY package.json package-lock.json ./

# Instala TODAS as dependências (produção + desenvolvimento)
# necessárias para compilar o TypeScript
RUN npm ci

# Copia o schema do Prisma antes de gerar o cliente
COPY prisma ./prisma/

# Gera o Prisma Client com os tipos corretos
RUN npx prisma generate

# Copia o restante do código-fonte
COPY tsconfig.json ./
COPY src ./src/

# Compila TypeScript → JavaScript na pasta ./dist
RUN npm run build

# ──────────────────────────────────────────────────────
# Estágio 2: Produção (imagem final enxuta)
# ──────────────────────────────────────────────────────
FROM node:18-alpine AS producao

# Metadados da imagem (boas práticas OCI)
LABEL maintainer="Marcus Vinícius"
LABEL description="Serviço de Reserva e Fila — Plataforma Nosso Livro"
LABEL version="1.0.0"

# Instala apenas dependências de sistema necessárias em runtime
RUN apk add --no-cache dumb-init

# Cria um usuário não-root para executar a aplicação (segurança)
RUN addgroup -S nossolivro && adduser -S reserva -G nossolivro

WORKDIR /app

# Copia package.json para instalar apenas dependências de produção
COPY package.json package-lock.json ./

# Instala apenas dependências de produção (sem devDependencies)
RUN npm ci --omit=dev && npm cache clean --force

# Copia o Prisma Client gerado no estágio anterior
COPY --from=construtor /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=construtor /app/node_modules/@prisma ./node_modules/@prisma

# Copia o schema do Prisma (necessário para migrations em runtime)
COPY prisma ./prisma/

# Copia os artefatos JavaScript compilados do estágio construtor
COPY --from=construtor /app/dist ./dist/

# Define o proprietário dos arquivos como o usuário não-root
RUN chown -R reserva:nossolivro /app

# Muda para o usuário não-root
USER reserva

# ──────────────────────────────────────────────────────
# Configurações de runtime
# ──────────────────────────────────────────────────────

# Porta exposta pelo serviço
EXPOSE 3001

# Variáveis de ambiente padrão (sobrescritas pelo docker-compose ou plataforma de deploy)
ENV NODE_ENV=production \
    PORTA=3001 \
    LOG_NIVEL=info

# Health check: verifica se o serviço está respondendo
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD wget -qO- http://localhost:${PORTA}/saude || exit 1

# Usa dumb-init como PID 1 para tratamento correto de sinais UNIX (SIGTERM, SIGINT)
# Isso garante que o graceful shutdown funcione corretamente em contêineres
ENTRYPOINT ["dumb-init", "--"]

# Aplica as migrations pendentes antes de iniciar o servidor
# (garante que o banco esteja sempre atualizado ao subir o contêiner)
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/servidor.js"]

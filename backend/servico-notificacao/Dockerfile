# ─── Estágio 1: Build ──────────────────────────────────────────────────────────
FROM node:20-alpine AS construtor

# Define o diretório de trabalho
WORKDIR /app

# Instala dependências (incluindo devDependencies necessárias para o build)
COPY package*.json ./
RUN npm ci

# Copia os arquivos necessários para gerar o cliente Prisma
COPY prisma ./prisma

# Copia o restante do código-fonte (respeitando o .dockerignore)
# NOTA: O .dockerignore oculta src e config, mas aqui nós precisamos do src para compilar
# Portanto, precisamos garantir que o .dockerignore não bloqueie src do contexto de build!
# Espera, no .dockerignore eu bloqueei src. Vou precisar corrigir isso. 
# Para manter a consistência, na verdade o .dockerignore bloqueia no host para a imagem,
# eu tenho que liberar src no dockerignore para a etapa de build.
# Vou ajustar e usar COPY . . para compilar.
COPY tsconfig.json ./
COPY src ./src

# Gera o cliente tipado do Prisma
RUN npx prisma generate

# Executa a compilação do TypeScript (gera a pasta /dist)
RUN npm run build

# ─── Estágio 2: Produção ───────────────────────────────────────────────────────
FROM node:20-alpine AS producao

# Define ambiente de produção
ENV NODE_ENV=production
WORKDIR /app

# Copia package.json para instalar apenas as libs de produção
COPY package*.json ./
COPY prisma.config.ts ./
RUN npm ci --only=production && npm cache clean --force

# Copia o Prisma e o client gerado no estágio de build
COPY --from=construtor /app/prisma ./prisma
COPY --from=construtor /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=construtor /app/node_modules/@prisma ./node_modules/@prisma

# Copia o código compilado
COPY --from=construtor /app/dist ./dist

# A porta que o Express escuta para Health Checks
EXPOSE 3002

# Usuário sem privilégios (boas práticas de segurança Alpine)
USER node

# Inicia a aplicação usando o código transpilado
CMD ["node", "dist/servidor.js"]

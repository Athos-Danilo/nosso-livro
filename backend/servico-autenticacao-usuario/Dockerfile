# Estágio 1: Build / Compilação do binário estático
FROM golang:1.26.3-alpine AS construtor

# Define diretório de trabalho dentro do contêiner
WORKDIR /app

# Instala certificados CA necessários e dependências básicas de rede
RUN apk add --no-cache git ca-certificates

# Copia os arquivos de dependência do módulo
COPY go.mod go.sum ./
RUN go mod download

# Copia o restante do código fonte do projeto
COPY . .

# Compila o binário de forma estática removendo símbolos de depuração para otimizar tamanho (-w -s)
RUN CGO_ENABLED=0 GOOS=linux go build -ldflags="-w -s" -o api ./cmd/api/principal.go

# Estágio 2: Imagem final enxuta de produção
FROM alpine:3.19

# Instala pacotes básicos de segurança e fuso horário
RUN apk add --no-cache ca-certificates tzdata

WORKDIR /app

# Copia o executável otimizado do estágio de build
COPY --from=construtor /app/api .

# Explicita a porta exposta pelo servidor HTTP
EXPOSE 8080

# Define a execução do binário como comando padrão
CMD ["./api"]

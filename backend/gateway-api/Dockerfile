# Estágio 1: Compilação do binário de forma estática
FROM golang:1.26.3-alpine AS construtor

RUN apk add --no-cache git gcc musl-dev

WORKDIR /app

# Copia as dependências do módulo Go
COPY go.mod go.sum ./
RUN go mod download

# Copia o restante do código fonte
COPY . .

# Compila o binário de forma totalmente estática (CGO desabilitado)
RUN CGO_ENABLED=0 GOOS=linux go build -ldflags="-w -s" -o gateway-api ./cmd/gateway/principal.go

# Estágio 2: Imagem final minimalista
FROM alpine:latest

# Instala certificados de segurança essenciais
RUN apk --no-cache add ca-certificates

# Cria um grupo e usuário de segurança não-root
RUN addgroup -S grupoapp && adduser -S usuarioapp -G grupoapp

# Define a execução sob o usuário não-root
USER usuarioapp

WORKDIR /app

# Copia o executável gerado no estágio anterior
COPY --from=construtor /app/gateway-api .

# Porta padrão de escuta do Gateway
EXPOSE 3000

# Comando de entrada
ENTRYPOINT ["./gateway-api"]

# Estágio 1: Build das dependências da aplicação
FROM python:3.12-slim AS construtor

WORKDIR /app

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .

# Instala as dependências no diretório local do usuário
RUN pip install --no-cache-dir --user -r requirements.txt

# Estágio 2: Imagem final leve de execução em produção
FROM python:3.12-slim AS executor

WORKDIR /app

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PATH="/home/usuario_app/.local/bin:${PATH}"

# Cria o usuário não-root seguro
RUN useradd --create-home usuario_app
USER usuario_app

# Copia as dependências instaladas do estágio do construtor
COPY --from=construtor /root/.local /home/usuario_app/.local

# Copia o código fonte do microsserviço
COPY --chown=usuario_app:usuario_app . .

EXPOSE 8000

CMD ["uvicorn", "app.principal:app", "--host", "0.0.0.0", "--port", "8000"]

# Estágio 1: Compilação de dependências (Build)
FROM python:3.12-slim AS construtor

WORKDIR /compilar

RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .

RUN pip install --no-cache-dir --prefix=/instalar -r requirements.txt

# Estágio 2: Ambiente de Execução (Production)
FROM python:3.12-slim AS executor

WORKDIR /app

# Copia as dependências instaladas no estágio anterior
COPY --from=construtor /instalar /usr/local

# Copia o código da aplicação
COPY --chown=usuario_app:usuario_app . .

# Cria grupo e usuário não-privilegiado (não-root)
RUN groupadd -r usuario_app && useradd -r -g usuario_app usuario_app

# Define permissões nos arquivos copiados para o usuário não-privilegiado
RUN chown -R usuario_app:usuario_app /app

USER usuario_app

EXPOSE 8000

ENV PYTHONUNBUFFERED=1
ENV PYTHONDONTWRITEBYTECODE=1

CMD ["uvicorn", "app.principal:app", "--host", "0.0.0.0", "--port", "8000"]

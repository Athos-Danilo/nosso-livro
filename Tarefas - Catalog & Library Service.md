# 📋 Checklist de Tarefas - Catalog & Library Service (Serviço de Catálogo)

Este documento funciona como um guia de acompanhamento (To-Do List) para a implementação completa do microsserviço **Catalog & Library Service**, desenvolvido em **Python (FastAPI)**. Ele é responsável pelo catálogo de títulos e a gestão das bibliotecas físicas da plataforma "Nosso Livro".

> [!IMPORTANT]
> O microsserviço deve fornecer uma API extremamente rápida para consultas e pesquisas avançadas de livros, além de expor endpoints seguros e estáveis para o API Gateway e chamadas de validação interna do `Loan Service`.

---

## 🗺️ Mapa de Progresso Geral

- [ ] **Fase 1: Configuração do Ambiente e Banco de Dados (Python + Alembic)**
- [ ] **Fase 2: Schemas Pydantic e Lógica ORM (SQLAlchemy)**
- [ ] **Fase 3: Desenvolvimento de APIs REST e Endpoints (FastAPI)**
- [ ] **Fase 4: Segurança, Autorização (RBAC) e Otimização de Performance**
- [ ] **Fase 5: Testes Automatizados (pytest)**
- [ ] **Fase 6: Dockerização, Observabilidade e Práticas de Produção**

---

## 🗄️ Fase 1: Configuração do Ambiente e Banco de Dados
Configuração do ecossistema Python, estrutura de diretórios e migrations do banco de dados do catálogo.

- [ ] **M1.1: Inicialização do Projeto e Dependências**
  - [ ] Configurar ambiente virtual (`python -m venv venv`) ou inicializar gerenciador (`poetry init`).
  - [ ] Instalar pacotes essenciais: `fastapi`, `uvicorn[standard]`, `sqlalchemy`, `alembic`, `psycopg2-binary` (ou `asyncpg` para conexões assíncronas) e `pydantic[email]`.
  - [ ] Organizar a estrutura de arquivos modular:
    - `/app/main.py` (Ponto de inicialização do FastAPI)
    - `/app/core/config.py` (Configurações e variáveis de ambiente)
    - `/app/core/database.py` (Conexão do SQLAlchemy e SessionLocal)
    - `/app/models/` (Modelos físicos do banco de dados)
    - `/app/schemas/` (Schemas de validação Pydantic)
    - `/app/api/` (Rotas HTTP e controllers)
    - `/app/crud/` (Lógica de leitura/escrita no banco de dados)
- [ ] **M1.2: Modelagem Física do Banco com SQLAlchemy**
  - [ ] Criar modelo `Library` (Biblioteca Física):
    - Campos: ID (UUID ou ID serial), Nome (Ex: "Biblioteca Setor Sul"), Localização/Descrição, Ativo (booleano), data de criação e atualização.
  - [ ] Criar modelo `Book` (Livro Físico):
    - Campos: ID (UUID ou ID serial), Título, Autor, ISBN, Categoria/Gênero, Ano de Publicação, Capa URL, Quantidade Total, Quantidade Disponível, ID Biblioteca (ForeignKey referenciando `Library`), Ativo (booleano) e controle temporal.
- [ ] **M1.3: Setup e Migration com Alembic**
  - [ ] Executar `alembic init alembic` para estruturar as pastas de migração.
  - [ ] Configurar `env.py` para carregar dinamicamente a string do banco PostgreSQL Neon (`DATABASE_URL`) e registrar os metadados do SQLAlchemy (`Base.metadata`) para autogeração.
  - [ ] Gerar e aplicar a primeira migration de criação das tabelas `libraries` e `books`, configurando chaves estrangeiras e índices em `books.title`, `books.isbn` e `books.library_id`.

---

## 💾 Fase 2: Schemas Pydantic e Lógica ORM (SQLAlchemy)
Configuração das validações e criação das operações de banco (CRUD).

- [ ] **M2.1: Schemas de Dados com Pydantic**
  - [ ] Criar schemas de entrada e saída para Bibliotecas (`LibraryCreate`, `LibraryResponse`).
  - [ ] Criar schemas de entrada e saída para Livros (`BookCreate`, `BookUpdate`, `BookResponse`).
  - [ ] Garantir validação estrita do formato do código ISBN utilizando regras customizadas do Pydantic.
- [ ] **M2.2: Operações de CRUD (`app/crud/`)**
  - [ ] Desenvolver operações para a entidade `Library` (criar, listar ativas, buscar por ID).
  - [ ] Desenvolver operações para a entidade `Book`:
    - `create_book`: Criar novo título validando se a biblioteca associada realmente existe.
    - `get_book_by_id`: Buscar livro incluindo o relacionamento carregado (JOIN) com a biblioteca física de origem.
    - `list_books`: Listar livros com paginação (`limit`/`offset`) e suporte a filtros opcionais por título, autor, gênero e ID da biblioteca.
    - `update_book_stock`: Atualizar quantidade em estoque (decremento e incremento, usado em fluxos de empréstimos e devoluções).

---

## 🌐 Fase 3: Desenvolvimento de APIs REST e Endpoints (FastAPI)
Exposição de endpoints para o frontend e consumo interno de outros serviços.

- [ ] **M3.1: APIs de Gestão de Bibliotecas**
  - [ ] `POST /api/libraries` (Protegido - Apenas Admin): Cadastro de bibliotecas.
  - [ ] `GET /api/libraries` (Público): Listagem de todas as bibliotecas disponíveis no sistema.
- [ ] **M3.2: APIs de Catálogo de Livros**
  - [ ] `POST /api/books` (Protegido - Apenas Admin): Cadastro de um livro físico no acervo.
  - [ ] `GET /api/books` (Público): Pesquisa de livros com filtros dinâmicos e paginação.
  - [ ] `GET /api/books/{id}` (Público/Integração): Detalhes de um livro específico.
    - **Importante:** Este endpoint será consumido via chamada HTTP interna síncrona pelo `Loan Service`. Deve retornar um payload limpo informando a disponibilidade física do exemplar.
  - [ ] `PUT /api/books/{id}` (Protegido - Apenas Admin): Atualização de metadados do livro.
  - [ ] `DELETE /api/books/{id}` (Protegido - Apenas Admin): Exclusão lógica (desativação de livro).

---

## 🛡️ Fase 4: Segurança, Autorização e Otimização de Performance
Controle de segurança baseado em papéis (RBAC) e aceleração de buscas.

- [ ] **M4.1: Validação de Autenticação JWT**
  - [ ] Criar uma dependência FastAPI (`Depends`) para ler o JWT repassado pelo API Gateway através do header `Authorization`.
  - [ ] Decodificar o payload e verificar o papel do usuário (`role`).
  - [ ] Criar dependências específicas para restrição de rotas administrativas (ex: `verify_admin_user`), bloqueando acessos não-autorizados (`403 Forbidden`).
- [ ] **M4.2: Otimização de Performance com Cache**
  - [ ] Implementar cache em memória (ex: `fastapi-cache` ou utilizando um dicionário em memória/Redis) para a rota de listagem de livros (`GET /api/books`), reduzindo acessos diretos ao PostgreSQL Neon e diminuindo a latência sob alta concorrência.
- [ ] **M4.3: Customização e Documentação de APIs**
  - [ ] Customizar as respostas padrão da API e configurar tags descritivas para gerar uma documentação OpenAPI (Swagger) de alto padrão.

---

## 🧪 Fase 5: Testes Automatizados (pytest)
Testes unitários e de integração para garantir a estabilidade do catálogo.

- [ ] **M5.1: Setup do Pytest**
  - [ ] Instalar `pytest`, `pytest-cov` e `httpx` (para testes de rotas assíncronas).
  - [ ] Configurar o arquivo `conftest.py` contendo fixtures para inicialização do banco de dados temporário de testes (usando SQLite em memória ou banco local de testes).
- [ ] **M5.2: Testes de Integração e Rotas**
  - [ ] Testar criação e listagem de bibliotecas físicas.
  - [ ] Testar regras de validação do Pydantic para ISBN incorreto ou quantidade negativa.
  - [ ] Testar criação de livros e garantia de integridade de ForeignKey (não permitir cadastrar livro em biblioteca inexistente).
  - [ ] Testar segurança das rotas (garantir que usuários não-admin recebam `403` ao tentar cadastrar livros).

---

## 🚀 Fase 6: Dockerização, Observabilidade e Produção
Deploy e padrões operacionais profissionais.

- [ ] **M6.1: Dockerfile Otimizado**
  - [ ] Criar `Dockerfile` multi-stage:
    - *Stage 1 (Compilação):* Usa imagem oficial Python (`python:3.11-slim`) para instalar dependências e preparar o ambiente sem incluir arquivos desnecessários.
    - *Stage 2 (Runtime):* Imagem limpa baseada em `python:3.11-slim` executando o servidor de produção Uvicorn de forma segura (como usuário não-root).
- [ ] **M6.2: Graceful Shutdown**
  - [ ] Configurar eventos de inicialização (`startup`) e encerramento (`shutdown`) no FastAPI para gerenciar a desconexão limpa do pool de conexões do SQLAlchemy.
- [ ] **M6.3: Health Checks e Logs JSON**
  - [ ] Criar rotas `/healthz` e `/readyz` verificando a integridade física do PostgreSQL.
  - [ ] Configurar biblioteca de logging (ex: `structlog` ou logging nativo com formatador JSON) para gerar logs estruturados que facilitem o rastreamento em produção no Render.

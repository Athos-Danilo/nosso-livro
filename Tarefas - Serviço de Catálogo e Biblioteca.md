# 📋 Checklist de Tarefas - Serviço de Catálogo e Biblioteca

Este documento funciona como um guia de acompanhamento (To-Do List) para a implementação completa do microsserviço **Serviço de Catálogo e Biblioteca**, desenvolvido em **Python (FastAPI)**. Ele é responsável pelo catálogo de títulos e a gestão das bibliotecas físicas da plataforma "Nosso Livro".

> [!IMPORTANT]
> **REGRA DE IDIOMA DO PROJETO (PT-BR):**
> Todo o desenvolvimento deste microsserviço (incluindo rotas HTTP, payloads JSON, nomes de variáveis, classes, funções, tabelas do banco de dados, comentários de código, mensagens de log e commits) deve ser realizado estritamente em **Português do Brasil (PT-BR)**. É proibido o uso de termos em inglês nas implementações internas e externas deste serviço.

---

## 🗺️ Mapa de Progresso Geral

- [X] **Fase 1: Configuração do Ambiente e Banco de Dados (Python + Alembic)**
- [X] **Fase 2: Schemas Pydantic e Lógica ORM (SQLAlchemy)**
- [X] **Fase 3: Desenvolvimento de APIs REST e Endpoints (FastAPI)**
- [ ] **Fase 4: Segurança, Autorização baseada em Permissões e Performance**
- [ ] **Fase 5: Testes Automatizados (pytest)**
- [ ] **Fase 6: Dockerização, Observabilidade e Práticas de Produção**

---

## 🗄️ Fase 1: Configuração do Ambiente e Banco de Dados
Configuração do ecossistema Python, estrutura de diretórios e migrations do banco de dados do catálogo.

- [X] **M1.1: Inicialização do Projeto e Dependências**
  - [X] Configurar ambiente virtual (`python -m venv venv`) ou inicializar gerenciador (`poetry init`).
  - [X] Instalar pacotes essenciais: `fastapi`, `uvicorn[standard]`, `sqlalchemy`, `alembic`, `psycopg2-binary` (ou `asyncpg` para conexões assíncronas) e `pydantic[email]`.
  - [X] Organizar a estrutura de arquivos modular em português:
    - `/app/principal.py` (Ponto de inicialização do FastAPI)
    - `/app/core/configuracoes.py` (Configurações e variáveis de ambiente)
    - `/app/core/banco.py` (Conexão do SQLAlchemy e SessionLocal)
    - `/app/modelos/` (Modelos físicos do banco de dados em português)
    - `/app/esquemas/` (Estruturas de validação Pydantic)
    - `/app/api/` (Rotas HTTP e controladores)
    - `/app/crud/` (Lógica de leitura/escrita no banco de dados)
- [X] **M1.2: Modelagem Física do Banco com SQLAlchemy**
  - [X] Criar modelo `Biblioteca` (Biblioteca Física):
    - Campos: `id` (UUID ou ID serial), `nome` (Ex: "Biblioteca Setor Sul"), `localizacao` (descrição física do local), `ativo` (booleano), `criado_em` e `atualizado_em`.
  - [X] Criar modelo `Livro` (Livro Físico):
    - Campos: `id` (UUID ou ID serial), `titulo`, `autor`, `isbn`, `categoria` (gênero), `ano_publicacao`, `capa_url`, `quantidade_total`, `quantidade_disponivel`, `id_biblioteca` (ForeignKey referenciando `Biblioteca`), `ativo` (booleano), `criado_em` e `atualizado_em`.
- [X] **M1.3: Setup e Migração com Alembic**
  - [X] Executar `alembic init alembic` para estruturar as pastas de migração.
  - [X] Configurar `env.py` para carregar dinamicamente a string do banco PostgreSQL Neon (`URL_BANCO_DADOS`) e registrar os metadados do SQLAlchemy (`Base.metadata`) para autogeração.
  - [X] Gerar e aplicar a primeira migration de criação das tabelas `bibliotecas` e `livros`, configurando chaves estrangeiras e índices em `livros.titulo`, `livros.isbn` e `livros.id_biblioteca`.

---

## 💾 Fase 2: Schemas Pydantic e Lógica ORM (SQLAlchemy)
Configuração das validações e criação das operações de banco (CRUD) em português.

- [X] **M2.1: Esquemas de Dados com Pydantic (`esquemas`)**
  - [X] Criar esquemas de entrada e saída para Bibliotecas (`CriarBiblioteca`, `RespostaBiblioteca`).
  - [X] Criar esquemas de entrada e saída para Livros (`CriarLivro`, `AtualizarLivro`, `RespostaLivro`).
  - [X] Garantir validação estrita do formato do código ISBN utilizando regras customizadas do Pydantic.
- [X] **M2.2: Operações de CRUD (`app/crud/`)**
  - [X] Desenvolver operações para a entidade `Biblioteca` (criar, listar ativas, buscar por ID).
  - [X] Desenvolver operações para a entidade `Livro`:
    - `criar_livro`: Criar novo título validando se a biblioteca associada existe.
    - `buscar_livro_por_id`: Buscar livro incluindo o relacionamento carregado (JOIN) com a biblioteca de origem.
    - `listar_livros`: Listar livros com paginação (`limite`/`deslocamento`) e suporte a filtros opcionais por título, autor, categoria e ID da biblioteca.
    - `atualizar_estoque_livro`: Atualizar quantidade em estoque (decremento e incremento, usado em fluxos de empréstimos e devoluções).

---

## 🌐 Fase 3: Desenvolvimento de APIs REST e Endpoints (FastAPI)
Exposição de endpoints para o frontend e consumo interno de outros serviços.

- [X] **M3.1: APIs de Gestão de Bibliotecas**
  - [X] `POST /api/bibliotecas` (Protegido - Apenas Administrador): Cadastro de bibliotecas.
  - [X] `GET /api/bibliotecas` (Público): Listagem de todas as bibliotecas disponíveis no sistema.
- [X] **M3.2: APIs de Catálogo de Livros**
  - [X] `POST /api/livros` (Protegido - Apenas Administrador): Cadastro de um livro no acervo.
  - [X] `GET /api/livros` (Público): Pesquisa de livros com filtros dinâmicos e paginação.
  - [X] `GET /api/livros/{id}` (Público/Integração): Detalhes de um livro específico.
    - **Importante:** Este endpoint será consumido via chamada HTTP interna síncrona pelo `Serviço de Empréstimo`. Deve retornar um payload limpo informando a disponibilidade física do exemplar.
  - [X] `PUT /api/livros/{id}` (Protegido - Apenas Administrador): Atualização de metadados do livro.
  - [X] `DELETE /api/livros/{id}` (Protegido - Apenas Administrador): Exclusão lógica (desativação do livro).

---

## 🛡️ Fase 4: Segurança, Autorização e Otimização de Performance
Controle de segurança baseado em papéis (permissões) e aceleração de buscas.

- [ ] **M4.1: Validação de Autenticação JWT**
  - [ ] Criar dependência FastAPI (`Depends`) para ler o JWT repassado pelo Gateway de API através do header `Authorization`.
  - [ ] Decodificar o payload e verificar a permissão do usuário (`permissao`). Restringir rotas administrativas de cadastro/edição de livros, bloqueando acessos não-autorizados (`403 Forbidden`).
- [ ] **M4.2: Otimização de Performance com Cache**
  - [ ] Implementar cache em memória (ex: `fastapi-cache` ou Redis) na rota de listagem de livros (`GET /api/livros`), diminuindo acessos ao PostgreSQL Neon.
- [ ] **M4.3: Documentação de APIs**
  - [ ] Customizar as respostas padrão e tags descritivas para gerar o Swagger em português.

---

## 🧪 Fase 5: Testes Automatizados (pytest)
Testes unitários e de integração para garantir a estabilidade do catálogo.

- [ ] **M5.1: Setup do Pytest**
  - [ ] Configurar `conftest.py` contendo fixtures para inicialização do banco de dados temporário de testes (usando SQLite em memória ou PostgreSQL local).
- [ ] **M5.2: Testes de Integração e Rotas**
  - [ ] Testar criação e listagem de bibliotecas.
  - [ ] Testar regras de validação do Pydantic para ISBN incorreto ou quantidade negativa.
  - [ ] Testar segurança das rotas (garantir que usuários comuns recebam `403` ao tentar cadastrar livros).

---

## 🚀 Fase 6: Dockerização, Observabilidade e Produção
Deploy e padrões operacionais profissionais.

- [ ] **M6.1: Dockerfile Otimizado**
  - [ ] Criar `Dockerfile` usando imagem `python:3.11-slim` executando o servidor de produção Uvicorn de forma segura como usuário não-root.
- [ ] **M6.2: Graceful Shutdown**
  - [ ] Configurar eventos de encerramento (`shutdown`) no FastAPI para gerenciar a desconexão limpa do pool de conexões do SQLAlchemy.
- [ ] **M6.3: Health Check e Logs**
  - [ ] Criar rotas `/saude` e `/pronto` verificando integridade do PostgreSQL.
  - [ ] Configurar logging para gerar logs estruturados em formato JSON em português.

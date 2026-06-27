# 📋 Checklist de Tarefas - Recommendation Service (Serviço de Recomendação)

Este documento funciona como um guia de acompanhamento (To-Do List) para a implementação completa do microsserviço **Recommendation Service**, desenvolvido em **Python (FastAPI)**. Ele gera o histórico de utilização e prepara a base para futuras recomendações inteligentes da plataforma "Nosso Livro".

> [!IMPORTANT]
> Este microsserviço funciona de forma reativa e assíncrona, escutando eventos do RabbitMQ para construir o histórico de leitura dos usuários. O mecanismo de recomendação deve iniciar como uma lógica estruturada (stub) e ser modular o suficiente para receber modelos de Inteligência Artificial no futuro.

---

## 🗺️ Mapa de Progresso Geral

- [ ] **Fase 1: Configuração do Ambiente e Banco de Dados (Python + Alembic)**
- [ ] **Fase 2: Consumidor RabbitMQ (Mensageria Assíncrona com `aio-pika`)**
- [ ] **Fase 3: Motor de Recomendação (Lógica de Negócio e Stubs - RF10)**
- [ ] **Fase 4: APIs REST e Endpoints de Consulta (FastAPI)**
- [ ] **Fase 5: Testes Automatizados e Cobertura (pytest)**
- [ ] **Fase 6: Dockerização, Observabilidade e Práticas de Produção**

---

## 🗄️ Fase 1: Configuração do Ambiente e Banco de Dados
Configuração da stack Python e modelagem física dos dados do histórico e estatísticas de uso.

- [ ] **M1.1: Inicialização do Projeto e Pacotes**
  - [ ] Criar ambiente virtual Python e instalar as dependências core: `fastapi`, `uvicorn[standard]`, `sqlalchemy`, `alembic`, `psycopg2-binary` (ou `asyncpg`), `pydantic` e `aio-pika` (motor assíncrono para o RabbitMQ).
  - [ ] Organizar diretórios do projeto:
    - `/app/main.py`
    - `/app/core/config.py` (Variáveis de ambiente)
    - `/app/core/database.py` (PostgreSQL Neon)
    - `/app/models/` (Modelos SQLAlchemy para histórico e popularidade)
    - `/app/schemas/` (Estruturas Pydantic)
    - `/app/api/` (Roteadores de endpoints)
    - `/app/services/` (Lógica do motor de recomendações)
    - `/app/workers/` (Consumidores em background do RabbitMQ)
- [ ] **M1.2: Modelagem Física do Banco (`recommendations_db`)**
  - [ ] Criar modelo `ReadingHistory` (Histórico de Leitura):
    - Campos: ID (UUID ou Serial), `user_id` (UUID), `book_id` (UUID), `categoria` (string - útil para classificar preferências), `data_inicio` (timestamp), `data_fim` (timestamp, nullable) e `status` (Ex: `'LENDO'`, `'CONCLUIDO'`).
  - [ ] Criar modelo `BookPopularity` (Popularidade de Livros):
    - Campos: `book_id` (UUID, chave primária), `titulo` (string), `categoria` (string) e `total_emprestimos` (contador inteiro).
- [ ] **M1.3: Migrations com Alembic**
  - [ ] Configurar conexão com o Neon no `env.py` do Alembic.
  - [ ] Criar migração de tabelas incluindo indexações otimizadas para agregação de histórico: `reading_history.user_id` e `book_popularity.total_emprestimos` (ordenação reversa para ranking).

---

## ✉️ Fase 2: Consumidor RabbitMQ (Mensageria Assíncrona com `aio-pika`)
Captação de eventos de empréstimos e devoluções para retroalimentar o histórico sem acoplamento síncrono.

- [ ] **M2.1: Desenvolvimento do Worker Consumidor**
  - [ ] Criar o worker em `/app/workers/event_consumer.py` usando `aio-pika`.
  - [ ] Implementar a escuta de eventos na exchange do RabbitMQ associada ao `Loan Service`.
  - [ ] Configurar fila própria (`recommendations_queue`) vinculada às routing keys dos eventos:
    - **`loan.created`**:
      - Ação: Criar registro em `ReadingHistory` com status `'LENDO'` e incrementar o contador correspondente do livro na tabela `BookPopularity`.
    - **`loan.returned`**:
      - Ação: Localizar registro ativo em `ReadingHistory` para o respectiva combinação de usuário/livro e alterar o status para `'CONCLUIDO'`, gravando a data final.
- [ ] **M2.2: Inicialização em Background e Resiliência**
  - [ ] Configurar a tarefa do worker para iniciar em background no ciclo de vida de inicialização (`startup`) do FastAPI.
  - [ ] Implementar política de reconexão automática caso a conexão com o broker seja interrompida, evitando perda de eventos.

---

## 🤖 Fase 3: Motor de Recomendação (Lógica de Negócio e Stubs - RF10)
Estruturação da inteligência do sistema em formato modular de fácil substituição.

- [ ] **M3.1: Implementação da Lógica do Stub de Recomendação**
  - [ ] Desenvolver classe `RecommenderService` em `/app/services/recommender.py`.
  - [ ] Criar lógica heurística inicial baseada em dados:
    - Buscar categorias que o usuário mais leu na tabela `ReadingHistory`.
    - Buscar livros mais populares pertencentes a essas mesmas categorias da tabela `BookPopularity` (excluindo os livros que o usuário já leu).
    - Caso o usuário não tenha histórico, retornar uma lista padrão baseada nos mais emprestados globalmente (fallback).
- [ ] **M3.2: Modularidade para Machine Learning**
  - [ ] Desenvolver a assinatura do método de recomendação de forma abstrata. Isso garante que a substituição futura por bibliotecas de data science (como `pandas`, `scikit-learn` ou modelos de NLP/embeddings baseados em redes neurais) exija apenas a mudança interna na lógica do serviço, mantendo intactas as rotas da API.

---

## 🌐 Fase 4: APIs REST e Endpoints de Consulta (FastAPI)
Rotas de retorno de dados para exibição de recomendações e estatísticas no Frontend.

- [ ] **M4.1: Desenvolvimento das APIs**
  - [ ] `GET /api/recommendations/user/{user_id}` (Protegido - Membro):
    - Retorna a lista de IDs de livros sugeridos de forma personalizada com base no algoritmo da Fase 3.
  - [ ] `GET /api/recommendations/popular` (Público):
    - Retorna os títulos de livros mais emprestados no sistema geral para exibição em vitrines de destaque no frontend.
  - [ ] `GET /api/recommendations/history/{user_id}` (Protegido - RF08):
    - Retorna a lista do histórico de livros lidos do usuário com status de leitura.
- [ ] **M4.2: Validação de Token JWT**
  - [ ] Adicionar dependência para descriptografia e leitura do token repassado pelo API Gateway, extraindo dados do usuário logado para auditoria e segurança.

---

## 🧪 Fase 5: Testes Automatizados e Cobertura (pytest)
Garantia de integridade do motor de sugestões e de consistência do consumo de eventos.

- [ ] **M5.1: Configuração de Testes de Recomendação**
  - [ ] Desenvolver testes unitários para a classe `RecommenderService`.
  - [ ] Simular um histórico de leitura artificial do usuário e verificar se as recomendações sugeridas respeitam as categorias de preferência definidas no mock.
- [ ] **M5.2: Testes de Integração do Consumidor**
  - [ ] Mockar mensagens simuladas do RabbitMQ no formato JSON (`loan.created` e `loan.returned`) e injetar diretamente no worker.
  - [ ] Verificar se as tabelas `ReadingHistory` e `BookPopularity` são alteradas corretamente de forma assíncrona no banco de testes.

---

## 🚀 Fase 6: Dockerização, Observabilidade e Práticas de Produção
Deploy e acompanhamento dinâmico do comportamento de consumo.

- [ ] **M6.1: Dockerfile Otimizado**
  - [ ] Criar `Dockerfile` multi-stage com compilação de dependências e imagem final `python:3.11-slim` executada sob privilégios restritos (usuário não-root).
- [ ] **M6.2: Graceful Shutdown das Conexões**
  - [ ] Configurar desativação do FastAPI fechando o canal e conexões assíncronas do RabbitMQ (`aio-pika`) e o pool de conexões com o Neon PostgreSQL.
- [ ] **M6.3: Health Check e Observabilidade**
  - [ ] Rotas `/healthz` e `/readyz` verificando integridade do PostgreSQL e conexão com o RabbitMQ.
  - [ ] Logs JSON estruturados identificando eventos recebidos, tempos de processamento da lógica de recomendação e erros de processamento assíncrono.

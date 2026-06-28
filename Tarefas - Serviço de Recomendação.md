# 📋 Checklist de Tarefas - Serviço de Recomendação

Este documento funciona como um guia de acompanhamento (To-Do List) para a implementação completa do microsserviço **Serviço de Recomendação**, desenvolvido em **Python (FastAPI)**. Ele gera o histórico de utilização e prepara a base para futuras recomendações inteligentes da plataforma "Nosso Livro".

> [!IMPORTANT]
> **REGRA DE IDIOMA DO PROJETO (PT-BR):**
> Todo o desenvolvimento deste microsserviço (incluindo rotas HTTP, payloads JSON, nomes de variáveis, classes, funções, tabelas do banco de dados, comentários de código, mensagens de log, eventos do RabbitMQ e commits) deve ser realizado estritamente em **Português do Brasil (PT-BR)**. É proibido o uso de termos em inglês nas implementações internas e externas deste serviço.

---

## 🗺️ Mapa de Progresso Geral

- [X] **Fase 1: Configuração do Ambiente e Banco de Dados (Python + Alembic)**
- [ ] **Fase 2: Consumidor RabbitMQ (Mensageria Assíncrona com `aio-pika`)**
- [ ] **Fase 3: Motor de Recomendação (Lógica de Negócio e Stubs - RF10)**
- [ ] **Fase 4: APIs REST e Endpoints de Consulta (FastAPI)**
- [ ] **Fase 5: Testes Automatizados e Cobertura (pytest)**
- [ ] **Fase 6: Dockerização, Observabilidade e Práticas de Produção**

---

## 🗄️ Fase 1: Configuração do Ambiente e Banco de Dados
Configuração da stack Python e modelagem física dos dados do histórico e estatísticas de uso.

- [X] **M1.1: Inicialização do Projeto e Pacotes**
  - [X] Criar ambiente virtual Python e instalar dependências core: `fastapi`, `uvicorn[standard]`, `sqlalchemy`, `alembic`, `psycopg2-binary` (ou `asyncpg`), `pydantic` e `aio-pika` (RabbitMQ).
  - [X] Organizar diretórios em português:
    - `/app/principal.py` (Ponto de inicialização do FastAPI)
    - `/app/core/configuracoes.py` (Variáveis de ambiente)
    - `/app/core/banco.py` (PostgreSQL Neon)
    - `/app/modelos/` (Modelos SQLAlchemy para histórico e popularidade)
    - `/app/esquemas/` (Estruturas Pydantic)
    - `/app/api/` (Roteadores de endpoints)
    - `/app/servicos/` (Lógica do motor de recomendações)
    - `/app/trabalhadores/` (Trabalhadores em segundo plano para consumo do RabbitMQ)
- [X] **M1.2: Modelagem Física do Banco (`banco_recomendacoes`)**
  - [X] Criar modelo `HistoricoLeitura` (Histórico de Leitura):
    - Campos: `id` (UUID ou Serial), `id_usuario` (UUID), `id_livro` (UUID), `categoria` (string - útil para classificar preferências), `data_inicio` (timestamp), `data_fim` (timestamp, nullable) e `estado` (Ex: `'LENDO'`, `'CONCLUIDO'`).
  - [X] Criar modelo `PopularidadeLivro` (Popularidade de Livros):
    - Campos: `id_livro` (UUID, chave primária), `titulo` (string), `categoria` (string) e `total_emprestimos` (contador inteiro).
- [X] **M1.3: Migrations com Alembic**
  - [X] Configurar conexão com o Neon no `env.py` do Alembic.
  - [X] Criar migração de tabelas incluindo indexações otimizadas para agregação de histórico: `historico_leitura.id_usuario` e `popularidade_livro.total_emprestimos`.

---

## ✉️ Fase 2: Consumidor RabbitMQ (Mensageria Assíncrona com `aio-pika`)
Captação de eventos de empréstimos e devoluções para retroalimentar o histórico sem acoplamento síncrono.

- [ ] **M2.1: Desenvolvimento do Consumidor**
  - [ ] Criar o worker em `/app/trabalhadores/consumidor_eventos.py` usando `aio-pika`.
  - [ ] Implementar a escuta de eventos na exchange do RabbitMQ associada ao `Serviço de Empréstimo`.
  - [ ] Configurar fila própria (`fila_recomendacoes`) vinculada às chaves de roteamento dos eventos:
    - **`emprestimo.criado`**:
      - Ação: Criar registro em `HistoricoLeitura` com estado `'LENDO'` e incrementar o contador correspondente do livro na tabela `PopularidadeLivro`.
    - **`emprestimo.devolvido`**:
      - Ação: Localizar registro ativo em `HistoricoLeitura` para a respectiva combinação de usuário/livro e alterar o estado para `'CONCLUIDO'`, gravando a data final.
- [ ] **M2.2: Inicialização e Resiliência**
  - [ ] Configurar a tarefa do consumidor para iniciar em segundo plano na inicialização (`startup`) do FastAPI.
  - [ ] Implementar política de reconexão automática caso o broker caia.

---

## 🤖 Fase 3: Motor de Recomendação (Lógica de Negócio e Stubs - RF10)
Estruturação da inteligência do sistema em formato modular de fácil substituição.

- [ ] **M3.1: Implementação da Lógica do Stub de Recomendação**
  - [ ] Desenvolver classe `ServicoRecomendacao` em `/app/servicos/recomendador.py`.
  - [ ] Criar lógica heurística inicial baseada em dados:
    - Buscar categorias que o usuário mais leu na tabela `HistoricoLeitura`.
    - Buscar livros mais populares pertencentes a essas mesmas categorias da tabela `PopularidadeLivro` (excluindo os livros que o usuário já leu).
    - Caso o usuário não tenha histórico, retornar uma lista padrão baseada nos mais emprestados globalmente (fallback).
- [ ] **M3.2: Modularidade para Machine Learning**
  - [ ] Desenvolver a assinatura do método de recomendação de forma abstrata. Isso garante que a substituição futura por modelos de Machine Learning (como IA baseada em embeddings) exija apenas a mudança interna na lógica do serviço, mantendo intactas as rotas da API.

---

## 🌐 Fase 4: APIs REST e Endpoints de Consulta (FastAPI)
Rotas de retorno de dados para exibição de recomendações e estatísticas no Frontend.

- [ ] **M4.1: Desenvolvimento das APIs**
  - [ ] `GET /api/recomendacoes/usuario/{id_usuario}` (Protegido - Membro):
    - Retorna a lista de IDs de livros sugeridos de forma personalizada com base no algoritmo da Fase 3.
  - [ ] `GET /api/recomendacoes/populares` (Público):
    - Retorna os títulos de livros mais emprestados no sistema geral para exibição em vitrines de destaque no frontend.
  - [ ] `GET /api/recomendacoes/historico/{id_usuario}` (Protegido - RF08):
    - Retorna a lista do histórico de livros lidos do usuário com estado de leitura.
- [ ] **M4.2: Validação de Token JWT**
  - [ ] Adicionar dependência para descriptografia do token repassado pelo Gateway de API.

---

## 🧪 Fase 5: Testes Automatizados e Cobertura (pytest)
Garantia de integridade do motor de sugestões e de consistência do consumo de eventos.

- [ ] **M5.1: Configuração de Testes de Recomendação**
  - [ ] Desenvolver testes unitários para a classe `ServicoRecomendacao`.
  - [ ] Simular um histórico de leitura artificial do usuário e verificar se as recomendações sugeridas respeitam as categorias de preferência definidas no mock.
- [ ] **M5.2: Testes de Integração do Consumidor**
  - [ ] Mockar mensagens simuladas do RabbitMQ no formato JSON (`emprestimo.criado` e `emprestimo.devolvido`) e injetar diretamente no consumidor.
  - [ ] Verificar se as tabelas `HistoricoLeitura` e `PopularidadeLivro` são alteradas corretamente.

---

## 🚀 Fase 6: Dockerização, Observabilidade e Práticas de Produção
Deploy e acompanhamento dinâmico do comportamento de consumo.

- [ ] **M6.1: Dockerfile Otimizado**
  - [ ] Criar `Dockerfile` multi-stage com imagem final `python:3.11-slim` executada como usuário não-root.
- [ ] **M6.2: Graceful Shutdown das Conexões**
  - [ ] Configurar desativação do FastAPI fechando o canal e conexões assíncronas do RabbitMQ (`aio-pika`) e o pool do PostgreSQL de forma limpa.
- [ ] **M6.3: Health Check e Observabilidade**
  - [ ] Rotas `/saude` e `/pronto` de integridade.
  - [ ] Logs JSON estruturados identificando eventos recebidos, tempos de processamento da recomendação e erros de processamento assíncrono.

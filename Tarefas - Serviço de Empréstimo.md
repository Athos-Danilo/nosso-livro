# 📋 Checklist de Tarefas - Serviço de Empréstimo

Este documento funciona como um guia de acompanhamento (To-Do List) para a implementação completa do microsserviço **Serviço de Empréstimo**, desenvolvido em **Go (Golang)**. Ele gerencia as regras de empréstimos, devoluções e históricos da plataforma "Nosso Livro".

> [!IMPORTANT]
> **REGRA DE IDIOMA DO PROJETO (PT-BR):**
> Todo o desenvolvimento deste microsserviço (incluindo rotas HTTP, payloads JSON, nomes de variáveis, structs, funções, tabelas do banco de dados, comentários de código, mensagens de log, eventos do RabbitMQ e commits) deve ser realizado estritamente em **Português do Brasil (PT-BR)**. É proibido o uso de termos em inglês nas implementações internas e externas deste serviço.

---

## 🗺️ Mapa de Progresso Geral

- [x] **Fase 1: Configuração do Módulo e Banco de Dados (Go + PostgreSQL)**
- [x] **Fase 2: Clientes HTTP Resilientes (Integração Síncrona Inter-serviços)**
- [x] **Fase 3: Conexão e Publicação com RabbitMQ (Mensageria)**
- [x] **Fase 4: Camada de Serviços e Lógica de Negócios (Transações e Concorrência)**
- [x] **Fase 5: Rotas HTTP, Middlewares e Handlers (Controladores)**
- [ ] **Fase 6: Testes Automatizados e Concorrência (Prevenção de Condição de Corrida)**
- [ ] **Fase 7: Dockerização, Desligamento Gracioso e Monitoramento**

---

## 🗄️ Fase 1: Configuração do Módulo e Banco de Dados
Inicialização do ambiente, Clean Architecture e migração do banco transacional.

- [x] **M1.1: Inicialização do Projeto Go**
  - [x] Executar `go mod init nosso-livro/servico-emprestimo` dentro da pasta `./backend/servico-emprestimo/`
  - [x] Organizar diretórios segundo o padrão Clean Architecture em português:
    - `/cmd/api/principal.go`
    - `/internal/dominio` (Entidades, interfaces e contratos)
    - `/internal/repositorio` (Acesso ao banco `banco_emprestimos`)
    - `/internal/cliente` (Chamadas HTTP para outros microsserviços)
    - `/internal/servico` (Lógica de negócios e transações)
    - `/internal/controlador` (Controladores HTTP)
    - `/internal/evento` (Publishers de eventos do RabbitMQ)
    - `/migrations` (Estruturação das tabelas via SQL em português)
- [x] **M1.2: Configuração de Migrações com `golang-migrate`**
  - [x] Criar a primeira migração (`000001_cria_tabela_emprestimos.up.sql`):
    - Tabela `emprestimos`: `id` (UUID primário), `id_usuario` (UUID), `id_livro` (UUID), `id_biblioteca` (UUID), `data_emprestimo` (timestamp), `data_devolucao_prevista` (timestamp), `data_devolucao_real` (timestamp, nullable), `estado` (Ex: `'ATIVO'`, `'DEVOLVIDO'`, `'ATRASADO'`), `criado_em` e `atualizado_em`.
    - Índices criados para otimização de consultas de relatórios: `emprestimos.id_usuario`, `emprestimos.id_livro` e `emprestimos.estado`.
- [x] **M1.3: Conexão e Configuração de Pool PostgreSQL**
  - [x] Configurar conexão para `banco_emprestimos` hospedado na Neon.
  - [x] Utilizar pool de conexões otimizado (`pgx/v5` ou `sqlx`) e implementar retry automático contra falhas por inatividade temporária (cold start).

---

## 🔗 Fase 2: Clientes HTTP Resilientes (Integração Síncrona Inter-serviços)
Consumo seguro das APIs externas para validação de dados de usuários e livros.

- [x] **M2.1: Desenvolvimento do Cliente de Usuários**
  - [x] Criar `ClienteUsuario` em `/internal/cliente` que efetua chamadas para `GET /api/usuarios/{id}` do **Serviço de Autenticação e Usuário**.
  - [x] Validar se o usuário existe e se está ativo (`ativo == true`) antes de autorizar qualquer empréstimo.
- [x] **M2.2: Desenvolvimento do Cliente de Catálogo**
  - [x] Criar `ClienteCatalogo` que efetua chamadas para `GET /api/livros/{id}` do **Serviço de Catálogo e Biblioteca**.
  - [x] Validar se o livro físico existe, está ativo e disponível para empréstimo.
- [x] **M2.3: Resiliência de Rede**
  - [x] Configurar `http.Client` com timeouts rígidos (máximo 3s).
  - [x] Implementar retentativas automáticas (retry) com backoff exponencial para contornar oscilações de rede.

---

## ✉️ Fase 3: Conexão e Publicação com RabbitMQ (Mensageria)
Disparo confiável de eventos assíncronos para o Message Broker.

- [x] **M3.1: Configuração do Driver do RabbitMQ**
  - [x] Instalar o pacote oficial `github.com/rabbitmq/amqp091-go`.
  - [x] Criar lógica de conexão e reconexão automática resiliente ao broker.
- [x] **M3.2: Implementação do Publicador de Eventos**
  - [x] Criar o componente de disparo de eventos em `/internal/evento`.
  - [x] Desenvolver função de publicação para o evento **`emprestimo.criado`** contendo o ID do empréstimo, ID do usuário, ID do livro, ID da biblioteca e data limite de devolução.
  - [x] Desenvolver função de publicação para o evento **`emprestimo.devolvido`** contendo o ID do empréstimo, ID do usuário, ID do livro e a data real da devolução.
  - [x] Garantir resiliência na publicação ativando o mecanismo de **Publisher Confirms** do RabbitMQ.

---

## 💼 Fase 4: Camada de Serviços e Lógica de Negócios (Transações)
Lógica de empréstimos e devoluções com controle concorrente estrito.

- [x] **M4.1: Fluxo de Criação de Empréstimos**
  - [x] Validar a existência do usuário e livro síncronamente via clientes HTTP.
  - [x] Checar no banco local se o usuário já possui pendências de livros em atraso (impedindo novos empréstimos).
  - [x] Gravar o registro do empréstimo definindo a data de devolução prevista (ex: data atual + 14 dias).
  - [x] **Controle de Concorrência Rígido:** Utilizar transações com isolamento adequado no PostgreSQL ou Locks pessimistas baseados no ID do livro para garantir que um exemplar disponível não seja associado a dois empréstimos concorrentes executados simultaneamente.
  - [x] Disparar o evento assíncrono `emprestimo.criado` via RabbitMQ.
- [x] **M4.2: Fluxo de Devolução de Empréstimo**
  - [x] Buscar o registro do empréstimo ativo no banco pelo ID.
  - [x] Atualizar o campo `data_devolucao_real` com a data/hora atual e mudar o estado para `'DEVOLVIDO'`.
  - [x] Disparar o evento assíncrono `emprestimo.devolvido` via RabbitMQ.

---

## 🌐 Fase 5: Rotas HTTP, Middlewares e Handlers (Controladores)
Desenvolvimento das rotas de consumo externo e integração com segurança.

- [x] **M5.1: Desenvolvimento dos Endpoints**
  - [x] `POST /api/emprestimos` (Protegido - Membro):
    - [x] Recebe `id_livro` e `id_biblioteca` no JSON de entrada.
    - [x] Extrai o `id_usuario` diretamente das claims do JWT inseridas no contexto pelo middleware.
    - [x] Cria o empréstimo seguindo a lógica de negócio e retorna o status `201 Created`.
  - [x] `POST /api/emprestimos/{id}/devolucao` (Protegido - Administrador/Membro):
    - [x] Finaliza o empréstimo alterando o estado no banco e disparando evento de devolução.
  - [x] `GET /api/emprestimos` (Protegido):
    - [x] Lista os empréstimos cadastrados com filtros por usuário, livro, estado e paginação.
  - [x] `GET /api/emprestimos/historico` (Protegido - RF08):
    - [x] Gera histórico ou logs consolidados de empréstimos por filtro de livro ou por usuário específico.
- [x] **M5.2: Middlewares de Proteção**
  - [x] Middleware CORS e Middleware de logs das requisições.
  - [x] Middleware de Autenticação JWT (para descriptografar o cabeçalho do API Gateway e injetar os dados do usuário).

---

## 🧪 Fase 6: Testes Automatizados e Concorrência
Garantia de que transações concorrentes e fluxos de integração funcionem.

- [ ] **M6.1: Testes Unitários de Lógica de Negócio**
  - [ ] Testar regras de validação de datas (prazos de devolução expirados, cálculo de dias decorridos).
- [ ] **M6.2: Testes de Integração com Banco e Chamadas Mockadas**
  - [ ] Implementar testes utilizando `testcontainers-go` com banco PostgreSQL dinâmico.
  - [ ] Mockar as respostas do `ClienteUsuario` e `ClienteCatalogo`.
- [ ] **M6.3: Testes de Stress de Concorrência Massiva (Race Detector)**
  - [ ] Desenvolver um teste de concorrência que simula 50 goroutines simultâneas tentando registrar empréstimo para o mesmo ID de livro. Garantir que exatamente 1 empréstimo seja aceito com sucesso e as outras 49 requisições retornem erro controlado.
  - [ ] Executar toda a suíte de testes com a flag `-race` do Go ativa.

---

## 🚀 Fase 7: Dockerização, Desligamento Gracioso e Monitoramento
Preparação operacional para ambientes Docker e nuvem de produção.

- [ ] **M7.1: Dockerfile Otimizado**
  - [ ] Criar `Dockerfile` multi-stage compilando o binário Go de forma estática e gerando imagem final enxuta baseada em `scratch` ou `alpine` mínimo.
- [ ] **M7.2: Desligamento Gracioso (Graceful Shutdown)**
  - [ ] Interceptação dos sinais `SIGINT` e `SIGTERM`: fechar servidor HTTP, concluir transações em andamento, desconectar do RabbitMQ e fechar o pool de conexões do banco de dados.
- [ ] **M7.3: Health Check e Observabilidade**
  - [ ] Endpoints de saúde `/saude` e `/pronto`.
  - [ ] Logs estruturados JSON em português com o pacote nativo `slog`.

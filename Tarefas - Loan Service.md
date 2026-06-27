# 📋 Checklist de Tarefas - Loan Service (Serviço de Empréstimos)

Este documento funciona como um guia de acompanhamento (To-Do List) para a implementação completa do microsserviço **Loan Service**, desenvolvido em **Go (Golang)**. Ele gerencia as regras de empréstimos, devoluções e históricos da plataforma "Nosso Livro".

> [!IMPORTANT]
> Por ser o núcleo transacional do sistema, o serviço deve garantir transações ACID robustas, proteção rígida contra concorrência dupla de livros físicos, resiliência nas conexões HTTP com serviços parceiros e confiabilidade no disparo de eventos para o RabbitMQ.

---

## 🗺️ Mapa de Progresso Geral

- [ ] **Fase 1: Configuração do Módulo e Banco de Dados (Go + PostgreSQL)**
- [ ] **Fase 2: Clientes HTTP Resilientes (Integração Síncrona - Opção A)**
- [ ] **Fase 3: Conexão e Publicação com RabbitMQ (Comunicação Assíncrona)**
- [ ] **Fase 4: Camada de Serviços e Lógica de Negócios (Transactions & Concurrency)**
- [ ] **Fase 5: Rotas HTTP, Middlewares e Handlers (HTTP Layer)**
- [ ] **Fase 6: Testes Automatizados e Garantia contra Condições de Corrida**
- [ ] **Fase 7: Dockerização, Graceful Shutdown e Monitoramento**

---

## 🗄️ Fase 1: Configuração do Módulo e Banco de Dados
Inicialização do ambiente, Clean Architecture e migração do banco transacional.

- [ ] **M1.1: Inicialização do Projeto Go**
  - [ ] Executar `go mod init nosso-livro/loan-service`
  - [ ] Organizar diretórios segundo o padrão Clean Architecture:
    - `/cmd/api/main.go`
    - `/internal/domain` (Entidades, interfaces e contratos)
    - `/internal/repository` (Acesso ao banco `loans_db`)
    - `/internal/client` (Chamadas HTTP para outros microsserviços)
    - `/internal/service` (Lógica de negócios e transações)
    - `/internal/handler` (Controladores HTTP)
    - `/internal/event` (Publishers de eventos do RabbitMQ)
    - `/migrations` (Estruturação das tabelas via SQL)
- [ ] **M1.2: Configuração de Migrations com `golang-migrate`**
  - [ ] Criar a primeira migration (`000001_create_loans_table.up.sql`):
    - Tabela `loans`: ID (UUID primário), `user_id` (UUID), `book_id` (UUID), `library_id` (UUID), `data_emprestimo` (timestamp), `data_devolucao_prevista` (timestamp), `data_devolucao_real` (timestamp, nullable), `status` (Ex: `'ATIVO'`, `'DEVOLVIDO'`, `'ATRASADO'`), `criado_em` e `atualizado_em`.
    - Índices criados para otimização de consultas de relatórios: `loans.user_id`, `loans.book_id` e `loans.status`.
- [ ] **M1.3: Conexão e Configuração de Pool PostgreSQL**
  - [ ] Configurar conexão para `loans_db` hospedado na Neon.
  - [ ] Utilizar pool de conexões otimizado (`pgx/v5` ou `sqlx`) e implementar retry automático com tratamento contra falhas por inatividade temporária (cold start).

---

## 🔗 Fase 2: Clientes HTTP Resilientes (Integração Síncrona - Opção A)
Consumo seguro das APIs externas para validação de dados de usuários e livros.

- [ ] **M2.1: Desenvolvimento do Client de Usuários**
  - [ ] Criar `UserClient` em `/internal/client` que efetua chamadas para `GET /api/users/{id}` do **User & Auth Service**.
  - [ ] Validar se o usuário existe e se a conta está ativa (`ativo == true`) antes de autorizar qualquer empréstimo.
- [ ] **M2.2: Desenvolvimento do Client de Catálogo**
  - [ ] Criar `CatalogClient` que efetua chamadas para `GET /api/books/{id}` do **Catalog & Library Service**.
  - [ ] Validar se o livro físico existe, se está em estado ativo e se a biblioteca (`library_id`) informada é a correta.
- [ ] **M2.3: Mecanismos de Resiliência de Rede**
  - [ ] Configurar um `http.Client` customizado com timeouts rígidos (ex: máximo 3 segundos por requisição) para evitar lentidão em cascata.
  - [ ] Implementar retentativas automáticas (retry) com backoff exponencial para lidar com instabilidades temporárias de rede (utilizando pacotes como `github.com/hashicorp/go-retryablehttp`).
  - [ ] Criar testes unitários para os clientes usando `net/http/httptest` para simular cenários de timeout, respostas corrompidas e erros HTTP (500, 404).

---

## ✉️ Fase 3: Conexão e Publicação com RabbitMQ (Mensageria)
Disparo confiável de eventos assíncronos para o Message Broker.

- [ ] **M3.1: Configuração do Driver do RabbitMQ**
  - [ ] Instalar o pacote oficial `github.com/rabbitmq/amqp091-go`.
  - [ ] Criar a lógica de conexão com o RabbitMQ via variável de ambiente.
  - [ ] Implementar um loop de reconexão automática caso o broker caia ou a conexão de rede oscile.
- [ ] **M3.2: Implementação do Publisher de Eventos**
  - [ ] Criar o componente de disparo de eventos em `/internal/event`.
  - [ ] Declarar de forma segura a exchange do tipo `topic` para propagação dos eventos do sistema de empréstimos.
  - [ ] Desenvolver função de publicação para o evento **`loan.created`** contendo o ID do empréstimo, ID do usuário, ID do livro e data limite de devolução.
  - [ ] Desenvolver função de publicação para o evento **`loan.returned`** contendo o ID do empréstimo, ID do usuário, ID do livro e a data real da devolução.
  - [ ] Garantir resiliência na publicação ativando o mecanismo de **Publisher Confirms** do RabbitMQ para certificar que a mensagem foi de fato recebida pelo broker.

---

## 💼 Fase 4: Camada de Serviços e Lógica de Negócios (Transactions)
Lógica de empréstimos e devoluções com controle concorrente estrito.

- [ ] **M4.1: Fluxo de Criação de Empréstimos**
  - [ ] Validar a existência e disponibilidade do usuário e livro síncronamente (usando os Clients HTTP da Fase 2).
  - [ ] Checar no banco local se o usuário já possui pendências de livros em atraso (o que impediria novos empréstimos).
  - [ ] Gravar o registro do empréstimo definindo a data de devolução esperada (ex: data atual + 14 dias).
  - [ ] **Controle de Concorrência Rígido:** Utilizar mecanismos de travamento (ex: transações com isolamento adequado no PostgreSQL ou Locks pessimistas baseados no ID do livro) para certificar que um livro físico disponível não seja associado a dois empréstimos concorrentes executados simultaneamente.
  - [ ] Disparar o evento assíncrono `loan.created` via RabbitMQ.
- [ ] **M4.2: Fluxo de Devolução de Empréstimo**
  - [ ] Buscar o registro do empréstimo ativo no banco pelo ID.
  - [ ] Atualizar o campo `data_devolucao_real` com a data/hora atual e mudar o status para `'DEVOLVIDO'`.
  - [ ] Caso a devolução seja feita com atraso, classificar o registro para posterior processamento ou cálculo de penalidade.
  - [ ] Disparar o evento assíncrono `loan.returned` via RabbitMQ (que será ouvido pelo `Reservation Service` para liberar a fila e pelo `Notification Service`).

---

## 🌐 Fase 5: Rotas HTTP, Middlewares e Handlers (HTTP Layer)
Desenvolvimento das rotas de consumo externo e integração com segurança.

- [ ] **M5.1: Criação dos Handlers**
  - [ ] `POST /api/loans` (Protegido - Membro):
    - Recebe `book_id` e `library_id` no JSON de entrada.
    - Extrai o `user_id` e permissão (`role`) diretamente das claims do JWT inseridas no contexto pelo middleware.
    - Cria o empréstimo seguindo a lógica de negócio e retorna o status `201 Created`.
  - [ ] `POST /api/loans/{id}/return` (Protegido - Admin/Membro):
    - Finaliza o empréstimo alterando o status no banco e disparando evento de devolução.
  - [ ] `GET /api/loans` (Protegido):
    - Lista os empréstimos cadastrados com filtros por usuário, livro, status e paginação.
  - [ ] `GET /api/loans/history` (Protegido - RF08):
    - Gera histórico ou logs consolidados de empréstimos por filtro de livro ou por usuário específico.
- [ ] **M5.2: Middlewares de Proteção**
  - [ ] Middleware CORS.
  - [ ] Middleware de recuperação de pânicos (Panic Recovery) com resposta JSON controlada.
  - [ ] Middleware de Autenticação JWT (para descriptografar o cabeçalho repassado pelo API Gateway e injetar os dados do usuário logado na requisição).

---

## 🧪 Fase 6: Testes Automatizados e Concorrência
Garantia de que transações concorrentes e fluxos de integração funcionem.

- [ ] **M6.1: Testes Unitários de Lógica de Negócio**
  - [ ] Testar regras de validação de datas (prazos de devolução expirados, cálculo de dias decorridos).
  - [ ] Testar cenários de bloqueio de usuário (usuário com empréstimos atrasados não pode pegar novos livros).
- [ ] **M6.2: Testes de Integração com Banco e Chamadas Mockadas**
  - [ ] Implementar testes utilizando `testcontainers-go` com banco PostgreSQL dinâmico.
  - [ ] Mockar as respostas do `UserClient` e `CatalogClient` para simular cenários em que o livro está indisponível ou usuário inexistente.
- [ ] **M6.3: Testes de Stress de Concorrência Massiva (Race Detector)**
  - [ ] Desenvolver um teste de concorrência que simula 50 goroutines simultâneas tentando registrar empréstimo para o mesmo ID de livro.
  - [ ] Garantir que exatamente 1 empréstimo seja aceito com sucesso e as outras 49 requisições retornem erro controlado de conflito, sem travar o banco.
  - [ ] Executar toda a suíte de testes com a flag `-race` do Go ativa.

---

## 🚀 Fase 7: Dockerização, Graceful Shutdown e Produção
Preparação operacional para ambientes Docker e nuvem de produção.

- [ ] **M7.1: Dockerfile Otimizado**
  - [ ] Criar `Dockerfile` multi-stage:
    - *Stage 1 (Compilação):* Compilar binário estático com otimizações (`CGO_ENABLED=0 go build -ldflags="-s -w"`).
    - *Stage 2 (Runtime):* Usar imagem final enxuta (`scratch` ou `alpine` mínimo) contendo apenas certificados SSL atualizados e o binário gerado.
- [ ] **M7.2: Graceful Shutdown das Conexões**
  - [ ] Programar o encerramento ordenado ao escutar sinais `SIGINT` e `SIGTERM`:
    - Fechar o servidor HTTP impedindo novos acessos.
    - Concluir transações de banco em andamento.
    - Fechar o canal de publicação e a conexão com o RabbitMQ.
    - Encerrar o pool do PostgreSQL de forma segura.
- [ ] **M7.3: Health Checks e Observabilidade**
  - [ ] Endpoint `/healthz` de integridade da API.
  - [ ] Endpoint `/readyz` verificando a integridade física das conexões locais: ping no PostgreSQL Neon e checagem de canal do RabbitMQ.
  - [ ] Logging estruturado em formato JSON com o pacote nativo `slog`, incluindo detalhes transacionais como `loan_id`, `user_id` e latência de consultas HTTP inter-serviços.

# 📋 Checklist de Tarefas - User & Auth Service (Serviço de Usuários)

Este documento funciona como um guia de acompanhamento (To-Do List) para a implementação completa do microsserviço **User & Auth Service**, desenvolvido em **Go (Golang)**. Ele serve como o núcleo de segurança e controle de acessos da plataforma de Biblioteca Compartilhada "Nosso Livro".

> [!IMPORTANT]
> A implementação deve seguir as boas práticas de desenvolvimento em Go (Clean Architecture/padrão modular), usar criptografia segura para senhas, validações estritas de identificador único (WhatsApp) e garantir a emissão correta de tokens JWT assinados para autenticação pelo API Gateway.

---

## 🗺️ Mapa de Progresso Geral

- [ ] **Fase 1: Configuração do Módulo e Banco de Dados (Go + PostgreSQL)**
- [ ] **Fase 2: Camada de Domínio e Repositórios (Domain & Repository)**
- [ ] **Fase 3: Lógica de Autenticação, Criptografia e JWT (Service Layer)**
- [ ] **Fase 4: Handlers HTTP, Rotas e Middlewares (HTTP Layer - Router & Controller)**
- [ ] **Fase 5: Segurança, Rate Limiting e Validações Avançadas**
- [ ] **Fase 6: Testes Automatizados (Unitários e Integração) e Cobertura**
- [ ] **Fase 7: Dockerização, Observabilidade e Práticas de Produção**

---

## 🗄️ Fase 1: Configuração do Módulo e Banco de Dados
Configuração inicial do projeto Go e da estrutura de migração com PostgreSQL.

- [ ] **M1.1: Inicialização do Projeto Go**
  - [ ] Executar `go mod init nosso-livro/user-auth`
  - [ ] Organizar a estrutura de diretórios padrão ouro (Clean Architecture):
    - `/cmd/api/main.go` (Ponto de entrada da aplicação)
    - `/internal/domain` (Entidades de domínio e contratos de interfaces)
    - `/internal/repository` (Persistência em banco de dados)
    - `/internal/service` (Lógica de negócios e regras de autenticação)
    - `/internal/handler` (Controladores HTTP e adaptadores de entrada)
    - `/migrations` (Scripts de alteração de banco de dados SQL)
- [ ] **M1.2: Configuração de Migrations com `golang-migrate`**
  - [ ] Instalar e configurar a ferramenta CLI ou a biblioteca interna do `golang-migrate` no projeto.
  - [ ] Criar migration de criação da tabela `users` (`000001_create_users_table.up.sql`):
    - ID do Usuário como UUID (gerado automaticamente no banco).
    - Campo `whatsapp` como string (identificador principal e único, indexado).
    - Campo `email` como string (único, indexado).
    - Campo `senha_hash` como string contendo o hash criptográfico.
    - Campo `nome` como string (obrigatório).
    - Campo `role` como enum ou string (ex: `'admin'`, `'membro'`).
    - Campo `ativo` como booleano (default `true`).
    - Campos de controle temporal `criado_em` e `atualizado_em` com timestamps.
- [ ] **M1.3: Conexão e Pool de Banco de Dados**
  - [ ] Configurar conexão com o banco serverless PostgreSQL Neon via variáveis de ambiente (`DATABASE_URL`).
  - [ ] Utilizar o driver `pgx/v5` ou `sqlx` para acesso seguro e de alta performance.
  - [ ] Ajustar parâmetros do pool de conexões (Ex: `MaxOpenConns`, `MaxIdleConns`, `ConnMaxLifetime`) para evitar estouro de conexões no banco compartilhado.
  - [ ] Implementar retry automático na conexão inicial caso o banco sofra um cold start (característico de bancos serverless).

---

## 💾 Fase 2: Camada de Domínio e Repositórios
Modelagem das entidades Go e escrita das queries de banco.

- [ ] **M2.1: Estruturas de Domínio (`domain`)**
  - [ ] Definir a struct `User` mapeando os campos do banco de dados e adicionando tags JSON corretas.
  - [ ] Criar a interface `UserRepository` contendo os contratos de métodos necessários para a persistência.
  - [ ] Definir structs de DTOs para payload de entrada (cadastro, login) e saída (informações públicas do usuário).
- [ ] **M2.2: Implementação do Repositório (`repository`)**
  - [ ] Desenvolver a persistência concreta do repositório utilizando comandos SQL com SQL Prepared Statements nativos para proteção contra SQL Injection.
  - [ ] Método `Create(ctx, user)` para cadastrar novos usuários.
  - [ ] Método `GetByID(ctx, id)` para obter dados de usuário.
  - [ ] Método `GetByWhatsApp(ctx, whatsapp)` para encontrar usuários pelo identificador do telefone.
  - [ ] Método `GetByEmail(ctx, email)` para encontrar usuários pelo email.
  - [ ] Tratamento de erros de chave duplicada (Unique Constraint Violation) no PostgreSQL para retornar erros limpos e sem expor detalhes internos da query.

---

## 🔒 Fase 3: Lógica de Autenticação, Criptografia e JWT (Service Layer)
Camada de serviços responsável pelas regras de segurança de acesso.

- [ ] **M3.1: Hashing de Senhas**
  - [ ] Usar a biblioteca de criptografia do Go (`golang.org/x/crypto/bcrypt`).
  - [ ] Configurar custo de hashing seguro (mínimo de `bcrypt.DefaultCost`).
  - [ ] Função para gerar hash a partir da senha em texto puro.
  - [ ] Função para comparar senha fornecida com o hash gravado no banco de dados.
- [ ] **M3.2: Geração e Assinatura de Tokens JWT**
  - [ ] Instalar o pacote oficial/recomendado do JWT (`github.com/golang-jwt/jwt/v5`).
  - [ ] Definir a chave secreta carregada estritamente de variáveis de ambiente.
  - [ ] Criar claims customizadas contendo:
    - ID do Usuário (`sub`)
    - Role / Cargo (`role`)
    - Identificador do WhatsApp (`whatsapp`)
    - Data de expiração (`exp` - configurado por padrão para 24 horas)
  - [ ] Função para gerar e assinar o JWT em formato de string.
- [ ] **M3.3: Validação de Tokens JWT**
  - [ ] Função de parser do JWT para validar a assinatura, expiração e integridade do payload (usada pelo Gateway ou no middleware interno de rotas do próprio serviço).

---

## 🌐 Fase 4: Handlers HTTP, Rotas e Middlewares (HTTP Layer)
Criação dos endpoints REST e configuração de tráfego.

- [ ] **M4.1: Escolha e Configuração do Roteador**
  - [ ] Configurar roteador rápido e leve, preferencialmente `go-chi/chi` ou `gin-gonic/gin`.
- [ ] **M4.2: Endpoints de Registro e Login**
  - [ ] `POST /api/auth/register` (Público):
    - Recebe Nome, WhatsApp, Email e Senha.
    - Valida dados de entrada (formato de e-mail, formato de telefone WhatsApp).
    - Gera hash da senha e persiste o usuário no banco.
    - Retorna os dados básicos criados (sem a senha).
  - [ ] `POST /api/auth/login` (Público):
    - Recebe WhatsApp/Email e Senha.
    - Valida as credenciais.
    - Retorna o token JWT de acesso e metadados de identificação do usuário.
- [ ] **M4.3: Endpoints de Informação de Perfil e Integração**
  - [ ] `GET /api/users/me` (Protegido):
    - Retorna o perfil completo do usuário logado baseado no token fornecido no header `Authorization`.
  - [ ] `GET /api/users/{id}` (Protegido por credenciais de microsserviço ou interno):
    - Retorna dados públicos do usuário por ID (endpoint síncrono que será consultado pelo `Loan Service` para validar se um usuário existe ao fazer empréstimos).
- [ ] **M4.4: Middlewares**
  - [ ] Middleware CORS configurado rigorosamente (sem wildcard `*` em produção).
  - [ ] Middleware de Logging Estruturado (escrever logs de acessos HTTP contendo método, rota, status e tempo de resposta).
  - [ ] Middleware de Recovery (capturar panics e retornar `500 Internal Server Error` no formato JSON em vez de derrubar a aplicação).
  - [ ] Middleware de Autenticação JWT para rotas protegidas (extrair token do header `Authorization: Bearer <token>`, validar e injetar o perfil do usuário no `context.Context` da requisição).

---

## 🛡️ Fase 5: Segurança, Rate Limiting e Validações
Blindagem da aplicação contra abusos e ataques comuns.

- [ ] **M5.1: Proteção de Força Bruta (Rate Limiting)**
  - [ ] Implementar controle de taxa de requisições nas rotas `/login` e `/register` (ex: utilizando a biblioteca de Token Bucket `golang.org/x/time/rate` ou `github.com/didip/tollbooth`).
  - [ ] Bloquear IPs temporariamente caso excedam o limite estabelecido de tentativas.
- [ ] **M5.2: Validação de Dados de Entrada**
  - [ ] Utilizar um validador de structs (ex: `github.com/go-playground/validator/v10`) para certificar que e-mails e telefones estão em formato válido antes de executar lógica de negócio.
- [ ] **M5.3: Tratamento e Ocultação de Erros Sensíveis**
  - [ ] Garantir que erros de conexão com o banco ou de drivers internos do PostgreSQL nunca vazem na resposta JSON HTTP (retornando apenas mensagens amigáveis como "erro interno do servidor").

---

## 🧪 Fase 6: Testes Automatizados e Cobertura
Garantia de qualidade de software e prevenção de regressões de bugs.

- [ ] **M6.1: Testes Unitários**
  - [ ] Testar as funções utilitárias de criptografia (geração de hash com bcrypt e validação de senhas).
  - [ ] Testar funções de geração e parsing do token JWT (cenários felizes, tokens expirados, assinaturas corrompidas).
- [ ] **M6.2: Testes de Integração com Mocks/Banco**
  - [ ] Implementar testes para o repositório de banco de dados (`UserRepository`) usando mocks (`github.com/DATA-DOG/go-sqlmock`) ou usando containers de teste Docker (`testcontainers-go` com postgres dinâmico).
  - [ ] Testar cenários de sucesso de inserção, falha de integridade por e-mail ou WhatsApp duplicado e resgate de usuário por ID/telefone.
- [ ] **M6.3: Testes de Concorrência**
  - [ ] Criar testes simulando múltiplas requisições simultâneas de registro com os mesmos dados de WhatsApp/E-mail para garantir que o sistema lide com a concorrência de forma limpa, retornando erro apropriado sem violar consistência e sem travar conexões de banco de dados.
  - [ ] Executar a suite completa de testes utilizando a flag `-race` do Go para identificar concorrência desregulada ou race conditions no código.

---

## 🚀 Fase 7: Dockerização, Observabilidade e Práticas de Produção
Preparação do microsserviço para deploy confiável e monitoramento em produção.

- [ ] **M7.1: Dockerfile Otimizado e Multi-stage**
  - [ ] Criar um arquivo `Dockerfile` usando multi-stage build:
    - *Stage 1 (Build):* Utilizar uma imagem oficial Go (`golang:1.21-alpine` ou superior) para compilar o binário estático com otimizações (`-ldflags="-s -w"`).
    - *Stage 2 (Runtime):* Utilizar uma imagem final mínima (`scratch` ou `distroless/static-debian12` ou `alpine` mínimo) para rodar o binário compilado. Isso reduz o tamanho da imagem de ~1GB para < 30MB, além de diminuir drasticamente a superfície de ataque por vulnerabilidades.
- [ ] **M7.2: Graceful Shutdown (Desligamento Gracioso)**
  - [ ] Programar o servidor HTTP do Go para interceptar sinais do sistema operacional (`SIGINT`, `SIGTERM`).
  - [ ] Ao receber o sinal, fechar a porta de novas conexões, finalizar todas as requisições em andamento com um timeout de segurança (ex: 10 segundos) e encerrar o pool de conexões do banco de dados antes de desligar totalmente o container.
- [ ] **M7.3: Health Check e Monitoramento**
  - [ ] Disponibilizar o endpoint público `/healthz` que checa o status interno do servidor.
  - [ ] Disponibilizar o endpoint `/readyz` que executa um ping de saúde no PostgreSQL Neon para verificar se a conexão está ativa antes de receber tráfego de produção do API Gateway.
- [ ] **M7.4: Logging Estruturado em Produção**
  - [ ] Usar a biblioteca de log estruturado do Go `slog` (adicionada a partir da versão 1.21) para emitir logs no formato JSON em produção, permitindo filtros fáceis por campos (`level`, `error`, `latency`, `request_id`).

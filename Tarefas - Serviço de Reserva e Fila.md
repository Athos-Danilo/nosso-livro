# 📋 Checklist de Tarefas - Serviço de Reserva e Fila

Este documento funciona como um guia de acompanhamento (To-Do List) para a implementação completa do microsserviço **Serviço de Reserva e Fila**, desenvolvido em **Node.js (TypeScript)**. Ele controla as reservas online e a fila de espera automatizada de livros da plataforma "Nosso Livro".

> [!IMPORTANT]
> **REGRA DE IDIOMA DO PROJETO (PT-BR):**
> Todo o desenvolvimento deste microsserviço (incluindo rotas HTTP, payloads JSON, nomes de variáveis, classes, interfaces, tabelas do banco de dados, comentários de código, mensagens de log, eventos do RabbitMQ e commits) deve ser realizado estritamente em **Português do Brasil (PT-BR)**. É proibido o uso de termos em inglês nas implementações internas e externas deste serviço.

---

## 🗺️ Mapa de Progresso Geral

- [ ] **Fase 1: Configuração do Ambiente e Banco de Dados (Node.js + TS + Prisma)**
- [ ] **Fase 2: Clientes HTTP e Validações Síncronas (Axios/Fetch)**
- [ ] **Fase 3: Integração com RabbitMQ (Consumo e Publicação de Eventos)**
- [ ] **Fase 4: Regras de Negócio e Lógica de Fila de Espera (Algoritmos de Fila)**
- [ ] **Fase 5: APIs REST, Rotas e Middlewares (Express/Fastify)**
- [ ] **Fase 6: Testes Automatizados (Jest/Vitest + Supertest)**
- [ ] **Fase 7: Dockerização, Desligamento Gracioso e Logs Estruturados**

---

## 🗄️ Fase 1: Configuração do Ambiente e Banco de Dados
Configuração inicial da stack TypeScript, setup do ORM Prisma e migrations em português.

- [ ] **M1.1: Inicialização do Projeto e TypeScript**
  - [ ] Executar `npm init -y` para criar o `package.json` na pasta `./backend/servico-reserva-fila/`.
  - [ ] Instalar dependências de produção: `express` (ou `fastify`), `amqplib`, `@prisma/client`, `zod` (para validação), `jsonwebtoken` e `dotenv`.
  - [ ] Instalar dependências de dev: `typescript`, `@types/node`, `@types/express`, `@types/amqplib`, `@types/jsonwebtoken`, `prisma` e `ts-node-dev`.
  - [ ] Inicializar e configurar o compilation flags no `tsconfig.json`.
- [ ] **M1.2: Modelagem Física do Banco (`banco_reservas`)**
  - [ ] Executar `npx prisma init` para estruturar a conexão ORM.
  - [ ] Configurar conexão com o Neon no arquivo `.env` (`URL_BANCO_DADOS`).
  - [ ] Mapear o modelo de dados no `schema.prisma` utilizando nomes em português:
    - Modelo `Reserva`:
      - `id` (UUID gerado automaticamente).
      - `idUsuario` (UUID referencial ao usuário).
      - `idLivro` (UUID referencial ao livro).
      - `estado` (Enum com os estados: `PENDENTE` - na fila, `ATRIBUIDO` - livro disponível para retirada, `CONCLUIDO` - empréstimo efetuado, `CANCELADO` - reserva cancelada).
      - `posicao` (Inteiro contendo a posição numérica atual da fila).
      - `criadoEm` e `atualizadoEm` (Controles de data).
- [ ] **M1.3: Migrations de Banco**
  - [ ] Criar e executar a migração (`npx prisma migrate dev --name cria_tabela_reservas`), garantindo a criação de índices de busca para `Reserva.idLivro`, `Reserva.idUsuario` e `Reserva.estado`.

---

## 🔗 Fase 2: Clientes HTTP e Validações Síncronas (Axios/Fetch)
Valores remotos de integridade física.

- [ ] **M2.1: Implementação dos Clientes de Integração**
  - [ ] Desenvolver `ClienteUsuario` utilizando `axios` ou `fetch` para disparar chamadas síncronas a `GET /api/usuarios/{id}` do **Serviço de Autenticação e Usuário**.
  - [ ] Desenvolver `ClienteCatalogo` para efetuar chamadas síncronas a `GET /api/livros/{id}` do **Serviço de Catálogo e Biblioteca**.
- [ ] **M2.2: Tratamento de Erros e Resiliência**
  - [ ] Configurar timeout de rede máximo (3 segundos) e retentativas (retry) com backoff exponencial.

---

## ✉️ Fase 3: Integração com RabbitMQ (Consumo e Publicação de Eventos)
Mensageria assíncrona reativa.

- [ ] **M3.1: Conexão Resiliente com Broker**
  - [ ] Desenvolver conexão em `/src/fila/rabbitmq.ts` utilizando a biblioteca `amqplib` com lógica de auto-reconexão inteligente.
- [ ] **M3.2: Consumidor de Eventos (Event Consumer)**
  - [ ] Configurar escuta do evento **`emprestimo.devolvido`** (publicado pelo `Serviço de Empréstimo`).
  - [ ] Ao receber a mensagem contendo o ID do livro devolvido (`id_livro`):
    - Buscar a próxima reserva com estado `PENDENTE` para aquele `id_livro` (ordenado pela data mais antiga `criadoEm`).
    - Se houver reserva na fila: alterar o estado para `ATRIBUIDO`, zerar a posição e definir data limite de retirada (ex: 48 horas).
    - Publicar o evento assíncrono **`reserva.atribuida`** contendo o ID do usuário e dados da reserva.
- [ ] **M3.3: Publisher de Eventos (Event Publisher)**
  - [ ] Desenvolver o dispatcher de mensagens no broker:
    - Enviar o evento **`reserva.criada`** toda vez que um usuário ingressar na fila de espera do livro.
    - Enviar o evento **`reserva.atribuida`** toda vez que um livro for atribuído ao próximo usuário da fila.

---

## 💾 Fase 4: Regras de Negócio e Lógica de Fila de Espera (Algoritmos de Fila)
Algoritmos de posicionamento de reservas.

- [ ] **M4.1: Algoritmo de Ingressão na Fila**
  - [ ] Validar a existência do usuário e livro síncronamente via HTTP.
  - [ ] Impedir reservas duplicadas concorrentes para o mesmo livro pelo mesmo usuário.
  - [ ] Calcular a posição atual do usuário: buscar quantidade de registros ativos com estado `PENDENTE` para o livro e atribuir `posição = contagem + 1`.
  - [ ] Gravar a reserva e disparar evento `reserva.criada`.
- [ ] **M4.2: Lógica de Cancelamento de Reservas**
  - [ ] Permitir o cancelamento manual da reserva pelo usuário ou expiração por prazo de retirada estourado (48h).
  - [ ] Se a reserva cancelada possuía estado `ATRIBUIDO` (livro estava guardado esperando retirada):
    - Mudar estado para `CANCELADO`.
    - Acionar imediatamente o reposicionamento da fila: selecionar o próximo usuário `PENDENTE` daquele livro, mudar o estado para `ATRIBUIDO` e publicar o evento `reserva.atribuida`.
  - [ ] Se a reserva cancelada possuía estado `PENDENTE` (no meio da fila):
    - Alterar estado para `CANCELADO` e decrementar a posição de todos os usuários posteriores na fila para aquele livro (`posição = posição - 1`).

---

## 🌐 Fase 5: APIs REST, Rotas e Middlewares (Express/Fastify)
Rotas HTTP expostas.

- [ ] **M5.1: Desenvolvimento dos Endpoints**
  - [ ] `POST /api/reservas` (Protegido - Membro):
    - Recebe o ID do livro no corpo.
    - Ingressa o usuário logado (dados do JWT) na fila de espera.
  - [ ] `DELETE /api/reservas/{id}` (Protegido):
    - Permite o cancelamento de uma reserva de forma segura.
  - [ ] `GET /api/reservas/me` (Protegido):
    - Retorna a listagem de todas as reservas do usuário com suas posições atuais na fila.
  - [ ] `GET /api/reservas/livro/{id_livro}` (Público):
    - Retorna o tamanho atual da fila e dados gerais públicos.
- [ ] **M5.2: Middlewares de Proteção**
  - [ ] Middleware CORS e Middleware de logs estruturados.
  - [ ] Middleware de validação do token JWT repassado no header pelo Gateway de API.

---

## 🧪 Fase 6: Testes Automatizados (Jest/Vitest + Supertest)
Qualidade de código.

- [ ] **M6.1: Testes Unitários de Fila de Espera**
  - [ ] Testar cenários de reordenação de posições pós-cancelamento de reservas intermediárias e fluxo de atribuição automática do livro para o primeiro da lista no caso de devoluções.
- [ ] **M6.2: Testes de Integração e Concorrência**
  - [ ] Testar endpoints usando banco de testes e mockar o RabbitMQ.
  - [ ] Simular 50 acessos concorrentes para criar reserva no mesmo livro ao mesmo tempo. Garantir que as posições sejam atribuídas estritamente na ordem correta (`1, 2, 3... 50`) sem duplicidades de posição.

---

## 🚀 Fase 7: Dockerização, Desligamento Gracioso e Produção
Deploy e padrões operacionais.

- [ ] **M7.1: Dockerfile Multi-stage Otimizado**
  - [ ] Compilar TypeScript para JavaScript e gerar imagem final enxuta em `node:18-alpine`.
- [ ] **M7.2: Desligamento Gracioso (Graceful Shutdown)**
  - [ ] Interceptação de `SIGINT` e `SIGTERM` para fechar o servidor Express, desconectar do RabbitMQ e fechar a conexão ativa do Prisma Client.
- [ ] **M7.3: Health Check e Observabilidade**
  - [ ] Criar endpoints `/saude` e `/pronto`.
  - [ ] Logs estruturados JSON em português utilizando Winston ou Pino.

# 📋 Checklist de Tarefas - Reservation & Waiting List Service (Serviço de Reservas)

Este documento funciona como um guia de acompanhamento (To-Do List) para a implementação completa do microsserviço **Reservation & Waiting List Service**, desenvolvido em **Node.js (TypeScript)**. Ele controla as reservas online e a fila de espera automatizada de livros da plataforma "Nosso Livro".

> [!IMPORTANT]
> A implementação deve assegurar alta consistência na ordenação da fila de espera, respostas rápidas a eventos de devolução através do RabbitMQ e resiliência nas validações HTTP com outros serviços.

---

## 🗺️ Mapa de Progresso Geral

- [ ] **Fase 1: Configuração do Ambiente e Banco de Dados (Node.js + TS + Prisma)**
- [ ] **Fase 2: Clientes HTTP e Validações Síncronas (Axios/Fetch)**
- [ ] **Fase 3: Integração com RabbitMQ (Consumo e Publicação)**
- [ ] **Fase 4: Regras de Negócio e Lógica de Fila de Espera (Waiting List Logic)**
- [ ] **Fase 5: APIs REST, Rotas e Middlewares (Express/Fastify)**
- [ ] **Fase 6: Testes Automatizados (Jest/Vitest + Supertest)**
- [ ] **Fase 7: Dockerização, Graceful Shutdown e Logs estruturados**

---

## 🗄️ Fase 1: Configuração do Ambiente e Banco de Dados
Configuração inicial da stack TypeScript, setup do ORM Prisma e migrations.

- [ ] **M1.1: Inicialização do Projeto e TypeScript**
  - [ ] Executar `npm init -y` para criar o `package.json`.
  - [ ] Instalar dependências de produção: `express` (ou `fastify`), `amqplib`, `@prisma/client`, `zod` (para validação estrutural), `jsonwebtoken` e `dotenv`.
  - [ ] Instalar dependências de desenvolvimento: `typescript`, `@types/node`, `@types/express`, `@types/amqplib`, `@types/jsonwebtoken`, `prisma` e `ts-node-dev`.
  - [ ] Inicializar o compilador do TypeScript com o arquivo `tsconfig.json` otimizado para produção.
- [ ] **M1.2: Modelagem Física do Banco (`reservations_db`)**
  - [ ] Executar `npx prisma init` para estruturar a conexão ORM.
  - [ ] Configurar conexão com o Neon no arquivo `.env` (`DATABASE_URL`).
  - [ ] Mapear o modelo de dados no `schema.prisma`:
    - Modelo `Reservation`:
      - `id` (UUID gerado automaticamente).
      - `userId` (UUID referencial ao usuário).
      - `bookId` (UUID referencial ao livro).
      - `status` (Enum com os estados: `PENDING` - na fila, `ASSIGNED` - livro reservado e pronto para retirada, `COMPLETED` - livro retirado/emprestado, `CANCELED` - reserva cancelada).
      - `position` (Inteiro contendo a posição numérica atual da fila).
      - `createdAt` e `updatedAt` (Controles de data).
- [ ] **M1.3: Migrations de Banco**
  - [ ] Criar e executar a migration (`npx prisma migrate dev --name init_reservations`), garantindo que o Prisma crie índices de busca para `Reservation.bookId`, `Reservation.userId` e `Reservation.status`.

---

## 🔗 Fase 2: Clientes HTTP e Validações Síncronas (Axios/Fetch)
Validação remota se os usuários e livros de fato existem no sistema antes de agendar uma reserva.

- [ ] **M2.1: Implementação dos Clientes de Integração**
  - [ ] Desenvolver `UserClient` utilizando a biblioteca `axios` ou a API nativa `fetch` para disparar chamadas síncronas a `GET /api/users/{id}` do **User & Auth Service**.
  - [ ] Desenvolver `CatalogClient` para efetuar chamadas síncronas a `GET /api/books/{id}` do **Catalog & Library Service**.
- [ ] **M2.2: Tratamento de Erros e Resiliência**
  - [ ] Definir limite de timeout de requisição física de rede (ex: máximo 3 segundos) para evitar travamento da API.
  - [ ] Implementar política de retentativas automáticas (retry) com atrasos progressivos para contornar oscilações rápidas de rede.
  - [ ] Implementar testes simulando falhas nos microsserviços integrados para certificar que a API retorna erro de maneira limpa (`404` ou `503 Service Unavailable`).

---

## ✉️ Fase 3: Integração com RabbitMQ (Consumo e Publicação)
Acionamento assíncrono das filas de mensageria para automação de tarefas reativas.

- [ ] **M3.1: Conexão Resiliente com Broker**
  - [ ] Desenvolver módulo em `/src/queue/rabbitmq.ts` utilizando a biblioteca `amqplib`.
  - [ ] Implementar lógica de reconexão cíclica que reestabeleça canais e escutas caso o RabbitMQ offline volte a ficar ativo.
- [ ] **M3.2: Consumidor de Eventos (Event Consumer)**
  - [ ] Configurar escuta do evento **`loan.returned`** (publicado pelo `Loan Service` no momento da devolução de um exemplar).
  - [ ] Ao receber a mensagem contendo o ID do livro devolvido:
    - Buscar a próxima reserva com status `PENDING` para aquele `bookId` (ordenado pela data mais antiga `createdAt`).
    - Se houver reserva na fila: alterar o status para `ASSIGNED`, rebaixar/zerar a posição e definir data limite de retirada (ex: 48 horas).
    - Publicar o evento assíncrono **`reservation.assigned`** contendo o ID do usuário e dados da reserva para que o `Notification Service` envie e-mail de alerta.
- [ ] **M3.3: Publisher de Eventos (Event Publisher)**
  - [ ] Desenvolver o dispatcher de mensagens no broker:
    - Enviar o evento **`reservation.created`** toda vez que um usuário ingressar na fila de espera do livro.
    - Enviar o evento **`reservation.assigned`** toda vez que um livro for atribuído com sucesso a um usuário da fila de espera.

---

## 💾 Fase 4: Regras de Negócio e Lógica de Fila de Espera (Waiting List)
Algoritmos de posicionamento, inserção, avanço e cancelamentos de reservas.

- [ ] **M4.1: Algoritmo de Ingressão na Fila**
  - [ ] Validar a existência do usuário e livro síncronamente via HTTP.
  - [ ] Impedir reservas duplicadas (o mesmo usuário não pode entrar na fila do mesmo livro duas vezes concorrentemente).
  - [ ] Calcular a posição atual do usuário: buscar quantidade de registros ativos com status `PENDING` para o livro e atribuir `posição = contagem + 1`.
  - [ ] Gravar a reserva e disparar evento `reservation.created`.
- [ ] **M4.2: Lógica de Cancelamento de Reservas**
  - [ ] Permitir o cancelamento manual da reserva pelo usuário ou expiração por prazo de retirada estourado (48h).
  - [ ] Se a reserva cancelada possuía status `ASSIGNED` (ou seja, o livro estava guardado esperando retirada):
    - Mudar status para `CANCELED`.
    - Acionar imediatamente o reposicionamento da fila: selecionar o próximo usuário `PENDING` daquele livro, mudar o status para `ASSIGNED` e publicar o evento `reservation.assigned`.
  - [ ] Se a reserva cancelada possuía status `PENDING` (no meio da fila):
    - Alterar status para `CANCELED`.
    - Atualizar a posição de todos os usuários que estavam em posições posteriores na fila para aquele livro (`posição = posição - 1`).

---

## 🌐 Fase 5: APIs REST, Rotas e Middlewares (Express/Fastify)
Interface REST para conexões de rede externas.

- [ ] **M5.1: Desenvolvimento dos Endpoints**
  - [ ] `POST /api/reservations` (Protegido - Membro):
    - Recebe o ID do livro no corpo.
    - Ingressa o usuário logado (dados do JWT) na fila de espera.
  - [ ] `DELETE /api/reservations/{id}` (Protegido):
    - Permite o cancelamento de uma reserva de forma segura.
  - [ ] `GET /api/reservations/me` (Protegido):
    - Retorna a listagem de todas as reservas do usuário com suas posições atuais na fila.
  - [ ] `GET /api/reservations/book/{bookId}` (Público):
    - Retorna dados gerais da fila (total de pessoas aguardando e listagem pública contendo apenas iniciais ou dados descaracterizados para fins de LGPD).
- [ ] **M5.2: Middlewares de Proteção**
  - [ ] Middleware CORS e Middleware de logs estruturados das requisições.
  - [ ] Middleware de validação do token JWT repassado no header da requisição pelo API Gateway.

---

## 🧪 Fase 6: Testes Automatizados (Jest/Vitest + Supertest)
Garantia de que as operações de fila de espera rodam de forma concorrente e sem erros.

- [ ] **M6.1: Testes Unitários de Fila de Espera**
  - [ ] Testar cenários de reordenação de posições pós-cancelamento de reservas intermediárias.
  - [ ] Testar fluxo de atribuição automática do livro para o primeiro da lista no caso de devoluções.
- [ ] **M6.2: Testes de Integração com Banco e Chamadas Mockadas**
  - [ ] Executar testes utilizando banco de testes PostgreSQL.
  - [ ] Mockar chamadas de rede externas e filas do RabbitMQ para avaliar se a API REST responde com códigos corretos (`201`, `404`, `400`).
- [ ] **M6.3: Testes de Concorrência e Estresse**
  - [ ] Simular 50 acessos concorrentes para criar reserva no mesmo livro ao mesmo tempo. Garantir que as posições sejam atribuídas estritamente na ordem correta (`1, 2, 3... 50`) sem duplicidades de posição.

---

## 🚀 Fase 7: Dockerização, Graceful Shutdown e Produção
Entrega operacional robusta e monitorável em nuvem.

- [ ] **M7.1: Dockerfile Multi-stage Otimizado**
  - [ ] Stage 1 (Build): Instala dependências de dev, copia os arquivos do código e executa compilação do TypeScript para JavaScript (`npm run build`).
  - [ ] Stage 2 (Runtime): Instala apenas dependências de produção, copia a pasta de compilação `/dist`, os arquivos do Prisma Client gerados e executa via imagem mínima `node:18-alpine`.
- [ ] **M7.2: Graceful Shutdown das Conexões**
  - [ ] Interceptar sinais `SIGINT` e `SIGTERM`:
    - Fechar o servidor HTTP.
    - Interromper o consumo e fechar a conexão com o RabbitMQ.
    - Fechar a conexão ativa do Prisma Client com o banco PostgreSQL Neon de maneira limpa.
- [ ] **M7.3: Health Check e Observabilidade**
  - [ ] Criar endpoints `/healthz` e `/readyz`.
  - [ ] Utilizar biblioteca de logging (ex: `pino` ou `winston`) configurada para emitir logs formatados em JSON no terminal em ambiente de produção.

# 📋 Checklist de Tarefas - Notification Service (Serviço de Notificações)

Este documento funciona como um guia de acompanhamento (To-Do List) para a implementação completa do microsserviço **Notification Service**, desenvolvido em **Node.js (TypeScript)**. Ele é responsável pelo envio de notificações por e-mail e outros alertas da plataforma "Nosso Livro".

> [!IMPORTANT]
> Por ser um serviço essencialmente baseado em I/O assíncrono e integrado a provedores de serviços externos (como SMTP), a implementação deve ter alta tolerância a falhas na entrega, gravação de logs de auditoria de disparos e resiliência nas consultas HTTP ao `User Service`.

---

## 🗺️ Mapa de Progresso Geral

- [ ] **Fase 1: Configuração do Ambiente e Banco de Dados (Node.js + TS + Prisma)**
- [ ] **Fase 2: Integração Síncrona HTTP (Busca de Destinatário)**
- [ ] **Fase 3: Consumo de Eventos no RabbitMQ (amqplib)**
- [ ] **Fase 4: Serviço de Envio e Templates de Mensagens (Nodemailer)**
- [ ] **Fase 5: Lógica de Registro de Histórico e Retentativas**
- [ ] **Fase 6: Testes Automatizados e Envio Mockado (Jest/Ethereal)**
- [ ] **Fase 7: Dockerização, Graceful Shutdown e Observabilidade**

---

## 🗄️ Fase 1: Configuração do Ambiente e Banco de Dados
Setup inicial do microsserviço em TypeScript e estruturação do banco de histórico de notificações.

- [ ] **M1.1: Inicialização do Módulo Node.js**
  - [ ] Inicializar o projeto com `npm init -y`.
  - [ ] Instalar dependências essenciais: `express` (para health check), `amqplib`, `nodemailer`, `@prisma/client`, `zod`, `dotenv` e `axios`.
  - [ ] Instalar dependências de dev: `typescript`, `@types/node`, `@types/express`, `@types/amqplib`, `@types/nodemailer`, `prisma` e `ts-node-dev`.
  - [ ] Configurar compilation flags no `tsconfig.json` para geração de código JS limpo.
- [ ] **M1.2: Modelagem Física do Banco (`notifications_db`)**
  - [ ] Executar `npx prisma init` para configurar o acesso ao Neon.
  - [ ] Mapear o modelo de histórico no `schema.prisma`:
    - Modelo `Notification`:
      - `id` (UUID primário gerado automaticamente).
      - `userId` (UUID referencial do destinatário).
      - `type` (Enum: `EMAIL`, `WHATSAPP`).
      - `status` (Enum: `SENT` - enviado com sucesso, `FAILED` - erro de disparo, `PENDING` - na fila de reprocessamento).
      - `title` (string contendo o assunto/título da notificação).
      - `content` (string contendo o corpo da mensagem enviada).
      - `errorMessage` (string contendo o log do erro em caso de falha de envio).
      - `createdAt` (timestamp de controle).
- [ ] **M1.3: Migrations de Banco**
  - [ ] Executar `npx prisma migrate dev --name init_notifications`, garantindo a criação de índices de busca eficientes em `Notification.userId` e `Notification.status`.

---

## 🔗 Fase 2: Integração Síncrona HTTP (Busca de Destinatário)
Consulta ao banco de usuários para resgatar dados de contato antes de efetuar o envio.

- [ ] **M2.1: Desenvolvimento do Client de Usuários**
  - [ ] Criar o `UserClient` utilizando a biblioteca `axios` para efetuar chamadas a `GET /api/users/{id}` do **User & Auth Service**.
  - [ ] Resgatar nome, e-mail e status do usuário a ser notificado.
- [ ] **M2.2: Resiliência de Rede**
  - [ ] Configurar timeout baixo (ex: máximo 3 segundos) para evitar travamento da fila do consumidor.
  - [ ] Tratar cenários em que o usuário não é encontrado (`404`) ou o serviço está indisponível (`503`), lançando erros específicos que impeçam o consumo destrutivo da mensagem da fila.

---

## ✉️ Fase 3: Consumo de Eventos no RabbitMQ (amqplib)
Captura assíncrona das mensagens enviadas pelos outros serviços do ecossistema.

- [ ] **M3.1: Conexão e Auto-reconexão com o Broker**
  - [ ] Desenvolver classe utilitária de conexão em `/src/queue/rabbitmq.ts`.
  - [ ] Configurar tratamento de erros (`error`, `close`) no canal do RabbitMQ para disparar tentativas periódicas de reconexão.
- [ ] **M3.2: Configuração de Filas e Consumidores**
  - [ ] Declarar exchange do tipo `topic` e criar a fila exclusiva `notifications_queue`.
  - [ ] Efetuar a escuta assíncrona dos 4 eventos do ecossistema:
    - **`loan.created`** (Empréstimo realizado)
    - **`loan.returned`** (Livro devolvido)
    - **`reservation.created`** (Entrou na fila de espera)
    - **`reservation.assigned`** (Livro pronto para ser retirado)
  - [ ] Configurar desempacotamento e tratamento correto das mensagens do formato JSON.

---

## 📧 Fase 4: Serviço de Envio e Templates de Mensagens (Nodemailer)
Construção do motor de disparo de e-mails e layouts responsivos para a experiência do usuário.

- [ ] **M4.1: Configuração do Nodemailer**
  - [ ] Desenvolver o módulo de envio em `/src/services/mail.service.ts`.
  - [ ] Configurar o transporte SMTP utilizando credenciais seguras carregadas de variáveis de ambiente (`SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`).
- [ ] **M4.2: Construção dos Templates de E-mail (HTML)**
  - [ ] Desenvolver templates de e-mail HTML modernos, responsivos e com design premium:
    - *Template 1 (Empréstimo):* Confirmação de empréstimo realizado, data máxima de devolução e recomendações de cuidados com o livro.
    - *Template 2 (Devolução):* Agradecimento de devolução efetuada e atualização de status de empréstimo concluído.
    - *Template 3 (Fila de Espera):* Confirmação de que o usuário entrou na fila de espera para determinado livro, mostrando a sua posição.
    - *Template 4 (Livro Liberado):* Alerta de alta prioridade informando que a reserva foi atribuída e o livro físico está reservado para retirada nas próximas 48h.
- [ ] **M4.3: Mock de Disparo de WhatsApp (Opcional/Evolutivo)**
  - [ ] Criar classe mockada que simula o envio de alertas por WhatsApp (gravando os logs estruturados das mensagens no console/log do container para fins de demonstração).

---

## 💾 Fase 5: Lógica de Registro de Histórico e Retentativas
Persistência do status dos disparos de e-mail e políticas contra falhas temporárias dos servidores SMTP.

- [ ] **M5.1: Fluxo de Processamento de Notificação**
  - [ ] Receber evento do RabbitMQ.
  - [ ] Chamar `UserClient` via HTTP para buscar dados de e-mail e nome do usuário.
  - [ ] Renderizar o template de e-mail correto com as variáveis reais do payload.
  - [ ] Enviar o e-mail via Nodemailer.
  - [ ] Registrar o status do disparo (`SENT` ou `FAILED` com a mensagem do erro) na tabela `Notification` do banco de dados `notifications_db`.
- [ ] **M5.2: Política de Retentativas e Tratamento de Falhas**
  - [ ] Se o disparo SMTP falhar por instabilidade no servidor de e-mails, salvar a notificação com status `FAILED` e aplicar lógica de reprocessamento automático (ex: 3 tentativas de envio antes de desistir definitivamente).

---

## 🧪 Fase 6: Testes Automatizados e Envio Mockado (Jest/Ethereal)
Garantia de que as rotinas de e-mail e consumo de eventos estejam funcionando localmente.

- [ ] **M6.1: Testes de Integração com Ethereal Email**
  - [ ] Configurar nos testes o envio de e-mails reais através de contas temporárias criadas dinamicamente no serviço **Ethereal Email** (ferramenta padrão ouro para validação de fluxos de e-mail em ambiente de teste).
  - [ ] Validar a entrega e o visual gerado pelo HTML.
- [ ] **M6.2: Testes de Integração de Mensageria**
  - [ ] Criar testes que enviam eventos artificiais no RabbitMQ e validam se o consumidor aciona corretamente o motor de e-mail e grava o histórico correspondente com sucesso no banco de dados de testes.

---

## 🚀 Fase 7: Dockerização, Graceful Shutdown e Observabilidade
Padrões de produção para deploy containerizado seguro.

- [ ] **M7.1: Dockerfile Multi-stage Otimizado**
  - [ ] Stage 1 (Build): Instala dependências de dev, copia o código e executa compilação do TypeScript para JavaScript (`npm run build`).
  - [ ] Stage 2 (Runtime): Copia a pasta compilada `/dist`, os arquivos gerados do Prisma Client e roda sob uma imagem enxuta de produção `node:18-alpine`.
- [ ] **M7.2: Graceful Shutdown das Conexões**
  - [ ] Programar encerramento controlado ao capturar sinais `SIGINT`/`SIGTERM`:
    - Parar o servidor Express/Fastify de health check.
    - Fechar o consumo e conexões ativas com o RabbitMQ.
    - Fechar as conexões do Prisma Client com o PostgreSQL Neon de forma limpa.
- [ ] **M7.3: Health Check e Logs Estruturados**
  - [ ] Criar rotas `/healthz` e `/readyz` para verificação de status do serviço e bancos de dados.
  - [ ] Utilizar biblioteca de logging (ex: `winston` ou `pino`) para exportar logs estruturados JSON, permitindo auditorias fáceis de quais e-mails foram enviados, quais falharam e quais erros de rede ocorreram.

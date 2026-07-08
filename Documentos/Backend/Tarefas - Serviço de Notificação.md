# 📋 Checklist de Tarefas - Serviço de Notificação

Este documento funciona como um guia de acompanhamento (To-Do List) para a implementação completa do microsserviço **Serviço de Notificação**, desenvolvido em **Node.js (TypeScript)**. Ele é responsável pelo envio de notificações por e-mail e outros alertas da plataforma "Nosso Livro".

> [!IMPORTANT]
> **REGRA DE IDIOMA DO PROJETO (PT-BR):**
> Todo o desenvolvimento deste microsserviço (incluindo rotas HTTP, payloads JSON, nomes de variáveis, classes, interfaces, tabelas do banco de dados, comentários de código, mensagens de log, eventos do RabbitMQ e commits) deve ser realizado estritamente em **Português do Brasil (PT-BR)**. É proibido o uso de termos em inglês nas implementações internas e externas deste serviço.

---

## 🗺️ Mapa de Progresso Geral

- [x] **Fase 1: Configuração do Ambiente e Banco de Dados (Node.js + TS + Prisma)**
- [x] **Fase 2: Integração Síncrona HTTP (Busca de Destinatário)**
- [x] **Fase 3: Consumo de Eventos no RabbitMQ (amqplib)**
- [x] **Fase 4: Serviço de Envio e Templates de Mensagens (Nodemailer)**
- [x] **Fase 5: Lógica de Registro de Histórico e Retentativas**
- [x] **Fase 6: Testes Automatizados e Envio Mockado (Jest/Ethereal)**
- [x] **Fase 7: Dockerização, Desligamento Gracioso e Observabilidade**

---

## 🗄️ Fase 1: Configuração do Ambiente e Banco de Dados
Setup inicial do microsserviço em TypeScript e estruturação do banco de histórico de notificações.

- [x] **M1.1: Inicialização do Módulo Node.js**
  - [x] Inicializar o projeto com `npm init -y` na pasta `./backend/servico-notificacao/`.
  - [x] Instalar dependências de produção: `express` (para health check), `amqplib`, `nodemailer`, `@prisma/client`, `zod`, `dotenv` e `axios`.
  - [x] Instalar dependências de dev: `typescript`, `@types/node`, `@types/express`, `@types/amqplib`, `@types/nodemailer`, `prisma` e `ts-node-dev`.
  - [x] Configurar compilation flags no `tsconfig.json`.
- [x] **M1.2: Modelagem Física do Banco (`banco_notificacoes`)**
  - [x] Executar `npx prisma init` para configurar o acesso ao Neon.
  - [x] Mapear o modelo de histórico no `schema.prisma` utilizando nomes em português:
    - Modelo `Notificacao`:
      - `id` (UUID primário gerado automaticamente).
      - `idUsuario` (UUID referencial do destinatário).
      - `tipo` (Enum: `EMAIL`, `WHATSAPP`).
      - `estado` (Enum: `ENVIADO` - enviado com sucesso, `FALHOU` - erro de disparo, `PENDENTE` - na fila de reprocessamento).
      - `titulo` (string contendo o assunto/título da notificação).
      - `conteudo` (string contendo o corpo da mensagem enviada).
      - `mensagemErro` (string contendo o log do erro em caso de falha de envio).
      - `criadoEm` (timestamp de controle).
- [x] **M1.3: Migrations de Banco**
  - [x] Executar `npx prisma migrate dev --name cria_tabela_notificacoes`, garantindo a criação de índices de busca para `Notificacao.idUsuario` e `Notificacao.estado`.

---

## 🔗 Fase 2: Integração Síncrona HTTP (Busca de Destinatário)
Consulta ao banco de usuários para resgatar dados de contato antes de efetuar o envio.

- [x] **M2.1: Desenvolvimento do Cliente de Usuários**
  - [x] Criar o `ClienteUsuario` utilizando `axios` para efetuar chamadas a `GET /api/usuarios/{id}` do **Serviço de Autenticação e Usuário**.
  - [x] Resgatar nome, e-mail, whatsapp e status do usuário a ser notificado.
- [x] **M2.2: Resiliência de Rede**
  - [x] Configurar timeout baixo (máximo 3 segundos) para evitar travamento do consumidor de filas.
  - [x] Tratar cenários em que o usuário não é encontrado (`404`) ou o serviço está indisponível (`503`) de forma controlada.

---

## ✉️ Fase 3: Consumo de Eventos no RabbitMQ (amqplib)
Captura assíncrona das mensagens enviadas pelos outros serviços do ecossistema.

- [x] **M3.1: Conexão e Auto-reconexão com o Broker**
  - [x] Desenvolver classe utilitária de conexão em `/src/fila/rabbitmq.ts` utilizando a biblioteca `amqplib` com auto-reconexão.
- [x] **M3.2: Configuração de Filas e Consumidores**
  - [x] Declarar exchange do tipo `topic` e criar a fila exclusiva `fila_notificacoes`.
  - [x] Efetuar a escuta assíncrona dos 4 eventos do ecossistema:
    - **`emprestimo.criado`** (Empréstimo realizado)
    - **`emprestimo.devolvido`** (Livro devolvido)
    - **`reserva.criada`** (Entrou na fila de espera)
    - **`reserva.atribuida`** (Livro liberado para retirada na biblioteca)
  - [x] Configurar desempacotamento e tratamento correto das mensagens do formato JSON.

---

## 📧 Fase 4: Serviço de Envio e Templates de Mensagens (Nodemailer)
Construção do motor de disparo de e-mails e layouts responsivos para a experiência do usuário.

- [x] **M4.1: Configuração do Nodemailer**
  - [x] Desenvolver o módulo de envio em `/src/servicos/email.servico.ts`.
  - [x] Configurar o transporte SMTP utilizando credenciais seguras carregadas de variáveis de ambiente (`SMTP_HOST`, `SMTP_PORT`, `SMTP_USUARIO`, `SMTP_SENHA`).
- [x] **M4.2: Construção dos Templates de E-mail (HTML)**
  - [x] Desenvolver templates de e-mail HTML modernos e responsivos em português:
    - *Template 1 (Empréstimo):* Confirmação de empréstimo realizado, data limite de devolução e recomendações.
    - *Template 2 (Devolução):* Agradecimento de devolução efetuada e atualização de status.
    - *Template 3 (Fila de Espera):* Confirmação de que o usuário entrou na fila de espera, mostrando a posição.
    - *Template 4 (Livro Liberado):* Alerta informando que a reserva foi atribuída e o livro físico está reservado para retirada nas próximas 48h.
- [x] **M4.3: Mock de Disparo de WhatsApp**
  - [x] Criar classe mockada que simula o envio de alertas por WhatsApp (gravando os logs estruturados no console para fins de demonstração).

---

## 💾 Fase 5: Lógica de Registro de Histórico e Retentativas
Persistência do status dos disparos de e-mail e políticas contra falhas temporárias dos servidores SMTP.

- [x] **M5.1: Fluxo de Processamento de Notificação**
  - [x] Receber evento do RabbitMQ.
  - [x] Chamar `ClienteUsuario` via HTTP para buscar dados de e-mail e nome do usuário.
  - [x] Renderizar o template de e-mail correto com as variáveis reais do payload.
  - [x] Enviar o e-mail via Nodemailer.
  - [x] Registrar o status do disparo (`ENVIADO` ou `FALHOU` com a mensagem do erro) na tabela `Notificacao` do banco de dados `banco_notificacoes`.
- [x] **M5.2: Política de Retentativas e Tratamento de Falhas**
  - [x] Se o disparo SMTP falhar por instabilidade no servidor de e-mails, salvar a notificação com estado `FALHOU` e aplicar lógica de reprocessamento automático (ex: 3 tentativas de envio antes de desistir).

---

## 🧪 Fase 6: Testes Automatizados e Envio Mockado (Jest/Ethereal)
Garantia de que as rotinas de e-mail e consumo de eventos estejam funcionando localmente.

- [x] **M6.1: Testes de Integração com Ethereal Email**
  - [x] Configurar nos testes o envio de e-mails reais através de contas temporárias criadas dinamicamente no serviço **Ethereal Email**. Validar a entrega e o visual do HTML.
- [x] **M6.2: Testes de Integração de Mensageria**
  - [x] Criar testes que enviam eventos artificiais no RabbitMQ e validam se o consumidor aciona corretamente o motor de e-mail e grava o histórico correspondente no banco.

---

## 🚀 Fase 7: Dockerização, Desligamento Gracioso e Observabilidade
Padrões de produção para deploy containerizado seguro.

- [x] **M7.1: Dockerfile Multi-stage Otimizado**
  - [x] Compilar TypeScript para JavaScript e gerar imagem final baseada em `node:18-alpine`.
- [x] **M7.2: Desligamento Gracioso (Graceful Shutdown)**
  - [x] Interceptar sinais `SIGINT`/`SIGTERM`: parar o servidor Express de health check, fechar consumo do RabbitMQ e fechar as conexões do Prisma Client de forma limpa.
- [x] **M7.3: Health Check e Logs Estruturados**
  - [x] Criar rotas `/saude` e `/pronto`.
  - [x] Logs estruturados JSON em português utilizando Winston ou Pino para registrar o status dos disparos.

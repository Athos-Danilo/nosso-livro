# 📌 O que ainda falta fazer no projeto Nosso Livro

Com base nas [Especificações do Projeto](file:///c:/Users/Athos/ADS/Meus%20Projetos/nosso-livro/ESPECIFICAÇÕES.md) e no estado atual do monorepo, a implementação de todos os **6 microsserviços de backend** está concluída na pasta `backend/`. 

No entanto, para que o sistema esteja completo e integrado, as seguintes etapas e componentes ainda precisam ser desenvolvidos:

---

### 1. 🌐 Gateway de API (`gateway-api`)
* **O que falta:** Criar a pasta `backend/gateway-api` e desenvolver o Gateway de API em **Go**.
* **Responsabilidade:** Centralizar o roteamento de borda, habilitar o CORS global, gerenciar o redirecionamento para os microsserviços corretos e validar as assinaturas e expiração dos tokens JWT (repassando as informações do usuário autenticado no cabeçalho das requisições internas).

### 2. 💻 Frontend React (`frontend`)
* **O que falta:** Criar o diretório `frontend/` na raiz do monorepo e desenvolver a aplicação cliente em **React (Vite + TypeScript)**.
* **Responsabilidade:** Interface do usuário para cadastro/login, catálogo de livros, gerenciamento de empréstimos, acompanhamento de reservas/fila de espera e visualização de recomendações.

### 3. 🐳 Orquestração do Ambiente Local (`docker-compose.yml`)
* **O que falta:** Criar o arquivo `docker-compose.yml` na raiz do repositório.
* **Responsabilidade:** Mapear e subir todos os microsserviços de backend, o novo Gateway de API, os respectivos bancos de dados PostgreSQL locais (para desenvolvimento) e o broker RabbitMQ em uma mesma rede local virtual.

### 4. 🚀 Configuração de Deploy e Produção
* Configurar o deploy automatizado nos ambientes de produção planejados:
  * **Frontend:** Vercel.
  * **Gateway de API e Microsserviços:** Render.
  * **Bancos de Dados PostgreSQL:** Neon (PostgreSQL Serverless).
  * **Mensageria (RabbitMQ):** CloudAMQP.

### 5. 📋 Revisão e Atualização dos Checklists de Tarefas
* Embora o código dos microsserviços de notificação e reservas esteja implementado, os seguintes documentos de acompanhamento possuem itens pendentes/desmarcados:
  * [Tarefas - Serviço de Notificação.md](file:///c:/Users/Athos/ADS/Meus%20Projetos/nosso-livro/Tarefas%20-%20Serviço%20de%20Notificação.md) (Fase 1.3 em diante está desmarcada).
  * [Tarefas - Serviço de Reserva e Fila.md](file:///c:/Users/Athos/ADS/Meus%20Projetos/nosso-livro/Tarefas%20-%20Serviço%20de%20Reserva%20e%20Fila.md) (Fase 1.1 até a Fase 5.2 estão desmarcadas).
* **Ação:** Revisar esses checklists com a equipe para garantir que todos os detalhes específicos (como tratamento de erros, resiliência de rede e testes) batam exatamente com o código implementado e marcá-los como concluídos.

### 6. 🧪 Testes de Integração Ponta a Ponta (E2E)
* Testar os fluxos integrados de ponta a ponta (ex: registrar um empréstimo no Frontend, passar pelo Gateway, validar o usuário/livro síncronamente, persistir o empréstimo, disparar evento no RabbitMQ e verificar o envio de e-mail de notificação).

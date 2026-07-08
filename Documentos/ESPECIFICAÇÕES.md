# Especificações do Projeto — Nosso Livro (Sistema Inteligente de Biblioteca Compartilhada)

Este documento serve como fonte única de verdade para todas as decisões técnicas, funcionais e de gestão tomadas para o desenvolvimento do projeto.

---

## 👥 Equipe e Responsabilidades

Abaixo estão definidos os integrantes do projeto, a linguagem de programação de backend e os microsserviços sob responsabilidade de cada um:

### 👤 Athos Inácio
* **Linguagem Backend:** **Go**
* **Responsabilidades:**
  - Desenvolvimento do **Frontend (React)** (Responsável Principal).
  - Desenvolvimento do **Gateway de API** em Go.
  - Desenvolvimento do **Serviço de Autenticação e Usuário** em Go.
  - Desenvolvimento do **Serviço de Empréstimo** em Go.
  - Orquestração inicial do ambiente de desenvolvimento (Docker Compose).

### 👤 Cauã Herculano
* **Linguagem Backend:** **Python (FastAPI)**
* **Responsabilidades:**
  - Desenvolvimento do **Serviço de Catálogo e Biblioteca** em Python.
  - Desenvolvimento do **Serviço de Recomendação** em Python.
  - Integração com o banco de dados e mensageria RabbitMQ nos seus serviços.

### 👤 Marcus Vinícius
* **Linguagem Backend:** **Node.js (TypeScript)**
* **Responsabilidades:**
  - Desenvolvimento do **Serviço de Reserva e Fila** em Node.js.
  - Desenvolvimento do **Serviço de Notificação** em Node.js.
  - Integração com o banco de dados e mensageria RabbitMQ nos seus serviços.

---

## 🎯 Visão Geral do Projeto

### O Problema
Dificuldade na gestão e no compartilhamento descentralizado de livros físicos entre usuários de uma mesma instituição, resultando em falta de controle sobre empréstimos, devoluções atrasadas, e falta de visibilidade da disponibilidade de títulos.

### A Solução
Um sistema descentralizado baseado em microsserviços para gerenciar o catálogo, múltiplas bibliotecas físicas, empréstimos, reservas de forma justa com fila de espera automatizada, e notificações, com suporte futuro a recomendações inteligentes de leitura.

### Público-Alvo
Estudantes, professores e colaboradores de uma instituição que compartilham acervos de livros.

---

## 💻 Stack Tecnológica e Arquitetura de Microsserviços

O sistema será desenvolvido utilizando uma **Arquitetura de Microsserviços** poliglota e descentralizada.

### 🌐 Arquitetura Geral e Integração
* **Estrutura do Projeto (Monorepo):** O código de todos os microsserviços, frontend e Gateway de API será armazenado em um único repositório Git. Para manter a organização do código limpa e os builds de desenvolvimento eficientes, adotaremos a seguinte estrutura física de diretórios na raiz do repositório:
  ```text
  nosso-livro/ (Raiz do Monorepo)
  ├── frontend/                           # Aplicação cliente React (Vite/TS)
  ├── backend/                            # Diretório agregador de APIs e Serviços
  │   ├── gateway-api/                    # Gateway de API centralizado (Go)
  │   ├── servico-autenticacao-usuario/   # Serviço de Usuários e Autenticação (Go)
  │   ├── servico-emprestimo/             # Serviço de Empréstimos e Devoluções (Go)
  │   ├── servico-catalogo-biblioteca/    # Serviço de Catálogo e Bibliotecas (Python/FastAPI)
  │   ├── servico-recomendacao/           # Serviço de Recomendação Inteligente (Python/FastAPI)
  │   ├── servico-reserva-fila/           # Serviço de Reservas e Filas de Espera (Node.js/TS)
  │   └── servico-notificacao/            # Serviço de Notificações (Node.js/TS)
  ├── docker-compose.yml                  # Orquestrador local de infraestrutura e serviços
  ├── README.md                           # Instruções globais de inicialização do projeto
  └── ESPECIFICAÇÕES.md                   # Fonte única de verdade do projeto
  ```
  Essa organização mantém a raiz do repositório limpa e simplifica a escrita do arquivo centralizado `docker-compose.yml`, que fará o mapeamento e subida automática de todos os microsserviços e seus respectivos bancos locais apontando para os subdiretórios corretos dentro de `./backend/`.
* **Comunicação Síncrona (HTTP/REST):** 
  - Comunicação externa entre o Frontend, o Gateway de API e os serviços de destino.
  - **Integração de Integridade:** Validações de integridade entre serviços serão feitas de forma síncrona e direta via chamadas HTTP internas de serviço para serviço. Por exemplo: antes de salvar um empréstimo, o `Serviço de Empréstimo` realiza chamadas HTTP síncronas para validar se o usuário existe no `Serviço de Autenticação e Usuário` e se o livro existe no `Serviço de Catálogo e Biblioteca`.
* **Comunicação Assíncrona (RabbitMQ):** Uso de mensageria assíncrona orientada a eventos para notificar ações reativas do sistema que não bloqueiam a experiência do usuário principal (detalhado na seção de eventos abaixo).
* **Gateway de API:** Desenvolvido do zero em **Go** para centralizar o roteamento de borda, CORS, e redirecionamento.
* **Autenticação:** Centralizada em tokens JWT. O Gateway valida a assinatura e expiração dos tokens e repassa o cabeçalho com os dados do usuário autenticado para os microsserviços internos.
* **Containerização:** **Docker & Docker Compose** local para gerenciar todos os bancos de dados, broker e microsserviços sob uma mesma rede local virtual.
* **Plataforma de Hospedagem (Produção):**
  - **Frontend:** **Vercel**
  - **Gateway de API & Microsserviços:** **Render**
  - **Banco de Dados PostgreSQL:** **Neon** (PostgreSQL Serverless)
  - **Message Broker (RabbitMQ):** CloudAMQP

### ⚙️ Microsserviços e Divisão de Escopo

O sistema é dividido em 6 microsserviços, distribuídos de forma equilibrada entre as três tecnologias backend escolhidas com base em afinidade técnica e performance:

#### 🐹 Microsserviços em Go (Desenvolvido por Athos)
*   **Serviço de Autenticação e Usuário (pasta: `servico-autenticacao-usuario`):** Cadastro de usuários (RF01), autenticação (login/registro) e geração de tokens JWT.
    *   *Justificativa Técnica:* A autenticação e geração de JWT necessitam de baixo tempo de resposta e alta segurança. Desenvolver em Go permite latências mínimas em rotas públicas críticas e facilita a integração nativa com o **Gateway de API** (também em Go) compartilhando lógicas e chaves de validação.
*   **Serviço de Empréstimo (pasta: `servico-emprestimo`):** Registro de empréstimos (RF03) e devoluções (RF04).
    *   *Justificativa Técnica:* Representa o núcleo transacional de negócio e requer consistência robusta. A tipagem estática do Go, combinada à facilidade de controle de concorrência nativa (goroutines e mutexes), garante um serviço livre de condições de corrida em reservas/empréstimos simultâneos do mesmo livro físico.

#### 🐍 Microsserviços em Python (FastAPI) (Desenvolvido por Cauã)
*   **Serviço de Catálogo e Biblioteca (pasta: `servico-catalogo-biblioteca`):** Cadastro e busca de livros (RF02) e gestão de múltiplas bibliotecas físicas (RF09).
    *   *Justificativa Técnica:* O FastAPI oferece alta performance assíncrona, além de gerar automaticamente a documentação interativa OpenAPI (Swagger), acelerando a integração com o frontend. É ideal também para futuras conexões com APIs externas de busca de livros.
*   **Serviço de Recomendação (pasta: `servico-recomendacao`):** Geração de histórico de utilização (RF08) e stub para futura recomendação inteligente (RF10).
    *   *Justificativa Técnica:* Python é o padrão da indústria para tratamento de dados e Inteligência Artificial. Utilizar Python e FastAPI aqui prepara o serviço de forma nativa para integrar algoritmos e modelos de Machine Learning no futuro.

#### 🟢 Microsserviços em Node.js (TypeScript) (Desenvolvido por Marcus)
*   **Serviço de Reserva e Fila (pasta: `servico-reserva-fila`):** Reservas online (RF07) e gerenciamento automático da fila de espera de livros (RF05).
    *   *Justificativa Técnica:* O fluxo de reservas e ordenação reativa das filas de espera depende fortemente de processamento de mensagens assíncronas do RabbitMQ. O modelo assíncrono não-bloqueante do Node.js é ideal para este fluxo orientado a eventos. O uso do TypeScript facilita o compartilhamento e validação de interfaces de dados com o frontend em React.
*   **Serviço de Notificação (pasta: `servico-notificacao`):** Envio de notificações automáticas (RF06) consumindo eventos do RabbitMQ.
    *   *Justificativa Técnica:* Serviço puramente I/O-bound que consome mensagens das filas e despacha alertas (e-mail, push, etc.). Node.js brilha em processamento de I/O de rede assíncrona e conta com um ecossistema gigantesco de bibliotecas de envio (`nodemailer`, SDKs de notificação push, etc.).

### 🛠️ Tecnologias e Infraestrutura
* **Frontend:** **React** (Hospedado na **Vercel**)
* **Backend (Serviços):** **Go**, **Node.js (TypeScript)** e **Python (FastAPI)** (Hospedados no **Render**)
* **Banco de Dados:** **PostgreSQL** hospedado na **Neon** (bases de dados separadas por microsserviço: `banco_autenticacao`, `banco_catalogo`, `banco_emprestimos`, `banco_reservas`, `banco_notificacoes`, `banco_recomendacoes`).
  - **Migrations:** Cada microsserviço utilizará o sistema de migração nativo de sua respectiva tecnologia/framework para gerenciar seu próprio banco de dados de maneira isolada (ex: `golang-migrate` para Go, `Alembic` para Python/FastAPI e `Prisma/TypeORM Migrations` para Node.js).
* **Mensageria:** **RabbitMQ** (Hospedado via CloudAMQP)
* **Ambiente de Desenvolvimento:** **Docker** e **Docker Compose** local

### ✉️ Catálogo de Eventos (RabbitMQ)

Para a comunicação assíncrona orientada a eventos, as filas do Message Broker serão regidas por 4 eventos principais:

1. **`emprestimo.criado` (Empréstimo Realizado):**
   * *Publicador:* `Serviço de Empréstimo`
   * *Consumidor:* `Serviço de Notificação`
   * *Ação:* Dispara notificação por e-mail/alerta informando sobre a realização do empréstimo e a data limite de devolução.
2. **`emprestimo.devolvido` (Livro Devolvido):**
   * *Publicador:* `Serviço de Empréstimo`
   * *Consumidores:* 
     - `Serviço de Notificação`: Notifica a devolução efetuada com sucesso.
     - `Serviço de Reserva e Fila`: Ativa a verificação na fila de espera para esse livro em específico.
3. **`reserva.criada` (Reserva Registrada):**
   * *Publicador:* `Serviço de Reserva e Fila`
   * *Consumidor:* `Serviço de Notificação`
   * *Ação:* Confirma o ingresso do usuário na fila de espera de determinado título.
4. **`reserva.atribuida` (Livro Liberado para o Próximo da Fila):**
   * *Publicador:* `Serviço de Reserva e Fila` (disparado após processamento e liberação da vaga na fila)
   * *Consumidor:* `Serviço de Notificação`
   * *Ação:* Alerta o próximo usuário na fila de espera que o livro já está disponível para retirada na biblioteca física de coleta selecionada.

### 📝 Diretrizes de Desenvolvimento
* **Idioma do Projeto:** Todo o projeto (interface com o usuário, documentação, commits, mensagens de log, variáveis e comentários do código-fonte) deve ser desenvolvido prioritariamente em **Português do Brasil (PT-BR)**, facilitando a colaboração da equipe e a avaliação acadêmica.

---

## 📋 Requisitos e Funcionalidades

### Requisitos Funcionais (RF)
* **[RF01] Cadastrar usuários:** Registro e gerenciamento dos dados cadastrais dos membros da instituição.
* **[RF02] Cadastrar livros:** Gerenciamento dos títulos físicos disponíveis para compartilhamento.
* **[RF03] Registrar empréstimos:** Controle de qual usuário pegou qual livro e prazos de devolução.
* **[RF04] Registrar devoluções:** Baixa de empréstimos ativos com atualização do status do livro.
* **[RF05] Gerenciar fila de espera:** Controle de prioridade automática quando um livro desejado já estiver emprestado.
* **[RF06] Enviar notificações automáticas:** Alertas automáticos de prazos vencidos, novos empréstimos ou livros disponíveis na fila de espera.
* **[RF07] Permitir reservas online:** Reserva prévia de livros que estão disponíveis ou emprestados.
* **[RF08] Gerar histórico de utilização:** Relatório ou logs de empréstimos passados por usuário e por livro.
* **[RF09] Gerenciar múltiplas bibliotecas:** Controle de diferentes pontos físicos de coleta/devolução de livros.
* **[RF10] Suportar futura recomendação inteligente:** Estrutura modular preparada para receber um serviço de recomendação de leitura.

### Requisitos Não-Funcionais (RNF)
* **[RNF01] Arquitetura de Microsserviços:** O sistema deve ser decomposto em serviços modulares e independentes.
* **[RNF02] Persistência Consistente:** Bancos de dados garantindo a integridade dos dados transacionais de empréstimo.
* **[RNF03] Segurança e Autenticação:** Autenticação baseada em JWT para comunicação segura entre o cliente e os microsserviços.
* **[RNF04] Escalabilidade:** Serviços containerizados com Docker facilitando o escalonamento independente de componentes (ex: catálogo sob alta carga).

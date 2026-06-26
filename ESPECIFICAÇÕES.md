# Especificações do Projeto — Nosso Livro (Sistema Inteligente de Biblioteca Compartilhada)

Este documento serve como fonte única de verdade para todas as decisões técnicas, funcionais e de gestão tomadas para o desenvolvimento do projeto.

---

## 👥 Equipe e Responsabilidades

Abaixo estão definidos os integrantes do projeto e a linguagem de programação de backend escolhida por cada um para desenvolver seus respectivos microsserviços (a divisão exata de qual serviço ficará com quem será definida posteriormente):

### 👤 Athos Inácio
* **Linguagem Backend:** **Go**
* **Responsabilidades:**
  - Desenvolvimento do **Frontend (React)** (Responsável Principal).
  - Desenvolvimento do **API Gateway** em Go.
  - Desenvolvimento de 2 microsserviços em Go.
  - Orquestração inicial do ambiente de desenvolvimento (Docker Compose).

### 👤 Cauã Herculano
* **Linguagem Backend:** **Python (FastAPI)**
* **Responsabilidades:**
  - Desenvolvimento de 2 microsserviços em Python.
  - Integração com o banco de dados e mensageria RabbitMQ nos seus serviços.

### 👤 Marcus Vinícius
* **Linguagem Backend:** **Node.js (TypeScript)**
* **Responsabilidades:**
  - Desenvolvimento de 2 microsserviços em Node.js.
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

### 🌐 Arquitetura Geral
* **Comunicação Síncrona:** HTTP/REST entre o Frontend, o API Gateway e os serviços de destino.
* **Comunicação Assíncrona:** **RabbitMQ** (Message Broker) para eventos (ex: notificações enviadas após devoluções ou novos empréstimos).
* **API Gateway:** Desenvolvido do zero em **Go** (para roteamento dinâmico e centralização de regras).
* **Autenticação:** Baseada em tokens JWT. O Gateway valida os tokens e repassa as informações do usuário autenticado no cabeçalho das requisições para os microsserviços.
* **Containerização:** **Docker & Docker Compose** para gerenciar e rodar a aplicação localmente.
* **Plataforma de Hospedagem (Produção):**
  - **Frontend:** **Vercel**
  - **API Gateway & Microsserviços:** **Render**
  - **Banco de Dados PostgreSQL:** **Neon** (PostgreSQL Serverless)
  - **Message Broker (RabbitMQ):** CloudAMQP (ou outro provedor de RabbitMQ em nuvem)

### ⚙️ Microsserviços e Divisão de Escopo
1. **User & Auth Service (Serviço de Usuários):** Cadastro de usuários (RF01), autenticação (login/registro) e geração de tokens JWT.
2. **Catalog & Library Service (Serviço de Catálogo):** Cadastro e busca de livros (RF02), além de gestão de múltiplas bibliotecas físicas (RF09).
3. **Loan Service (Serviço de Empréstimos):** Registro de empréstimos (RF03) e devoluções (RF04).
4. **Reservation & Waiting List Service (Serviço de Reservas):** Reservas online (RF07) e gerenciamento automático da fila de espera de livros (RF05).
5. **Notification Service (Serviço de Notificações):** Envio de notificações automáticas (RF06) consumindo eventos do RabbitMQ.
6. **Recommendation Service (Serviço de Recomendação):** Geração de histórico de utilização (RF08) e stub para futura recomendação inteligente (RF10).

### 🛠️ Tecnologias e Infraestrutura
* **Frontend:** **React** (Hospedado na **Vercel**)
* **Backend (Serviços):** **Go**, **Node.js (TypeScript)** e **Python (FastAPI)** (Hospedados no **Render**)
* **Banco de Dados:** **PostgreSQL** hospedado na **Neon** (bases de dados separadas por microsserviço: `auth_db`, `catalog_db`, `loans_db`, `reservations_db`, `notifications_db`, `recommendations_db`)
* **Mensageria:** **RabbitMQ** (Hospedado via CloudAMQP)
* **Ambiente de Desenvolvimento:** **Docker** e **Docker Compose** local

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

---

## 📅 Planejamento de Entregas (Milestones)

*Divisão sugerida do desenvolvimento em fases:*

* **Milestone 1 - Planejamento e Arquitetura:** Definição do escopo, diagramas e configuração dos repositórios.
* **Milestone 2 - MVP (Produto Mínimo Viável):** Desenvolvimento das funcionalidades principais.
* **Milestone 3 - Integração e Ajustes:** Testes, correções de bugs e deploy em ambiente de produção/homologação.

# 📋 Checklist de Tarefas - Serviço de Autenticação e Usuário

Este documento funciona como um guia de acompanhamento (To-Do List) para a implementação completa do microsserviço **Serviço de Autenticação e Usuário**, desenvolvido em **Go (Golang)**. Ele serve como o núcleo de segurança e controle de acessos da plataforma de Biblioteca Compartilhada "Nosso Livro".

> [!IMPORTANT]
> **REGRA DE IDIOMA DO PROJETO (PT-BR):**
> Todo o desenvolvimento deste microsserviço (incluindo rotas HTTP, payloads JSON, nomes de variáveis, structs, funções, tabelas do banco de dados, comentários de código, mensagens de log e commits) deve ser realizado estritamente em **Português do Brasil (PT-BR)**. É proibido o uso de termos em inglês nas implementações internas e externas deste serviço.

---

## 🗺️ Mapa de Progresso Geral

- [x] **Fase 1: Configuração do Módulo e Banco de Dados (Go + PostgreSQL)**
- [x] **Fase 2: Camada de Domínio e Repositórios (Domínio & Repositório)**
- [x] **Fase 3: Lógica de Autenticação, Criptografia e JWT (Serviços)**
- [x] **Fase 4: Handlers HTTP, Rotas e Middlewares (Controladores)**
- [x] **Fase 5: Segurança, Limitador de Taxa e Validações**
- [x] **Fase 6: Testes Automatizados e Cobertura**
- [x] **Fase 7: Dockerização, Observabilidade e Práticas de Produção**

---

## 🗄️ Fase 1: Configuração do Módulo e Banco de Dados
Configuração inicial do projeto Go e da estrutura de migração com PostgreSQL.

- [x] **M1.1: Inicialização do Projeto Go**
  - [x] Executar `go mod init nosso-livro/servico-autenticacao-usuario` dentro da pasta `./backend/servico-autenticacao-usuario/`
  - [x] Organizar a estrutura de diretórios em português:
    - `/cmd/api/principal.go` (Ponto de entrada da aplicação)
    - `/internal/dominio` (Entidades e contratos de interfaces)
    - `/internal/repositorio` (Persistência em banco de dados)
    - `/internal/servico` (Lógica de negócios e regras de autenticação)
    - `/internal/controlador` (Controladores HTTP e adaptadores de entrada)
    - `/migrations` (Scripts de alteração de banco de dados SQL em português)
- [x] **M1.2: Configuração de Migrações com `golang-migrate`**
  - [x] Configurar a ferramenta para gerenciar o banco `banco_autenticacao`.
  - [x] Criar a primeira migração (`000001_cria_tabela_usuarios.up.sql`):
    - `id` do usuário como UUID (gerado automaticamente no banco).
    - Campo `whatsapp` como string (identificador único, indexado).
    - Campo `email` como string (único, indexado).
    - Campo `senha_hash` como string contendo o hash criptográfico.
    - Campo `nome` como string (obrigatório).
    - Campo `permissao` como string (ex: `'administrador'`, `'membro'`).
    - Campo `ativo` como booleano (default `true`).
    - Campos de controle temporal `criado_em` e `atualizado_em`.
- [x] **M1.3: Conexão e Pool de Banco de Dados**
  - [x] Configurar conexão com o banco serverless PostgreSQL Neon via variável de ambiente (`URL_BANCO_DADOS`).
  - [x] Utilizar pool de conexões otimizado (`pgx/v5` ou `sqlx`) com retry automático contra cold start.

---

## 💾 Fase 2: Camada de Domínio e Repositórios
Modelagem das entidades e escrita das queries de banco em português.

- [x] **M2.1: Estruturas de Domínio (`dominio`)**
  - [x] Definir a struct `Usuario` mapeando os campos do banco de dados com tags JSON em português.
  - [x] Criar a interface `RepositorioUsuario` com os contratos de persistência.
  - [x] Definir as estruturas de DTOs para entrada (`RequisicaoCadastro`, `RequisicaoLogin`) e saída (`RespostaUsuario`).
- [x] **M2.2: Implementação do Repositório (`repositorio`)**
  - [x] Desenvolver a persistência concreta do repositório utilizando comandos SQL parametrizados.
  - [x] Método `Criar(ctx, usuario)` para cadastrar novos usuários.
  - [x] Método `BuscarPorID(ctx, id)` para obter dados de usuário.
  - [x] Método `BuscarPorWhatsApp(ctx, whatsapp)` para encontrar usuários pelo telefone.
  - [x] Método `BuscarPorEmail(ctx, email)` para encontrar usuários pelo email.
  - [x] Tratar erros de chave duplicada retornando mensagens de erro limpas e informativas (ex: "WhatsApp já cadastrado").

---

## 🔒 Fase 3: Lógica de Autenticação, Criptografia e JWT (Serviços)
Regras de segurança de acesso e criptografia de credenciais.

- [x] **M3.1: Hashing de Senhas**
  - [x] Usar `golang.org/x/crypto/bcrypt` para hash da senha.
  - [x] Criar funções `GerarHashSenha` e `CompararSenhaHash`.
- [x] **M3.2: Geração e Validação de Tokens JWT**
  - [x] Utilizar o pacote `github.com/golang-jwt/jwt/v5`.
  - [x] Definir a chave secreta a ser lida de variável de ambiente (`CHAVE_SECRETA_JWT`).
  - [x] Criar claims contendo:
    - ID do Usuário (`sub`)
    - Permissão / Cargo (`permissao`)
    - Telefone WhatsApp (`whatsapp`)
    - Data de expiração (`exp` - padrão de 24 horas)
  - [x] Função para gerar e assinar o token (`GerarTokenAutenticacao`).
  - [x] Função para decodificar e validar o token (`ValidarTokenAutenticacao`).

---

## 🌐 Fase 4: Handlers HTTP, Rotas e Middlewares (Controladores)
Criação dos endpoints REST e roteamento em português.

- [x] **M4.1: Endpoints de Registro e Login**
  - [x] `POST /api/autenticacao/cadastro` (Público):
    - Recebe dados em português (`nome`, `whatsapp`, `email`, `senha`).
    - Valida dados de entrada e cria o usuário no banco de dados.
  - [x] `POST /api/autenticacao/login` (Público):
    - Recebe credenciais (`whatsapp` ou `email`, e `senha`).
    - Valida as credenciais e retorna o token JWT e dados do usuário.
- [x] **M4.2: Endpoints de Informação de Perfil e Integração**
  - [x] `GET /api/usuarios/me` (Protegido):
    - Retorna o perfil completo do usuário logado baseado no token fornecido no cabeçalho `Authorization: Bearer <token>`.
  - [x] `GET /api/usuarios/{id}` (Protegido/Interno):
    - Retorna dados públicos do usuário por ID (endpoint síncrono que será consultado pelo `Serviço de Empréstimo` para verificar se o usuário existe).
- [x] **M4.3: Middlewares**
  - [x] Middleware CORS.
  - [x] Middleware de logs estruturados das requisições.
  - [x] Middleware de recuperação de pânicos (Panic Recovery) retornando JSON com erro 500 controlado.
  - [x] Middleware de autenticação JWT para rotas protegidas (extrai o token, valida e injeta o usuário no contexto).

---

- [x] **Fase 5: Segurança, Limitador de Taxa e Validações**
Controles contra abusos e validação estrutural.

- [x] **M5.1: Limitador de Taxa (Rate Limiting)**
  - [x] Implementar limitador de requisições nas rotas de `/login` e `/cadastro` (usando `golang.org/x/time/rate` ou similar) para evitar força bruta.
- [x] **M5.2: Validação de Dados**
  - [x] Validar formato de e-mail e formato de telefone WhatsApp antes do processamento no banco.

---

## 🧪 Fase 6: Testes Automatizados e Cobertura
Garantia de qualidade por meio de testes locais.

- [x] **M6.1: Testes Unitários**
  - [x] Testar hash de senhas e geração/validação de tokens JWT.
- [x] **M6.2: Testes de Integração com Banco Mockado**
  - [x] Criar testes para o repositório utilizando banco PostgreSQL de testes ou `go-sqlmock`.
  - [x] Testar cenários de concorrência massiva de cadastros simultâneos com o mesmo WhatsApp, assegurando que o sistema rejeite a duplicidade sem quebras.
  - [x] Executar toda a suíte de testes com a flag `-race` do Go ativa.

---

## 🚀 Fase 7: Dockerização, Observabilidade e Práticas de Produção
Deploy e suporte de produção.

- [x] **M7.1: Dockerfile Otimizado**
  - [x] Criar `Dockerfile` multi-stage gerando imagem estática enxuta baseada em `scratch` ou `alpine` mínimo.
- [x] **M7.2: Desligamento Gracioso (Graceful Shutdown)**
  - [x] Interceptação de sinais `SIGINT` e `SIGTERM` para fechar o servidor, conexões pendentes e pool do PostgreSQL de forma ordenada.
- [x] **M7.3: Health Check e Logs**
  - [x] Endpoints de saúde `/saude` e `/pronto`.
  - [x] Logs estruturados em formato JSON utilizando a biblioteca nativa `slog` em português.

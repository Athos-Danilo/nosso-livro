# 📋 Checklist de Tarefas - Gateway de API

Este documento funciona como um guia de acompanhamento (To-Do List) para a implementação completa do **Gateway de API**, desenvolvido em **Go (Golang)**. Ele atua como o ponto de entrada único (borda) para o ecossistema de microsserviços da plataforma de Biblioteca Compartilhada "Nosso Livro".

> [!IMPORTANT]
> **REGRA DE IDIOMA DO PROJETO (PT-BR):**
> Todo o desenvolvimento deste componente (incluindo rotas HTTP, payloads JSON, nomes de variáveis, structs, funções, comentários de código, mensagens de log e commits) deve ser realizado estritamente em **Português do Brasil (PT-BR)**. É proibido o uso de termos em inglês nas implementações internas e externas deste serviço.

---

## 🗺️ Mapa de Progresso Geral

- [x] **Fase 1: Configuração do Módulo e Ambiente (Go + HTTP)**
- [x] **Fase 2: Motor de Roteamento e Proxy Reverso (Mapeamento & Proxy)**
- [x] **Fase 3: Middleware de CORS Global e Segurança Básica (CORS & Headers)**
- `[x]` **Fase 4: Validação de Token JWT e Propagação de Contexto (Autenticação)**
- `[x]` **Fase 5: Tratamento de Erros, Resiliência e Timeouts (Resiliência)**
- [x] **Fase 6: Testes Automatizados (Roteamento & JWT)**
- [x] **Fase 7: Dockerização, Desligamento Gracioso e Logs (Produção)**

---

## 🗄️ Fase 1: Configuração do Módulo e Ambiente
Configuração inicial do projeto Go e preparação das variáveis de ambiente.

- [x] **M1.1: Inicialização do Projeto Go**
  - [x] Executar `go mod init nosso-livro/gateway-api` dentro da pasta `./backend/gateway-api/`.
  - [x] Organizar a estrutura de diretórios em português:
    - `/cmd/gateway/principal.go` (Ponto de entrada do serviço)
    - `/internal/configuracao` (Leitura e mapeamento de variáveis de ambiente)
    - `/internal/middleware` (Middlewares de CORS, segurança e autenticação)
    - `/internal/proxy` (Controladores e handlers de proxy reverso)
    - `/internal/logger` (Configuração do logger estruturado)
- [x] **M1.2: Configurações via Variáveis de Ambiente**
  - [x] Configurar leitura do arquivo `.env` para rodar localmente.
  - [x] Mapear as seguintes variáveis cruciais no código:
    - `PORTA` (Porta de escuta do Gateway, ex: `3000`)
    - `AMBIENTE` (Ambiente de execução: `desenvolvimento` ou `producao`)
    - `CHAVE_SECRETA_JWT` (Chave secreta compartilhada para decodificar e validar os tokens)
    - `URL_SERVICO_USUARIO` (Endereço interno do Serviço de Autenticação e Usuário)
    - `URL_SERVICO_CATALOGO` (Endereço interno do Serviço de Catálogo e Biblioteca)
    - `URL_SERVICO_EMPRESTIMO` (Endereço interno do Serviço de Empréstimo)
    - `URL_SERVICO_RESERVA` (Endereço interno do Serviço de Reserva e Fila)
    - `URL_SERVICO_RECOMENDACAO` (Endereço interno do Serviço de Recomendação)

---

## 🔗 Fase 2: Motor de Roteamento e Proxy Reverso
Mapeamento das rotas de borda e encaminhamento HTTP síncrono para os microsserviços corretos.

- [x] **M2.1: Roteador HTTP Centralizado**
  - [x] Configurar roteador HTTP utilizando o `http.NewServeMux` nativo do Go (1.22+) ou biblioteca leve (`go-chi/chi`).
  - [x] Mapear as rotas de borda correspondentes a cada microsserviço:
    - `/api/autenticacao/*` e `/api/usuarios/*` -> Redirecionar para `URL_SERVICO_USUARIO`
    - `/api/livros/*` e `/api/bibliotecas/*` -> Redirecionar para `URL_SERVICO_CATALOGO`
    - `/api/emprestimos/*` -> Redirecionar para `URL_SERVICO_EMPRESTIMO`
    - `/api/reservas/*` -> Redirecionar para `URL_SERVICO_RESERVA`
    - `/api/recomendacoes/*` -> Redirecionar para `URL_SERVICO_RECOMENDACAO`
- [x] **M2.2: Implementação do Proxy Reverso**
  - [x] Desenvolver a lógica de proxy utilizando o pacote padrão `net/http/httputil` com a struct `ReverseProxy`.
  - [x] Garantir o repasse integral do método HTTP, rota, cabeçalhos de origem, query params e corpo da requisição (payload JSON).
  - [x] Ajustar os caminhos (URIs) no redirecionamento caso o microsserviço de destino utilize caminhos relativos diferentes.

---

## 🛡️ Fase 3: Middleware de CORS Global e Segurança Básica
Tratamento das requisições do Frontend e proteções na borda da API.

- [x] **M3.1: Middleware de CORS Global**
  - [x] Desenvolver middleware para aceitar requisições de origens permitidas (lidas de variáveis de ambiente, ex: local `http://localhost:5173` ou Vercel em produção).
  - [x] Definir os cabeçalhos corretos: `Access-Control-Allow-Origin`, `Access-Control-Allow-Methods` (GET, POST, PUT, DELETE, OPTIONS, PATCH), e `Access-Control-Allow-Headers` (Content-Type, Authorization).
  - [x] Responder imediatamente com status `204 No Content` para requisições do tipo Preflight (`OPTIONS`), interrompendo o fluxo antes do proxy.
- [x] **M3.2: Proteção Elementar de Borda**
  - [x] Limitar o tamanho dos corpos de requisições HTTP permitidos (ex: máximo 2MB) para prevenir ataques simples de negação de serviço (DoS).
  - [x] Configurar cabeçalhos padrões de segurança: `X-Content-Type-Options: nosniff` e `X-Frame-Options: DENY`.

---

## 🔑 Fase 4: Validação de Token JWT e Propagação de Contexto
Centralização da autenticação na borda e comunicação do usuário logado para os microsserviços.

- [x] **M4.1: Extração e Validação do JWT**
  - [x] Criar o middleware de validação de token JWT.
  - [x] Capturar o cabeçalho `Authorization: Bearer <token>`.
  - [x] Validar a assinatura do token usando a chave `CHAVE_SECRETA_JWT` e confirmar o prazo de validade (`exp`) por meio do pacote `github.com/golang-jwt/jwt/v5`.
  - [x] Retornar status HTTP `401 Unauthorized` com corpo JSON em português se o token for inválido, ausente ou expirado.
- [x] **M4.2: Liberação de Rotas Públicas (Pass-through)**
  - [x] Criar uma lista de exceções (rotas públicas) que contornam a obrigatoriedade do token:
    - `POST /api/autenticacao/cadastro` (Registro de usuário)
    - `POST /api/autenticacao/login` (Autenticação inicial)
    - `/saude` (Health check do Gateway)
    - `/pronto` (Readiness check do Gateway)
- [x] **M4.3: Injeção de Cabeçalhos Internos (Propagação de Contexto)**
  - [x] Em caso de token válido, decodificar as claims internas (`sub`, `email`, `whatsapp`, `permissao`).
  - [x] Injetar as claims extraídas nos cabeçalhos da requisição que será enviada aos microsserviços internos:
    - `X-Usuario-ID` (ID do usuário autenticado)
    - `X-Usuario-Email` (E-mail do usuário autenticado)
    - `X-Usuario-WhatsApp` (Telefone do usuário autenticado)
    - `X-Usuario-Permissao` (Cargo/função de permissão do usuário, ex: `'administrador'`, `'membro'`)
  - [x] **Proteção de Spoofing:** Garantir que o Gateway remova/sobrescreva quaisquer cabeçalhos que iniciem com `X-Usuario-` presentes na requisição externa original do cliente, impedindo que usuários mal-intencionados forjem a própria identidade.

---

## 💾 Fase 5: Tratamento de Erros, Resiliência e Timeouts
Garantias de resiliência e estabilidade da comunicação de borda com os serviços internos.

- [x] **M5.1: Configuração de Timeouts do Proxy**
  - [x] Configurar limites de tempo rígidos para chamadas do Proxy Reverso (ex: timeout de conexão de 2s e timeout de resposta de 5s).
  - [x] Evitar consumo indefinido de threads e portas de rede por conta de microsserviços em lentidão extrema ou travados.
- [x] **M5.2: Manipulador de Erros do Proxy (ErrorHandler)**
  - [x] Customizar a propriedade `ErrorHandler` do `ReverseProxy` para capturar falhas de rede (ex: `connection refused` ao tentar chamar um serviço offline).
  - [x] Retornar um JSON limpo e padronizado em português com status `503 Service Unavailable` em vez de expor erros nativos de rede ou falhas brancas de conexão.

---

## 🧪 Fase 6: Testes Automatizados
Garantia de segurança da borda e validação do fluxo de roteamento do proxy.

- [x] **M6.1: Testes Unitários de Middlewares**
  - [x] Validar CORS: testar respostas de cabeçalhos com origens autorizadas e requisições OPTIONS.
  - [x] Validar Autenticação: testar o middleware de JWT fornecendo tokens válidos (esperando a injeção dos cabeçalhos contextuais), expirados, corrompidos e assinados com chaves incorretas.
- [x] **M6.2: Testes de Roteamento e Proxy Reverso**
  - [x] Desenvolver suíte de testes de integração utilizando servidores de teste locais (`httptest.NewServer`).
  - [x] Simular os microsserviços internos com mocks de endpoints e validar se as requisições enviadas ao Gateway chegam corretamente aos seus respectivos destinos com os cabeçalhos `X-Usuario-*` propagados.

---

## 🚀 Fase 7: Dockerização, Desligamento Gracioso e Logs
Configurações finais de observabilidade e empacotamento para ambiente de produção local e nuvem.

- [x] **M7.1: Dockerfile Otimizado**
  - [x] Criar `Dockerfile` multi-stage compilando o binário Go de forma estática no primeiro estágio.
  - [x] Utilizar no segundo estágio uma imagem final mínima (`alpine` ou `scratch`) contendo apenas o binário compilado e certificados SSL essenciais.
- [x] **M7.2: Desligamento Gracioso (Graceful Shutdown)**
  - [x] Interceptação de sinais do sistema operacional `SIGINT` e `SIGTERM`.
  - [x] Interromper a escuta do servidor HTTP e aguardar a conclusão das requisições proxy ativas no momento (com timeout limite de 10s).
- [x] **M7.3: Health Check e Logs Estruturados**
  - [x] Criar endpoint `/saude` para retornar status básico do Gateway (`ativo`).
  - [x] Criar endpoint `/pronto` para checar de forma integrada se o Serviço de Autenticação e Usuário está disponível.
  - [x] Implementar logs estruturados em JSON no padrão `slog` ou `zerolog` em português.
  - [x] Registrar dados como: IP de origem, método HTTP, URI de acesso, status HTTP de retorno e tempo total de latência.

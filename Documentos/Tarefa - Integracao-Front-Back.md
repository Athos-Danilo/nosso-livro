# Tarefas de Integração: Frontend e Backend

Este documento detalha os problemas encontrados na integração entre o frontend e os microsserviços do backend, além das tarefas necessárias para resolvê-los e garantir que o projeto funcione 100% de forma integrada.

## 1. Problemas Identificados no Painel (Dashboard)

A página `Painel.tsx` atualmente não consegue buscar dados reais porque as rotas chamadas não correspondem ao que está implementado no backend, ou os endpoints simplesmente não existem. Como solução paleativa temporária, o frontend estava usando uma função `simularAPI()`.

### 1.1 Estatísticas da Biblioteca
- **Problema**: O frontend tenta chamar `GET /api/bibliotecas/estatisticas` para buscar o total de livros disponíveis.
- **Causa**: O `servico-catalogo-biblioteca` não possui esse endpoint implementado (`app/api/bibliotecas.py`).
- **Solução**: 
  1. Implementar o endpoint `GET /estatisticas` (ou `/bibliotecas/estatisticas`) no `servico-catalogo-biblioteca`.
  2. Retornar um JSON com as contagens (ex: `{"total": 142}`).
  3. No `Painel.tsx`, substituir `simularAPI` por `api.get('/api/bibliotecas/estatisticas')`.

### 1.2 Reservas do Usuário
- **Problema**: O frontend no Painel tenta chamar `GET /api/reservas/usuario`.
- **Causa**: A rota correta exposta no `servico-reserva-fila` (e mapeada no Gateway) é `GET /api/reservas/me`. 
- **Solução**: Corrigir a chamada no `Painel.tsx` para `api.get('/api/reservas/me')` (O mesmo endpoint já usado corretamente na página de Reservas).

### 1.3 Empréstimos Ativos
- **Problema**: O frontend tenta chamar `GET /api/emprestimos/usuario` no Painel.
- **Causa**: O `servico-emprestimo` expõe a listagem na rota `GET /api/emprestimos` (passando o ID do usuário, extraído do token JWT).
- **Solução**: Atualizar o `Painel.tsx` para chamar `api.get('/api/emprestimos')` em vez da simulação.

### 1.4 Notificações do Usuário
- **Problema**: O frontend tenta chamar `GET /api/usuarios/notificacoes`.
- **Causa**: O `servico-notificacao` (Node.js/Express) atualmente não expõe nenhuma rota REST para listar notificações no banco de dados. Ele possui apenas rotas de integridade (`/saude`, `/pronto`).
- **Solução**: 
  1. Criar um controlador e rota `GET /` no `servico-notificacao` para listar as notificações do usuário logado através do Prisma.
  2. Configurar o Gateway (`gateway-api/cmd/gateway/principal.go`) para fazer o proxy reverso de `/api/notificacoes/` para o serviço de notificação.
  3. Atualizar o frontend (`Painel.tsx`) para chamar `api.get('/api/notificacoes')`.

## 2. Ajustes na API Gateway
- **Problema**: A API Gateway não tem mapeamento para o microsserviço de notificações.
- **Solução**: No arquivo `principal.go`, adicionar a criação do `proxyNotificacao` e registrar o roteamento, por exemplo:
  ```go
  mux.Handle("/api/notificacoes/", proxyNotificacao)
  mux.Handle("GET /api/notificacoes", proxyNotificacao)
  ```

## 3. Limpeza do Frontend
- Após garantir que os quatro endpoints acima estão funcionais no backend e mapeados no Gateway:
  1. Remover a função estática `simularAPI()` do `Painel.tsx`.
  2. Modificar o bloco `Promise.allSettled` para fazer as requisições HTTP reais usando o `api` do Axios.
  3. Garantir que, se o array de dados retornado não vier com a estrutura esperada (ex: `.data.total`), o frontend faça a adaptação correta para o contador na tela.

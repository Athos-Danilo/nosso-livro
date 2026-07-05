# 📋 Checklist de Tarefas - Tela de Catálogo de Livros

Este documento funciona como um guia de acompanhamento (To-Do List) para a conclusão e polimento da tela de **Catálogo de Livros** do sistema "Nosso Livro". O objetivo é criar uma vitrine de livros extremamente atraente, com filtros instantâneos e interatividade de alta fidelidade.

> [!IMPORTANT]
> **REGRA DE IDIOMA E PADRÕES DO PROJETO (PT-BR):**
> Toda a interface visual, mensagens de feedback, placeholders, logs de console, estruturas de variáveis e comentários deste componente devem ser estritamente em **Português do Brasil (PT-BR)**.
> **DIRETRIZ DESIGN PREMIUM:**
> A interface deve possuir estética glassmorphism refinada, efeitos dinâmicos de hover, foco e animações fluidas baseadas no design system definido em [variaveis.css](file:///c:/Users/Athos/ADS/Meus%20Projetos/nosso-livro/frontend/src/styles/variaveis.css).

---

## 🗺️ Mapa de Progresso da Tela

- [ ] **Fase 1: Painel de Filtros e Grid de Livros**
- [ ] **Fase 2: Cards de Livros com Efeitos Visuais Avançados**
- [ ] **Fase 3: Modal de Detalhes e Ações Rápidas**
- [ ] **Fase 4: Integração com APIs (Catálogo, Empréstimos e Reservas)**
- [ ] **Fase 5: Interface de Cadastro de Livros (Modo Administrador)**
- [ ] **Fase 6: Paginação Infinita, Skeletons e Performance**

---

## 🎨 Fase 1: Painel de Filtros e Grid de Livros
Criação do cabeçalho de busca rápida e estruturação do catálogo.

- [ ] **M1.1: Barra de Pesquisa e Filtros Rápidos**
  - [ ] Projetar barra de pesquisa superior estilizada, com ícone de lupa que muda de cor ao focar.
  - [ ] Implementar painel de filtros expansível (Gênero, Autor, Disponibilidade) com transição de colapso/expansão suave (`max-height` animado).
  - [ ] Criar tags/chips ativos de filtro selecionados (Ex: "Disponível", "Ficção") que podem ser removidos com um clique.
- [ ] **M1.2: Grid Responsivo Dinâmico**
  - [ ] Definir o grid com CSS Grid configurado para se adaptar automaticamente a diferentes tamanhos de tela (`repeat(auto-fill, minmax(180px, 1fr))`).
  - [ ] Configurar espaçamento harmonioso (`gap: 24px`) e alinhamento centralizado.

---

## 🎬 Fase 2: Cards de Livros com Efeitos Visuais Avançados
Projetar os elementos que compõem o livro, tornando-os atraentes e fáceis de escanear.

- [ ] **M2.1: Card de Livro com Capa e Info Básica**
  - [ ] Desenhar o card usando a classe `card-glass` com borda arredondada de `--raio-borda-md`.
  - [ ] Criar placeholder dinâmico com gradiente e título do livro centralizado para cobrir a ausência de imagem de capa física.
- [ ] **M2.2: Efeito Hover Tridimensional ou de Elevação**
  - [ ] Ao passar o mouse sobre o card do livro, aplicar efeito hover de elevação suave (`translateY(-8px)`) e uma sombra projetada difusa (`--sombra-lg`).
  - [ ] Aplicar zoom sutil na imagem da capa (`transform: scale(1.05)`) sem que ela ultrapasse os limites do card (`overflow: hidden`).
- [ ] **M2.3: Crachás de Status (Badges) Estilizados**
  - [ ] Inserir badge dinâmico indicando o status do livro: "Disponível" em `--cor-sucesso`, "Emprestado" em `--cor-erro` ou "Reservado" em `--cor-alerta`.
  - [ ] Adicionar um efeito pulsação sutil na cor da badge de status disponível.

---

## 🔎 Fase 3: Modal de Detalhes e Ações Rápidas
Ficha técnica completa do livro selecionado e ativação dos fluxos do sistema.

- [ ] **M3.1: Modal com Backdrop Blur e Animação de Entrada**
  - [ ] Criar modal de detalhes que se sobrepõe à tela com fundo escurecido semi-transparente e desfoque (`backdrop-filter: blur(8px)`).
  - [ ] Configurar animação de entrada do modal: surgir do centro com escala inicial reduzida (Ex: `scale(0.95)` para `scale(1)`) e fade-in associado em 250ms.
- [ ] **M3.2: Ficha Técnica Detalhada do Livro**
  - [ ] Exibir título completo, autor, editora, ano de publicação, quantidade de páginas, sinopse, e bibliotecas físicas que possuem exemplares.
  - [ ] Criar seção mostrando a fila de espera atual (quantas pessoas estão na fila para este livro caso ele esteja indisponível).
- [ ] **M3.3: Botões de Ação Condicionais no Modal**
  - [ ] Se o livro estiver disponível: Exibir botão "Solicitar Empréstimo" (destacado).
  - [ ] Se o livro estiver emprestado: Exibir botão "Entrar na Fila de Reserva" (cor de acento).
  - [ ] Se o usuário já estiver na fila de espera do livro: Exibir botão "Cancelar Reserva" com visual discreto.

---

## 🔗 Fase 4: Integração com APIs (Catálogo, Empréstimos e Reservas)
Conectar a tela do catálogo com as APIs correspondentes de cada microsserviço.

- [ ] **M4.1: Consumo do Serviço de Catálogo (Python/FastAPI)**
  - [ ] Chamar `GET /api/catalogo/livros` para listar todos os livros cadastrados.
  - [ ] Implementar parâmetros de filtro na query (pesquisa de texto, filtros por categoria).
- [ ] **M4.2: Integração com o Serviço de Empréstimos (Go)**
  - [ ] Ao clicar em "Solicitar Empréstimo", disparar a requisição `POST /api/emprestimos` passando o ID do livro e a biblioteca de retirada desejada.
  - [ ] Exibir mensagem de sucesso animada: "Empréstimo registrado com sucesso! Retire seu livro na biblioteca selecionada."
- [ ] **M4.3: Integração com o Serviço de Reservas (Node.js)**
  - [ ] Ao clicar em "Entrar na Fila de Reserva", disparar a requisição `POST /api/reservas` passando o ID do livro.
  - [ ] Mostrar pop-up de sucesso informando a posição que o usuário ocupa na fila de espera.

---

## ⚙️ Fase 5: Interface de Cadastro de Livros (Modo Administrador)
Rotas e formulários exclusivos para usuários administradores.

- [ ] **M5.1: Botão de Cadastro Exclusivo**
  - [ ] Mostrar botão "Cadastrar Novo Livro" na barra superior do catálogo somente se `usuario.permissao === 'administrador'`.
- [ ] **M5.2: Formulário do Administrador**
  - [ ] Criar modal ou aba para cadastrar novos livros, contendo campos para: Título, Autor, Gênero, Editora, Ano, Sinopse e quantidade de cópias.
  - [ ] Realizar validação de campos obrigatórios no frontend antes de enviar a requisição `POST /api/catalogo/livros`.

---

## 🚀 Fase 6: Paginação Infinita, Skeletons e Performance
Otimização para grandes volumes de dados.

- [ ] **M6.1: Rolagem Infinita (Infinite Scroll) ou Paginação Inteligente**
  - [ ] Implementar carregamento sob demanda ao rolar a página até o fim, evitando carregar todo o acervo de uma vez.
- [ ] **M6.2: Skeletons Animados Premium**
  - [ ] Exibir esqueletos pulsantes com a proporção exata dos cards de livros enquanto os dados estão sendo buscados.
- [ ] **M6.3: Otimização de Imagens e Debounce de Busca**
  - [ ] Adicionar `debounce` de 300ms no campo de busca para evitar dezenas de requisições desnecessárias ao servidor enquanto o usuário digita.

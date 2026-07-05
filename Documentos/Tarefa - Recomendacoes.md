# 📋 Checklist de Tarefas - Tela de Recomendações Inteligentes

Este documento funciona como um guia de acompanhamento (To-Do List) para a conclusão e polimento da tela de **Recomendações Inteligentes** do sistema "Nosso Livro". O objetivo é criar uma vitrine de sugestões literárias altamente atraente e personalizada para o usuário, simulando interfaces modernas de streaming.

> [!IMPORTANT]
> **REGRA DE IDIOMA E PADRÕES DO PROJETO (PT-BR):**
> Toda a interface visual, mensagens de feedback, placeholders, logs de console, estruturas de variáveis e comentários deste componente devem ser estritamente em **Português do Brasil (PT-BR)**.
> **DIRETRIZ DESIGN PREMIUM:**
> A interface deve possuir estética glassmorphism refinada, efeitos dinâmicos de hover, foco e animações fluidas baseadas no design system definido em [variaveis.css](file:///c:/Users/Athos/ADS/Meus%20Projetos/nosso-livro/frontend/src/styles/variaveis.css).

---

## 🗺️ Mapa de Progresso da Tela

- [ ] **Fase 1: Layout de Carrossel de Destaques Literários**
- [ ] **Fase 2: Elementos de Animação e Partículas Premium (Efeito Delite)**
- [ ] **Fase 3: Integração de Consumo com o Serviço de Recomendação**
- [ ] **Fase 4: Painel de Afinidade de Gênero e Estatísticas de Leitura**
- [ ] **Fase 5: Skeletons Pulsantes e Otimização para Conexões Lentas**

---

## 🎨 Fase 1: Layout de Carrossel de Destaques Literários
Modelagem do carrossel horizontal de recomendações que dá destaque aos livros mais sugeridos.

- [ ] **M1.1: Carrossel Horizontal Responsivo**
  - [ ] Projetar seção superior contendo um carrossel horizontal com rolagem suave por toque ou clique de seta, usando CSS flexbox e `overflow-x: auto` estilizado (sem barra de rolagem padrão).
  - [ ] Envelopar cada livro do carrossel na classe `card-glass` com destaque sutil de tamanho superior aos cards padrão.
- [ ] **M1.2: Cartão de Recomendação Especial (Golden/Highlight Card)**
  - [ ] Destacar o livro com maior pontuação de recomendação em um card especial com bordas com gradiente dourado/acento (`--cor-acento`) e sinalizador visual "Recomendação do Dia".
  - [ ] Exibir título do livro, autor, gênero e um breve trecho explicativo (Ex: "Porque você leu Clean Code").

---

## 🎬 Fase 2: Elementos de Animação e Partículas Premium (Efeito Delite)
Efeitos de transição refinados para valorizar a curadoria do sistema inteligente.

- [ ] **M2.1: Animação de Entrada Cinematográfica**
  - [ ] Implementar animação de revelação gradual (fade-in) nos livros com efeito de deslocamento lateral ou elevação vertical de 20px ao carregar a página.
- [ ] **M2.2: Hover Tridimensional com Brilho Dinâmico**
  - [ ] Ao passar o mouse sobre um card recomendado:
    - Aplicar elevação suave (`transform: translateY(-8px) scale(1.03)`).
    - Criar efeito de brilho radial que acompanha a movimentação do mouse sobre o card (efeito holofote sutil).
- [ ] **M2.3: Ícone Interativo de Afinidade (Coração ou Estrela Animada)**
  - [ ] Incluir ícone de afinidade (estrela) que executa uma animação de pulsação rápida ao passar o mouse por cima, permitindo salvar ou descartar a recomendação.

---

## 🔗 Fase 3: Integração de Consumo com o Serviço de Recomendação
Conexão do frontend ao microsserviço de recomendação inteligente desenvolvido em Python/FastAPI.

- [ ] **M3.1: Chamada HTTP ao Endpoint de Recomendação**
  - [ ] Efetuar chamada assíncrona ao endpoint `GET /api/recomendacoes` passando o ID do usuário autenticado no cabeçalho JWT.
  - [ ] Mapear a resposta estruturada contendo a lista de livros recomendados e a justificativa do cálculo.
- [ ] **M3.2: Redirecionamento para Ação Direta**
  - [ ] Permitir que o usuário clique em qualquer livro recomendado para abrir o modal de detalhes correspondente na própria tela do catálogo ou em um modal local.
  - [ ] Incluir botão rápido "Reservar Agora" diretamente no card de recomendação, conectando-se ao Serviço de Reservas.

---

## 📊 Fase 4: Painel de Afinidade de Gênero e Estatísticas de Leitura
Gráficos e informações analíticas sobre o perfil leitor do usuário.

- [ ] **M4.1: Gráficos de Pizza ou Barra Estilizados (Afinidade de Gênero)**
  - [ ] Desenhar um painel lateral indicando os gêneros literários favoritos do usuário (Ex: "Ficção Científica 50%", "Tecnologia 30%") de forma totalmente estilizada, usando blocos de cores puras baseadas em HSL do design system.
  - [ ] Aplicar animação de crescimento das barras ou arcos do gráfico ao entrar na tela.
- [ ] **M4.2: Estatística de Leitor do Mês**
  - [ ] Exibir o perfil de progresso de leitura (quantidade de livros lidos no semestre) de forma atraente.

---

## 🚀 Fase 5: Skeletons Pulsantes e Otimização para Conexões Lentas
Garantia de que a interface não pareça vazia ou quebrada enquanto os cálculos inteligentes são processados.

- [ ] **M5.1: Skeleton Loaders Horizontais para o Carrossel**
  - [ ] Projetar esqueletos retangulares pulsantes imitando os cards de livros do carrossel horizontal enquanto a requisição HTTP está sendo finalizada.
- [ ] **M5.2: Fallbacks Elegantes para Novo Usuário**
  - [ ] Se o usuário for novo e não possuir histórico de leitura que permita calcular recomendações personalizadas:
    - Exibir uma seção convidativa em português: "Ainda não conhecemos suas preferências. Que tal começar lendo alguns dos nossos títulos mais populares?".
    - Mostrar uma lista alternativa com os livros mais emprestados de forma geral na rede.
- [ ] **M5.3: Tratamento de Indisponibilidade do Serviço**
  - [ ] Se o serviço Python/FastAPI falhar, redirecionar visualmente para a lista padrão do catálogo sem interromper a navegação da aplicação.

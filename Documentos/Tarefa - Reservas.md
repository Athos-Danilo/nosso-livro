# 📋 Checklist de Tarefas - Tela de Reservas e Filas de Espera

Este documento funciona como um guia de acompanhamento (To-Do List) para a conclusão e polimento da tela de **Reservas** do sistema "Nosso Livro". O foco é criar um acompanhamento visual claro do status de cada reserva e da posição do usuário na fila de espera.

> [!IMPORTANT]
> **REGRA DE IDIOMA E PADRÕES DO PROJETO (PT-BR):**
> Toda a interface visual, mensagens de feedback, placeholders, logs de console, estruturas de variáveis e comentários deste componente devem ser estritamente em **Português do Brasil (PT-BR)**.
> **DIRETRIZ DESIGN PREMIUM:**
> A interface deve possuir estética glassmorphism refinada, efeitos dinâmicos de hover, foco e animações fluidas baseadas no design system definido em [variaveis.css](file:///c:/Users/Athos/ADS/Meus%20Projetos/nosso-livro/frontend/src/styles/variaveis.css).

---

## 🗺️ Mapa de Progresso da Tela

- [ ] **Fase 1: Layout e Estrutura de Cartões de Reservas**
- [ ] **Fase 2: Indicador de Fila de Espera (Timeline ou Barra de Progresso)**
- [ ] **Fase 3: Integração com APIs e Ações de Cancelamento**
- [ ] **Fase 4: Alertas de Liberação de Livros e Retirada**
- [ ] **Fase 5: Estados Vazios Elegantes e Polimento Visual**

---

## 🎨 Fase 1: Layout e Estrutura de Cartões de Reservas
Construção do painel organizador das solicitações ativas do usuário.

- [ ] **M1.1: Cartões Individuais de Reserva (Classe Glass)**
  - [ ] Projetar cada reserva ativa como um cartão no formato `card-glass` com cantos arredondados (`--raio-borda-md`).
  - [ ] Exibir de forma destacada o título do livro, autor e a data de criação da reserva.
- [ ] **M1.2: Grid de Exibição e Divisões**
  - [ ] Organizar os cartões em coluna única (tipo lista) para facilitar o acompanhamento linear das filas de espera.
  - [ ] Adicionar bordas sutis com `--cor-borda` para separar a imagem simulada do livro dos dados textuais.
- [ ] **M1.3: Cabeçalho da Tela**
  - [ ] Criar título estruturado da página com contagem de reservas ativas (Ex: "Minhas Reservas (2)").

---

## 🎬 Fase 2: Indicador de Fila de Espera (Timeline ou Barra de Progresso)
Criar elementos dinâmicos que informem ao usuário sua posição exata na fila.

- [ ] **M2.1: Barra de Progresso de Fila Dinâmica**
  - [ ] Projetar um componente visual de linha do tempo ou indicador circular mostrando qual a posição do usuário na fila (Ex: "2º da fila de 5 pessoas").
  - [ ] Aplicar animação de preenchimento gradual na barra de progresso ao carregar a página (slide da esquerda para a direita).
- [ ] **M2.2: Efeitos Hover nos Botões de Ação**
  - [ ] Botão de "Cancelar Reserva" deve ter efeito hover com cor de fundo `--cor-erro` semi-transparente e texto que acende em vermelho sólido.
- [ ] **M2.3: Animação de Mudança de Posição**
  - [ ] Se a posição do usuário na fila mudar (revalidação de dados), piscar o número da posição com um efeito sutil de pulsação na cor `--cor-acento`.

---

## 🔗 Fase 3: Integração com APIs e Ações de Cancelamento
Conectar a listagem e os controles ao microsserviço de Reservas e Filas de Espera.

- [ ] **M3.1: Consumo do Serviço de Reservas (Node.js)**
  - [ ] Chamar `GET /api/reservas` para listar as reservas ativas do usuário logado.
  - [ ] Mapear as respostas contendo informações da fila de espera calculada em tempo real pelo backend.
- [ ] **M3.2: Endpoint de Cancelamento de Reserva**
  - [ ] Integrar o clique no botão "Cancelar Reserva" com a requisição HTTP `DELETE /api/reservas/{id}`.
  - [ ] Criar modal de confirmação elegante ("Tem certeza que deseja cancelar esta reserva?") com transição suave e blur de fundo antes de disparar o cancelamento.
- [ ] **M3.3: Animação de Remoção de Item**
  - [ ] Ao confirmar o cancelamento, aplicar uma animação de fade-out combinada com encolhimento de altura (`height` vai de 100% a 0) no cartão cancelado para removê-lo da lista de forma orgânica.

---

## 🔔 Fase 4: Alertas de Liberação de Livros e Retirada
Sinalização visual imediata para quando o livro estiver disponível na biblioteca.

- [ ] **M4.1: Card com Visual Destacado (Pronto para Retirada)**
  - [ ] Se a reserva for atribuída ao usuário (quando o status for "Liberado" ou "Pronto para Retirada"):
    - Alterar a cor da borda do cartão para `--cor-sucesso` com um pulso de brilho neon sutil.
    - Exibir uma grande mensagem piscante ou com ícone brilhante: "Livro Disponível para Retirada!".
- [ ] **M4.2: Cronômetro de Expiração para Retirada**
  - [ ] Mostrar um relógio de contagem regressiva animado indicando o tempo limite para retirada na biblioteca física (Ex: "Retirar em até 47h 30m").
  - [ ] Se o prazo estiver abaixo de 12 horas, mudar a cor do texto do timer para `--cor-erro` com animação de alerta sutil.
- [ ] **M4.3: Direcionamento para Biblioteca de Coleta**
  - [ ] Exibir o nome da biblioteca física onde o livro deve ser retirado, com um link rápido para ver informações da biblioteca.

---

## 🚀 Fase 5: Estados Vazios Elegantes e Polimento Visual
Garantir que a tela seja informativa mesmo quando o usuário não tiver nenhuma reserva ativa.

- [ ] **M5.1: Estado Vazio Ilustrado (Empty State)**
  - [ ] Se a API retornar lista vazia, exibir um contêiner centralizado contendo um ícone elegante de marcador de livro transparente (`lucide-react` `Bookmark` com escala grande e opacidade baixa).
  - [ ] Adicionar texto explicativo amigável em português: "Você não possui nenhuma reserva ativa no momento." e um botão atrativo "Explorar Catálogo" direcionando para a tela de livros.
- [ ] **M5.2: Skeleton Loaders para a Lista**
  - [ ] Criar esqueletos de linha do tempo cinzas/azuis piscantes para simular a estrutura dos cards e posições de fila enquanto a tela carrega.
- [ ] **M5.3: Tratamento de Erros e Recarga Rápida**
  - [ ] Adicionar tratamento de erros caso o serviço de reservas esteja temporariamente indisponível, oferecendo um botão amigável para tentar novamente.

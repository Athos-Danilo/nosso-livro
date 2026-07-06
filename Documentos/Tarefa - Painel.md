# 📋 Checklist de Tarefas - Tela do Painel / Dashboard (Santuário Literário)

Este documento funciona como um guia de acompanhamento (To-Do List) para a conclusão e polimento da tela de **Painel Principal** (Escrivaninha do Leitor) do sistema "Nosso Livro", adaptada para a estética clássica do **"Santuário Literário"**.

> [!IMPORTANT]
> **DIRETRIZ DESIGN PREMIUM & TEMÁTICA:**
> O painel do usuário simula a **"Escrivaninha de Estudos"** de um leitor clássico. O banner de boas-vindas é estilizado como uma folha de papel pólen de alta gramatura com detalhes dourados. Os cartões de estatísticas são dispostos como **Plaquetas Gravadas em Metal/Ouro** ou gavetas clássicas de couro e mogno.
> Toda a interface visual, mensagens de feedback, placeholders e comentários devem ser estritamente em **Português do Brasil (PT-BR)**.

---

## 🗺️ Mapa de Progresso da Tela

- [ ] **Fase 1: Escrivaninha de Estudos e Banner de Registro (Estrutura)**
- [ ] **Fase 2: Animações Cinematográficas e Efeito Hover Metálico**
- [ ] **Fase 3: Contadores Dinâmicos de Página Mecânicos (APIs)**
- [ ] **Fase 4: Livro de Avisos e Prateleira de Indicações (Listagens)**
- [ ] **Fase 5: Skeletons de Papel e Responsividade Premium**

---

## 🎨 Fase 1: Escrivaninha de Estudos e Banner de Registro (Estrutura)
Desenvolvimento do layout estrutural do dashboard clássico de biblioteca institucional.

- [ ] **M1.1: Banner Ficha de Leitor (Boas-vindas)**
  - [ ] Implementar o banner superior de boas-vindas com o estilo de folha de papel pólen texturizada (`--cor-papel-polen-glass`) e molduras clássicas duplas gravadas.
  - [ ] Exibir o nome do leitor com efeito de escrita sutil em fonte vintage.
  - [ ] Widget de data no formato de carimbo de calendário clássico no canto superior direito.
- [ ] **M1.2: Plaquetas Metálicas de Estatísticas (Grid)**
  - [ ] Dispor cards responsivos em CSS Grid (`grid-template-columns: repeat(auto-fit, minmax(220px, 1fr))`).
  - [ ] Estilizar os cards como plaquetas de bronze/ouro envelhecido com cantos chanfrados e linhas de borda douradas sutis.
- [ ] **M1.3: Subpainéis do Leitor**
  - [ ] Criar divisores inferiores em duas colunas: "Prateleira de Recomendações" e "Livro de Avisos" (Notificações).

---

## 🎬 Fase 2: Animações Cinematográficas e Efeito Hover Metálico
Adicionar efeitos de toque vintage e transições escalonadas na entrada dos dados.

- [ ] **M2.1: Entrada Escalonada (Staggered Delay)**
  - [ ] Adicionar animação de surgimento das plaquetas uma a uma a partir da base (Card 1: 0ms, Card 2: 100ms, Card 3: 200ms, Card 4: 300ms).
- [ ] **M2.2: Hover Metálico Tridimensional**
  - [ ] Ao passar o cursor, a plaqueta deve se elevar em 5px e ganhar um brilho sutil de ouro na borda (`box-shadow`), com fundo mudando suavemente para `--cor-card-hover`.
- [ ] **M2.3: Micro-animações de Ícones Vintage**
  - [ ] Ao focar ou passar o cursor sobre as plaquetas, os ícones (`BookOpen`, `Bell`, etc.) devem executar movimentos suaves (rotação ou leve balanço de pêndulo).

---

## 🔗 Fase 3: Contadores Dinâmicos de Página Mecânicos (APIs)
Alimentação real dos dados e efeito de contagem mecânica simulada.

- [ ] **M3.1: Requisições assíncronas aos Serviços**
  - [ ] Consumir dados do Catálogo (Python), Reservas (Node), Empréstimos (Go) e Notificações paralelos.
- [ ] **M3.2: Efeito de Contador Mecânico**
  - [ ] Implementar animação que simula um contador mecânico de páginas (ou carimbo numerado rotativo) subindo rapidamente de 0 ao número final.
- [ ] **M3.3: Cache e Atualização Rápida**
  - [ ] Adicionar lógica de revalidação de dados em segundo plano a cada 60 segundos.

---

## 📨 Fase 4: Livro de Avisos e Prateleira de Indicações (Listagens)
Alimentação das listas inferiores do painel de leitura.

- [ ] **M4.1: Livro de Avisos (Notificações)**
  - [ ] Mostrar as últimas notificações. Atribuir selos de carimbo coloridos sutilmente conforme o tipo (Devolução, Reserva, Retirada).
- [ ] **M4.2: Prateleira de Recomendações**
  - [ ] Carregar as sugestões do microsserviço de recomendações. Exibir os livros no formato 3D com a capa em perspectiva.

---

## 🚀 Fase 5: Skeletons de Papel e Responsividade Premium
Garantir o acabamento tátil em carregamentos lentos e celulares.

- [ ] **M5.1: Skeletons de Ficha Pólen**
  - [ ] Exibir esqueletos pulsando com brilho sutil em tons bege pólen e dourado no lugar das plaquetas de dados.
- [ ] **M5.2: Responsividade Física**
  - [ ] Garantir empilhamento simétrico em duas colunas para tablets e coluna única vertical contínua para celulares.
- [ ] **M5.3: Tratamento contra Falhas de Rede**
  - [ ] Mostrar um carimbo vintage `"INDISPONÍVEL"` no lugar dos contadores se os microsserviços falharem.

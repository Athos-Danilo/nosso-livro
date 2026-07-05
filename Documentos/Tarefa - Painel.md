# 📋 Checklist de Tarefas - Tela do Painel (Dashboard)

Este documento funciona como um guia de acompanhamento (To-Do List) para a conclusão e polimento da tela de **Painel Principal** (Dashboard) do sistema "Nosso Livro". O objetivo é criar uma central de informações viva, com atualizações dinâmicas e excelente apelo visual.

> [!IMPORTANT]
> **REGRA DE IDIOMA E PADRÕES DO PROJETO (PT-BR):**
> Toda a interface visual, mensagens de feedback, placeholders, logs de console, estruturas de variáveis e comentários deste componente devem ser estritamente em **Português do Brasil (PT-BR)**.
> **DIRETRIZ DESIGN PREMIUM:**
> A interface deve possuir estética glassmorphism refinada, efeitos dinâmicos de hover, foco e animações fluidas baseadas no design system definido em [variaveis.css](file:///c:/Users/Athos/ADS/Meus%20Projetos/nosso-livro/frontend/src/styles/variaveis.css).

---

## 🗺️ Mapa de Progresso da Tela

- [ ] **Fase 1: Layout do Dashboard e Banner de Boas-vindas**
- [ ] **Fase 2: Animações Escalonadas (Staggered) nos Cards de Estatísticas**
- [ ] **Fase 3: Alimentação Dinâmica dos Contadores (Consumo de APIs)**
- [ ] **Fase 4: Listagens Dinâmicas (Notificações Recentes e Recomendações)**
- [ ] **Fase 5: Otimizações, Skeletons e Responsividade**

---

## 🎨 Fase 1: Layout do Dashboard e Banner de Boas-vindas
Construção do cabeçalho principal e posicionamento dos painéis de dados.

- [ ] **M1.1: Banner com Gradiente e Data Dinâmica**
  - [ ] Implementar o banner de boas-vindas com gradiente angular premium de tons escuros a azuis semi-transparentes (`linear-gradient(135deg, rgba(30, 41, 59, 0.6) 0%, rgba(15, 23, 42, 0.8) 100%)`).
  - [ ] Exibir o nome do usuário ativo dinamicamente com animação suave de fade-in ao carregar.
  - [ ] Desenhar o widget de data atual no canto direito, com borda sutil e cor de destaque `--cor-acento`.
- [ ] **M1.2: Grid de Estatísticas**
  - [ ] Estruturar uma grade responsiva com CSS Grid (`grid-template-columns: repeat(auto-fit, minmax(220px, 1fr))`) para os quatro cards informativos.
  - [ ] Utilizar a classe `card-glass` com bordas semi-transparentes em cada um dos cards.
- [ ] **M1.3: Subpainéis de Atividades**
  - [ ] Estruturar a parte inferior em duas colunas responsivas: "Recomendações para Você" e "Últimas Notificações".
  - [ ] Garantir que cada painel tenha divisão de bordas finas com `--cor-borda`.

---

## 🎬 Fase 2: Animações Escalonadas (Staggered) nos Cards de Estatísticas
Aplicar efeitos de movimento e toque modernos para tornar o dashboard dinâmico.

- [ ] **M2.1: Animação de Entrada dos Cards**
  - [ ] Configurar animação de fade-in com slide-up para os cards de estatísticas.
  - [ ] Aplicar delay incremental (stagger) para que os cards apareçam um por um na tela (Card 1: 0ms, Card 2: 100ms, Card 3: 200ms, Card 4: 300ms).
- [ ] **M2.2: Hover 3D Interativo nos Cards**
  - [ ] Adicionar efeito hover nos cards de estatística, elevando o card em 5px (`transform: translateY(-5px)`) e alterando o fundo para `--cor-card-hover` com transição suave.
  - [ ] Inserir uma borda iluminada no hover usando a cor correspondente de cada indicador (azul, amarelo, verde e laranja).
- [ ] **M2.3: Micro-animações nos Ícones**
  - [ ] Ao passar o mouse sobre o card, fazer com que o ícone interno correspondente (`lucide-react`) execute uma micro-animação (Ex: rotação sutil de 15 graus para a direita ou pulsação suave).

---

## 🔗 Fase 3: Alimentação Dinâmica dos Contadores (Consumo de APIs)
Substituir os stubs (dados estáticos) por chamadas de rede para APIs dinâmicas através do Gateway.

- [ ] **M3.1: Requisições de Contadores**
  - [ ] Efetuar chamadas HTTP assíncronas paralelas ao carregar a página:
    - Buscar total de livros do catálogo: `GET /api/catalogo/livros` (ou rota agregadora correspondente).
    - Buscar total de reservas ativas do usuário: `GET /api/reservas` (filtrado por usuário).
    - Buscar empréstimos ativos: `GET /api/emprestimos` (filtrado por usuário).
    - Buscar total de notificações não lidas: `GET /api/notificacoes` (filtrado por usuário).
- [ ] **M3.2: Contagem Progressiva Animada (Number Counter)**
  - [ ] Implementar efeito de números rolando/subindo de 0 até o valor real retornado da API (Ex: ir de 0 a 128 rapidamente em 1 segundo com interpolação linear).
- [ ] **M3.3: Cache e Revalidação em Segundo Plano**
  - [ ] Adicionar lógica de revalidação rápida a cada 60 segundos ou recarregamento manual sob demanda.

---

## 📨 Fase 4: Listagens Dinâmicas (Notificações Recentes e Recomendações)
Popular os painéis inferiores com dados atualizados e interativos.

- [ ] **M4.1: Lista de Notificações do Usuário**
  - [ ] Consumir as últimas 3 notificações registradas para o usuário a partir da API.
  - [ ] Diferenciar os alertas visualmente por tipo: cor `--cor-sucesso` para devolução, `--cor-primaria` para reserva, `--cor-alerta` para livros liberados para retirada.
  - [ ] Calcular a data de envio de forma amigável (Ex: "Há 2 horas", "Ontem às 14h") em português.
- [ ] **M4.2: Listagem de Recomendações Rápidas**
  - [ ] Carregar do microsserviço de recomendações os dois livros mais relevantes sugeridos para o usuário logado.
  - [ ] Exibir título, autor e um placeholder premium estilizado com gradiente na capa enquanto a imagem real não carrega.
- [ ] **M4.3: Ações Rápidas nas Listagens**
  - [ ] Permitir que o usuário clique em uma notificação para marcá-la como lida, executando uma animação de recolhimento suave da notificação lida.

---

## 🚀 Fase 5: Otimizações, Skeletons e Responsividade
Refinamento técnico para garantir fluidez e consistência em qualquer tela.

- [ ] **M5.1: Skeleton Loading Premium**
  - [ ] Criar templates de esqueleto (`Skeleton Loader`) com animação de pulsação de brilho cinza/azul para cobrir os números e os textos das listas enquanto as APIs respondem.
- [ ] **M5.2: Responsividade Móvel Completa**
  - [ ] Garantir que em telas menores de 768px, as estatísticas fiquem empilhadas em duas colunas e o painel de atividades inferiores fique em coluna única de leitura contínua.
- [ ] **M5.3: Tratamento de Fallbacks sem Conexão**
  - [ ] Se as APIs de contadores falharem, mostrar um traço `-` elegante nos cards e um pequeno botão sutil de "Recarregar" sem estragar o visual geral da interface.

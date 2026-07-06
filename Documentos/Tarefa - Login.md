# 📋 Checklist de Tarefas - Tela de Login (Reformulação "Santuário Literário")

Este documento serve como o roteiro detalhado para a reformulação completa da tela de **Login** do sistema "Nosso Livro". O objetivo é criar um design "UAU", altamente imersivo e elegante, que conecte o usuário à temática de bibliotecas clássicas de forma inovadora e moderna, utilizando texturas, luzes e animações cinematográficas.

> [!IMPORTANT]
> **DIRETRIZ DESIGN PREMIUM & TEMÁTICA:**
> O visual abandona o modelo chapado tradicional e adota a estética do **"Santuário Literário"** — misturando texturas clássicas de papel pólen, madeira nobre (mogno) e couro escuro com a sofisticação do vidro fosco (glassmorphism) e iluminação dourada (gold glow).
> Toda a interface visual, feedbacks e logs devem permanecer estritamente em **Portuguê## 🗺️ Mapa de Progresso da Tela (Nova Proposta)

- [x] **Fase 1: Ambientação Clássica e Texturas (Santuário Literário)**
- [x] **Fase 2: Coreografia e Animações Cinematográficas**
- [x] **Fase 3: Inputs Interativos e Placeholders Dinâmicos**
- [x] **Fase 4: Validação Imersiva e Feedback com "Carimbos"**
- [x] **Fase 5: Integração, Efeito Loading e Polimento**

---

## 📚 Fase 1: Ambientação Clássica e Texturas (Santuário Literário)
Construção do plano de fundo imersivo e do contêiner central com texturas e luzes de biblioteca clássica.

- [x] **M1.1: Fundo Tridimensional com Efeito de Luz e Sombra**
  - [x] Criar um gradiente de fundo rico em tons de azul-petróleo escuro e preto-madeira (`hsl(215, 30%, 6%)` a `hsl(180, 25%, 4%)`).
  - [x] Adicionar um efeito radial de iluminação simulando uma luminária de leitura clássica (luz suave de tom âmbar/ouro).
  - [x] Implementar uma sobreposição de textura de grão de papel/noise sutil via SVG embutido no CSS para eliminar o aspect digital chapado.
- [x] **M1.2: Card "Ficha de Catálogo de Vidro" (Glass-Catalog Card)**
  - [x] Desenhar o card principal inspirado nas antigas fichas de catálogo de biblioteca (papel pólen texturizado, cantos arredondados finos), mesclado com um efeito de vidro moderno semi-transparente.
  - [x] Adicionar uma moldura dupla fina interna em marrom-bege suave (`#d5c8b5`), com relevo 3D.
- [x] **M1.3: Branding e Tipografia Retro-Moderna**
  - [x] Substituir a logo pelo título limpo "Nosso Livro".
  - [x] Utilizar a fonte 'Tapestry' para o título destacado e 'Inter' para o formulário.
  - [x] Aplicar a cor Azul Escuro Nobre no título "Nosso Livro".

---

## 🎬 Fase 2: Coreografia e Animações Cinematográficas
Dar vida e dinamismo à tela com micro-interações e física realista.

- [x] **M2.1: Partículas de Poeira de Luz (Dust Motes)**
  - [x] Desenvolver um efeito de partículas flutuantes douradas no fundo que se movem aleatoriamente, simulando a poeira de luz suspensa em salas de leitura antigas.
- [x] **M2.2: Animação de Abertura "Abrir Livro"**
  - [x] Ao carregar a tela, animar o card de login simulando a abertura de uma capa de livro (efeito 3D com rotação no eixo Y de -18deg para 0deg, acompanhado de fade-in).
- [x] **M2.3: Botão Principal com Brilho Dourado (Gold Shine)**
  - [x] O botão de login deve usar uma cor verde-biblioteca profunda com detalhes dourados.
  - [x] Adicionar efeito "shine" de brilho dourado que atravessa o botão a cada 6 segundos e uma transição física de clique que encolhe sutilmente (`active`).
- [x] **M2.4: Efeito Parallax no Fundo**
  - [x] Adicionar uma movimentação interativa do fundo de partículas e do card acompanhando o cursor do mouse, gerando profundidade parallax.

---

## ✍️ Fase 3: Inputs Interativos e Placeholders Dinâmicos
Reformulação da forma como os dados são digitados, com maior interatividade e detalhes literários.

- [x] **M3.1: Placeholder Dinâmico Estilo Máquina de Escrever**
  - [x] Substituir o placeholder estático por um texto dinâmico (Typewriter Effect) que alterna de forma elegante entre opções de e-mail e WhatsApp.
- [x] **M3.2: Rótulos Flutuantes (Floating Labels) Temáticos**
  - [x] Criar rótulos que flutuam para o topo do campo ao focar ou ao conter texto, com aparência de etiquetas clássicas.
- [x] **M3.3: Ícones Reativos**
  - [x] Fazer com que os ícones de e-mail e senha façam uma micro-animação (escala e mudança de cor) quando o usuário foca nos campos correspondentes.

---

## 🛡️ Fase 4: Validação Imersiva e Feedback com "Carimbos"
Tratamento visual único para mensagens de validação e erros.

- [x] **M4.1: Alertas com Visual de Carimbos Vintage**
  - [x] Os erros de validação local e global surgem na tela com uma animação e estilo de carimbo de tinta vermelha desbotada ("INVÁLIDO", "ATRASADO", "BLOQUEADO").
  - [x] Adicionar efeito visual de carimbada rápida com escala e tremor elástico.
- [x] **M4.2: Validação Progressiva**
  - [x] Validar o formato do WhatsApp ou E-mail (onBlur), exibindo bordas em tom ferrugem e sombra protetora vermelha.

---

## 🔗 Fase 5: Integração, Efeito Loading e Polimento
Integração com a lógica de login e refinamento de performance.

- [x] **M5.1: Efeito de Carregamento "Folheando Livro"**
  - [x] Ao clicar em "Entrar na Biblioteca", exibir um livro cujas páginas folheiam rapidamente no botão como animação de carregamento.
- [x] **M5.2: Transição de Saída Cinematográfica**
  - [x] Quando o login for bem-sucedido, toda a tela desvanece com um efeito 3D de fechamento de livro (flip 3D do card para fora) antes da navegação.
- [x] **M5.3: Validação de Acessibilidade e Teclado**
  - [x] Garantir que o fluxo de Tabulação e o envio com Enter funcionem perfeitamente em meio às novas animações.

# 📋 Checklist de Tarefas - Tela de Catálogo de Livros (Santuário Literário)

Este documento funciona como um guia de acompanhamento (To-Do List) para a conclusão e polimento da tela de **Catálogo de Livros** do sistema "Nosso Livro", adaptada para a estética clássica do **"Santuário Literário"**.

> [!IMPORTANT]
> **DIRETRIZ DESIGN PREMIUM & TEMÁTICA:**
> O catálogo de livros deve parecer um acervo físico imersivo. Cada livro é exibido como um **livro físico tridimensional** com acabamentos dourados nas capas. Ao passar o mouse, a capa se move em perspectiva 3D (tilt effect). As informações técnicas são apresentadas em fichas clássicas de papel pólen com debossed e selos de carimbo em tinta indicando a disponibilidade.
> Toda a interface visual, mensagens de feedback, placeholders e comentários devem ser estritamente em **Português do Brasil (PT-BR)**.

---

## 🗺️ Mapa de Progresso da Tela

- [ ] **Fase 1: Gaveta de Busca e Grid de Acervos**
- [ ] **Fase 2: Livros Tridimensionais com Perspectiva e Selos de Status**
- [ ] **Fase 3: Ficha Técnica Detalhada (Modal de Papel Pólen)**
- [ ] **Fase 4: Consumo e Integração com FastAPI, Go e Node.js**
- [ ] **Fase 5: Registro de Novas Obras (Aba de Bibliotecário/Admin)**
- [ ] **Fase 6: Paginação com Skeletons de Livros e Debounce**

---

## 🎨 Fase 1: Gaveta de Busca e Grid de Acervos
Construção da gaveta superior de pesquisa e estruturação do grid físico de livros.

- [ ] **M1.1: Gaveta de Busca e Filtros Vintage**
  - [ ] Projetar a barra de busca inspirada em arquivos de fichas de biblioteca, com ícone de lupa dourada.
  - [ ] Implementar painel de filtros expansível (Gêneros, Autores, Editora) com transições suaves que simulam a abertura de uma pasta física de couro.
  - [ ] Adicionar chips/etiquetas de filtros ativos no tom de papel pólen e borda dourada fina.
- [ ] **M1.2: Grid de Prateleiras de Biblioteca**
  - [ ] Estruturar o CSS Grid para dispor os livros simulando prateleiras de madeira de biblioteca (`repeat(auto-fill, minmax(180px, 1fr))`).
  - [ ] Adicionar linhas divisórias de prateleiras sutis em tom ouro envelhecido abaixo de cada fileira de livros.

---

## 🎬 Fase 2: Livros Tridimensionais com Perspectiva e Selos de Status
Criação dos cards de livros como modelos tridimensionais físicos interativos.

- [ ] **M2.1: Efeito Livro 3D e Capa Texturizada**
  - [ ] Projetar o card de livro com perspectiva 3D (lombada lateral simulada em couro escuro e a capa do livro com acabamentos dourados e texturas envelhecidas).
  - [ ] Ao passar o mouse, aplicar efeito tilt de rotação em perspectiva 3D (`transform: rotateY(-18deg) scale(1.05) translateZ(10px)`).
- [ ] **M2.2: Selos de Disponibilidade (Carimbos de Tinta)**
  - [ ] Inserir selo dinâmico de status com visual de carimbo de biblioteca inclinado a `-6deg`:
    - `"DISPONÍVEL"` em tom verde-floresta.
    - `"EMPRESTADO"` em tom vermelho-ferrugem.
    - `"RESERVADO"` em tom amarelo-ouro.
  - [ ] Aplicar textura envelhecida de carimbada falha nas badges de status.

---

## 🔎 Fase 3: Ficha Técnica Detalhada (Modal de Papel Pólen)
Visualização completa do livro simulando a abertura de uma pasta institucional de fichamento.

- [ ] **M3.1: Modal Ficha Técnica em Papel Pólen**
  - [ ] Projetar modal com fundo de vidro fosco (`backdrop-filter: blur(12px)`) e o container central no estilo folha de papel pólen (`--cor-papel-polen-glass`) com moldura dupla em relevo.
  - [ ] Configurar animação de entrada do modal imitando uma folha sendo depositada na mesa.
- [ ] **M3.2: Ficha Catalográfica e Fila de Espera**
  - [ ] Dispor os dados (Título, Autor, Ano, Sinopse) em layout de catalogação clássica, com fontes serifadas elegantes.
  - [ ] Exibir o status da fila de espera do livro com visual de lista de assinaturas antigas.
- [ ] **M3.3: Botões de Solicitação Literária**
  - [ ] Botão "Solicitar Empréstimo" estilizado em gradiente Azul Marinho Nobre.
  - [ ] Botão "Entrar na Fila de Espera" em tom verde-biblioteca clássico.

---

## 🔗 Fase 4: Consumo e Integração com FastAPI, Go e Node.js
Integração dos fluxos literários com os respectivos microsserviços.

- [ ] **M4.1: Conexão com Microsserviço de Catálogo (Python/FastAPI)**
  - [ ] Integrar consumo de `GET /api/catalogo/livros` com paginação e envio de filtros de pesquisa.
- [ ] **M4.2: Registro de Empréstimos (Serviço em Go)**
  - [ ] Integrar envio de empréstimo `POST /api/emprestimos` com o livro selecionado.
  - [ ] Exibir mensagem de sucesso via carimbo verde `"EMPRÉSTIMO APROVADO"`.
- [ ] **M4.3: Registro de Reservas (Serviço em Node.js)**
  - [ ] Integrar criação de reserva `POST /api/reservas`.
  - [ ] Exibir crachá de confirmação com a posição na fila de espera.

---

## ⚙️ Fase 5: Registro de Novas Obras (Aba de Bibliotecário/Admin)
Formulários de catalogação exclusivos para administradores.

- [ ] **M5.1: Botão "Adicionar Obra ao Acervo"**
  - [ ] Exibir botão somente se `usuario.permissao === 'administrador'`, com ícone clássico de pena/tinteiro.
- [ ] **M5.2: Ficha de Cadastro de Livro**
  - [ ] Formulário em papel pólen com validação sob demanda, exibindo carimbo vermelho `"INVÁLIDO"` caso ocorram erros nos inputs.

---

## 🚀 Fase 6: Paginação com Skeletons de Livros e Debounce
Polimento de desempenho para acervos massivos.

- [ ] **M6.1: Paginação Infinita e Skeletons de Livros**
  - [ ] Carregamento dinâmico ao rolar a tela, exibindo skeletons simulando silhuetas de livros cinza cardboard em prateleiras escuras de madeira.
- [ ] **M6.2: Debounce de Pesquisa de Ficha**
  - [ ] Implementar `debounce` de 300ms no input de busca para evitar múltiplas chamadas à API enquanto o usuário digita.

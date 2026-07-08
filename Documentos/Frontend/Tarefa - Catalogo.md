# 📋 Checklist de Tarefas - Tela de Catálogo de Livros (Santuário Literário)

Este documento funciona como um guia de acompanhamento (To-Do List) para a conclusão e polimento da tela de **Catálogo de Livros** do sistema "Nosso Livro", adaptada para a estética clássica do **"Santuário Literário"**.

> [!IMPORTANT]
> **DIRETRIZ DESIGN PREMIUM & TEMÁTICA:**
> O catálogo de livros deve parecer um acervo físico imersivo. Cada livro é exibido como um **livro físico tridimensional** com acabamentos dourados nas capas. Ao passar o mouse, a capa se move em perspectiva 3D (tilt effect). As informações técnicas são apresentadas em fichas clássicas de papel pólen com debossed e selos de carimbo em tinta indicando a disponibilidade.
> Toda a interface visual, mensagens de feedback, placeholders e comentários devem ser estritamente em **Português do Brasil (PT-BR)**.

---

## 🗺️ Mapa de Progresso da Tela

- [x] **Fase 1: Gaveta de Busca e Grid de Acervos**
- [x] **Fase 2: Livros Tridimensionais com Perspectiva e Selos de Status**
- [x] **Fase 3: Ficha Técnica Detalhada (Modal de Papel Pólen)**
- [x] **Fase 4: Consumo e Integração com FastAPI, Go e Node.js**
- [x] **Fase 5: Registro de Novas Obras (Aba de Bibliotecário/Admin)**
- [x] **Fase 6: Paginação com Skeletons de Livros e Debounce**

---

## 🎨 Fase 1: Gaveta de Busca e Grid de Acervos
Construção da gaveta superior de pesquisa e estruturação do grid físico de livros.

- [x] **M1.1: Gaveta de Busca e Filtros Vintage**
  - [x] Projetar a barra de busca inspirada em arquivos de fichas de biblioteca, com ícone de lupa dourada.
  - [x] Implementar painel de filtros expansível (Gêneros, Autores, Editora) com transições suaves que simulam a abertura de uma pasta física de couro.
  - [x] Adicionar chips/etiquetas de filtros ativos no tom de papel pólen e borda dourada fina.
- [x] **M1.2: Grid de Prateleiras de Biblioteca**
  - [x] Estruturar o CSS Grid para dispor os livros simulando prateleiras de madeira de biblioteca (`repeat(auto-fill, minmax(180px, 1fr))`).
  - [x] Adicionar linhas divisórias de prateleiras sutis em tom ouro envelhecido abaixo de cada fileira de livros.

---

## 🎬 Fase 2: Livros Tridimensionais com Perspectiva e Selos de Status
Criação dos cards de livros como modelos tridimensionais físicos interativos.

- [x] **M2.1: Efeito Livro 3D e Capa Texturizada**
  - [x] Projetar o card de livro com perspectiva 3D (lombada lateral simulada em couro escuro e a capa do livro com acabamentos dourados e texturas envelhecidas).
  - [x] Ao passar o mouse, aplicar efeito tilt de rotação em perspectiva 3D (`transform: rotateY(-18deg) scale(1.05) translateZ(10px)`).
- [x] **M2.2: Selos de Disponibilidade (Carimbos de Tinta)**
  - [x] Inserir selo dinâmico de status com visual de carimbo de biblioteca inclinado a `-6deg`:
    - `"DISPONÍVEL"` em tom verde-floresta.
    - `"EMPRESTADO"` em tom vermelho-ferrugem.
    - `"RESERVADO"` em tom amarelo-ouro.
  - [x] Aplicar textura envelhecida de carimbada falha nas badges de status.

---

## 🔎 Fase 3: Ficha Técnica Detalhada (Modal de Papel Pólen)
Visualização completa do livro simulando a abertura de uma pasta institucional de fichamento.

- [x] **M3.1: Modal Ficha Técnica em Papel Pólen**
  - [x] Projetar modal com fundo de vidro fosco (`backdrop-filter: blur(12px)`) e o container central no estilo folha de papel pólen (`--cor-papel-polen-glass`) com moldura dupla em relevo.
  - [x] Configurar animação de entrada do modal imitando uma folha sendo depositada na mesa.
- [x] **M3.2: Ficha Catalográfica e Fila de Espera**
  - [x] Dispor os dados (Título, Autor, Ano, Sinopse) em layout de catalogação clássica, com fontes serifadas elegantes.
  - [x] Exibir o status da fila de espera do livro com visual de lista de assinaturas antigas.
- [x] **M3.3: Botões de Solicitação Literária**
  - [x] Botão "Solicitar Empréstimo" estilizado em gradiente Azul Marinho Nobre.
  - [x] Botão "Entrar na Fila de Espera" em tom verde-biblioteca clássico.

---

## 🔗 Fase 4: Consumo e Integração com FastAPI, Go e Node.js
Integração dos fluxos literários com os respectivos microsserviços.

- [x] **M4.1: Conexão com Microsserviço de Catálogo (Python/FastAPI)**
  - [x] Integrar consumo de `GET /api/catalogo/livros` com paginação e envio de filtros de pesquisa.
- [x] **M4.2: Registro de Empréstimos (Serviço em Go)**
  - [x] Integrar envio de empréstimo `POST /api/emprestimos` com o livro selecionado.
  - [x] Exibir mensagem de sucesso via carimbo verde `"EMPRÉSTIMO APROVADO"`.
- [x] **M4.3: Registro de Reservas (Serviço em Node.js)**
  - [x] Integrar criação de reserva `POST /api/reservas`.
  - [x] Exibir crachá de confirmação com a posição na fila de espera.

---

## ⚙️ Fase 5: Registro de Novas Obras (Aba de Bibliotecário/Admin)
Formulários de catalogação exclusivos para administradores.

- [x] **M5.1: Botão "Adicionar Obra ao Acervo"**
  - [x] Exibir botão somente se `usuario.permissao === 'administrador'`, com ícone clássico de pena/tinteiro.
- [x] **M5.2: Ficha de Cadastro de Livro**
  - [x] Formulário em papel pólen com validação sob demanda, exibindo carimbo vermelho `"INVÁLIDO"` caso ocorram erros nos inputs.

---

## 🚀 Fase 6: Paginação com Skeletons de Livros e Debounce
Polimento de desempenho para acervos massivos.

- [x] **M6.1: Paginação Infinita e Skeletons de Livros**
  - [x] Carregamento dinâmico ao rolar a tela, exibindo skeletons simulando silhuetas de livros cinza cardboard em prateleiras escuras de madeira.
- [x] **M6.2: Debounce de Pesquisa de Ficha**
  - [x] Implementar `debounce` de 300ms no input de busca para evitar múltiplas chamadas à API enquanto o usuário digita.

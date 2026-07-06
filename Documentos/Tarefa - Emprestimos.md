# 📋 Checklist de Tarefas - Tela de Empréstimos (Santuário Literário)

Este documento funciona como um guia de acompanhamento (To-Do List) para a conclusão e polimento da tela de **Empréstimos** do sistema "Nosso Livro", adaptada para a estética clássica do **"Santuário Literário"**.

> [!IMPORTANT]
> **DIRETRIZ DESIGN PREMIUM & TEMÁTICA:**
> A tela de empréstimos deve lembrar o controle manual de arquivos físicos. Os empréstimos ativos são apresentados no formato de **Fichas de Bolso de Empréstimo** (aquelas fichas clássicas de papel cartão presas no final do livro). As abas de navegação são estilizadas como marcadores de página de fita de cetim e os alertas de prazos aparecem como **carimbos vintage** aplicados sobre a ficha.
> Toda a interface visual, mensagens de feedback, placeholders e comentários devem ser estritamente em **Português do Brasil (PT-BR)**.

---

## 🗺️ Mapa de Progresso da Tela

- [ ] **Fase 1: Abas de Fita e Registro de Fichas (Estrutura)**
- [ ] **Fase 2: Cartões de Ficha de Bolso e Prazos com Carimbos**
- [ ] **Fase 3: Integração com Endpoint de Empréstimos (Serviço em Go)**
- [ ] **Fase 4: Baixa na Ficha (Simulador de Devolução)**
- [ ] **Fase 5: Fichas de Esqueleto Vazia e Mensagem Literária**

---

## 🎨 Fase 1: Abas de Fita e Registro de Fichas (Estrutura)
Construção do painel de navegação utilizando marcadores clássicos de livros e fichas de bolso.

- [ ] **M1.1: Controle de Abas Deslizantes (Sliding Ribbon Tabs)**
  - [ ] Implementar abas para alternar entre "Leituras Ativas" e "Registros Anteriores" (Histórico).
  - [ ] Estilizar as abas simulando **fitas marcadoras de cetim** vermelhas/douradas presas no topo que se movem com animação física horizontal suave (`transform: translateX`).
- [ ] **M1.2: Estrutura em Fichas de Papel Cartão**
  - [ ] Apresentar os registros no estilo de fichas de bolso de papel cartão pólen envelhecido com cantos retos, linhas horizontais pontilhadas cinzas e fontes serifadas.

---

## 🎬 Fase 2: Cartões de Ficha de Bolso e Prazos com Carimbos
Codificação de status de prazos utilizando carimbos de tinta vintage com margens seguras.

- [ ] **M2.1: Status por Carimbos Vintage de Prazos**
  - [ ] Estilizar o status do empréstimo como uma carimbada inclinada a `-6deg` com textura envelhecida:
    - `"NO PRAZO"` (Em dia) na cor verde-floresta.
    - `"VENCE LOGO"` (Menos de 3 dias para devolução) na cor amarelo-ouro.
    - `"ATRASADO"` (Excedeu o prazo) na cor vermelho-ferrugem.
    - `"DEVOLVIDO"` (Para registros anteriores) na cor azul marinho.
- [ ] **M2.2: Destaque de Prazos sem Colisão**
  - [ ] Exibir a data final de devolução em fonte serifada grande (`1.15rem`) e em negrito.
  - [ ] Adicionar um gap/margem de pelo menos `32px` ao redor dos carimbos de prazo para evitar colisões com outros textos ou botões da ficha.

---

## 🔗 Fase 3: Integração com Endpoint de Empréstimos (Serviço em Go)
Conexão do cliente frontend ao microsserviço de empréstimos em Go.

- [ ] **M3.1: Chamada ao Microsserviço de Empréstimos**
  - [ ] Consumir `GET /api/emprestimos` passando o token e dados do leitor logado.
  - [ ] Formatar as datas no formato brasileiro padrão `DD/MM/AAAA`.
- [ ] **M3.2: Agregação Literária de Detalhes**
  - [ ] Mesclar dados para buscar a capa (ilustração) e o autor de cada obra através de chamadas internas ao Catálogo.

---

## ⚙️ Fase 4: Baixa na Ficha (Simulador de Devolução)
Simulação clássica de entrega de exemplares com feedbacks interativos.

- [ ] **M4.1: Ação "Dar Baixa na Obra"**
  - [ ] Criar o botão de simular devolução estilizado como uma ação física de devolução de livro ao bibliotecário.
- [ ] **M4.2: Notificação Flutuante de Devolução**
  - [ ] Após sucesso no endpoint de devolução (`POST /api/emprestimos/devolver`), exibir um alerta toast flutuante no estilo de carimbo verde `"DEVOLVIDO: BAIXA CONCLUÍDA"`.
  - [ ] Mover o card de aba (de ativa para histórico) utilizando animação suave de desvanecimento (fade-out) e reinserção na lista seguinte.

---

## 🚀 Fase 5: Fichas de Esqueleto Vazia e Mensagem Literária
Polimento fino de carregamento e estados sem dados.

- [ ] **M5.1: Estado Vazio Clássico**
  - [ ] Caso não existam registros de empréstimos, exibir o texto: `"NENHUM REGISTRO DE LEITURA ENCONTRADO NA SUA FICHA."` com ilustração minimalista de uma estante vazia e link direto para "Explorar Prateleiras do Catálogo".
- [ ] **M5.2: Fichas Skeletons Pulsantes**
  - [ ] Exibir skeletons imitando linhas pontilhadas de papel cartão pulsando em luz âmbar sutil durante a requisição.

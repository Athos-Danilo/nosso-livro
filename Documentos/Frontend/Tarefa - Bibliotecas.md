# 📋 Checklist de Tarefas - Tela de Bibliotecas (Santuário Literário)

Este documento funciona como um guia de acompanhamento (To-Do List) para a conclusão e polimento da tela de **Bibliotecas** (Pontos de Coleta) do sistema "Nosso Livro", adaptada para a estética clássica do **"Santuário Literário"**.

> [!IMPORTANT]
> **DIRETRIZ DESIGN PREMIUM & TEMÁTICA:**
> A interface deve simular um catálogo físico clássico de biblioteca. Os pontos de coleta são representados como **gaveteiros de madeira nobre (mogno)** com puxadores em latão/ouro envelhecido, que deslizam ligeiramente para a frente no hover. Os detalhes utilizam a paleta de ouro envelhecido, papel pólen e verde-biblioteca.
> Toda a interface visual, mensagens de feedback, placeholders e comentários devem ser estritamente em **Português do Brasil (PT-BR)**.

---

## 🗺️ Mapa de Progresso da Tela

- [ ] **Fase 1: Painel de Arquivo de Biblioteca (Estrutura e Gaveteiros)**
- [ ] **Fase 2: Interações Cinematográficas e Abertura de Gavetas**
- [ ] **Fase 3: Integração com Endpoint de Pontos de Coleta**
- [ ] **Fase 4: Registro de Novo Ponto (Modo Bibliotecário/Admin)**
- [ ] **Fase 5: Skeletons em Papel Pólen e Polimento Geral**

---

## 🎨 Fase 1: Painel de Arquivo de Biblioteca (Estrutura e Gaveteiros)
Construção do grid responsivo de bibliotecas baseadas em gaveteiros de madeira e detalhes de ouro.

- [ ] **M1.1: Grid de Gaveteiros em Mogno**
  - [ ] Projetar a exibição usando uma grade flexível (`grid-template-columns: repeat(auto-fit, minmax(280px, 1fr))`).
  - [ ] Estilizar os cards de biblioteca como gavetas de arquivo de fichas clássicas (`background` em gradiente marrom-mogno escuro, bordas com acabamento chanfrado e puxador de ouro/latão sutil simulado via SVG/CSS).
- [ ] **M1.2: Rótulos e Plaquetas Identificadoras**
  - [ ] Adicionar uma plaqueta de metal dourada no topo de cada gaveta contendo a sigla institucional e o nome do ponto de coleta em fonte vintage (Cinzel/Tapestry).
  - [ ] Exibir a quantidade de livros disponíveis como um contador em papel pólen embutido.

---

## 🎬 Fase 2: Interações Cinematográficas e Abertura de Gavetas
Enriquecer a experiência com efeitos táteis tridimensionais que simulam a física de gavetas reais.

- [ ] **M2.1: Efeito de Deslizamento 3D no Hover**
  - [ ] Ao passar o cursor sobre a gaveta, aplicar transição de movimento vertical/profundidade (`transform: translateY(-4px) translateZ(10px)`), dando a nítida sensação física de que a gaveta está abrindo.
  - [ ] Adicionar partículas de poeira de luz (dust motes) saindo da gaveta ao passar o mouse.
- [ ] **M2.2: Ficha de Catálogo Expansível**
  - [ ] Ao clicar na gaveta, abrir um modal ou expandir o container revelando as informações completas da biblioteca em formato de ficha de papel pólen (`#f6f3eb` com texto escuro e borda dupla em relevo).

---

## 🛡️ Fase 3: Integração com Endpoint de Pontos de Coleta
Consumo da API de bibliotecas físicas e sincronização em tempo real.

- [ ] **M3.1: Requisição de Leitura de Pontos de Coleta**
  - [ ] Chamar o endpoint da API para buscar a listagem de bibliotecas.
  - [ ] Controlar estado de carregamento com loaders literários (livro folheando suas páginas em ouro envelhecido).
- [ ] **M3.2: Exibição de Erros por Carimbos**
  - [ ] Em caso de falha de conexão, aplicar o carimbo vermelho `"INDISPONÍVEL: ARQUIVO DE BIBLIOTECAS INACESSÍVEL"` com inclinação de `-6deg`.

---

## 🔗 Fase 4: Registro de Novo Ponto (Modo Bibliotecário/Admin)
Formulário clássico de adição de bibliotecas exclusivo para administradores da rede.

- [ ] **M4.1: Ficha de Cadastro de Biblioteca**
  - [ ] Formular painel de inserção com campos flutuantes (Nome, Localização, Horário de Funcionamento).
  - [ ] O formulário deve possuir o estilo de ficha de papel pólen com validações sob demanda.
- [ ] **M4.2: Carimbo "REGISTRADO" no Sucesso**
  - [ ] Após a inserção no banco de dados, aplicar o carimbo vintage verde-floresta `"REGISTRADO"` no centro do formulário e fechar o modal suavemente.

---

## 🚀 Fase 5: Skeletons em Papel Pólen e Polimento Geral
Finalização visual para uma transição fluida durante o carregamento de dados.

- [ ] **M5.1: Skeletons em Formato de Fichas Vazias**
  - [ ] Durante o carregamento da lista de bibliotecas, exibir skeletons animados simulando gavetas de madeira fechadas com um efeito de pulsar sutil de luz âmbar.
- [ ] **M5.2: Polimento das Bordas e Sombras**
  - [ ] Ajustar as sombras projetadas entre as gavetas adjacentes para dar profundidade tridimensional ao catálogo.

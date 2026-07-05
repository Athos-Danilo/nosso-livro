# 📋 Checklist de Tarefas - Tela de Bibliotecas

Este documento funciona como um guia de acompanhamento (To-Do List) para a conclusão e polimento da tela de **Bibliotecas** do sistema "Nosso Livro". O objetivo é catalogar de forma elegante todas as bibliotecas físicas e pontos de coleta integrados à rede de compartilhamento da instituição.

> [!IMPORTANT]
> **REGRA DE IDIOMA E PADRÕES DO PROJETO (PT-BR):**
> Toda a interface visual, mensagens de feedback, placeholders, logs de console, estruturas de variáveis e comentários deste componente devem ser estritamente em **Português do Brasil (PT-BR)**.
> **DIRETRIZ DESIGN PREMIUM:**
> A interface deve possuir estética glassmorphism refinada, efeitos dinâmicos de hover, foco e animações fluidas baseadas no design system definido em [variaveis.css](file:///c:/Users/Athos/ADS/Meus%20Projetos/nosso-livro/frontend/src/styles/variaveis.css).

---

## 🗺️ Mapa de Progresso da Tela

- [ ] **Fase 1: Layout e Apresentação dos Pontos de Coleta**
- [ ] **Fase 2: Interações Visuais e Informações Detalhadas**
- [ ] **Fase 3: Integração de Consumo com a API de Bibliotecas**
- [ ] **Fase 4: Formulário de Nova Biblioteca (Modo Administrador)**
- [ ] **Fase 5: Otimizações de Interface, Skeletons e Fallbacks**

---

## 🎨 Fase 1: Layout e Apresentação dos Pontos de Coleta
Desenvolvimento da grade visual das bibliotecas cadastradas no ecossistema.

- [ ] **M1.1: Grid de Bibliotecas (Classe Glassmorphism)**
  - [ ] Projetar a exibição das bibliotecas físicas cadastradas usando uma grade flexível (`grid-template-columns: repeat(auto-fit, minmax(280px, 1fr))`).
  - [ ] Aplicar estilo `card-glass` com bordas suaves e arredondadas para os cards individuais de cada biblioteca.
- [ ] **M1.2: Cabeçalho com Nome da Biblioteca e Ícone**
  - [ ] Inserir ícones representativos (`lucide-react` `Library` ou `MapPin`) no cabeçalho de cada card de biblioteca física, estilizados com a cor primária (`--cor-primaria`).
  - [ ] Exibir o nome da biblioteca com tamanho de fonte de `1.25rem` e peso negrito.

---

## 🎬 Fase 2: Interações Visuais e Informações Detalhadas
Apresentação detalhada de horários de funcionamento, endereços e acervos locais.

- [ ] **M2.1: Exibição Elegante de Detalhes de Contato e Localização**
  - [ ] Listar endereço completo, telefone/whatsapp de contato e horários de funcionamento em blocos de texto limpos e organizados com ícones correspondentes.
  - [ ] Exibir de forma atraente a quantidade total de livros físicos armazenados naquela biblioteca específica (Ex: "Acervo local: 42 títulos").
- [ ] **M2.2: Hover Animado e Detalhes**
  - [ ] Ao passar o mouse sobre o card da biblioteca, elevar o contêiner em 5px (`translateY(-5px)`) e acentuar a borda com a cor primária (`--cor-borda-foco`).
  - [ ] Adicionar link rápido "Ver Livros nesta Biblioteca" que redireciona para a tela de catálogo pré-filtrada pelos livros exclusivos daquela unidade física.

---

## 🔗 Fase 3: Integração de Consumo com a API de Bibliotecas
Conexão do frontend com o microsserviço de catálogo e bibliotecas em Python/FastAPI.

- [ ] **M3.1: Chamada HTTP ao Endpoint de Bibliotecas**
  - [ ] Efetuar chamada assíncrona ao endpoint `GET /api/bibliotecas` para listar as bibliotecas físicas salvas.
  - [ ] Mapear o retorno no estado local do React ao carregar a página.
- [ ] **M3.2: Exibição Dinâmica do Acervo de Livros por Unidade**
  - [ ] Garantir que a quantidade de livros exibida em cada unidade reflita o estoque real consultado dinamicamente das bases de dados.
- [ ] **M3.3: Tratamento de Retornos Vazios**
  - [ ] Tratar de forma amigável caso não existam bibliotecas cadastradas, indicando que o administrador deve realizar o primeiro cadastro.

---

## ⚙️ Fase 4: Formulário de Nova Biblioteca (Modo Administrador)
Permitir que usuários gestores insiram novas bibliotecas físicas de forma integrada.

- [ ] **M4.1: Condicionamento de Botão para Administrador**
  - [ ] Exibir o botão "Cadastrar Biblioteca" apenas se a claims do token JWT indicar perfil administrador (`usuario.permissao === 'administrador'`).
- [ ] **M4.2: Modal com Formulário de Cadastro**
  - [ ] Desenhar formulário contendo: Nome da Biblioteca, Endereço Completo, Horário de Funcionamento (Abertura e Fechamento) e Telefone.
  - [ ] Implementar validação local de formulário antes de disparar a requisição.
- [ ] **M4.3: Conexão com Endpoint de Cadastro**
  - [ ] Integrar o envio do formulário à requisição `POST /api/bibliotecas`.
  - [ ] Exibir mensagem flutuante Toast de sucesso após o cadastro concluído, fechando o modal e atualizando a listagem principal na tela com uma animação de fade-in.

---

## 🚀 Fase 5: Otimizações de Interface, Skeletons e Fallbacks
Garantir carregamento fluido e resiliência visual.

- [ ] **M5.1: Skeletons de Cards de Biblioteca**
  - [ ] Exibir esqueletos pulsantes com a proporção exata dos cards de bibliotecas físicas durante a requisição de carregamento inicial.
- [ ] **M5.2: Responsividade no Mobile-first**
  - [ ] Garantir legibilidade dos endereços e horários em telas estreitas, ajustando as colunas dos cards para ocuparem 100% de largura no celular.
- [ ] **M5.3: Tratamento de Erro de Conexão**
  - [ ] Apresentar mensagem intuitiva caso o serviço de catálogo e bibliotecas esteja instável, fornecendo opção rápida para nova tentativa.

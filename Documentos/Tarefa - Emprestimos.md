# 📋 Checklist de Tarefas - Tela de Empréstimos

Este documento funciona como um guia de acompanhamento (To-Do List) para a conclusão e polimento da tela de **Empréstimos** do sistema "Nosso Livro". O objetivo é oferecer ao usuário controle total sobre seus prazos de leitura, histórico de devoluções e alertas preventivos contra atrasos.

> [!IMPORTANT]
> **REGRA DE IDIOMA E PADRÕES DO PROJETO (PT-BR):**
> Toda a interface visual, mensagens de feedback, placeholders, logs de console, estruturas de variáveis e comentários deste componente devem ser estritamente em **Português do Brasil (PT-BR)**.
> **DIRETRIZ DESIGN PREMIUM:**
> A interface deve possuir estética glassmorphism refinada, efeitos dinâmicos de hover, foco e animações fluidas baseadas no design system definido em [variaveis.css](file:///c:/Users/Athos/ADS/Meus%20Projetos/nosso-livro/frontend/src/styles/variaveis.css).

---

## 🗺️ Mapa de Progresso da Tela

- [ ] **Fase 1: Layout de Abas e Organização de Conteúdo**
- [ ] **Fase 2: Cartões de Empréstimo com Codificação de Cores e Prazos**
- [ ] **Fase 3: Integração com APIs do Serviço de Empréstimos**
- [ ] **Fase 4: Simulador de Devolução (Fluxo Administrativo/Demonstração)**
- [ ] **Fase 5: Skeletons, Feedbacks Visuais e Estados Vazios**

---

## 🎨 Fase 1: Layout de Abas e Organização de Conteúdo
Criação do painel de navegação entre empréstimos ativos e o histórico passado.

- [ ] **M1.1: Controle de Abas Deslizantes (Sliding Tabs)**
  - [ ] Implementar abas para alternar entre "Empréstimos Ativos" e "Histórico de Leitura".
  - [ ] Adicionar um indicador visual de fundo (barra inferior ou pílula) que se desloca suavemente com animação horizontal (`transform: translateX`) ao selecionar uma aba.
- [ ] **M1.2: Estrutura em Lista Responsiva**
  - [ ] Organizar os empréstimos em formato de lista responsiva que se transforma em blocos verticais compactos em dispositivos móveis.
  - [ ] Utilizar a classe `card-glass` com bordas arredondadas e divisores finos para cada registro.

---

## 🎬 Fase 2: Cartões de Empréstimo com Codificação de Cores e Prazos
Garantir destaque absoluto para as datas de devolução e o status de cada livro emprestado.

- [ ] **M2.1: Badges de Status com Cores Dinâmicas**
  - [ ] Projetar badges de status diferenciados usando gradientes e cores do design system:
    - **No Prazo:** Verde suave (`--cor-sucesso`) com mensagem "Em Dia".
    - **Perto do Vencimento (menos de 3 dias):** Laranja/Amarelo (`--cor-alerta`) com mensagem "Atenção - Vence Logo".
    - **Atrasado:** Vermelho vibrante (`--cor-erro`) com mensagem "Atrasado".
    - **Devolvido:** Azul/Cinza (`--cor-texto-secundario`) para o histórico.
- [ ] **M2.2: Destaque da Data de Devolução**
  - [ ] Exibir a data de devolução com fonte de tamanho destacado (`1.1rem`) e peso negrito.
  - [ ] Adicionar um ícone de relógio ou calendário ao lado da data, piscando suavemente se o livro estiver atrasado.
- [ ] **M2.3: Efeitos Hover nos Cards de Empréstimo**
  - [ ] Implementar efeito hover de profundidade sutil (sombra `--sombra-md` expandindo e escala de `1.01`).

---

## 🔗 Fase 3: Integração com APIs do Serviço de Empréstimos
Conexão do cliente React com o microsserviço transacional em Go.

- [ ] **M3.1: Consumo do Endpoint de Empréstimos**
  - [ ] Realizar chamada HTTP assíncrona para `GET /api/emprestimos` filtrado pelo ID do usuário logado.
  - [ ] Mapear as datas do JSON de retorno e convertê-las para o formato brasileiro (`DD/MM/AAAA`) usando utilitários nativos em JavaScript.
- [ ] **M3.2: Tratamento de Dados do Livro Relacionado**
  - [ ] Obter as informações de título, autor e capa do livro associado fazendo a junção de dados localmente ou consumindo rotas agregadas de detalhes do livro no Gateway.
- [ ] **M3.3: Exibição de Biblioteca de Coleta/Devolução**
  - [ ] Exibir qual biblioteca física foi escolhida para a retirada do exemplar e o local correto de devolução.

---

## ⚙️ Fase 4: Simulador de Devolução (Fluxo Administrativo/Demonstração)
Facilitação de testes locais e fluxo de devolução integrado.

- [ ] **M4.1: Botão de Devolver Livro (Simulador ou Admin)**
  - [ ] Inserir um botão discreto de "Simular Devolução" ao lado dos empréstimos ativos para agilizar testes e demonstrações acadêmicas.
- [ ] **M4.2: Integração com o Endpoint de Devolução**
  - [ ] Configurar chamada assíncrona ao clicar em devolver para a rota `POST /api/emprestimos/devolver` passando o ID do empréstimo.
- [ ] **M4.3: Animação e Evento Assíncrono pós-Devolução**
  - [ ] Após a devolução com sucesso:
    - Exibir uma notificação flutuante de sucesso no canto da tela (Toast) com transição de slide lateral.
    - Mover o card de empréstimo ativo para a aba de histórico de leitura automaticamente com animação de fade-out seguida de inserção na aba de histórico.

---

## 🚀 Fase 5: Skeletons, Feedbacks Visuais e Estados Vazios
Garantir o acabamento estético e feedbacks compreensíveis.

- [ ] **M5.1: Estado Vazio Ilustrativo**
  - [ ] Caso o usuário não tenha histórico de empréstimo ativo ou finalizado, exibir uma mensagem em português: "Nenhum empréstimo registrado." acompanhada de ícone de ampulheta ou livro transparente e um botão rápido "Ver Livros do Catálogo".
- [ ] **M5.2: Skeleton Loading de Linhas**
  - [ ] Desenhar linhas de esqueleto pulsantes simulando o título do livro, a data e a badge enquanto a requisição à API de empréstimos está pendente.
- [ ] **M5.3: Tratamento Resiliente contra Falha de Conexão**
  - [ ] Caso a chamada HTTP ao microsserviço transacional falhe, exibir aviso amigável sem interromper a navegação da barra lateral.

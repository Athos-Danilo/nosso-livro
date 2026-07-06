# 📋 Checklist de Tarefas - Tela de Reservas e Filas de Espera (Santuário Literário)

Este documento funciona como um guia de acompanhamento (To-Do List) para a conclusão e polimento da tela de **Reservas** do sistema "Nosso Livro", adaptada para a estética clássica do **"Santuário Literário"**.

> [!IMPORTANT]
> **DIRETRIZ DESIGN PREMIUM & TEMÁTICA:**
> A tela de reservas simula a **"Fila de Fichas de Espera"**. Cada reserva ativa é representada como uma ficha de papel pólen texturizada (`--cor-papel-polen-glass`) com molduras duplas. O status da fila de espera é exibido como uma lista clássica de leitores assinada à pena. Quando o livro é liberado, recebe o carimbo vintage verde-floresta `"LIBERADO PARA RETIRADA"`.
> Toda a interface visual, mensagens de feedback, placeholders e comentários devem ser estritamente em **Português do Brasil (PT-BR)**.

---

## 🗺️ Mapa de Progresso da Tela

- [ ] **Fase 1: Fila de Fichas de Espera (Estrutura e Cards)**
- [ ] **Fase 2: Indicador de Fila Escrito à Pena (Progresso de Espera)**
- [ ] **Fase 3: Integração com Serviço de Reservas (Node.js)**
- [ ] **Fase 4: Carimbo de Liberação e Temporizador de Guarda**
- [ ] **Fase 5: Fichas Skeletons e Estado Vazio**

---

## 🎨 Fase 1: Fila de Fichas de Espera (Estrutura e Cards)
Construção da listagem linear de reservas em formato de fichas pólen.

- [ ] **M1.1: Cartões Individuais de Reserva (Fichas Pólen)**
  - [ ] Projetar cada reserva como uma ficha de papel pólen clássica com bordas arredondadas e divisores finos.
  - [ ] Exibir o título do livro, autor e data da solicitação em fontes serifadas clássicas.
- [ ] **M1.2: Lista Linear de Prateleiras**
  - [ ] Organizar os cartões em lista vertical, com espaçamento harmonioso (`gap: 24px`) que simula pastas empilhadas.
  - [ ] Separar a imagem da capa (em modelo 3D sutil) das informações textuais com bordas em tom ouro envelhecido sutil.

---

## 🎬 Fase 2: Indicador de Fila Escrito à Pena (Progresso de Espera)
Visualização clássica da posição na fila de espera de forma analógica.

- [ ] **M2.1: Progresso Circular ou Lista à Pena**
  - [ ] Desenhar o indicador de posição da fila simulando uma lista manual de nomes antigos escrita em caligrafia elegante (ex: "1º da fila de 4 leitores").
  - [ ] Adicionar preenchimento gradual da barra de espera usando o tom de ouro envelhecido.
- [ ] **M2.2: Hover nos Botões de Ação**
  - [ ] O botão "Cancelar Reserva" deve reagir ao hover com tom vermelho-ferrugem sóbrio e sem brilhos dourados, dando o feedback clássico de "Anular Registro".

---

## 🔗 Fase 3: Integração com Serviço de Reservas (Node.js)
Conexão do frontend ao microsserviço de reservas rodando em Node.js.

- [ ] **M3.1: Requisições de Fila de Espera**
  - [ ] Consumir `GET /api/reservas` para obter a posição atualizada calculada em tempo real.
- [ ] **M3.2: Cancelamento e Animação de Altura**
  - [ ] Integrar o clique no botão "Cancelar Reserva" ao endpoint `DELETE /api/reservas/{id}`.
  - [ ] Ao confirmar a exclusão, remover o item com animação suave de fade-out e encolhimento físico de altura (redução para zero no fluxo do layout).

---

## 🔔 Fase 4: Carimbo de Liberação e Temporizador de Guarda
Efeitos visuais marcantes para alertar a disponibilidade física do livro na biblioteca.

- [ ] **M4.1: Carimbo Verde-Floresta "LIBERADO"**
  - [ ] Se o livro estiver pronto para retirada:
    - Aplicar o carimbo vintage verde-floresta `"LIBERADO PARA RETIRADA"` inclinado a `-6deg`.
    - Adicionar um pulso de brilho âmbar sutil ao redor da borda da ficha de reserva.
- [ ] **M4.2: Cronômetro de Guarda Literária**
  - [ ] Exibir o prazo limite de guarda do livro na biblioteca de retirada (Ex: "Retirar em até 48 horas") em vermelho-ferrugem com ícone de ampulheta sutil.

---

## 🚀 Fase 5: Fichas Skeletons e Estado Vazio
Otimizações visuais e tratamentos de indisponibilidade.

- [ ] **M5.1: Estado Vazio Clássico**
  - [ ] Caso não existam reservas ativas, mostrar o texto: `"NENHUM LIVRO EM ESPERA REGISTRADO NA SUA FICHA."` com ilustração de um marcador de páginas de fita antiga e link rápido para "Explorar Acervo".
- [ ] **M5.2: Skeletons de Ficha Pólen**
  - [ ] Renderizar silhuetas pulsantes em papel pólen imitando os dados da reserva e a barra da fila enquanto a API carrega.

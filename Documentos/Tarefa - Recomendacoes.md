# 📋 Checklist de Tarefas - Tela de Recomendações (Santuário Literário)

Este documento funciona como um guia de acompanhamento (To-Do List) para a conclusão e polimento da tela de **Recomendações Inteligentes** (Indicações da Biblioteca) do sistema "Nosso Livro", adaptada para a estética clássica do **"Santuário Literário"**.

> [!IMPORTANT]
> **DIRETRIZ DESIGN PREMIUM & TEMÁTICA:**
> A tela de indicações simula a **"Curadoria do Bibliotecário"**. As recomendações são dispostas em um **expositor inclinado de madeira (book stand)**. O livro de destaque ganha um acabamento dourado na capa e selo de classificação em cera vermelha. As estatísticas de afinidade literária são representadas em gráficos que lembram astrolábios antigos ou relógios astronômicos com ponteiros de ouro.
> Toda a interface visual, mensagens de feedback, placeholders e comentários devem ser estritamente em **Português do Brasil (PT-BR)**.

---

## 🗺️ Mapa de Progresso da Tela

- [ ] **Fase 1: Expositor de Curadoria e Livro Destaque (Estrutura)**
- [ ] **Fase 2: Perspectiva 3D nos Livros e Micro-animação de Estrela**
- [ ] **Fase 3: Integração de Consumo (Serviço de Recomendação em Python)**
- [ ] **Fase 4: Painel de Afinidade de Leitor (Estatísticas de Astrolábio)**
- [ ] **Fase 5: Skeletons de Estantes e Fallback para Leitores Novos**

---

## 🎨 Fase 1: Expositor de Curadoria e Livro Destaque (Estrutura)
Construção do layout de exibição horizontal de recomendações em stands de madeira.

- [ ] **M1.1: Expositor Horizontal de Leitura (Book Stand Carousel)**
  - [ ] Projetar seção superior contendo rolagem flexível horizontal sem barra de rolagem nativa.
  - [ ] Modelar a base do expositor simulando prateleiras inclinadas em mogno escuro com relevos de ouro.
- [ ] **M1.2: Livro Destaque da Curadoria (Selo de Lacre de Cera)**
  - [ ] Destacar a indicação principal com capa tridimensional especial e o carimbo de lacre de cera vermelho `"ESCOLHA DO BIBLIOTECÁRIO"`.
  - [ ] Apresentar título do livro, autor, gênero e a justificativa de afinidade em formato de texto manuscrito elegante.

---

## 🎬 Fase 2: Perspectiva 3D nos Livros e Micro-animação de Estrela
Efeitos visuais clássicos ao interagir com as indicações.

- [ ] **M2.1: Efeito Livro Aberto no Hover**
  - [ ] Ao passar o cursor, o livro recomendado deve rotacionar suavemente em Y (`transform: rotateY(-20deg) scale(1.05)`), imitando a abertura da capa.
- [ ] **M2.2: Micro-animação do Selo de Afinidade**
  - [ ] Inserir uma estrela clássica/tinteiro de afinidade que pulsa ao passar o cursor, indicando o salvamento da recomendação na ficha do leitor.

---

## 🔗 Fase 3: Integração de Consumo (Serviço de Recomendação em Python)
Consumo da API inteligente baseada no histórico do leitor logado.

- [ ] **M3.1: Integração com Endpoint de Recomendações (FastAPI)**
  - [ ] Consumir `GET /api/recomendacoes` enviando o token JWT.
  - [ ] Lidar com a justificativa de leitura calculada pelo algoritmo.
- [ ] **M3.2: Ações Rápidas de Reserva**
  - [ ] Permitir que o leitor clique em "Reservar Obra" diretamente no card de recomendação, conectando-se ao Serviço de Reservas.

---

## 📊 Fase 4: Painel de Afinidade de Leitor (Estatísticas de Astrolábio)
Exibição de métricas analíticas e de perfil de leitura em formato de instrumentos de navegação clássicos.

- [ ] **M4.1: Gráficos de Afinidade Literária (Astrolábio/Relógio Antigo)**
  - [ ] Desenhar o painel com anéis circulares concêntricos que giram suavemente ao carregar, imitando ponteiros de latão de um relógio astronômico, representando a proporção de gêneros lidos.
- [ ] **M4.2: Registro de Páginas Devoradas**
  - [ ] Exibir estatística de páginas lidas no mês como um pergaminho aberto com letras cursivas elegantes.

---

## 🚀 Fase 5: Skeletons de Estantes e Fallback para Leitores Novos
Tratamento estético para garantir navegação resiliente.

- [ ] **M5.1: Skeletons de Livros Vazios**
  - [ ] Durante a requisição à API, preencher as prateleiras com silhuetas vazias de livros antigos em degradê cinza e iluminação âmbar.
- [ ] **M5.2: Ficha Alternativa para Leitores Sem Histórico**
  - [ ] Se o leitor não possuir histórico de leituras anteriores:
    - Exibir a mensagem: `"AINDA NÃO POSSUÍMOS REGISTROS DE LEITURA EM SUA FICHA PARA GERAR INDICAÇÕES PERSONALIZADAS."`
    - Listar os livros mais lidos/populares da biblioteca geral no expositor.

# 📋 Checklist de Tarefas - Tela de Cadastro (Reformulação "Santuário Literário")

Este documento serve como o roteiro detalhado para a implementação e polimento da tela de **Cadastro** (Registro de Leitor) do sistema "Nosso Livro", adaptada para a estética clássica do **"Santuário Literário"**.

> [!IMPORTANT]
> **DIRETRIZ DESIGN PREMIUM & TEMÁTICA:**
> O visual segue a mesma identidade da tela de login: fundo escuro tridimensional com iluminação âmbar, textura de papel pólen, tipografia Vintage, botão em gradiente Azul Marinho Nobre, links limpos e alertas em formato de **carimbos vintage** de tinta vermelha envelhecida.
> Toda a interface visual, feedbacks e mensagens devem permanecer estritamente em **Português do Brasil (PT-BR)**.

---

## 🗺️ Mapa de Progresso da Tela

- [x] **Fase 1: Ficha de Registro de Leitor (Estrutura e Inputs)**
- [x] **Fase 2: Animações Cinematográficas e Máscara Dinâmica**
- [x] **Fase 3: Medidor de Força da Senha e Validação de Carimbos**
- [x] **Fase 4: Integração com API e Efeito "Folheando Registros"**
- [x] **Fase 5: Carimbo "APROVADO" (Sucesso) e Redirecionamento**

---

## 🎨 Fase 1: Ficha de Registro de Leitor (Estrutura e Inputs)
Construção do layout do card de registro de leitor baseado em papel pólen texturizado e campos simétricos.

- [x] **M1.1: Ficha de Catálogo de Biblioteca Vintage**
  - [x] Reutilizar o card `.card-santuario` com papel pólen (`--cor-papel-polen-glass`), moldura dupla interna em debossed/embossed e sombra profunda de luxo.
  - [x] Garantir responsividade completa, adaptando os paddings para telas mobile.
- [x] **M1.2: Distribuição dos Inputs do Formulário**
  - [x] Criar campos de entrada individuais com labels flutuantes para:
    - Nome Completo
    - WhatsApp (obrigatório pelo backend, com máscara ativa)
    - E-mail (obrigatório pelo backend)
    - Senha (mínimo 6 caracteres)
    - Confirmar Senha
  - [x] Adicionar os respectivos ícones da biblioteca Lucide à esquerda (`User`, `Phone`, `Mail`, `Lock`).
- [x] **M1.3: Botões e Links de Transição**
  - [x] Estilizar o botão principal "Registrar na Ficha de Leitores" com o gradiente Azul Marinho Nobre (`#1d3557` a `#102a43`) e hover com borda azul escura.
  - [x] Inserir o link de retorno "Já tem conta? Entrar" estilizado de forma limpa no rodapé (texto azul marinho negrito, sem sublinhados, hover de opacidade).

---

## 🎬 Fase 2: Animações Cinematográficas e Máscara Dinâmica
Enriquecer a experiência do leitor com transições elegantes e máscaras de telefone em tempo real.

- [x] **M2.1: Transição Cinematográfica de Entrada (Slide-in Horizontal)**
  - [x] Criar animação de transição a partir da tela de login (um slide suave da direita para a esquerda).
  - [x] Configurar delay escalonado nos campos do formulário para surgimento sequencial.
- [x] **M2.2: Máscara Dinâmica de Telefone/WhatsApp**
  - [x] No campo de WhatsApp, aplicar a máscara `(XX) XXXXX-XXXX` dinamicamente em tempo real ao digitar.
  - [x] Tratar a digitação para apagar os caracteres da máscara caso o usuário dê backspace.
- [x] **M2.3: Foco Dinâmico e Brilho Ouro Envelhecido**
  - [x] Ao focar em qualquer input, a caixa de entrada deve mudar o fundo para branco (`#ffffff`), as bordas para ouro envelhecido (`var(--cor-ouro-envelhecido)`) e aplicar o box-shadow dourado sutil.
  - [x] Fazer com que o ícone do input mude de cor para o tom dourado ao receber foco.

---

## 🛡️ Fase 3: Medidor de Força da Senha e Validação de Carimbos
Validações visuais robustas inspiradas em carimbos antigos de tinta antes da submissão do formulário.

- [x] **M3.1: Validação sob Demanda**
  - [x] As validações só devem exibir alertas visuais de erro após o primeiro clique em "Registrar na Ficha de Leitores".
  - [x] Limpar todos os erros na hora em que o usuário recomeçar a digitar nos inputs.
- [x] **M3.2: Medidor Temático de Força da Senha**
  - [x] Adicionar um medidor sutil de segurança de senha abaixo do campo de senha (barra fina de progresso que muda de cor: Vermelho Ferrugem para fraca, Amarelo Envelhecido para média, Verde Floresta para forte).
- [x] **M3.3: Selos de Confirmação de Senha**
  - [x] Validar em tempo real se a senha e a confirmação coincidem.
  - [x] Se divergirem, exibir o carimbo de erro local `"DIVERGENTE: AS SENHAS NÃO COINCIDEM"` com rotação de `-6deg` e margem de respiro de `32px`.

---

## 🔗 Fase 4: Integração com API e Efeito "Folheando Registros"
Conexão do formulário ao backend com estados clássicos de carregamento e manipulação de erros.

- [x] **M4.1: Submissão de Cadastro ao Servidor**
  - [x] Enviar a requisição para o endpoint de cadastro com `nome`, `email`, `whatsapp` e `senha` limpos.
  - [x] Controlar o estado de carregamento do botão principal de ação.
- [x] **M4.2: Efeito "Folheando Registros..."**
  - [x] Quando o registro estiver em processamento, desativar todos os inputs e mudar o texto do botão principal de cadastro para "Folheando registros..." exibindo a animação clássica de livro folheando suas páginas.
- [x] **M4.3: Carimbos Globais de Erro**
  - [x] Caso a API retorne erros de duplicidade (e-mail já em uso ou WhatsApp já cadastrado), exibir o carimbo vintage de erro global no topo da ficha: `"DUPLICADO: REGISTRO JÁ EXISTENTE"` com tremor (*shake*).

---

## 🚀 Fase 5: Carimbo "APROVADO" (Sucesso) e Redirecionamento
Finalização fluida e recompensa visual ao concluir o registro do leitor na biblioteca.

- [x] **M5.1: Carimbo "APROVADO" de Bibliotecário**
  - [x] Ao concluir com sucesso o cadastro, limpar os dados da memória.
  - [x] Exibir uma animação de carimbo vintage verde-floresta no centro do card contendo o texto: `"APROVADO: BEM-VINDO LEITOR"`.
- [x] **M5.2: Redirecionamento Temporizado Autônomo**
  - [x] Manter o carimbo de aprovação por 2.5 segundos para o usuário contemplar o sucesso e, em seguida, disparar o redirecionamento automático suave para a tela de login (`/login`).

# 📋 Checklist de Tarefas - Tela de Login

Este documento funciona como um guia de acompanhamento (To-Do List) para a conclusão e polimento da tela de **Login** do sistema "Nosso Livro". O objetivo é transformar esta tela em uma interface padrão ouro de design, com transições cinematográficas e alta performance.

> [!IMPORTANT]
> **REGRA DE IDIOMA E PADRÕES DO PROJETO (PT-BR):**
> Toda a interface visual, mensagens de feedback, placeholders, logs de console, estruturas de variáveis e comentários deste componente devem ser estritamente em **Português do Brasil (PT-BR)**.
> **DIRETRIZ DESIGN PREMIUM:**
> A interface deve possuir estética glassmorphism refinada, efeitos dinâmicos de hover, foco e animações fluidas baseadas no design system definido em [variaveis.css](file:///c:/Users/Athos/ADS/Meus%20Projetos/nosso-livro/frontend/src/styles/variaveis.css).

---

## 🗺️ Mapa de Progresso da Tela

- [x] **Fase 1: Estrutura Visual e Ambientação Premium**
- [x] **Fase 2: Micro-interações e Animações Cinematográficas**
- [x] **Fase 3: Validação de Dados Local e Acessibilidade**
- [x] **Fase 4: Integração com a API e Gerenciamento de Estado**
- [x] **Fase 5: Otimização de Performance e Tratamento de Erros**

---

## 🎨 Fase 1: Estrutura Visual e Ambientação Premium
Construção do contêiner principal e elementos gráficos da tela utilizando o tema escuro institucional.

- [x] **M1.1: Fundo com Gradiente Dinâmico e Efeito de Vidro (Glassmorphism)**
  - [x] Implementar fundo com degradê suave animado de tons escuros (`--cor-fundo` e tons de HSL azulados).
  - [x] Estruturar o card central com a classe `card-glass` e bordas finas semi-transparentes (`--glass-border`).
  - [x] Adicionar um efeito de blur progressivo ao fundo do card usando `backdrop-filter: var(--glass-blur)`.
- [x] **M1.2: Tipografia e Branding Corporativo**
  - [x] Estilizar a logo do "Nosso Livro" no cabeçalho do formulário, aplicando um gradiente metálico na palavra "Livro".
  - [x] Implementar fontes com pesos adequados (Inter 700 para títulos, 500 para rótulos e 400 para textos secundários).
- [x] **M1.3: Desenho dos Inputs e Botões**
  - [x] Criar campos de formulário envelopados em contêineres que isolam visualmente o ícone (`lucide-react`) e o input.
  - [x] Criar o botão de ação principal com cor sólida (`--cor-primaria`) e o botão de transição para cadastro com fundo transparente e borda sutil.

---

## 🎬 Fase 2: Micro-interações e Animações Cinematográficas
Dar vida à interface com animações que enriquecem a experiência do usuário.

- [x] **M2.1: Animação de Entrada dos Elementos (Staggered Entrance)**
  - [x] Configurar animação de fade-in com slide-up de 30px na tela ao carregar.
  - [x] Aplicar delay escalonado para os elementos: Primeiro o logotipo (0ms), depois o campo de e-mail (100ms), campo de senha (200ms), botão de login (300ms) e link de cadastro (400ms).
- [x] **M2.2: Efeitos de Foco Dinâmicos (Glow Effect)**
  - [x] Ao focar em qualquer input, expandir a borda sutilmente e aplicar uma sombra suave com a cor primária (`--cor-borda-foco`) simulando um neon sutil.
  - [x] Deslocar levemente o ícone do input para a direita no foco como indicativo visual.
- [x] **M2.3: Estados de Hover e Active nos Botões**
  - [x] O botão de login deve clarear suavemente no hover (`--cor-primaria-hover`) e encolher 2% no clique físico (`active`).
  - [x] Adicionar um efeito de brilho que percorre horizontalmente o botão de login (efeito shine) a cada 8 segundos para chamar a atenção de forma elegante.
- [x] **M2.4: Alternância Suave de Visibilidade de Senha**
  - [x] Implementar botão de revelar/ocultar senha com transição de ícone fluida (olho aberto para olho fechado) e feedback visual imediato.

---

## 🛡️ Fase 3: Validação de Dados Local e Acessibilidade
Garantia de integridade das entradas do usuário e conformidade de acesso para todos.

- [x] **M3.1: Validação de Formato em Tempo Real**
  - [x] Validar e-mail estruturalmente (regex) ou aceitar telefone WhatsApp (apenas números, mínimo 11 dígitos).
  - [x] Exibir mensagens de erro abaixo de cada campo com transição de entrada suave (slide-down de 5px com fade-in).
  - [x] Mudar a cor da borda do input para `--cor-erro` apenas após a primeira tentativa de envio ou após o usuário sair do campo (onBlur).
- [x] **M3.2: Controle de Envio Vazio**
  - [x] Desativar o botão de login se os campos estiverem vazios, aplicando um estado visual desativado com `--cor-texto-desativado` e opacidade reduzida.
- [x] **M3.3: Acessibilidade Completa (A11y)**
  - [x] Garantir navegação sequencial fluida usando a tecla `Tab`.
  - [x] Incluir atributos `aria-invalid` e `aria-describedby` para os erros de validação.
  - [x] Permitir a submissão do formulário ao pressionar a tecla `Enter` em qualquer campo.

---

## 🔗 Fase 4: Integração com a API e Gerenciamento de Estado
Conexão do frontend com o gateway de autenticação para autenticar usuários.

- [x] **M4.1: Comunicação com o Endpoint de Login**
  - [x] Conectar a submissão do formulário à função `login` exposta pelo `AuthContext`.
  - [x] Chamar a rota `POST /api/autenticacao/login` passando os dados validados.
- [x] **M4.2: Estado de Carregamento Premium (Loading State)**
  - [x] Ao clicar em entrar, substituir o texto do botão por um spinner de carregamento elegante e travar as interações da tela.
  - [x] Adicionar efeito de pulsação suave em todo o card de login durante a requisição.
- [x] **M4.3: Armazenamento Seguro e Redirecionamento**
  - [x] Após o login com sucesso, armazenar o token retornado de forma transparente.
  - [x] Executar animação de saída de toda a tela (fade-out combinado com zoom sutil para fora) antes de navegar para o Painel Principal (`/`).

---

## 🚀 Fase 5: Otimização de Performance e Tratamento de Erros
Garantia de resiliência e fluidez em conexões lentas.

- [x] **M5.1: Captura e Exibição de Erros Globais**
  - [x] Capturar respostas de erro do backend (ex: "Credenciais inválidas", "Usuário desativado").
  - [x] Exibir um banner de erro flutuante no topo do formulário com cor `--cor-erro` e um ícone de alerta vibrando levemente (shake animation).
- [x] **M5.2: Limitação de Duplo Clique (Debounce / Throttle)**
  - [x] Prevenir múltiplos disparos de requisições caso o usuário clique freneticamente no botão de login.
- [x] **M5.3: Limpeza de Estado no Desmonte**
  - [x] Garantir que todas as variáveis locais e eventuais timers sejam limpos se a tela for desmontada repentinamente.

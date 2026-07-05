# 📋 Checklist de Tarefas - Tela de Cadastro

Este documento funciona como um guia de acompanhamento (To-Do List) para a conclusão e polimento da tela de **Cadastro** (Registro de Usuário) do sistema "Nosso Livro". O foco é criar um formulário interativo de alta conversão, com excelente usabilidade e validações fluidas.

> [!IMPORTANT]
> **REGRA DE IDIOMA E PADRÕES DO PROJETO (PT-BR):**
> Toda a interface visual, mensagens de feedback, placeholders, logs de console, estruturas de variáveis e comentários deste componente devem ser estritamente em **Português do Brasil (PT-BR)**.
> **DIRETRIZ DESIGN PREMIUM:**
> A interface deve possuir estética glassmorphism refinada, efeitos dinâmicos de hover, foco e animações fluidas baseadas no design system definido em [variaveis.css](file:///c:/Users/Athos/ADS/Meus%20Projetos/nosso-livro/frontend/src/styles/variaveis.css).

---

## 🗺️ Mapa de Progresso da Tela

- [ ] **Fase 1: Estrutura Visual e Campos do Formulário**
- [ ] **Fase 2: Micro-interações e Máscaras Inteligentes**
- [ ] **Fase 3: Validação de Segurança e Confirmação de Senha**
- [ ] **Fase 4: Integração com a API de Autenticação**
- [ ] **Fase 5: Feedbacks de Sucesso e Otimização Geral**

---

## 🎨 Fase 1: Estrutura Visual e Campos do Formulário
Construção do layout responsivo para acomodar as informações cadastrais do membro institucional.

- [ ] **M1.1: Container Glassmorphism Centralizado**
  - [ ] Projetar card de cadastro com a classe `card-glass` alinhada perfeitamente no centro da tela.
  - [ ] Garantir que o formulário seja responsivo, adaptando o espaçamento interno (`padding`) para telas de celulares.
- [ ] **M1.2: Distribuição dos Inputs do Formulário**
  - [ ] Criar campos de entrada para: Nome Completo, E-mail Institucional, WhatsApp (Telefone) e Senha.
  - [ ] Adicionar rótulos descritivos com tamanho de fonte de `0.875rem` e cor `--cor-texto-secundario`.
  - [ ] Inserir ícones representativos (`lucide-react`) na lateral esquerda de cada input (Ex: `User`, `Mail`, `Phone`, `Lock`).
- [ ] **M1.3: Botões de Ação**
  - [ ] Estilizar o botão principal "Criar Conta" com fundo de gradiente sutil usando `--cor-primaria` e `--cor-primaria-hover`.
  - [ ] Criar link de alternância "Já tem uma conta? Entrar" posicionado de forma discreta no rodapé do card.

---

## 🎬 Fase 2: Micro-interações e Máscaras Inteligentes
Enriquecer a experiência do usuário com reações visuais automáticas à digitação.

- [ ] **M2.1: Animação de Entrada e Transição de Telas**
  - [ ] Adicionar animação de entrada da esquerda para a direita (slide-in horizontal) simulando uma transição de páginas nativa a partir da tela de login.
  - [ ] Configurar delay escalonado nos campos do formulário para entrada fluida.
- [ ] **M2.2: Máscara Dinâmica de Telefone no Campo WhatsApp**
  - [ ] Implementar máscara em tempo real para o WhatsApp no formato `(XX) XXXXX-XXXX`.
  - [ ] Tratar a digitação de forma que apague caracteres especiais automaticamente se o usuário usar backspace.
- [ ] **M2.3: Foco Dinâmico e Brilho das Bordas**
  - [ ] Aplicar animação de transição nas bordas dos inputs ao receber foco, alterando para a cor `--cor-borda-foco` com um brilho externo suave (`box-shadow`).
  - [ ] Fazer com que o ícone interno do input ganhe a cor primária ao focar no respectivo campo.
- [ ] **M2.4: Efeito Hover nos Elementos Clicáveis**
  - [ ] Adicionar efeito hover no link de voltar para o login, criando um sublinhado elegante que se expande do centro para as bordas.

---

## 🛡️ Fase 3: Validação de Segurança e Confirmação de Senha
Garantir que os dados fornecidos pelo usuário sejam válidos e seguros antes de enviar ao servidor.

- [ ] **M3.1: Medidor de Força da Senha**
  - [ ] Implementar uma barra de progresso colorida abaixo do campo de Senha indicando a força (Fraca, Média, Forte) com base em critérios simples (comprimento, números, letras maiúsculas/especiais).
  - [ ] Utilizar as cores de feedback: `--cor-erro` para fraca, `--cor-alerta` para média e `--cor-sucesso` para forte.
- [ ] **M3.2: Confirmação de Senha Igual**
  - [ ] Adicionar campo "Confirmar Senha" e validar em tempo real se o valor coincide com a senha digitada anteriormente.
  - [ ] Mostrar um indicador visual de erro (borda vermelha e texto descritivo) se as senhas divergirem.
- [ ] **M3.3: Validação de E-mail e WhatsApp**
  - [ ] Validar se o e-mail atende a uma expressão regular padrão de e-mails válidos.
  - [ ] Validar se o WhatsApp possui todos os 11 dígitos numéricos necessários.

---

## 🔗 Fase 4: Integração com a API de Autenticação
Conectar a tela de cadastro ao microsserviço de usuários.

- [ ] **M4.1: Submissão para o Endpoint de Cadastro**
  - [ ] Ao enviar o formulário, acionar o método `cadastro` do `AuthContext`.
  - [ ] Enviar a requisição `POST /api/autenticacao/cadastro` contendo `nome`, `email`, `whatsapp` (limpo de máscaras) e `senha`.
- [ ] **M4.2: Estado de Carregamento e Bloqueio de Ações**
  - [ ] Substituir o texto do botão por um estado de loading elegante com animação giratória (spinner).
  - [ ] Bloquear todos os campos de input contra edição enquanto o cadastro é processado.
- [ ] **M4.3: Captura de Erros da API**
  - [ ] Tratar mensagens de erro comuns da API (Ex: "WhatsApp já cadastrado", "E-mail já em uso").
  - [ ] Exibir o erro em uma caixa de alerta vermelha flutuante com animação de tremor (*shake*) no card de cadastro.

---

## 🚀 Fase 5: Feedbacks de Sucesso e Otimização Geral
Finalização do fluxo de registro e retorno amigável ao usuário.

- [ ] **M5.1: Tela de Sucesso Interativa**
  - [ ] Após o cadastro concluído com sucesso, exibir uma tela de transição com um grande ícone de check animado que se desenha na tela (`draw SVG path`).
  - [ ] Apresentar uma mensagem amigável: "Cadastro realizado com sucesso! Redirecionando para o login...".
- [ ] **M5.2: Redirecionamento Temporizado Autônomo**
  - [ ] Redirecionar automaticamente o usuário para a página de Login após 3 segundos da exibição da mensagem de sucesso.
- [ ] **M5.3: Limpeza de Cache de Input**
  - [ ] Garantir que os campos de formulário e senhas sejam limpos da memória do navegador após o sucesso da operação.

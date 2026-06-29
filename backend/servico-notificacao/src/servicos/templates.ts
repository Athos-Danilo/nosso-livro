// ─── Templates de E-mail HTML — Serviço de Notificação ──────────────────────
// Templates modernos e responsivos em português para cada tipo de notificação.
// Cada função recebe dados dinâmicos e retorna o HTML pronto para envio.

// ─── Layout base compartilhado ───────────────────────────────────────────────

/**
 * Encapsula o conteúdo do e-mail em um layout HTML responsivo com:
 * - Reset CSS para compatibilidade com clientes de e-mail
 * - Cores da identidade visual "Nosso Livro"
 * - Cabeçalho com logo/nome e rodapé com aviso legal
 *
 * @param titulo - Título exibido no cabeçalho do e-mail
 * @param conteudo - HTML interno do corpo da mensagem
 * @returns HTML completo do e-mail pronto para envio
 */
function layoutBase(titulo: string, conteudo: string): string {
  return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${titulo}</title>
  <style>
    /* Reset para clientes de e-mail */
    body, table, td, p, a, li { margin: 0; padding: 0; }
    body { width: 100% !important; -webkit-text-size-adjust: 100%; }
    img { border: 0; outline: none; text-decoration: none; }

    /* Estilos principais */
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      background-color: #f4f6f9;
      color: #333333;
      line-height: 1.6;
    }
    .container {
      max-width: 600px;
      margin: 20px auto;
      background-color: #ffffff;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
    }
    .header {
      background: linear-gradient(135deg, #2563eb, #1d4ed8);
      color: #ffffff;
      padding: 28px 32px;
      text-align: center;
    }
    .header h1 {
      font-size: 22px;
      font-weight: 700;
      margin: 0;
      letter-spacing: 0.5px;
    }
    .header .subtitulo {
      font-size: 13px;
      opacity: 0.85;
      margin-top: 4px;
    }
    .body {
      padding: 32px;
    }
    .body h2 {
      font-size: 18px;
      color: #1e3a5f;
      margin-bottom: 16px;
      border-bottom: 2px solid #e5e7eb;
      padding-bottom: 8px;
    }
    .body p {
      font-size: 15px;
      color: #4b5563;
      margin-bottom: 12px;
    }
    .info-box {
      background-color: #eff6ff;
      border-left: 4px solid #2563eb;
      border-radius: 6px;
      padding: 16px 20px;
      margin: 20px 0;
    }
    .info-box p {
      margin: 4px 0;
      font-size: 14px;
      color: #1e40af;
    }
    .info-box strong {
      color: #1e3a5f;
    }
    .destaque {
      background-color: #fef3c7;
      border-left: 4px solid #f59e0b;
      border-radius: 6px;
      padding: 16px 20px;
      margin: 20px 0;
    }
    .destaque p {
      margin: 4px 0;
      font-size: 14px;
      color: #92400e;
    }
    .footer {
      background-color: #f9fafb;
      padding: 20px 32px;
      text-align: center;
      border-top: 1px solid #e5e7eb;
    }
    .footer p {
      font-size: 12px;
      color: #9ca3af;
      margin: 2px 0;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>📚 Nosso Livro</h1>
      <div class="subtitulo">Biblioteca Compartilhada Inteligente</div>
    </div>
    <div class="body">
      ${conteudo}
    </div>
    <div class="footer">
      <p>Este é um e-mail automático da plataforma <strong>Nosso Livro</strong>.</p>
      <p>Por favor, não responda a esta mensagem.</p>
    </div>
  </div>
</body>
</html>`.trim();
}

// ─── Formatação de datas ─────────────────────────────────────────────────────

/**
 * Formata uma data ISO 8601 para o formato brasileiro (dd/mm/aaaa às HH:mm).
 */
function formatarData(dataIso: string): string {
  try {
    const data = new Date(dataIso);
    return data.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return dataIso; // Retorna a string original se a conversão falhar
  }
}

// ─── Template 1: Empréstimo Confirmado ───────────────────────────────────────

export interface DadosTemplateEmprestimo {
  nomeUsuario: string;
  idLivro: string;
  idBiblioteca: string;
  dataLimiteDevolucao: string;
  criadoEm: string;
}

/**
 * Template de confirmação de empréstimo realizado.
 * Informa ao usuário que o empréstimo foi registrado e a data limite de devolução.
 */
export function templateEmprestimo(dados: DadosTemplateEmprestimo): { titulo: string; html: string } {
  const conteudo = `
    <h2>✅ Empréstimo Confirmado!</h2>
    <p>Olá, <strong>${dados.nomeUsuario}</strong>!</p>
    <p>Seu empréstimo foi registrado com sucesso na plataforma Nosso Livro.</p>

    <div class="info-box">
      <p><strong>📖 Livro:</strong> ${dados.idLivro}</p>
      <p><strong>🏛️ Biblioteca:</strong> ${dados.idBiblioteca}</p>
      <p><strong>📅 Data do empréstimo:</strong> ${formatarData(dados.criadoEm)}</p>
    </div>

    <div class="destaque">
      <p><strong>⚠️ Data limite para devolução:</strong></p>
      <p style="font-size: 16px; font-weight: bold;">${formatarData(dados.dataLimiteDevolucao)}</p>
    </div>

    <p>Lembre-se de devolver o livro dentro do prazo para que outros colegas possam aproveitá-lo. Boa leitura! 📖</p>
  `;

  return {
    titulo: '📚 Empréstimo confirmado — Nosso Livro',
    html: layoutBase('Empréstimo Confirmado', conteudo),
  };
}

// ─── Template 2: Devolução Confirmada ────────────────────────────────────────

export interface DadosTemplateDevolucao {
  nomeUsuario: string;
  idLivro: string;
  dataDevolucao: string;
}

/**
 * Template de confirmação de devolução efetuada.
 * Agradece ao usuário pela devolução e atualiza o status.
 */
export function templateDevolucao(dados: DadosTemplateDevolucao): { titulo: string; html: string } {
  const conteudo = `
    <h2>📦 Devolução Registrada!</h2>
    <p>Olá, <strong>${dados.nomeUsuario}</strong>!</p>
    <p>A devolução do seu livro foi registrada com sucesso. Obrigado por contribuir com a comunidade!</p>

    <div class="info-box">
      <p><strong>📖 Livro devolvido:</strong> ${dados.idLivro}</p>
      <p><strong>📅 Data da devolução:</strong> ${formatarData(dados.dataDevolucao)}</p>
    </div>

    <p>Agradecemos por manter nosso acervo circulando. Que tal explorar novos títulos? 🔍</p>
  `;

  return {
    titulo: '📦 Devolução confirmada — Nosso Livro',
    html: layoutBase('Devolução Confirmada', conteudo),
  };
}

// ─── Template 3: Ingresso na Fila de Espera ──────────────────────────────────

export interface DadosTemplateFilaEspera {
  nomeUsuario: string;
  idLivro: string;
  posicao: number;
}

/**
 * Template de confirmação de ingresso na fila de espera.
 * Informa ao usuário sua posição na fila e que será avisado quando o livro estiver disponível.
 */
export function templateFilaEspera(dados: DadosTemplateFilaEspera): { titulo: string; html: string } {
  const conteudo = `
    <h2>🕐 Você entrou na fila de espera!</h2>
    <p>Olá, <strong>${dados.nomeUsuario}</strong>!</p>
    <p>Sua reserva foi registrada. O livro está emprestado no momento, mas você será notificado assim que ele estiver disponível.</p>

    <div class="info-box">
      <p><strong>📖 Livro reservado:</strong> ${dados.idLivro}</p>
      <p><strong>📊 Sua posição na fila:</strong> ${dados.posicao}º lugar</p>
    </div>

    <p>Fique tranquilo! Enviaremos um alerta assim que for a sua vez. 🔔</p>
  `;

  return {
    titulo: '🕐 Reserva registrada — Nosso Livro',
    html: layoutBase('Fila de Espera', conteudo),
  };
}

// ─── Template 4: Livro Liberado para Retirada ────────────────────────────────

export interface DadosTemplateLivroLiberado {
  nomeUsuario: string;
  idLivro: string;
  prazoRetirada: string;
}

/**
 * Template de alerta de livro disponível para retirada.
 * Informa ao usuário que sua reserva foi atribuída e o prazo para retirada (48h).
 */
export function templateLivroLiberado(dados: DadosTemplateLivroLiberado): { titulo: string; html: string } {
  const conteudo = `
    <h2>🎉 Seu livro está disponível!</h2>
    <p>Olá, <strong>${dados.nomeUsuario}</strong>!</p>
    <p>Ótima notícia! O livro que você reservou já está disponível para retirada na biblioteca.</p>

    <div class="info-box">
      <p><strong>📖 Livro:</strong> ${dados.idLivro}</p>
    </div>

    <div class="destaque">
      <p><strong>⏰ Prazo para retirada:</strong></p>
      <p style="font-size: 16px; font-weight: bold;">${formatarData(dados.prazoRetirada)}</p>
      <p>Após este prazo, o livro será liberado para o próximo da fila.</p>
    </div>

    <p>Dirija-se à biblioteca o mais breve possível para garantir seu exemplar! 🏃‍♂️</p>
  `;

  return {
    titulo: '🎉 Livro disponível para retirada — Nosso Livro',
    html: layoutBase('Livro Liberado', conteudo),
  };
}

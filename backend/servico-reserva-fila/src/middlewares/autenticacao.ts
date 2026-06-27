import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

// ─── Tipagem do payload JWT injetado pelo Gateway de API ─────────────────────
// O Gateway valida o token e repassa os dados do usuário no header.
export interface UsuarioAutenticado {
  id: string;
  email: string;
  nome: string;
}

// Estende o tipo Request do Express para incluir o usuário autenticado
declare global {
  namespace Express {
    interface Request {
      usuario?: UsuarioAutenticado;
    }
  }
}

// ─── Middleware de Autenticação JWT ───────────────────────────────────────────

/**
 * Valida o token JWT presente no header 'Authorization: Bearer <token>'.
 * O Gateway de API injeta o header 'x-usuario-id', 'x-usuario-email' etc.
 * após validação. Este middleware suporta ambas as abordagens:
 *
 * 1. Header `x-usuario-dados` (JSON serializado — injetado pelo Gateway)
 * 2. Header `Authorization: Bearer <token>` (validação local — para dev/testes)
 */
export function autenticarJWT(req: Request, res: Response, next: NextFunction): void {
  // ── Abordagem 1: dados injetados pelo Gateway (produção) ────────────────
  const dadosUsuarioHeader = req.headers['x-usuario-dados'] as string | undefined;
  if (dadosUsuarioHeader) {
    try {
      req.usuario = JSON.parse(dadosUsuarioHeader) as UsuarioAutenticado;
      next();
      return;
    } catch {
      res.status(401).json({ erro: 'Header de usuário inválido fornecido pelo gateway.' });
      return;
    }
  }

  // ── Abordagem 2: token JWT direto (desenvolvimento/testes) ─────────────
  const authHeader = req.headers['authorization'];
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ erro: 'Token de autenticação não fornecido.' });
    return;
  }

  const token = authHeader.split(' ')[1];
  const segredo = process.env.JWT_SEGREDO;

  if (!segredo) {
    res.status(500).json({ erro: 'Configuração de autenticação ausente no servidor.' });
    return;
  }

  try {
    const payload = jwt.verify(token, segredo) as UsuarioAutenticado;
    req.usuario = payload;
    next();
  } catch {
    res.status(401).json({ erro: 'Token de autenticação inválido ou expirado.' });
  }
}

import { Request, Response, NextFunction } from 'express';

export interface UsuarioAutenticado {
  id: string;
  email: string;
  nome: string;
}

declare global {
  namespace Express {
    interface Request {
      usuario?: UsuarioAutenticado;
    }
  }
}

export function autenticarJWT(req: Request, res: Response, next: NextFunction): void {
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

  // Em modo de desenvolvimento sem o Gateway, poderíamos validar o token diretamente aqui,
  // mas para manter simples e dependente do Gateway, retornamos 401.
  res.status(401).json({ erro: 'Usuário não autenticado pelo Gateway de API.' });
}

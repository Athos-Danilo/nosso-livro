
import React, { createContext, useState, useEffect, useContext, type ReactNode } from 'react';
import { api } from '../services/api';

// Interface do Usuário autenticado
export interface Usuario {
  id: string;
  nome: string;
  email: string;
  whatsapp: string;
  permissao: 'administrador' | 'membro';
}

// Interface do contexto de autenticação
interface ContextoAuthTipo {
  usuario: Usuario | null;
  autenticado: boolean;
  carregando: boolean;
  login: (email: string, senha: string) => Promise<void>;
  cadastro: (nome: string, email: string, whatsapp: string, senha: string) => Promise<void>;
  logout: () => void;
}

const ContextoAuth = createContext<ContextoAuthTipo>({} as ContextoAuthTipo);

// Função auxiliar para decodificar o token JWT manualmente
const decodificarTokenJWT = (token: string) => {
  try {
    const partes = token.split('.');
    if (partes.length !== 3) return null;
    
    // Corrige codificação base64url para base64 padrão
    const payloadBase64 = partes[1].replace(/-/g, '+').replace(/_/g, '/');
    const payloadJSON = decodeURIComponent(
      window
        .atob(payloadBase64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    
    return JSON.parse(payloadJSON);
  } catch (erro) {
    console.error('Falha ao decodificar payload do token:', erro);
    return null;
  }
};

const formatarNomeCurto = (nomeCompleto: string) => {
  if (!nomeCompleto) return 'Usuário';
  const partes = nomeCompleto.trim().split(/\s+/);
  if (partes.length <= 1) return nomeCompleto;
  return `${partes[0]} ${partes[partes.length - 1]}`;
};

export const ProvedorAuth: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    const carregarSessao = async () => {
      const token = localStorage.getItem('nosso-livro:token');
      
      if (token) {
        const claims = decodificarTokenJWT(token);
        
        // Verifica se o token não expirou (claims.exp está em segundos Unix)
        if (claims && claims.exp * 1000 > Date.now()) {
          const dadosUsuario: Usuario = {
            id: claims.sub,
            nome: formatarNomeCurto(claims.nome), // Caso venha na claims
            email: claims.email || '',
            whatsapp: claims.whatsapp || '',
            permissao: claims.permissao || 'membro',
          };

          try {
            const respostaPerfil = await api.get('/api/usuarios/me', {
              headers: { Authorization: `Bearer ${token}` }
            });
            dadosUsuario.nome = formatarNomeCurto(respostaPerfil.data.nome);
          } catch (erroPerfil) {
            console.warn('Não foi possível obter dados detalhados de perfil no reload.');
          }

          setUsuario(dadosUsuario);
        } else {
          // Token expirado
          localStorage.removeItem('nosso-livro:token');
        }
      }
      setCarregando(false);
    };

    carregarSessao();
  }, []);

  const login = async (email: string, senha: string) => {
    try {
      const resposta = await api.post('/api/autenticacao/login', { email, senha });
      const { token } = resposta.data;
      
      localStorage.setItem('nosso-livro:token', token);
      
      const claims = decodificarTokenJWT(token);
      if (claims) {
        // Se a API não devolveu o nome no token, podemos buscar no perfil (/me) na sequência
        const dadosUsuario: Usuario = {
          id: claims.sub,
          nome: formatarNomeCurto(claims.nome),
          email: claims.email || '',
          whatsapp: claims.whatsapp || '',
          permissao: claims.permissao || 'membro',
        };
        
        // Vamos buscar os dados atualizados do próprio perfil para garantir o Nome correto
        try {
          const respostaPerfil = await api.get('/api/usuarios/me', {
            headers: { Authorization: `Bearer ${token}` }
          });
          dadosUsuario.nome = formatarNomeCurto(respostaPerfil.data.nome);
        } catch (erroPerfil) {
          console.warn('Não foi possível obter dados detalhados de perfil no login, usando claims padrão.');
        }

        setUsuario(dadosUsuario);
      }
    } catch (erro: any) {
      const mensagemErro = erro.response?.data?.erro || 'Falha ao efetuar login. Verifique suas credenciais.';
      throw new Error(mensagemErro);
    }
  };

  const cadastro = async (nome: string, email: string, whatsapp: string, senha: string) => {
    try {
      await api.post('/api/autenticacao/cadastro', { nome, email, whatsapp, senha });
    } catch (erro: any) {
      const mensagemErro = erro.response?.data?.erro || 'Erro ao realizar cadastro.';
      throw new Error(mensagemErro);
    }
  };

  const logout = () => {
    localStorage.removeItem('nosso-livro:token');
    setUsuario(null);
  };

  return (
    <ContextoAuth.Provider value={{ usuario, autenticado: !!usuario, carregando, login, cadastro, logout }}>
      {children}
    </ContextoAuth.Provider>
  );
};

export const useAuth = () => useContext(ContextoAuth);

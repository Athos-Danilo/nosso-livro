import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  BookOpen, 
  Library, 
  History, 
  Bookmark, 
  Sparkles, 
  LogOut, 
  User,
  LayoutDashboard
} from 'lucide-react';
import '../styles/index.css';

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { usuario, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const itensMenu = [
    { nome: 'Painel', caminho: '/painel', icone: LayoutDashboard, permissao: 'todos' },
    { nome: 'Catálogo', caminho: '/catalogo', icone: BookOpen, permissao: 'todos' },
    { nome: 'Reservas', caminho: '/reservas', icone: Bookmark, permissao: 'todos' },
    { nome: 'Empréstimos', caminho: '/emprestimos', icone: History, permissao: 'todos' },
    { nome: 'Bibliotecas', caminho: '/bibliotecas', icone: Library, permissao: 'todos' },
    { nome: 'Recomendações', caminho: '/recomendacoes', icone: Sparkles, permissao: 'todos' },
  ];

  return (
    <div className="layout-container">
      {/* Menu Lateral (Sidebar) */}
      <aside className="card-glass layout-sidebar">
          {/* Logo do App */}
          <div className="layout-logo" style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '40px', paddingLeft: '8px' }}>
            <div style={{
              backgroundColor: 'var(--cor-primaria)',
              padding: '8px',
              borderRadius: 'var(--raio-borda-sm)',
              boxShadow: '0 0 10px rgba(var(--cor-primaria-rgb), 0.3)'
            }}>
              <BookOpen size={24} color="var(--cor-fundo)" />
            </div>
            <span style={{ fontWeight: 700, fontSize: '1.25rem', letterSpacing: '0.5px' }}>
              Nosso<span style={{ color: 'var(--cor-acento)' }}>Livro</span>
            </span>
          </div>

          {/* Links do Menu */}
          <nav className="layout-nav">
            {itensMenu.map((item) => {
              const Ativo = location.pathname === item.caminho;
              const Icone = item.icone;

              return (
                <Link
                  key={item.caminho}
                  to={item.caminho}
                  className="btn-animado"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '12px 16px',
                    borderRadius: 'var(--raio-borda-md)',
                    backgroundColor: Ativo ? 'var(--cor-primaria)' : 'transparent',
                    color: Ativo ? 'var(--cor-fundo)' : 'var(--cor-texto-secundario)',
                    fontWeight: Ativo ? 600 : 500,
                    transition: 'all var(--transicao-rapida)'
                  }}
                >
                  <Icone size={20} />
                  <span>{item.nome}</span>
                </Link>
              );
            })}
          </nav>

        {/* Informações do Usuário no Rodapé */}
        <div className="layout-footer">
          {usuario && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '16px 8px',
              borderTop: '1px solid var(--cor-borda)',
              marginBottom: '16px'
            }}>
              <div style={{
                backgroundColor: 'var(--cor-card-hover)',
                padding: '8px',
                borderRadius: '50%',
                border: '1px solid var(--cor-borda)'
              }}>
                <User size={18} color="var(--cor-primaria)" />
              </div>
              <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                <div style={{ fontSize: '0.9rem', fontWeight: 600 }}>{usuario.nome}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--cor-texto-desativado)', textTransform: 'capitalize' }}>
                  {usuario.permissao}
                </div>
              </div>
            </div>
          )}

          <button
            onClick={handleLogout}
            className="btn-animado"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '12px 16px',
              width: '100%',
              borderRadius: 'var(--raio-borda-md)',
              color: 'var(--cor-erro)',
              fontWeight: 600,
              backgroundColor: 'transparent'
            }}
          >
            <LogOut size={20} />
            <span>Sair</span>
          </button>
        </div>
      </aside>

      {/* Conteúdo Principal */}
      <main className="layout-main">
        {children}
      </main>
    </div>
  );
};

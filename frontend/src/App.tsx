import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ProvedorAuth, useAuth } from './context/AuthContext';

// Importação das páginas
import { Home } from './pages/Home';
import { Login } from './pages/Login';
import { Cadastro } from './pages/Cadastro';
import { Painel } from './pages/Painel';
import { Catalogo } from './pages/Catalogo';
import { Reservas } from './pages/Reservas';
import { Emprestimos } from './pages/Emprestimos';
import { Bibliotecas } from './pages/Bibliotecas';
import { Recomendacoes } from './pages/Recomendacoes';

// Componente Wrapper para proteger rotas privadas
const RotaPrivada: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { autenticado, carregando } = useAuth();

  if (carregando) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        backgroundColor: 'var(--cor-fundo)',
        color: 'var(--cor-texto-secundario)',
        fontSize: '1rem',
        fontWeight: 500
      }}>
        Carregando painel institucional...
      </div>
    );
  }

  if (!autenticado) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

// Componente Wrapper para impedir acesso a rotas públicas por usuários logados
const RotaPublica: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { autenticado, carregando } = useAuth();

  if (carregando) {
    return null;
  }

  if (autenticado) {
    return <Navigate to="/painel" replace />;
  }

  return <>{children}</>;
};

function App() {
  return (
    <BrowserRouter>
      <ProvedorAuth>
        <Routes>
          {/* Rotas Públicas */}
          <Route path="/" element={<Home />} />
          <Route path="/login" element={
            <RotaPublica>
              <Login />
            </RotaPublica>
          } />
          <Route path="/cadastro" element={
            <RotaPublica>
              <Cadastro />
            </RotaPublica>
          } />

          {/* Rotas Privadas */}
          <Route path="/painel" element={
            <RotaPrivada>
              <Painel />
            </RotaPrivada>
          } />
          <Route path="/catalogo" element={
            <RotaPrivada>
              <Catalogo />
            </RotaPrivada>
          } />
          <Route path="/reservas" element={
            <RotaPrivada>
              <Reservas />
            </RotaPrivada>
          } />
          <Route path="/emprestimos" element={
            <RotaPrivada>
              <Emprestimos />
            </RotaPrivada>
          } />
          <Route path="/bibliotecas" element={
            <RotaPrivada>
              <Bibliotecas />
            </RotaPrivada>
          } />
          <Route path="/recomendacoes" element={
            <RotaPrivada>
              <Recomendacoes />
            </RotaPrivada>
          } />

          {/* Redirecionamento Padrão */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </ProvedorAuth>
    </BrowserRouter>
  );
}

export default App;

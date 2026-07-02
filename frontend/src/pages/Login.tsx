import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { BookOpen, Mail, Lock, AlertCircle } from 'lucide-react';
import '../styles/index.css';

export const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState('');
  const [carregando, setCarregando] = useState(false);
  
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmeter = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro('');
    
    if (!email || !senha) {
      setErro('Por favor, preencha todos os campos.');
      return;
    }

    setCarregando(true);
    try {
      await login(email, senha);
      navigate('/');
    } catch (err: any) {
      setErro(err.message || 'Falha ao efetuar login.');
    } finally {
      setCarregando(false);
    }
  };

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      backgroundColor: 'var(--cor-fundo)',
      padding: '24px'
    }}>
      <div className="card-glass" style={{
        width: '100%',
        maxWidth: '420px',
        padding: '40px',
        border: '1px solid var(--cor-borda)'
      }}>
        {/* Cabeçalho do Card */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '32px' }}>
          <div style={{
            backgroundColor: 'var(--cor-primaria)',
            padding: '12px',
            borderRadius: 'var(--raio-borda-md)',
            marginBottom: '16px',
            boxShadow: '0 0 20px rgba(var(--cor-primaria-rgb), 0.3)'
          }}>
            <BookOpen size={32} color="var(--cor-fundo)" />
          </div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 700, textAlign: 'center', marginBottom: '4px' }}>
            Nosso<span style={{ color: 'var(--cor-acento)' }}>Livro</span>
          </h1>
          <p style={{ fontSize: '0.875rem', color: 'var(--cor-texto-secundario)', textAlign: 'center' }}>
            Acesse a biblioteca compartilhada institucional
          </p>
        </div>

        {/* Alerta de Erro */}
        {erro && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            backgroundColor: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid var(--cor-erro)',
            padding: '12px 16px',
            borderRadius: 'var(--raio-borda-md)',
            color: 'var(--cor-erro)',
            fontSize: '0.875rem',
            marginBottom: '24px'
          }}>
            <AlertCircle size={18} style={{ flexShrink: 0 }} />
            <span>{erro}</span>
          </div>
        )}

        {/* Formulário */}
        <form onSubmit={handleSubmeter} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--cor-texto-secundario)' }}>
              Endereço de E-mail
            </label>
            <div className="efeito-glow" style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              backgroundColor: 'var(--cor-fundo)',
              border: '1px solid var(--cor-borda)',
              padding: '12px 16px',
              borderRadius: 'var(--raio-borda-md)'
            }}>
              <Mail size={18} color="var(--cor-texto-desativado)" />
              <input
                id="input-email"
                type="email"
                placeholder="nome@instituicao.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={carregando}
                style={{ width: '100%', height: '100%' }}
              />
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--cor-texto-secundario)' }}>
              Senha
            </label>
            <div className="efeito-glow" style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              backgroundColor: 'var(--cor-fundo)',
              border: '1px solid var(--cor-borda)',
              padding: '12px 16px',
              borderRadius: 'var(--raio-borda-md)'
            }}>
              <Lock size={18} color="var(--cor-texto-desativado)" />
              <input
                id="input-senha"
                type="password"
                placeholder="Sua senha secreta"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                disabled={carregando}
                style={{ width: '100%', height: '100%' }}
              />
            </div>
          </div>

          <button
            id="btn-submeter-login"
            type="submit"
            className="btn-animado"
            disabled={carregando}
            style={{
              backgroundColor: carregando ? 'var(--cor-texto-desativado)' : 'var(--cor-primaria)',
              color: 'var(--cor-fundo)',
              fontWeight: 600,
              padding: '14px',
              borderRadius: 'var(--raio-borda-md)',
              textAlign: 'center',
              marginTop: '8px',
              fontSize: '1rem',
              boxShadow: carregando ? 'none' : '0 4px 10px rgba(var(--cor-primaria-rgb), 0.2)'
            }}
          >
            {carregando ? 'Entrando...' : 'Entrar na Conta'}
          </button>
        </form>

        {/* Cadastro Link */}
        <div style={{ textAlign: 'center', marginTop: '24px', fontSize: '0.875rem', color: 'var(--cor-texto-secundario)' }}>
          Ainda não tem conta?{' '}
          <Link to="/cadastro" style={{ color: 'var(--cor-primaria)', fontWeight: 600 }}>
            Cadastre-se grátis
          </Link>
        </div>
      </div>
    </div>
  );
};

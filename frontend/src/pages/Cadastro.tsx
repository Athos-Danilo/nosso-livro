import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { BookOpen, User, Mail, Lock, Phone, AlertCircle, CheckCircle } from 'lucide-react';
import '../styles/index.css';

export const Cadastro: React.FC = () => {
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState('');
  const [sucesso, setSucesso] = useState(false);
  const [carregando, setCarregando] = useState(false);

  const { cadastro } = useAuth();
  const navigate = useNavigate();

  const handleSubmeter = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro('');
    setSucesso(false);

    if (!nome || !email || !whatsapp || !senha) {
      setErro('Por favor, preencha todos os campos.');
      return;
    }

    setCarregando(true);
    try {
      await cadastro(nome, email, whatsapp, senha);
      setSucesso(true);
      // Redireciona para o login após 2 segundos
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (err: any) {
      setErro(err.message || 'Erro ao efetuar cadastro.');
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
        maxWidth: '460px',
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
            Crie sua Conta
          </h1>
          <p style={{ fontSize: '0.875rem', color: 'var(--cor-texto-secundario)', textAlign: 'center' }}>
            Cadastre-se na rede de compartilhamento Nosso Livro
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

        {/* Mensagem de Sucesso */}
        {sucesso && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            backgroundColor: 'rgba(34, 197, 94, 0.1)',
            border: '1px solid var(--cor-sucesso)',
            padding: '12px 16px',
            borderRadius: 'var(--raio-borda-md)',
            color: 'var(--cor-sucesso)',
            fontSize: '0.875rem',
            marginBottom: '24px'
          }}>
            <CheckCircle size={18} style={{ flexShrink: 0 }} />
            <span>Cadastro realizado com sucesso! Redirecionando...</span>
          </div>
        )}

        {/* Formulário */}
        <form onSubmit={handleSubmeter} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          
          {/* Nome */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--cor-texto-secundario)' }}>
              Nome Completo
            </label>
            <div className="efeito-glow" style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              backgroundColor: 'var(--cor-fundo)',
              border: '1px solid var(--cor-borda)',
              padding: '10px 14px',
              borderRadius: 'var(--raio-borda-md)'
            }}>
              <User size={18} color="var(--cor-texto-desativado)" />
              <input
                id="input-cadastro-nome"
                type="text"
                placeholder="Seu nome completo"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                disabled={carregando || sucesso}
                style={{ width: '100%', height: '100%' }}
              />
            </div>
          </div>

          {/* WhatsApp */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--cor-texto-secundario)' }}>
              WhatsApp (DDDFone)
            </label>
            <div className="efeito-glow" style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              backgroundColor: 'var(--cor-fundo)',
              border: '1px solid var(--cor-borda)',
              padding: '10px 14px',
              borderRadius: 'var(--raio-borda-md)'
            }}>
              <Phone size={18} color="var(--cor-texto-desativado)" />
              <input
                id="input-cadastro-whatsapp"
                type="text"
                placeholder="11999999999"
                value={whatsapp}
                onChange={(e) => setWhatsapp(e.target.value)}
                disabled={carregando || sucesso}
                style={{ width: '100%', height: '100%' }}
              />
            </div>
          </div>

          {/* E-mail */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--cor-texto-secundario)' }}>
              Endereço de E-mail
            </label>
            <div className="efeito-glow" style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              backgroundColor: 'var(--cor-fundo)',
              border: '1px solid var(--cor-borda)',
              padding: '10px 14px',
              borderRadius: 'var(--raio-borda-md)'
            }}>
              <Mail size={18} color="var(--cor-texto-desativado)" />
              <input
                id="input-cadastro-email"
                type="email"
                placeholder="nome@instituicao.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={carregando || sucesso}
                style={{ width: '100%', height: '100%' }}
              />
            </div>
          </div>

          {/* Senha */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--cor-texto-secundario)' }}>
              Senha
            </label>
            <div className="efeito-glow" style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              backgroundColor: 'var(--cor-fundo)',
              border: '1px solid var(--cor-borda)',
              padding: '10px 14px',
              borderRadius: 'var(--raio-borda-md)'
            }}>
              <Lock size={18} color="var(--cor-texto-desativado)" />
              <input
                id="input-cadastro-senha"
                type="password"
                placeholder="Mínimo 6 caracteres"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                disabled={carregando || sucesso}
                style={{ width: '100%', height: '100%' }}
              />
            </div>
          </div>

          <button
            id="btn-submeter-cadastro"
            type="submit"
            className="btn-animado"
            disabled={carregando || sucesso}
            style={{
              backgroundColor: carregando || sucesso ? 'var(--cor-texto-desativado)' : 'var(--cor-primaria)',
              color: 'var(--cor-fundo)',
              fontWeight: 600,
              padding: '12px',
              borderRadius: 'var(--raio-borda-md)',
              textAlign: 'center',
              marginTop: '12px',
              fontSize: '1rem',
              boxShadow: carregando || sucesso ? 'none' : '0 4px 10px rgba(var(--cor-primaria-rgb), 0.2)'
            }}
          >
            {carregando ? 'Cadastrando...' : 'Criar minha Conta'}
          </button>
        </form>

        {/* Login Link */}
        <div style={{ textAlign: 'center', marginTop: '24px', fontSize: '0.875rem', color: 'var(--cor-texto-secundario)' }}>
          Já possui conta?{' '}
          <Link to="/login" style={{ color: 'var(--cor-primaria)', fontWeight: 600 }}>
            Faça login aqui
          </Link>
        </div>
      </div>
    </div>
  );
};

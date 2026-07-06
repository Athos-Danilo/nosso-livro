import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { BookOpen, Mail, Lock, AlertCircle, Eye, EyeOff, Loader2 } from 'lucide-react';
import '../styles/index.css';

export const Login: React.FC = () => {
  const [emailOuWhatsapp, setEmailOuWhatsapp] = useState('');
  const [senha, setSenha] = useState('');
  
  // Estados de erro específicos
  const [erroEmail, setErroEmail] = useState('');
  const [erroSenha, setErroSenha] = useState('');
  const [erroGlobal, setErroGlobal] = useState('');
  
  // Estados para controlar interações
  const [emailTocado, setEmailTocado] = useState(false);
  const [senhaTocado, setSenhaTocado] = useState(false);
  const [tentouSubmeter, setTentouSubmeter] = useState(false);
  
  const [carregando, setCarregando] = useState(false);
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [saindo, setSaindo] = useState(false);
  
  // Ref para limpar o timer de transição no desmonte
  const timerSaidaRef = useRef<any>(null);
  
  const { login } = useAuth();
  const navigate = useNavigate();

  // Limpeza de timers no desmonte
  useEffect(() => {
    return () => {
      if (timerSaidaRef.current) {
        clearTimeout(timerSaidaRef.current);
      }
    };
  }, []);

  // Validador de E-mail ou WhatsApp
  const validarEmailOuWhatsapp = (valor: string) => {
    if (!valor.trim()) {
      return 'Este campo é obrigatório.';
    }
    
    const regexEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const regexApenasNumeros = /^\d+$/;
    
    if (valor.includes('@')) {
      if (!regexEmail.test(valor)) {
        return 'Insira um endereço de e-mail válido.';
      }
    } else if (regexApenasNumeros.test(valor)) {
      if (valor.length < 11) {
        return 'O número de WhatsApp deve conter pelo menos 11 dígitos (com DDD).';
      }
    } else {
      return 'Insira um e-mail válido ou apenas os números do seu WhatsApp.';
    }
    return '';
  };

  // Validador de Senha
  const validarSenha = (valor: string) => {
    if (!valor) {
      return 'A senha é obrigatória.';
    }
    if (valor.length < 6) {
      return 'A senha deve ter pelo menos 6 caracteres.';
    }
    return '';
  };

  // Efeitos para revalidar campos conforme o usuário digita
  useEffect(() => {
    setErroEmail(validarEmailOuWhatsapp(emailOuWhatsapp));
  }, [emailOuWhatsapp]);

  useEffect(() => {
    setErroSenha(validarSenha(senha));
  }, [senha]);

  const handleSubmeter = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Throttle / Bloqueio contra múltiplos envios simultâneos
    if (carregando) return;
    
    setErroGlobal('');
    setTentouSubmeter(true);

    const erroE = validarEmailOuWhatsapp(emailOuWhatsapp);
    const erroS = validarSenha(senha);

    setErroEmail(erroE);
    setErroSenha(erroS);

    if (erroE || erroS) {
      return;
    }

    setCarregando(true);
    try {
      await login(emailOuWhatsapp, senha);
      setSaindo(true);
      
      // Delay sutil de 400ms para reproduzir a animação de saída de tela antes de navegar
      timerSaidaRef.current = setTimeout(() => {
        navigate('/');
      }, 400);
    } catch (err: any) {
      setErroGlobal(err.message || 'Falha ao efetuar login.');
      setCarregando(false);
    }
  };

  // Regras para exibição dos erros na tela
  const exibirErroEmail = erroEmail && (emailTocado || tentouSubmeter);
  const exibirErroSenha = erroSenha && (senhaTocado || tentouSubmeter);
  
  // Controle de ativação do botão
  const botaoDesativado = !emailOuWhatsapp.trim() || !senha || carregando;

  return (
    <div className={`tela-autenticacao-apple ${saindo ? 'animar-saida' : ''}`}>
      
      {/* Card Central de Vidro Fosco macOS Style */}
      <div className={`card-apple-glass ${carregando ? 'pulsar-loading' : ''} animar-entrada`}>
        
        {/* Cabeçalho do Card */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '32px' }}>
          <div style={{
            backgroundColor: '#0071e3',
            padding: '12px',
            borderRadius: '16px',
            marginBottom: '16px',
            boxShadow: '0 8px 24px rgba(0, 113, 227, 0.25)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <BookOpen size={28} color="#ffffff" />
          </div>
          
          <h1 style={{ 
            fontSize: '1.85rem', 
            fontWeight: 700, 
            textAlign: 'center', 
            color: '#1d1d1f', 
            fontFamily: 'var(--fonte-principal)', 
            letterSpacing: '-0.8px',
            marginBottom: '6px'
          }}>
            NossoLivro
          </h1>
          
          <p style={{ fontSize: '0.85rem', color: '#86868b', textAlign: 'center', fontWeight: 500, lineHeight: 1.3 }}>
            Acesse a biblioteca compartilhada institucional
          </p>
        </div>

        {/* Alerta de Erro Global */}
        {erroGlobal && (
          <div 
            key={erroGlobal}
            className="animar-erro animar-tremor" 
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              backgroundColor: 'rgba(239, 68, 68, 0.08)',
              border: '1px solid rgba(239, 68, 68, 0.2)',
              padding: '12px 16px',
              borderRadius: '12px',
              color: '#d12424',
              fontSize: '0.85rem',
              marginBottom: '24px',
              fontWeight: 500
            }}
          >
            <AlertCircle size={18} style={{ flexShrink: 0 }} />
            <span>{erroGlobal}</span>
          </div>
        )}

        {/* Formulário */}
        <form onSubmit={handleSubmeter} style={{ display: 'flex', flexDirection: 'column', gap: '22px' }} noValidate>
          
          {/* Campo E-mail / WhatsApp */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label 
              htmlFor="input-email-whatsapp"
              style={{ fontSize: '0.8rem', fontWeight: 600, color: '#1d1d1f', paddingLeft: '4px' }}
            >
              E-mail ou WhatsApp
            </label>
            <div className="input-apple" style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              border: exibirErroEmail ? '1px solid #d12424' : '1px solid rgba(0, 0, 0, 0.05)',
              padding: '14px 16px'
            }}>
              <Mail size={18} color={exibirErroEmail ? '#d12424' : '#86868b'} />
              <input
                id="input-email-whatsapp"
                type="text"
                className="input-apple-inner"
                placeholder="nome@email.com ou 11999998888"
                value={emailOuWhatsapp}
                onChange={(e) => setEmailOuWhatsapp(e.target.value)}
                onBlur={() => setEmailTocado(true)}
                disabled={carregando}
                aria-invalid={!!exibirErroEmail}
                aria-describedby={exibirErroEmail ? 'erro-email-desc' : undefined}
                required
              />
            </div>
            {exibirErroEmail && (
              <span 
                id="erro-email-desc"
                className="animar-erro"
                style={{
                  color: '#d12424',
                  fontSize: '0.75rem',
                  fontWeight: 500,
                  marginTop: '2px',
                  paddingLeft: '4px'
                }}
              >
                {erroEmail}
              </span>
            )}
          </div>

          {/* Campo Senha */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label 
              htmlFor="input-senha"
              style={{ fontSize: '0.8rem', fontWeight: 600, color: '#1d1d1f', paddingLeft: '4px' }}
            >
              Senha
            </label>
            <div className="input-apple" style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              border: exibirErroSenha ? '1px solid #d12424' : '1px solid rgba(0, 0, 0, 0.05)',
              padding: '14px 16px'
            }}>
              <Lock size={18} color={exibirErroSenha ? '#d12424' : '#86868b'} />
              <input
                id="input-senha"
                type={mostrarSenha ? 'text' : 'password'}
                className="input-apple-inner"
                placeholder="Sua senha"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                onBlur={() => setSenhaTocado(true)}
                disabled={carregando}
                aria-invalid={!!exibirErroSenha}
                aria-describedby={exibirErroSenha ? 'erro-senha-desc' : undefined}
                required
              />
              <button
                type="button"
                onClick={() => setMostrarSenha(!mostrarSenha)}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: '#86868b',
                  padding: 0,
                  display: 'flex',
                  alignItems: 'center'
                }}
                className="btn-revelar-senha"
                aria-label={mostrarSenha ? 'Ocultar senha' : 'Revelar senha'}
              >
                {mostrarSenha ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {exibirErroSenha && (
              <span 
                id="erro-senha-desc"
                className="animar-erro"
                style={{
                  color: '#d12424',
                  fontSize: '0.75rem',
                  fontWeight: 500,
                  marginTop: '2px',
                  paddingLeft: '4px'
                }}
              >
                {erroSenha}
              </span>
            )}
          </div>

          {/* Botão de Entrar Apple Style */}
          <button
            id="btn-submeter-login"
            type="submit"
            className="btn-apple"
            disabled={botaoDesativado}
            style={{
              opacity: botaoDesativado ? 0.5 : 1,
              padding: '16px',
              marginTop: '10px',
              cursor: botaoDesativado ? 'not-allowed' : 'pointer'
            }}
          >
            {carregando ? (
              <>
                <Loader2 size={18} className="girar-icone" />
                <span>Conectando...</span>
              </>
            ) : (
              'Entrar'
            )}
          </button>
        </form>

        {/* Cadastro Link */}
        <div style={{ textAlign: 'center', marginTop: '28px', fontSize: '0.85rem', color: '#86868b', fontWeight: 500 }}>
          Ainda não tem conta?{' '}
          <Link to="/cadastro" style={{ color: '#0071e3', fontWeight: 600, textDecoration: 'none', transition: 'opacity var(--transicao-rapida)' }} onMouseEnter={(e) => e.currentTarget.style.opacity = '0.85'} onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}>
            Cadastre-se grátis
          </Link>
        </div>
      </div>
    </div>
  );
};

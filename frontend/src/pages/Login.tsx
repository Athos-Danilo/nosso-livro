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

  // Estados para controlar foco nos campos (Floating Labels)
  const [emailFocado, setEmailFocado] = useState(false);
  const [senhaFocado, setSenhaFocado] = useState(false);

  // Estados e Efeito do Typewriter para o Placeholder Dinâmico
  const [placeholderText, setPlaceholderText] = useState('');
  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  const [charIndex, setCharIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);

  // Efeito Parallax
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  const handleMouseMove = (e: React.MouseEvent) => {
    const { clientX, clientY } = e;
    // Fator de sensibilidade (sensibilidade baixa para profundidade sutil)
    const x = (clientX - window.innerWidth / 2) / 38;
    const y = (clientY - window.innerHeight / 2) / 38;
    setMousePos({ x, y });
  };

  const placeholders = useRef([
    'nome@email.com',
    '11999998888 (WhatsApp)',
    'leitor@nossolivro.com.br'
  ]);

  // Partículas douradas (dust motes) com propriedades visuais fixas
  const particulas = useRef(Array.from({ length: 15 }, (_, i) => ({
    id: i,
    top: `${10 + Math.random() * 80}%`,
    left: `${10 + Math.random() * 80}%`,
    delay: `${Math.random() * 6}s`,
    duration: `${8 + Math.random() * 8}s`,
    size: `${2 + Math.random() * 3}px`
  })));
  
  // Ref para limpar o timer de transição no desmonte
  const timerSaidaRef = useRef<any>(null);
  
  const { login } = useAuth();
  const navigate = useNavigate();

  // Typewriter Effect logic
  useEffect(() => {
    let timer: any;
    const currentFullText = placeholders.current[placeholderIndex];
    
    const tick = () => {
      if (!isDeleting) {
        setPlaceholderText(currentFullText.substring(0, charIndex + 1));
        setCharIndex(prev => prev + 1);
        
        if (charIndex >= currentFullText.length - 1) {
          timer = setTimeout(() => setIsDeleting(true), 2500);
          return;
        }
      } else {
        setPlaceholderText(currentFullText.substring(0, charIndex - 1));
        setCharIndex(prev => prev - 1);
        
        if (charIndex <= 1) {
          setIsDeleting(false);
          setPlaceholderIndex(prev => (prev + 1) % placeholders.current.length);
          setCharIndex(0);
          return;
        }
      }
      
      const speed = isDeleting ? 25 : 55;
      timer = setTimeout(tick, speed);
    };

    timer = setTimeout(tick, 100);
    return () => clearTimeout(timer);
  }, [charIndex, isDeleting, placeholderIndex]);

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

  // Efeitos para revalidar campos e ocultar erros anteriores conforme o usuário digita/edita
  useEffect(() => {
    setErroEmail(validarEmailOuWhatsapp(emailOuWhatsapp));
    setTentouSubmeter(false);
    setErroGlobal('');
  }, [emailOuWhatsapp]);

  useEffect(() => {
    setErroSenha(validarSenha(senha));
    setTentouSubmeter(false);
    setErroGlobal('');
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

  // Regras para exibição dos erros na tela (Apenas ao tentar submeter/clicar no botão)
  const exibirErroEmail = erroEmail && tentouSubmeter;
  const exibirErroSenha = erroSenha && tentouSubmeter;
  
  // Controle de ativação do botão (liberar apenas com e-mail preenchido e senha >= 6 caracteres)
  const botaoDesativado = !emailOuWhatsapp.trim() || senha.length < 6 || carregando;

  return (
    <div 
      className={`tela-santuario-literario ${saindo ? 'animar-saida' : ''}`}
      onMouseMove={handleMouseMove}
    >
      
      {/* Partículas douradas (dust motes) com animações CSS */}
      <div 
        style={{ 
          position: 'absolute', 
          top: 0, 
          left: 0, 
          width: '100%', 
          height: '100%', 
          pointerEvents: 'none', 
          zIndex: 1,
          transform: `translate3d(${-mousePos.x * 0.4}px, ${-mousePos.y * 0.4}px, 0)`,
          transition: 'transform 0.25s cubic-bezier(0.25, 0.46, 0.45, 0.94)'
        }}
      >
        {particulas.current.map((part) => (
          <div
            key={part.id}
            className="particula-poeira"
            style={{
              top: part.top,
              left: part.left,
              width: part.size,
              height: part.size,
              animationDelay: part.delay,
              animationDuration: part.duration
            }}
          />
        ))}
      </div>

      {/* Card Ficha de Catálogo de Biblioteca Vintage */}
      <div 
        className={`card-santuario ${carregando ? 'pulsar-loading' : ''} animar-entrada`}
        style={{
          transform: `translate3d(${mousePos.x}px, ${mousePos.y}px, 0)`,
          transition: carregando ? 'none' : 'transform 0.15s cubic-bezier(0.25, 0.46, 0.45, 0.94)'
        }}
      >
        
        {/* Moldura dupla de papel envelhecido */}
        <div className="card-santuario-moldura" />

        {/* Cabeçalho do Card */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '32px', position: 'relative', zIndex: 2 }}>
          <h1 className="titulo-santuario">
            Nosso Livro
          </h1>
          <p className="subtitulo-santuario">
            Acesse a biblioteca compartilhada institucional
          </p>
        </div>

        {/* Alerta de Erro Global */}
        {erroGlobal && (
          <div style={{ display: 'flex', justifyContent: 'center', marginTop: '24px', marginBottom: '40px', position: 'relative', zIndex: 2 }}>
            <div 
              key={erroGlobal}
              className="carimbo-erro animar-tremor" 
              style={{ margin: 0 }}
            >
              <AlertCircle size={18} style={{ flexShrink: 0 }} />
              <span>BLOQUEADO: {erroGlobal}</span>
            </div>
          </div>
        )}

        {/* Formulário */}
        <form onSubmit={handleSubmeter} style={{ display: 'flex', flexDirection: 'column', gap: '24px', position: 'relative', zIndex: 2 }} noValidate>
          
          {/* Campo E-mail / WhatsApp */}
          <div className={`campo-wrapper ${emailFocado || emailOuWhatsapp ? 'focado preenchido' : ''}`}>
            <label 
              htmlFor="input-email-whatsapp"
              className="label-santuario-flutuante"
            >
              E-mail ou WhatsApp
            </label>
            <div className="input-santuario" style={{
              border: exibirErroEmail ? '1px solid var(--cor-vermelho-ferrugem)' : undefined,
              boxShadow: exibirErroEmail ? '0 0 0 3px rgba(163, 40, 20, 0.15)' : undefined
            }}>
              <Mail size={18} color={exibirErroEmail ? 'var(--cor-vermelho-ferrugem)' : undefined} />
              <input
                id="input-email-whatsapp"
                type="text"
                className="input-santuario-inner"
                placeholder={emailFocado ? placeholderText : ''}
                value={emailOuWhatsapp}
                onChange={(e) => setEmailOuWhatsapp(e.target.value)}
                onFocus={() => setEmailFocado(true)}
                onBlur={() => {
                  setEmailFocado(false);
                  setEmailTocado(true);
                }}
                disabled={carregando}
                aria-invalid={!!exibirErroEmail}
                aria-describedby={exibirErroEmail ? 'erro-email-desc' : undefined}
                required
              />
            </div>
            {exibirErroEmail && (
              <span 
                id="erro-email-desc"
                className="carimbo-erro"
              >
                INVÁLIDO: {erroEmail}
              </span>
            )}
          </div>

          {/* Campo Senha */}
          <div className={`campo-wrapper ${senhaFocado || senha ? 'focado preenchido' : ''}`}>
            <label 
              htmlFor="input-senha"
              className="label-santuario-flutuante"
            >
              Senha
            </label>
            <div className="input-santuario" style={{
              border: exibirErroSenha ? '1px solid var(--cor-vermelho-ferrugem)' : undefined,
              boxShadow: exibirErroSenha ? '0 0 0 3px rgba(163, 40, 20, 0.15)' : undefined
            }}>
              <Lock size={18} color={exibirErroSenha ? 'var(--cor-vermelho-ferrugem)' : undefined} />
              <input
                id="input-senha"
                type={mostrarSenha ? 'text' : 'password'}
                className="input-santuario-inner"
                placeholder=""
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                onFocus={() => setSenhaFocado(true)}
                onBlur={() => {
                  setSenhaFocado(false);
                  setSenhaTocado(true);
                }}
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
                  color: '#8c897f',
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
                className="carimbo-erro"
              >
                ATRASADO: {erroSenha}
              </span>
            )}
          </div>

          {/* Botão de Entrar Santuário Style */}
          <button
            id="btn-submeter-login"
            type="submit"
            className="btn-santuario"
            disabled={botaoDesativado}
            style={{
              opacity: botaoDesativado ? 0.6 : 1,
              padding: '16px',
              marginTop: '12px',
              cursor: botaoDesativado ? 'not-allowed' : 'pointer'
            }}
          >
            {carregando ? (
              <>
                <div className="livro-carregando" />
                <span style={{ color: 'var(--cor-ouro-envelhecido)' }}>Folheando registros...</span>
              </>
            ) : (
              'Entrar na Biblioteca'
            )}
          </button>
        </form>

        {/* Cadastro Link */}
        <div style={{ textAlign: 'center', marginTop: '28px', fontSize: '0.85rem', color: '#5c5950', fontWeight: 600, position: 'relative', zIndex: 2 }}>
          Ainda não tem conta?{' '}
          <Link to="/cadastro" className="btn-cadastro-santuario">
            Cadastre-se
          </Link>
        </div>
      </div>
    </div>
  );
};

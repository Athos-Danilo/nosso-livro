import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { User, Mail, Lock, Phone, AlertCircle, CheckCircle, Eye, EyeOff } from 'lucide-react';
import '../styles/index.css';

export const Cadastro: React.FC = () => {
  const [nome, setNome] = useState('');
  const [emailOuWhatsapp, setEmailOuWhatsapp] = useState('');
  const [senha, setSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  
  // Estados de erro específicos (validação sob demanda)
  const [erroNome, setErroNome] = useState('');
  const [erroEmail, setErroEmail] = useState('');
  const [erroSenha, setErroSenha] = useState('');
  const [erroConfirmarSenha, setErroConfirmarSenha] = useState('');
  const [erroGlobal, setErroGlobal] = useState('');

  const [sucesso, setSucesso] = useState(false);
  const [carregando, setCarregando] = useState(false);
  const [tentouSubmeter, setTentouSubmeter] = useState(false);
  
  // Estados de foco e toque para animação dos inputs
  const [nomeFocado, setNomeFocado] = useState(false);
  const [emailFocado, setEmailFocado] = useState(false);
  const [senhaFocado, setSenhaFocado] = useState(false);
  const [confirmarSenhaFocado, setConfirmarSenhaFocado] = useState(false);
  
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [mostrarConfirmarSenha, setMostrarConfirmarSenha] = useState(false);
  const [forcaSenha, setForcaSenha] = useState<'fraca' | 'media' | 'forte' | ''>('');

  const { cadastro } = useAuth();
  const navigate = useNavigate();
  const timerSaidaRef = useRef<any>(null);

  // Efeito Parallax suave no mouse
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const handleMouseMove = (e: React.MouseEvent) => {
    const { clientX, clientY } = e;
    const largura = window.innerWidth;
    const altura = window.innerHeight;
    
    // Parallax suave deslocando até 12px
    const x = (clientX - largura / 2) / (largura / 2) * 12;
    const y = (clientY - altura / 2) / (altura / 2) * 12;
    setMousePos({ x, y });
  };

  // Gerador de Partículas de Poeira de Luz (Dust Motes)
  const particulas = useRef(
    Array.from({ length: 12 }, (_, i) => ({
      id: i,
      top: `${Math.random() * 100}%`,
      left: `${Math.random() * 100}%`,
      size: `${Math.random() * 3 + 2}px`,
      delay: `${Math.random() * 5}s`,
      duration: `${Math.random() * 15 + 10}s`
    }))
  );

  // Efeito typewriter de placeholder interativo flutuante para E-mail ou WhatsApp
  const [placeholderText, setPlaceholderText] = useState('');
  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  const [charIndex, setCharIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);
  
  const placeholders = useRef([
    'exemplo@biblioteca.com',
    '(11) 99999-8888',
    'leitor.institucional@nosso.org',
    '(21) 98888-7777'
  ]);

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
      timer = setTimeout(tick, isDeleting ? 40 : 80);
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

  // Máscara Dinâmica de Telefone no campo WhatsApp
  const formatarWhatsapp = (valor: string) => {
    const apenasNumeros = valor.replace(/\D/g, '');
    
    if (apenasNumeros.length === 0) {
      return valor;
    }
    
    if (apenasNumeros.length <= 2) {
      return `(${apenasNumeros}`;
    } else if (apenasNumeros.length <= 6) {
      return `(${apenasNumeros.substring(0, 2)}) ${apenasNumeros.substring(2)}`;
    } else if (apenasNumeros.length <= 10) {
      return `(${apenasNumeros.substring(0, 2)}) ${apenasNumeros.substring(2, 6)}-${apenasNumeros.substring(6)}`;
    } else {
      return `(${apenasNumeros.substring(0, 2)}) ${apenasNumeros.substring(2, 7)}-${apenasNumeros.substring(7, 11)}`;
    }
  };

  const handleEmailWhatsappChange = (val: string) => {
    const regexLetras = /[a-zA-Z]/;
    if (regexLetras.test(val)) {
      setEmailOuWhatsapp(val);
    } else {
      setEmailOuWhatsapp(formatarWhatsapp(val));
    }
  };

  // Medidor Temático de Força da Senha
  const calcularForcaSenha = (valor: string) => {
    if (!valor) return '';
    if (valor.length < 6) return 'fraca';
    
    const temLetras = /[a-zA-Z]/.test(valor);
    const temNumeros = /[0-9]/.test(valor);
    const temEspeciais = /[^a-zA-Z0-9]/.test(valor);
    
    if (valor.length >= 8 && temLetras && temNumeros && (temEspeciais || valor.length >= 10)) {
      return 'forte';
    }
    if (temLetras && temNumeros) {
      return 'media';
    }
    return 'fraca';
  };

  useEffect(() => {
    setForcaSenha(calcularForcaSenha(senha));
  }, [senha]);

  // Validador de Nome Completo
  const validarNome = (valor: string) => {
    if (!valor.trim()) {
      return 'Este campo é obrigatório.';
    }
    if (valor.trim().split(' ').length < 2) {
      return 'Insira o seu nome completo (nome e sobrenome).';
    }
    return '';
  };

  // Validador de E-mail ou WhatsApp
  const validarEmailOuWhatsapp = (valor: string) => {
    if (!valor.trim()) {
      return 'Este campo é obrigatório.';
    }
    
    const regexEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const regexApenasNumeros = /^\d+$/;
    const apenasNum = valor.replace(/\D/g, '');
    
    if (valor.includes('@')) {
      if (!regexEmail.test(valor)) {
        return 'Insira um endereço de e-mail válido.';
      }
    } else if (regexApenasNumeros.test(apenasNum) && apenasNum.length > 0) {
      if (apenasNum.length < 11) {
        return 'O número de WhatsApp deve conter pelo menos 11 dígitos (com DDD).';
      }
    } else {
      return 'Insira um e-mail válido ou os números do seu WhatsApp.';
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

  // Validador de Confirmação de Senha
  const validarConfirmarSenha = (valor: string, senhaOriginal: string) => {
    if (!valor) {
      return 'A confirmação da senha é obrigatória.';
    }
    if (valor !== senhaOriginal) {
      return 'As senhas inseridas não coincidem.';
    }
    return '';
  };

  // Efeitos de revalidação e ocultação de erros na digitação
  useEffect(() => {
    setErroNome(validarNome(nome));
    setTentouSubmeter(false);
    setErroGlobal('');
  }, [nome]);

  useEffect(() => {
    setErroEmail(validarEmailOuWhatsapp(emailOuWhatsapp));
    setTentouSubmeter(false);
    setErroGlobal('');
  }, [emailOuWhatsapp]);

  useEffect(() => {
    setErroSenha(validarSenha(senha));
    if (confirmarSenha) {
      setErroConfirmarSenha(validarConfirmarSenha(confirmarSenha, senha));
    }
    setTentouSubmeter(false);
    setErroGlobal('');
  }, [senha]);

  useEffect(() => {
    setErroConfirmarSenha(validarConfirmarSenha(confirmarSenha, senha));
    setTentouSubmeter(false);
    setErroGlobal('');
  }, [confirmarSenha]);

  // Submissão do Formulário de Registro
  const handleSubmeter = async (e: React.FormEvent) => {
    e.preventDefault();
    if (carregando || sucesso) return;

    setErroGlobal('');
    setTentouSubmeter(true);

    const erroN = validarNome(nome);
    const erroE = validarEmailOuWhatsapp(emailOuWhatsapp);
    const erroS = validarSenha(senha);
    const erroC = validarConfirmarSenha(confirmarSenha, senha);

    setErroNome(erroN);
    setErroEmail(erroE);
    setErroSenha(erroS);
    setErroConfirmarSenha(erroC);

    if (erroN || erroE || erroS || erroC) {
      return;
    }

    setCarregando(true);
    
    // Identifica se digitou e-mail ou whatsapp
    const apenasNum = emailOuWhatsapp.replace(/\D/g, '');
    const isWhatsapp = !emailOuWhatsapp.includes('@') && apenasNum.length >= 11;
    
    const emailFinal = isWhatsapp ? '' : emailOuWhatsapp;
    const whatsappFinal = isWhatsapp ? apenasNum : '';

    try {
      await cadastro(nome, emailFinal, whatsappFinal, senha);
      setSucesso(true);
      
      // Limpeza de cache de inputs pós sucesso
      setNome('');
      setEmailOuWhatsapp('');
      setSenha('');
      setConfirmarSenha('');

      timerSaidaRef.current = setTimeout(() => {
        navigate('/login');
      }, 2500);
    } catch (err: any) {
      setErroGlobal(err.message || 'Erro ao efetuar registro de leitor.');
    } finally {
      setCarregando(false);
    }
  };

  const botaoDesativado = !nome.trim() || !emailOuWhatsapp.trim() || senha.length < 6 || !confirmarSenha || carregando;

  return (
    <div 
      className="tela-santuario-literario"
      onMouseMove={handleMouseMove}
    >
      
      {/* Partículas douradas de poeira de luz */}
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

      {/* Card Ficha de Registro do Leitor */}
      <div 
        className={`card-santuario ${carregando ? 'pulsar-loading' : ''} animar-entrada`}
        style={{
          transform: `translate3d(${mousePos.x}px, ${mousePos.y}px, 0)`,
          transition: carregando ? 'none' : 'transform 0.15s cubic-bezier(0.25, 0.46, 0.45, 0.94)'
        }}
      >
        
        {/* Moldura dupla em relevo */}
        <div className="card-santuario-moldura" />

        {sucesso ? (
          /* Carimbo "APROVADO" de Sucesso do Bibliotecário */
          <div style={{ 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center', 
            justifyContent: 'center', 
            minHeight: '300px',
            position: 'relative',
            zIndex: 2,
            animation: 'carimbada 0.35s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards'
          }}>
            <div 
              style={{
                border: '4px double #2e7d32',
                padding: '14px 24px',
                borderRadius: '4px',
                color: '#2e7d32',
                fontFamily: "'Boogaloo', 'Cinzel', monospace",
                fontWeight: 700,
                fontSize: '1.65rem',
                textTransform: 'uppercase',
                letterSpacing: '1.5px',
                transform: 'rotate(-5deg)',
                boxShadow: '0 8px 24px rgba(46, 125, 50, 0.1)',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                backgroundImage: 'linear-gradient(rgba(255,255,255,0.03) 50%, rgba(0,0,0,0.03) 50%), linear-gradient(90deg, rgba(255,255,255,0.03) 50%, rgba(0,0,0,0.03) 50%)',
                backgroundSize: '3px 3px'
              }}
            >
              <CheckCircle size={26} />
              <span>APROVADO: BEM-VINDO LEITOR</span>
            </div>
            <p style={{
              marginTop: '32px',
              fontSize: '0.85rem',
              color: '#5c5950',
              fontWeight: 600,
              fontFamily: 'var(--fonte-principal)',
              textAlign: 'center',
              lineHeight: 1.5
            }}>
              Seu registro de acesso foi arquivado com sucesso.<br />
              Redirecionando para a biblioteca...
            </p>
          </div>
        ) : (
          /* Formulário de Registro Ativo */
          <>
            {/* Cabeçalho da Ficha */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '32px', position: 'relative', zIndex: 2 }}>
              <h1 className="titulo-santuario" style={{ fontSize: '2.5rem' }}>
                Ficha de Leitor
              </h1>
              <p className="subtitulo-santuario">
                Registre o seu acesso no catálogo institucional
              </p>
            </div>

            {/* Erro Global da API */}
            {erroGlobal && (
              <div style={{ display: 'flex', justifyContent: 'center', marginTop: '24px', marginBottom: '40px', position: 'relative', zIndex: 2 }}>
                <div className="carimbo-erro animar-tremor" style={{ margin: 0 }}>
                  <AlertCircle size={18} style={{ flexShrink: 0 }} />
                  <span>DUPLICADO: {erroGlobal}</span>
                </div>
              </div>
            )}

            {/* Formulário */}
            <form onSubmit={handleSubmeter} style={{ display: 'flex', flexDirection: 'column', gap: '24px', position: 'relative', zIndex: 2 }} noValidate>
              
              {/* Campo Nome Completo */}
              <div className={`campo-wrapper ${nomeFocado || nome ? 'focado preenchido' : ''}`}>
                <label htmlFor="input-cadastro-nome" className="label-santuario-flutuante">
                  Nome Completo
                </label>
                <div className="input-santuario" style={{
                  border: (erroNome && tentouSubmeter) ? '1px solid var(--cor-vermelho-ferrugem)' : undefined,
                  boxShadow: (erroNome && tentouSubmeter) ? '0 0 0 3px rgba(163, 40, 20, 0.15)' : undefined
                }}>
                  <User size={18} color={(erroNome && tentouSubmeter) ? 'var(--cor-vermelho-ferrugem)' : undefined} />
                  <input
                    id="input-cadastro-nome"
                    type="text"
                    className="input-santuario-inner"
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                    onFocus={() => setNomeFocado(true)}
                    onBlur={() => setNomeFocado(false)}
                    disabled={carregando}
                    required
                  />
                </div>
                {erroNome && tentouSubmeter && (
                  <span className="carimbo-erro">
                    DIVERGENTE: {erroNome}
                  </span>
                )}
              </div>

              {/* Campo E-mail ou WhatsApp */}
              <div className={`campo-wrapper ${emailFocado || emailOuWhatsapp ? 'focado preenchido' : ''}`}>
                <label htmlFor="input-cadastro-email-whatsapp" className="label-santuario-flutuante">
                  E-mail ou WhatsApp
                </label>
                <div className="input-santuario" style={{
                  border: (erroEmail && tentouSubmeter) ? '1px solid var(--cor-vermelho-ferrugem)' : undefined,
                  boxShadow: (erroEmail && tentouSubmeter) ? '0 0 0 3px rgba(163, 40, 20, 0.15)' : undefined
                }}>
                  {emailOuWhatsapp.includes('@') || !emailOuWhatsapp.replace(/\D/g, '') ? (
                    <Mail size={18} color={(erroEmail && tentouSubmeter) ? 'var(--cor-vermelho-ferrugem)' : undefined} />
                  ) : (
                    <Phone size={18} color={(erroEmail && tentouSubmeter) ? 'var(--cor-vermelho-ferrugem)' : undefined} />
                  )}
                  <input
                    id="input-cadastro-email-whatsapp"
                    type="text"
                    className="input-santuario-inner"
                    placeholder={emailFocado ? placeholderText : ''}
                    value={emailOuWhatsapp}
                    onChange={(e) => handleEmailWhatsappChange(e.target.value)}
                    onFocus={() => setEmailFocado(true)}
                    onBlur={() => setEmailFocado(false)}
                    disabled={carregando}
                    required
                  />
                </div>
                {erroEmail && tentouSubmeter && (
                  <span className="carimbo-erro">
                    INVÁLIDO: {erroEmail}
                  </span>
                )}
              </div>

              {/* Campo Senha */}
              <div className={`campo-wrapper ${senhaFocado || senha ? 'focado preenchido' : ''}`}>
                <label htmlFor="input-cadastro-senha" className="label-santuario-flutuante">
                  Senha
                </label>
                <div className="input-santuario" style={{
                  border: (erroSenha && tentouSubmeter) ? '1px solid var(--cor-vermelho-ferrugem)' : undefined,
                  boxShadow: (erroSenha && tentouSubmeter) ? '0 0 0 3px rgba(163, 40, 20, 0.15)' : undefined
                }}>
                  <Lock size={18} color={(erroSenha && tentouSubmeter) ? 'var(--cor-vermelho-ferrugem)' : undefined} />
                  <input
                    id="input-cadastro-senha"
                    type={mostrarSenha ? 'text' : 'password'}
                    className="input-santuario-inner"
                    value={senha}
                    onChange={(e) => setSenha(e.target.value)}
                    onFocus={() => setSenhaFocado(true)}
                    onBlur={() => setSenhaFocado(false)}
                    disabled={carregando}
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
                  >
                    {mostrarSenha ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                
                {/* Medidor de Força da Senha */}
                {senha && (
                  <div className="senha-forca-container" style={{ marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <div style={{ display: 'flex', gap: '4px', height: '4px', width: '100%', borderRadius: '2px', overflow: 'hidden', backgroundColor: 'rgba(0,0,0,0.06)' }}>
                      <div style={{
                        height: '100%',
                        width: forcaSenha === 'fraca' ? '33.3%' : forcaSenha === 'media' ? '66.6%' : '100%',
                        backgroundColor: forcaSenha === 'fraca' ? 'var(--cor-vermelho-ferrugem)' : forcaSenha === 'media' ? '#d4af37' : '#2e7d32',
                        transition: 'all 0.3s ease'
                      }} />
                    </div>
                    <span style={{
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      color: forcaSenha === 'fraca' ? 'var(--cor-vermelho-ferrugem)' : forcaSenha === 'media' ? '#b59424' : '#2e7d32',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px'
                    }}>
                      Senha {forcaSenha === 'fraca' ? 'Fraca' : forcaSenha === 'media' ? 'Média' : 'Forte'}
                    </span>
                  </div>
                )}

                {erroSenha && tentouSubmeter && (
                  <span className="carimbo-erro">
                    INVÁLIDO: {erroSenha}
                  </span>
                )}
              </div>

              {/* Campo Confirmar Senha */}
              <div className={`campo-wrapper ${confirmarSenhaFocado || confirmarSenha ? 'focado preenchido' : ''}`}>
                <label htmlFor="input-cadastro-confirmar-senha" className="label-santuario-flutuante">
                  Confirmar Senha
                </label>
                <div className="input-santuario" style={{
                  border: (erroConfirmarSenha && tentouSubmeter) ? '1px solid var(--cor-vermelho-ferrugem)' : undefined,
                  boxShadow: (erroConfirmarSenha && tentouSubmeter) ? '0 0 0 3px rgba(163, 40, 20, 0.15)' : undefined
                }}>
                  <Lock size={18} color={(erroConfirmarSenha && tentouSubmeter) ? 'var(--cor-vermelho-ferrugem)' : undefined} />
                  <input
                    id="input-cadastro-confirmar-senha"
                    type={mostrarConfirmarSenha ? 'text' : 'password'}
                    className="input-santuario-inner"
                    value={confirmarSenha}
                    onChange={(e) => setConfirmarSenha(e.target.value)}
                    onFocus={() => setConfirmarSenhaFocado(true)}
                    onBlur={() => setConfirmarSenhaFocado(false)}
                    disabled={carregando}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setMostrarConfirmarSenha(!mostrarConfirmarSenha)}
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
                  >
                    {mostrarConfirmarSenha ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {erroConfirmarSenha && tentouSubmeter && (
                  <span className="carimbo-erro">
                    DIVERGENTE: {erroConfirmarSenha}
                  </span>
                )}
              </div>

              {/* Botão Submeter Ficha */}
              <button
                id="btn-submeter-cadastro"
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
                  'Registrar na Ficha de Leitores'
                )}
              </button>
            </form>

            {/* Login Link no Rodapé */}
            <div style={{ textAlign: 'center', marginTop: '28px', fontSize: '0.85rem', color: '#5c5950', fontWeight: 600, position: 'relative', zIndex: 2 }}>
              Já possui conta?{' '}
              <Link to="/login" className="btn-cadastro-santuario" style={{ marginLeft: '4px' }}>
                Entrar
              </Link>
            </div>
          </>
        )}

      </div>
    </div>
  );
};

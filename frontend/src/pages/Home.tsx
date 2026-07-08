import React from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, Search, Clock, Users, ArrowRight, Library, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import '../styles/index.css';
import '../styles/home.css';

export const Home: React.FC = () => {
  const { autenticado } = useAuth();

  return (
    <div className="home-container">
      {/* Header Público */}
      <header className="home-header">
        <div className="home-logo">
          <BookOpen className="icone-logo" size={32} />
          <h1>Nosso Livro</h1>
        </div>
        <nav className="home-nav">
          {autenticado ? (
            <Link to="/painel" className="btn-primario btn-animado">
              Ir para o Painel <ArrowRight size={18} />
            </Link>
          ) : (
            <>
              <Link to="/login" className="btn-secundario btn-animado">Entrar</Link>
              <Link to="/cadastro" className="btn-primario btn-animado">Cadastrar-se</Link>
            </>
          )}
        </nav>
      </header>

      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-content fade-in-up">
          <div className="badge-brilho">
            <Sparkles size={16} />
            <span>Biblioteca Inteligente Compartilhada</span>
          </div>
          <h2 className="hero-titulo">A evolução do seu <span>Acervo Físico</span></h2>
          <p className="hero-subtitulo">
            Conecte leitores e livros em uma plataforma unificada. Gerencie empréstimos, crie filas de espera justas e descubra novas leituras com o nosso ecossistema institucional.
          </p>
        </div>
        
        <div className="hero-imagem-container flutuacao">
          <img 
            src="/assets/livrosss.webp" 
            alt="Biblioteca Digital Iluminada" 
            className="hero-imagem"
          />
          <div className="hero-glow"></div>
        </div>
      </section>

      {/* Seção de Funcionalidades */}
      <section id="funcionalidades" className="features-section">
        <h3 className="section-titulo">Tudo que você precisa em um só lugar</h3>
        
        <div className="features-grid">
          <div className="feature-card card-glass fade-in-up" style={{ animationDelay: '0.1s' }}>
            <div className="feature-icon-wrapper">
              <Search className="feature-icon" />
            </div>
            <h4>Catálogo Unificado</h4>
            <p>Busque livros físicos em diferentes bibliotecas do seu setor instantaneamente.</p>
          </div>

          <div className="feature-card card-glass fade-in-up" style={{ animationDelay: '0.2s' }}>
            <div className="feature-icon-wrapper">
              <Clock className="feature-icon" />
            </div>
            <h4>Filas Inteligentes</h4>
            <p>Esqueça os cadernos. Um algoritmo justo garante que o próximo da fila receba o livro.</p>
          </div>

          <div className="feature-card card-glass fade-in-up" style={{ animationDelay: '0.3s' }}>
            <div className="feature-icon-wrapper">
              <Users className="feature-icon" />
            </div>
            <h4>Comunidade Leitora</h4>
            <p>Compartilhe conhecimento e conecte-se através de sugestões e recomendações automatizadas.</p>
          </div>

          <div className="feature-card card-glass fade-in-up" style={{ animationDelay: '0.4s' }}>
            <div className="feature-icon-wrapper">
              <Library className="feature-icon" />
            </div>
            <h4>Gestão de Devoluções</h4>
            <p>Avisos automatizados por e-mail para lembrar dos prazos e evitar atrasos nas entregas.</p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="home-footer">
        <div className="footer-content">
          <div className="footer-logo">
            <BookOpen size={24} />
            <span>Nosso Livro</span>
          </div>
          <p>© 2026 Nosso Livro - Ecossistema de Bibliotecas Descentralizadas.</p>
        </div>
      </footer>
    </div>
  );
};

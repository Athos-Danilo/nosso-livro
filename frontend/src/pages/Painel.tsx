import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Layout } from '../components/Layout';
import { BookOpen, Bookmark, History, Bell, Calendar } from 'lucide-react';
import '../styles/index.css';

export const Painel: React.FC = () => {
  const { usuario } = useAuth();

  const estatisticas = [
    { titulo: 'Livros Disponíveis', valor: '128', icone: BookOpen, cor: 'var(--cor-primaria)' },
    { titulo: 'Minhas Reservas', valor: '2', icone: Bookmark, cor: 'var(--cor-acento)' },
    { titulo: 'Empréstimos Ativos', valor: '1', icone: History, cor: 'var(--cor-sucesso)' },
    { titulo: 'Notificações', valor: '4', icone: Bell, cor: 'var(--cor-alerta)' },
  ];

  return (
    <Layout>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
        
        {/* Banner de Boas-vindas */}
        <section className="card-glass" style={{
          padding: '40px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          border: '1px solid var(--cor-borda)',
          background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.6) 0%, rgba(15, 23, 42, 0.8) 100%)'
        }}>
          <div>
            <span style={{
              fontSize: '0.875rem',
              fontWeight: 600,
              color: 'var(--cor-primaria)',
              textTransform: 'uppercase',
              letterSpacing: '1px'
            }}>
              Bem-vindo de Volta
            </span>
            <h1 style={{ fontSize: '2rem', fontWeight: 700, margin: '8px 0 12px 0' }}>
              Olá, {usuario?.nome}!
            </h1>
            <p style={{ color: 'var(--cor-texto-secundario)', maxWidth: '500px', fontSize: '0.95rem' }}>
              Explore o acervo compartilhado, reserve novos títulos e acompanhe suas leituras. Juntos, construímos uma comunidade mais inteligente.
            </p>
          </div>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            backgroundColor: 'rgba(255, 255, 255, 0.05)',
            padding: '10px 16px',
            borderRadius: 'var(--raio-borda-md)',
            border: '1px solid var(--cor-borda)'
          }}>
            <Calendar size={18} color="var(--cor-acento)" />
            <span style={{ fontSize: '0.875rem', fontWeight: 500 }}>
              {new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'short' })}
            </span>
          </div>
        </section>

        {/* Grade de Estatísticas */}
        <section style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '20px'
        }}>
          {estatisticas.map((stat, index) => {
            const Icone = stat.icone;
            return (
              <div key={index} className="card-glass" style={{
                padding: '24px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                border: '1px solid var(--cor-borda)'
              }}>
                <div>
                  <span style={{ fontSize: '0.875rem', color: 'var(--cor-texto-secundario)' }}>{stat.titulo}</span>
                  <h2 style={{ fontSize: '2rem', fontWeight: 700, marginTop: '8px' }}>{stat.valor}</h2>
                </div>
                <div style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.05)',
                  padding: '12px',
                  borderRadius: 'var(--raio-borda-md)',
                  border: `1px solid ${stat.cor}`
                }}>
                  <Icone size={24} color={stat.cor} />
                </div>
              </div>
            );
          })}
        </section>

        {/* Bloco de Atividades Recentes (Stub) */}
        <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '20px' }}>
          
          {/* Livros Recomendados Rápidos */}
          <div className="card-glass" style={{ padding: '24px', border: '1px solid var(--cor-borda)' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '20px' }}>Recomendações para Você</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                <div style={{ width: '45px', height: '60px', backgroundColor: 'var(--cor-card-hover)', borderRadius: '4px' }}></div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>O Hobbit</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--cor-texto-secundario)' }}>J.R.R. Tolkien</div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                <div style={{ width: '45px', height: '60px', backgroundColor: 'var(--cor-card-hover)', borderRadius: '4px' }}></div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>Clean Code</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--cor-texto-secundario)' }}>Robert C. Martin</div>
                </div>
              </div>
            </div>
          </div>

          {/* Últimos Alertas */}
          <div className="card-glass" style={{ padding: '24px', border: '1px solid var(--cor-borda)' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '20px' }}>Últimas Notificações</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                <div style={{ padding: '6px', borderRadius: '50%', backgroundColor: 'rgba(34, 197, 94, 0.1)', color: 'var(--cor-sucesso)' }}>
                  <History size={16} />
                </div>
                <div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 500 }}>Empréstimo realizado com sucesso!</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--cor-texto-desativado)' }}>Há 2 horas</div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                <div style={{ padding: '6px', borderRadius: '50%', backgroundColor: 'rgba(59, 130, 246, 0.1)', color: 'var(--cor-primaria)' }}>
                  <Bookmark size={16} />
                </div>
                <div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 500 }}>Sua reserva do livro "Clean Code" está ativa.</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--cor-texto-desativado)' }}>Ontem</div>
                </div>
              </div>
            </div>
          </div>

        </section>

      </div>
    </Layout>
  );
};

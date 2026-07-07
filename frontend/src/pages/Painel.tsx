import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Layout } from '../components/Layout';
import { BookOpen, Bookmark, History, Bell, Calendar } from 'lucide-react';
import { api } from '../services/api';
import '../styles/index.css';

// Componente para o efeito de Contador Mecânico (M3.2)
const ContadorMecanico: React.FC<{ valorFinal: number }> = ({ valorFinal }) => {
  const [valor, setValor] = useState(0);

  useEffect(() => {
    let inicio = 0;
    const duracao = 1500; // 1.5 segundo
    const incremento = valorFinal / (duracao / 16); 
    
    if (valorFinal === 0) {
      setValor(0);
      return;
    }

    const intervalo = setInterval(() => {
      inicio += incremento;
      if (inicio >= valorFinal) {
        setValor(valorFinal);
        clearInterval(intervalo);
      } else {
        setValor(Math.floor(inicio));
      }
    }, 16);

    return () => clearInterval(intervalo);
  }, [valorFinal]);

  return <>{valor}</>;
};

export const Painel: React.FC = () => {
  const { usuario } = useAuth();
  
  const [carregando, setCarregando] = useState(true);
  const [falhaRede, setFalhaRede] = useState(false);
  const [dadosEstatisticas, setDadosEstatisticas] = useState({
    livros: 0,
    reservas: 0,
    emprestimos: 0,
    notificacoes: 0
  });

  const buscarDados = async () => {
    try {
      // Como as rotas de estatísticas (ex: /api/bibliotecas/estatisticas) 
      // ainda não foram implementadas nos microsserviços do backend,
      // usamos uma simulação para não causar erros 404/500 no console.
      const simularAPI = (valor: number) => 
        new Promise<any>((resolve) => setTimeout(() => resolve({ data: { total: valor } }), 400));

      const [resLivros, resReservas, resEmprestimos, resNotificacoes] = await Promise.allSettled([
        simularAPI(142), // api.get('/api/bibliotecas/estatisticas')
        simularAPI(3),   // api.get('/api/reservas/usuario')
        simularAPI(1),   // api.get('/api/emprestimos/usuario')
        simularAPI(5)    // api.get('/api/usuarios/notificacoes')
      ]);

      const todasFalharam = resLivros.status === 'rejected' && resReservas.status === 'rejected' && resEmprestimos.status === 'rejected' && resNotificacoes.status === 'rejected';
      
      setFalhaRede(todasFalharam);

      setDadosEstatisticas({
        livros: resLivros.status === 'fulfilled' ? (resLivros.value.data.total || 128) : (todasFalharam ? 0 : 128),
        reservas: resReservas.status === 'fulfilled' ? (resReservas.value.data.total || 2) : (todasFalharam ? 0 : 2),
        emprestimos: resEmprestimos.status === 'fulfilled' ? (resEmprestimos.value.data.total || 1) : (todasFalharam ? 0 : 1),
        notificacoes: resNotificacoes.status === 'fulfilled' ? (resNotificacoes.value.data.total || 4) : (todasFalharam ? 0 : 4)
      });
    } catch (err) {
      console.error('Erro ao buscar dados do painel:', err);
      setFalhaRede(true);
    } finally {
      // Simulando um pequeno tempo de rede para vermos os Skeletons Premium de Papel Pólen (M5.1)
      setTimeout(() => setCarregando(false), 800);
    }
  };

  useEffect(() => {
    buscarDados();
    // M3.3: Cache e Atualização Rápida (Polling 60s)
    const interval = setInterval(buscarDados, 60000);
    return () => clearInterval(interval);
  }, []);

  const estatisticas = [
    { titulo: 'Livros Disponíveis', valor: dadosEstatisticas.livros, icone: BookOpen, cor: 'var(--cor-ouro-envelhecido)' },
    { titulo: 'Minhas Reservas', valor: dadosEstatisticas.reservas, icone: Bookmark, cor: 'var(--cor-ouro-envelhecido)' },
    { titulo: 'Empréstimos Ativos', valor: dadosEstatisticas.emprestimos, icone: History, cor: 'var(--cor-ouro-envelhecido)' },
    { titulo: 'Notificações', valor: dadosEstatisticas.notificacoes, icone: Bell, cor: 'var(--cor-ouro-envelhecido)' },
  ];

  return (
    <Layout>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
        
        {/* Banner de Boas-vindas (M1.1) */}
        <section className="banner-ficha" style={{
          position: 'relative',
          padding: '40px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          backgroundColor: 'var(--cor-papel-polen)',
          color: 'var(--cor-papel-texto)',
          border: '4px double var(--cor-ouro-envelhecido)',
          borderRadius: '2px',
          boxShadow: 'var(--sombra-md)',
          backgroundImage: 'url("https://www.transparenttextures.com/patterns/cream-paper.png")'
        }}>
          <div>
            <span style={{
              fontSize: '0.875rem',
              fontWeight: 600,
              color: 'var(--cor-verde-biblioteca)',
              textTransform: 'uppercase',
              letterSpacing: '2px'
            }}>
              Ficha de Leitor
            </span>
            <h1 style={{ 
              fontSize: '2.5rem', 
              fontWeight: 700, 
              margin: '8px 0 12px 0',
              fontFamily: '"Playfair Display", Georgia, serif',
              color: 'var(--cor-papel-texto)'
            }}>
              Olá, {usuario?.nome}!
            </h1>
            <p style={{ color: 'var(--cor-papel-texto)', opacity: 0.8, maxWidth: '500px', fontSize: '1rem', fontStyle: 'italic' }}>
              "A leitura engrandece a alma." Explore o acervo compartilhado, reserve novos títulos e acompanhe suas leituras no nosso Santuário Literário.
            </p>
          </div>
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            backgroundColor: 'transparent',
            padding: '16px',
            border: '2px dashed var(--cor-vermelho-ferrugem)',
            borderRadius: '50%',
            width: '120px',
            height: '120px',
            color: 'var(--cor-vermelho-ferrugem)',
            transform: 'rotate(15deg)',
            opacity: 0.8
          }}>
            <Calendar size={24} />
            <span style={{ fontSize: '0.875rem', fontWeight: 700, textAlign: 'center', textTransform: 'uppercase' }}>
              {new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })}
            </span>
          </div>
        </section>

        {/* Grade de Estatísticas (Plaquetas Metálicas) (M1.2) */}
        <section style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '20px'
        }}>
          {estatisticas.map((stat, index) => {
            const Icone = stat.icone;
            return (
              <div key={index} className="plaqueta-metalica plaqueta-animada" style={{
                padding: '24px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                backgroundColor: 'var(--cor-card)',
                border: '1px solid var(--cor-ouro-envelhecido)',
                borderRadius: '8px',
                boxShadow: 'inset 0 0 10px rgba(0,0,0,0.5), var(--sombra-sm)',
                position: 'relative',
                overflow: 'hidden'
              }}>
                <div style={{
                  position: 'absolute',
                  top: 0, left: 0, right: 0, height: '1px',
                  background: 'linear-gradient(90deg, transparent, var(--cor-ouro-envelhecido), transparent)',
                  opacity: 0.5
                }} />
                {carregando ? (
                  <div style={{ flex: 1, marginRight: '16px' }}>
                    <div className="skeleton-polen skeleton-text" style={{ width: '40%', height: '12px' }}></div>
                    <div className="skeleton-polen skeleton-text" style={{ width: '25%', height: '40px', marginTop: '12px' }}></div>
                  </div>
                ) : (
                  <div style={{ flex: 1 }}>
                    <span style={{ 
                      fontSize: '0.75rem', 
                      color: 'var(--cor-texto-secundario)', 
                      textTransform: 'uppercase', 
                      letterSpacing: '1px',
                      fontFamily: '"Playfair Display", Georgia, serif'
                    }}>
                      {stat.titulo}
                    </span>
                    {falhaRede ? (
                      <div>
                        <span className="carimbo-indisponivel">Indisponível</span>
                      </div>
                    ) : (
                      <h2 style={{ 
                        fontSize: '2.5rem', 
                        fontWeight: 700, 
                        marginTop: '4px',
                        color: 'var(--cor-papel-polen)',
                        textShadow: '0 2px 4px rgba(0,0,0,0.5)'
                      }}><ContadorMecanico valorFinal={stat.valor} /></h2>
                    )}
                  </div>
                )}
                <div className="icone-pendulo" style={{
                  padding: '12px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, rgba(212, 175, 55, 0.1) 0%, transparent 100%)',
                  border: `1px solid rgba(212, 175, 55, 0.3)`,
                  boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.3)'
                }}>
                  <Icone size={28} color={stat.cor} />
                </div>
              </div>
            );
          })}
        </section>

        {/* Subpainéis do Leitor (M1.3) */}
        <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px' }}>
          
          {/* Prateleira de Recomendações */}
          <div style={{ 
            padding: '24px', 
            backgroundColor: 'var(--cor-card)', 
            borderTop: '3px solid var(--cor-ouro-envelhecido)',
            borderRadius: '4px',
            boxShadow: 'var(--sombra-md)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
              <BookOpen color="var(--cor-ouro-envelhecido)" size={24} />
              <h3 style={{ 
                fontSize: '1.25rem', 
                fontWeight: 600, 
                color: 'var(--cor-papel-polen)',
                fontFamily: '"Playfair Display", Georgia, serif'
              }}>Prateleira de Recomendações</h3>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{ display: 'flex', gap: '16px', alignItems: 'center', padding: '12px', backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: '8px' }}>
                <div className="livro-3d-wrapper">
                  <div className="livro-3d" style={{ backgroundColor: 'var(--cor-azul-nobre)' }}></div>
                </div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '1rem', color: 'var(--cor-papel-polen)' }}>O Senhor dos Anéis</div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--cor-texto-secundario)', fontStyle: 'italic' }}>J.R.R. Tolkien</div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '16px', alignItems: 'center', padding: '12px', backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: '8px' }}>
                <div className="livro-3d-wrapper">
                  <div className="livro-3d" style={{ backgroundColor: 'var(--cor-verde-biblioteca)' }}></div>
                </div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '1rem', color: 'var(--cor-papel-polen)' }}>Arquitetura Limpa</div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--cor-texto-secundario)', fontStyle: 'italic' }}>Robert C. Martin</div>
                </div>
              </div>
            </div>
          </div>

          {/* Livro de Avisos */}
          <div style={{ 
            padding: '24px', 
            backgroundColor: 'var(--cor-card)', 
            borderTop: '3px solid var(--cor-ouro-envelhecido)',
            borderRadius: '4px',
            boxShadow: 'var(--sombra-md)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
              <Bell color="var(--cor-ouro-envelhecido)" size={24} />
              <h3 style={{ 
                fontSize: '1.25rem', 
                fontWeight: 600, 
                color: 'var(--cor-papel-polen)',
                fontFamily: '"Playfair Display", Georgia, serif'
              }}>Livro de Avisos</h3>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '16px', position: 'relative' }}>
                <div style={{ padding: '8px', borderRadius: '50%', backgroundColor: 'rgba(46, 125, 50, 0.15)', color: 'var(--cor-sucesso)' }}>
                  <History size={18} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '0.95rem', fontWeight: 500, color: 'var(--cor-papel-polen)' }}>Empréstimo realizado com sucesso!</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--cor-texto-desativado)', marginTop: '4px' }}>Há 2 horas</div>
                </div>
                <div className="selo-carimbo devolucao" style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%) rotate(-4deg)' }}>
                  Devolvido
                </div>
              </div>
              <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start', position: 'relative' }}>
                <div style={{ padding: '8px', borderRadius: '50%', backgroundColor: 'rgba(212, 175, 55, 0.15)', color: 'var(--cor-ouro-envelhecido)' }}>
                  <Bookmark size={18} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '0.95rem', fontWeight: 500, color: 'var(--cor-papel-polen)' }}>Sua reserva do livro "Clean Code" está pronta.</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--cor-texto-desativado)', marginTop: '4px' }}>Ontem</div>
                </div>
                <div className="selo-carimbo reserva" style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%) rotate(-4deg)' }}>
                  Disponível
                </div>
              </div>
            </div>
          </div>

        </section>

      </div>
    </Layout>
  );
};


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
  const [recomendacoes, setRecomendacoes] = useState<any[]>([]);
  const [avisos, setAvisos] = useState<any[]>([]);

  const buscarDados = async () => {
    if (!usuario?.id) return;
    
    try {
      const [resLivros, resReservas, resEmprestimos, resNotificacoes, resRecomendacoes] = await Promise.allSettled([
        api.get('/api/bibliotecas/estatisticas'),
        api.get('/api/reservas/me'),
        api.get('/api/emprestimos', { params: { usuario_id: usuario.id } }),
        api.get('/api/notificacoes'),
        api.get(`/api/recomendacoes/usuario/${usuario.id}`)
      ]);

      const todasFalharam = resLivros.status === 'rejected' && resReservas.status === 'rejected' && resEmprestimos.status === 'rejected' && resNotificacoes.status === 'rejected';
      
      setFalhaRede(todasFalharam);

      setDadosEstatisticas({
        livros: resLivros.status === 'fulfilled' ? (resLivros.value.data.total || 0) : 0,
        reservas: resReservas.status === 'fulfilled' ? (resReservas.value.data.total || resReservas.value.data.dados?.length || 0) : 0,
        emprestimos: resEmprestimos.status === 'fulfilled' ? (resEmprestimos.value.data?.length || 0) : 0,
        notificacoes: resNotificacoes.status === 'fulfilled' ? (resNotificacoes.value.data.total || 0) : 0
      });

      if (resRecomendacoes.status === 'fulfilled' && resRecomendacoes.value.data) {
        const top2 = resRecomendacoes.value.data.slice(0, 2);
        const recDetalhes = await Promise.all(
          top2.map(async (rec: any) => {
             try {
               const resLivro = await api.get(`/api/livros/${rec.id_livro}`);
               return { ...rec, detalhesLivro: resLivro.data };
             } catch (e) {
               return { ...rec, detalhesLivro: { titulo: 'Desconhecido', autor: 'Desconhecido' }};
             }
          })
        );
        setRecomendacoes(recDetalhes);
      }

      if (resEmprestimos.status === 'fulfilled' && resEmprestimos.value.data) {
        const ativos = resEmprestimos.value.data.filter((e: any) => e.estado === 'ATIVO' || e.estado === 'ATRASADO');
        const topAtivos = ativos.slice(0, 3);
        const ativosDetalhes = await Promise.all(
          topAtivos.map(async (emp: any) => {
             try {
               const resLivro = await api.get(`/api/livros/${emp.id_livro}`);
               return { ...emp, livro: resLivro.data };
             } catch (e) {
               return { ...emp, livro: { titulo: `Livro #${emp.id_livro}` }};
             }
          })
        );
        setAvisos(ativosDetalhes);
      }
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
          flexWrap: 'wrap',
          gap: '24px',
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
            opacity: 0.8,
            flexShrink: 0
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
                      fontFamily: 'var(--fonte-principal)',
                      fontWeight: 600
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
              {recomendacoes.length > 0 ? recomendacoes.map((rec, idx) => (
                <div key={rec.id_livro || idx} className="item-lista-hover" style={{ display: 'flex', gap: '16px', alignItems: 'center', padding: '12px', backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: '8px', transition: 'all 0.2s ease', cursor: 'pointer' }}>
                  {rec.detalhesLivro?.capa_url ? (
                    <img 
                      src={rec.detalhesLivro.capa_url} 
                      alt={rec.detalhesLivro.titulo} 
                      style={{
                        width: '45px',
                        height: '65px',
                        objectFit: 'cover',
                        borderRadius: '4px',
                        border: '1px solid var(--cor-borda)',
                        flexShrink: 0
                      }}
                    />
                  ) : (
                    <div style={{
                      width: '45px',
                      height: '65px',
                      backgroundColor: 'var(--cor-card-hover)',
                      borderRadius: '4px',
                      border: '1px solid var(--cor-borda)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0
                    }}>
                      <BookOpen size={20} color="var(--cor-texto-desativado)" />
                    </div>
                  )}
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '1rem', color: 'var(--cor-papel-polen)', lineHeight: 1.2, marginBottom: '4px' }}>{rec.detalhesLivro?.titulo}</div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--cor-texto-secundario)', fontStyle: 'italic' }}>{rec.detalhesLivro?.autor}</div>
                  </div>
                </div>
              )) : (
                <div style={{ padding: '12px', color: 'var(--cor-texto-secundario)', fontStyle: 'italic' }}>Nenhuma recomendação disponível no momento.</div>
              )}
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
              {avisos.length > 0 ? avisos.map((aviso, idx) => {
                const atrasado = aviso.estado === 'ATRASADO';
                const corIcone = atrasado ? 'var(--cor-alerta)' : 'var(--cor-sucesso)';
                const bgIcone = atrasado ? 'rgba(220, 38, 38, 0.15)' : 'rgba(46, 125, 50, 0.15)';
                const textoSelo = atrasado ? 'Atrasado' : 'Ativo';
                const classeSelo = atrasado ? 'atrasado' : 'no-prazo';
                
                return (
                  <div key={aviso.id || idx} className="item-lista-hover" style={{ display: 'flex', gap: '16px', alignItems: 'flex-start', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '16px', position: 'relative', transition: 'all 0.2s ease', cursor: 'pointer', padding: '8px', borderRadius: '8px' }}>
                    <div style={{ padding: '8px', borderRadius: '50%', backgroundColor: bgIcone, color: corIcone }}>
                      <History size={18} />
                    </div>
                    <div style={{ flex: 1, paddingRight: '100px' }}>
                      <div style={{ fontSize: '0.95rem', fontWeight: 500, color: 'var(--cor-papel-polen)', lineHeight: 1.2 }}>Emprestou: {aviso.livro?.titulo}</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--cor-texto-desativado)', marginTop: '6px' }}>
                        Devolução: {new Date(aviso.data_devolucao_prevista).toLocaleDateString('pt-BR')}
                      </div>
                    </div>
                    <div className={`selo-carimbo ${classeSelo}`} style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%) rotate(-4deg)', fontSize: '0.7rem' }}>
                      {textoSelo}
                    </div>
                  </div>
                );
              }) : (
                <div style={{ padding: '12px', color: 'var(--cor-texto-secundario)', fontStyle: 'italic' }}>Nenhum aviso ou empréstimo pendente.</div>
              )}
            </div>
          </div>

        </section>

      </div>
    </Layout>
  );
};


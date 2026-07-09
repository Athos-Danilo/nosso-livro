import React, { useState, useEffect } from 'react';
import { Layout } from '../components/Layout';
import { Sparkles, BookOpen, ThumbsUp, Star } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import '../styles/index.css';

interface RecomendacaoData {
  id_livro: string;
  porcentagem_compatibilidade: number;
  motivo: string;
  detalhesLivro?: {
    titulo: string;
    autor: string;
    categoria: string;
    capa_url?: string;
  };
}

export const Recomendacoes: React.FC = () => {
  const { usuario } = useAuth();
  const [recomendacoes, setRecomendacoes] = useState<RecomendacaoData[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');

  useEffect(() => {
    const buscarRecomendacoes = async () => {
      if (!usuario?.id) return;
      
      try {
        setCarregando(true);
        // 1. Buscar recomendações
        const resRecomendacoes = await api.get(`/api/recomendacoes/usuario/${usuario.id}`);
        const listaRecomendacoes: RecomendacaoData[] = resRecomendacoes.data;
        
        // 2. Para cada recomendação, buscar os detalhes do livro
        const recomendacoesComDetalhes = await Promise.all(
          listaRecomendacoes.map(async (rec) => {
            try {
              const resLivro = await api.get(`/api/livros/${rec.id_livro}`);
              return {
                ...rec,
                detalhesLivro: resLivro.data
              };
            } catch (err) {
              console.error(`Erro ao buscar livro ${rec.id_livro}`, err);
              return {
                ...rec,
                detalhesLivro: {
                  titulo: 'Livro não encontrado',
                  autor: 'Desconhecido',
                  categoria: 'Sem Categoria'
                }
              };
            }
          })
        );
        
        setRecomendacoes(recomendacoesComDetalhes);
      } catch (err: any) {
        console.error('Erro ao buscar recomendações:', err);
        setErro('Não foi possível carregar as recomendações no momento.');
      } finally {
        setCarregando(false);
      }
    };

    buscarRecomendacoes();
  }, [usuario]);

  return (
    <Layout>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
        
        {/* Cabeçalho */}
        <div>
          <h1 style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '2rem', fontWeight: 700 }}>
            <Sparkles size={28} color="var(--cor-acento)" />
            <span>Recomendações Inteligentes</span>
          </h1>
          <p style={{ color: 'var(--cor-texto-secundario)' }}>Sugestões personalizadas baseadas no seu histórico de leituras</p>
        </div>

        {/* Banner Motivacional */}
        <section className="card-glass" style={{
          padding: '30px',
          border: '1px solid var(--cor-borda)',
          background: 'linear-gradient(135deg, rgba(235, 94, 40, 0.1) 0%, rgba(30, 41, 59, 0.4) 100%)',
          display: 'flex',
          gap: '20px',
          alignItems: 'center'
        }}>
          <div style={{
            backgroundColor: 'var(--cor-acento)',
            color: 'var(--cor-fundo)',
            padding: '16px',
            borderRadius: '50%'
          }}>
            <Star size={32} />
          </div>
          <div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700 }}>Descubra sua Próxima Grande Leitura</h3>
            <p style={{ color: 'var(--cor-texto-secundario)', marginTop: '6px', fontSize: '0.9rem', maxWidth: '600px' }}>
              Nosso sistema analisa os livros que você pegou por empréstimo e as avaliações da comunidade para traçar sugestões de alta afinidade técnica e literária.
            </p>
          </div>
        </section>

        {/* Loading ou Erro */}
        {carregando && (
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--cor-texto-secundario)' }}>
            <Sparkles className="spin-animation" size={32} style={{ marginBottom: '16px', display: 'inline-block' }} />
            <p>Analisando seu perfil e buscando os melhores livros...</p>
          </div>
        )}

        {erro && !carregando && (
          <div style={{ padding: '20px', backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', borderRadius: '8px', border: '1px solid #ef4444' }}>
            {erro}
          </div>
        )}

        {/* Grade de Recomendações */}
        {!carregando && !erro && recomendacoes.length === 0 && (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--cor-texto-secundario)' }}>
            <p>Ainda não temos dados suficientes para gerar recomendações personalizadas.</p>
            <p>Faça alguns empréstimos para o sistema aprender seu gosto!</p>
          </div>
        )}

        {!carregando && !erro && recomendacoes.length > 0 && (
          <section style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: '24px'
          }}>
            {recomendacoes.map((sug) => (
              <div key={sug.id_livro} className="card-glass" style={{
                padding: '28px',
                border: '1px solid var(--cor-borda)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                gap: '20px'
              }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      backgroundColor: 'var(--cor-card-hover)',
                      color: 'var(--cor-acento)',
                      padding: '4px 8px',
                      borderRadius: 'var(--raio-borda-sm)'
                    }}>
                      {sug.detalhesLivro?.categoria}
                    </span>
                    <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--cor-acento)' }}>
                      {sug.porcentagem_compatibilidade}% Afinidade
                    </span>
                  </div>

                  <div style={{ display: 'flex', gap: '16px', alignItems: 'center', marginTop: '16px' }}>
                    {sug.detalhesLivro?.capa_url ? (
                      <img 
                        src={sug.detalhesLivro.capa_url} 
                        alt={sug.detalhesLivro.titulo} 
                        style={{
                          width: '60px',
                          height: '80px',
                          objectFit: 'cover',
                          borderRadius: '4px',
                          border: '1px solid var(--cor-borda)'
                        }}
                      />
                    ) : (
                      <div style={{
                        width: '60px',
                        height: '80px',
                        backgroundColor: 'var(--cor-card-hover)',
                        borderRadius: '4px',
                        border: '1px solid var(--cor-borda)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        <BookOpen size={24} color="var(--cor-texto-desativado)" />
                      </div>
                    )}
                    <div>
                      <h3 style={{ fontSize: '1.1rem', fontWeight: 700, lineHeight: 1.2 }}>
                        {sug.detalhesLivro?.titulo}
                      </h3>
                      <p style={{ fontSize: '0.85rem', color: 'var(--cor-texto-secundario)', marginTop: '4px' }}>
                        Por {sug.detalhesLivro?.autor}
                      </p>
                    </div>
                  </div>

                  <p style={{
                    fontSize: '0.85rem',
                    color: 'var(--cor-texto-secundario)',
                    backgroundColor: 'rgba(255, 255, 255, 0.02)',
                    border: '1px dashed var(--cor-borda)',
                    padding: '12px',
                    borderRadius: 'var(--raio-borda-md)',
                    marginTop: '16px',
                    lineHeight: 1.4
                  }}>
                    {sug.motivo}
                  </p>
                </div>

                <button className="btn-animado" style={{
                  backgroundColor: 'transparent',
                  border: '1px solid var(--cor-acento)',
                  color: 'var(--cor-acento)',
                  padding: '10px',
                  borderRadius: 'var(--raio-borda-md)',
                  fontWeight: 600,
                  fontSize: '0.875rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px'
                }}>
                  <ThumbsUp size={16} />
                  <span>Tenho Interesse</span>
                </button>

              </div>
            ))}
          </section>
        )}

      </div>
    </Layout>
  );
};

import React from 'react';
import { Layout } from '../components/Layout';
import { Sparkles, BookOpen, ThumbsUp, Star } from 'lucide-react';
import '../styles/index.css';

export const Recomendacoes: React.FC = () => {
  // Dados de sugestões simuladas elegantes
  const sugestoes = [
    {
      id: '1',
      livro: 'O Hobbit',
      autor: 'J.R.R. Tolkien',
      categoria: 'Fantasia',
      porcentagemCompatibilidade: 98,
      motivo: 'Porque você leu outros títulos clássicos de ficção e fantasia.'
    },
    {
      id: '2',
      livro: 'Introdução ao Algoritmos',
      autor: 'Thomas H. Cormen',
      categoria: 'Computação',
      porcentagemCompatibilidade: 92,
      motivo: 'Baseado no seu interesse por livros técnicos e programação.'
    }
  ];

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

        {/* Grade de Recomendações */}
        <section style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '24px'
        }}>
          {sugestoes.map((sug) => (
            <div key={sug.id} className="card-glass" style={{
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
                    {sug.categoria}
                  </span>
                  <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--cor-acento)' }}>
                    {sug.porcentagemCompatibilidade}% Afinidade
                  </span>
                </div>

                <div style={{ display: 'flex', gap: '16px', alignItems: 'center', marginTop: '16px' }}>
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
                  <div>
                    <h3 style={{ fontSize: '1.2rem', fontWeight: 700 }}>{sug.livro}</h3>
                    <p style={{ fontSize: '0.85rem', color: 'var(--cor-texto-secundario)', marginTop: '2px' }}>Por {sug.autor}</p>
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

      </div>
    </Layout>
  );
};

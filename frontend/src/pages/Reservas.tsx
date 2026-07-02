import React from 'react';
import { Layout } from '../components/Layout';
import { Bookmark, Clock, CheckCircle, ArrowRight } from 'lucide-react';
import '../styles/index.css';

export const Reservas: React.FC = () => {
  // Dados simulados elegantes de reservas
  const reservas = [
    {
      id: '1',
      livro: 'Clean Code',
      autor: 'Robert C. Martin',
      dataReserva: '01/07/2026',
      status: 'FILA',
      posicaoFila: 2,
      totalFila: 5,
    },
    {
      id: '2',
      livro: 'Arquitetura Limpa',
      autor: 'Robert C. Martin',
      dataReserva: '29/06/2026',
      status: 'DISPONIVEL',
      prazoRetirada: '05/07/2026',
      biblioteca: 'Biblioteca Central (Bloco A)'
    }
  ];

  return (
    <Layout>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
        
        {/* Cabeçalho */}
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: 700 }}>Minhas Reservas</h1>
          <p style={{ color: 'var(--cor-texto-secundario)' }}>Monitore sua posição na fila de espera e livros liberados</p>
        </div>

        {/* Listagem */}
        <section style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {reservas.map((reserva) => (
            <div key={reserva.id} className="card-glass" style={{
              padding: '24px',
              border: '1px solid var(--cor-borda)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '20px'
            }}>
              <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                <div style={{
                  padding: '12px',
                  borderRadius: 'var(--raio-borda-md)',
                  backgroundColor: reserva.status === 'DISPONIVEL' ? 'rgba(34, 197, 94, 0.1)' : 'rgba(235, 94, 40, 0.1)',
                  color: reserva.status === 'DISPONIVEL' ? 'var(--cor-sucesso)' : 'var(--cor-acento)'
                }}>
                  <Bookmark size={24} />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.2rem', fontWeight: 700 }}>{reserva.livro}</h3>
                  <p style={{ fontSize: '0.85rem', color: 'var(--cor-texto-secundario)', marginTop: '2px' }}>Por {reserva.autor}</p>
                  <p style={{ fontSize: '0.8rem', color: 'var(--cor-texto-desativado)', marginTop: '4px' }}>Reservado em {reserva.dataReserva}</p>
                </div>
              </div>

              {/* Informações de Status */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '24px', flexWrap: 'wrap' }}>
                {reserva.status === 'FILA' ? (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--cor-acento)', fontSize: '0.875rem', fontWeight: 600 }}>
                      <Clock size={16} />
                      <span>Na Fila de Espera</span>
                    </div>
                    {/* Barra de Progresso da Fila */}
                    {(() => {
                      const totalFila = reserva.totalFila ?? 1;
                      const posicaoFila = reserva.posicaoFila ?? 1;
                      const porcentagem = ((totalFila - posicaoFila + 1) / totalFila) * 100;
                      return (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <div style={{ width: '120px', height: '6px', backgroundColor: 'var(--cor-card-hover)', borderRadius: '3px', overflow: 'hidden' }}>
                            <div style={{
                              width: `${porcentagem}%`,
                              height: '100%',
                              backgroundColor: 'var(--cor-acento)',
                              borderRadius: '3px'
                            }}></div>
                          </div>
                          <span style={{ fontSize: '0.8rem', fontWeight: 500 }}>
                            {posicaoFila}º de {totalFila}
                          </span>
                        </div>
                      );
                    })()}
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '6px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--cor-sucesso)', fontSize: '0.875rem', fontWeight: 600 }}>
                      <CheckCircle size={16} />
                      <span>Disponível para Coleta!</span>
                    </div>
                    <span style={{ fontSize: '0.8rem', color: 'var(--cor-texto-secundario)' }}>
                      Retirar até: <strong style={{ color: 'var(--cor-texto-principal)' }}>{reserva.prazoRetirada}</strong>
                    </span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--cor-texto-desativado)' }}>
                      Local: {reserva.biblioteca}
                    </span>
                  </div>
                )}

                <button className="btn-animado" style={{
                  backgroundColor: reserva.status === 'DISPONIVEL' ? 'var(--cor-sucesso)' : 'transparent',
                  border: reserva.status === 'DISPONIVEL' ? 'none' : '1px solid var(--cor-erro)',
                  color: reserva.status === 'DISPONIVEL' ? 'var(--cor-fundo)' : 'var(--cor-erro)',
                  padding: '10px 18px',
                  borderRadius: 'var(--raio-borda-md)',
                  fontWeight: 600,
                  fontSize: '0.875rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  {reserva.status === 'DISPONIVEL' ? (
                    <>
                      <span>Ver Código Coleta</span>
                      <ArrowRight size={16} />
                    </>
                  ) : (
                    <span>Cancelar Reserva</span>
                  )}
                </button>
              </div>

            </div>
          ))}
        </section>

      </div>
    </Layout>
  );
};

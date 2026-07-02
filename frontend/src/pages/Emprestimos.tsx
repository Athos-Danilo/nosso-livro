import React from 'react';
import { Layout } from '../components/Layout';
import { History, Calendar, AlertTriangle, Check } from 'lucide-react';
import '../styles/index.css';

export const Emprestimos: React.FC = () => {
  // Dados simulados elegantes de empréstimos
  const emprestimos = [
    {
      id: '1',
      livro: 'O Alquimista',
      autor: 'Paulo Coelho',
      dataEmprestimo: '25/06/2026',
      dataDevolucaoPrevista: '09/07/2026',
      estado: 'ATIVO',
      biblioteca: 'Biblioteca Central'
    },
    {
      id: '2',
      livro: 'Clean Code',
      autor: 'Robert C. Martin',
      dataEmprestimo: '10/06/2026',
      dataDevolucaoReal: '24/06/2026',
      estado: 'DEVOLVIDO',
      biblioteca: 'Biblioteca Central'
    }
  ];

  return (
    <Layout>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
        
        {/* Cabeçalho */}
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: 700 }}>Meus Empréstimos</h1>
          <p style={{ color: 'var(--cor-texto-secundario)' }}>Gerencie seus livros emprestados e prazos de devolução</p>
        </div>

        {/* Listagem */}
        <section style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {emprestimos.map((emp) => {
            const ehAtivo = emp.estado === 'ATIVO';
            return (
              <div key={emp.id} className="card-glass" style={{
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
                    backgroundColor: ehAtivo ? 'rgba(59, 130, 246, 0.1)' : 'rgba(255, 255, 255, 0.05)',
                    color: ehAtivo ? 'var(--cor-primaria)' : 'var(--cor-texto-desativado)'
                  }}>
                    <History size={24} />
                  </div>
                  <div>
                    <h3 style={{ fontSize: '1.2rem', fontWeight: 700 }}>{emp.livro}</h3>
                    <p style={{ fontSize: '0.85rem', color: 'var(--cor-texto-secundario)', marginTop: '2px' }}>Por {emp.autor}</p>
                    <div style={{ display: 'flex', gap: '16px', fontSize: '0.8rem', color: 'var(--cor-texto-desativado)', marginTop: '6px' }}>
                      <span>Retirado em: {emp.dataEmprestimo}</span>
                      <span>Local: {emp.biblioteca}</span>
                    </div>
                  </div>
                </div>

                {/* Status do Empréstimo */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '24px', flexWrap: 'wrap' }}>
                  {ehAtivo ? (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '6px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--cor-primaria)', fontSize: '0.875rem', fontWeight: 600 }}>
                        <Calendar size={16} />
                        <span>Devolução em: {emp.dataDevolucaoPrevista}</span>
                      </div>
                      
                      {/* Alerta de Prazo Próximo (Simulado se faltar poucos dias) */}
                      <span style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        fontSize: '0.75rem',
                        color: 'var(--cor-alerta)',
                        fontWeight: 500
                      }}>
                        <AlertTriangle size={12} />
                        Faltam 7 dias
                      </span>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--cor-sucesso)', fontSize: '0.875rem', fontWeight: 600 }}>
                        <Check size={16} />
                        <span>Devolvido em {emp.dataDevolucaoReal}</span>
                      </div>
                    </div>
                  )}

                  {ehAtivo && (
                    <button className="btn-animado" style={{
                      backgroundColor: 'var(--cor-primaria)',
                      color: 'var(--cor-fundo)',
                      padding: '10px 18px',
                      borderRadius: 'var(--raio-borda-md)',
                      fontWeight: 600,
                      fontSize: '0.875rem'
                    }}>
                      Renovar Leitura
                    </button>
                  )}
                </div>

              </div>
            );
          })}
        </section>

      </div>
    </Layout>
  );
};

import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Layout } from '../components/Layout';
import { api } from '../services/api';
import { BookMarked, CheckCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import '../styles/index.css';

interface EmprestimoAPI {
  id: string;
  id_livro: string;
  data_emprestimo: string;
  data_devolucao_prevista: string;
  data_devolucao_real?: string | null;
  estado: string; // ATIVO, ATRASADO, DEVOLVIDO
}

interface LivroDetalhes {
  titulo: string;
  autor: string;
  capa_url?: string;
}

interface EmprestimoAgregado extends EmprestimoAPI {
  livro?: LivroDetalhes;
}

export const Emprestimos: React.FC = () => {
  const { usuario } = useAuth();
  const [abaAtiva, setAbaAtiva] = useState<'ATIVOS' | 'HISTORICO'>('ATIVOS');
  
  const [emprestimos, setEmprestimos] = useState<EmprestimoAgregado[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [processandoBaixa, setProcessandoBaixa] = useState<string | null>(null);
  const [mensagemSucesso, setMensagemSucesso] = useState('');

  const carregarEmprestimos = async () => {
    if (!usuario?.id) return;
    
    setCarregando(true);
    try {
      // Busca todos os empréstimos do usuário
      const respostaEmprestimos = await api.get('/api/emprestimos', {
        params: { usuario_id: usuario.id }
      });
      
      const listaEmprestimos: EmprestimoAPI[] = respostaEmprestimos.data || [];
      
      // Busca detalhes dos livros em paralelo
      const promessasLivros = listaEmprestimos.map(async (emp) => {
        try {
          const resLivro = await api.get(`/api/livros/${emp.id_livro}`);
          return { ...emp, livro: resLivro.data };
        } catch (e) {
          return { ...emp, livro: { titulo: 'Livro Desconhecido', autor: 'Autor Desconhecido' } };
        }
      });
      
      const agregados = await Promise.all(promessasLivros);
      
      // Ordenar por data mais recente
      agregados.sort((a, b) => new Date(b.data_emprestimo).getTime() - new Date(a.data_emprestimo).getTime());
      
      setEmprestimos(agregados);
    } catch (erro) {
      console.error('Erro ao carregar empréstimos:', erro);
    } finally {
      setCarregando(false);
    }
  };

  useEffect(() => {
    carregarEmprestimos();
  }, [usuario]);

  const darBaixa = async (id: string) => {
    setProcessandoBaixa(id);
    try {
      await api.post(`/api/emprestimos/${id}/devolucao`);
      setMensagemSucesso('DEVOLVIDO: BAIXA CONCLUÍDA');
      setTimeout(() => setMensagemSucesso(''), 4000);
      await carregarEmprestimos();
    } catch (erro) {
      console.error('Erro ao devolver', erro);
    } finally {
      setProcessandoBaixa(null);
    }
  };

  const formatarData = (dataIso: string) => {
    if (!dataIso) return '--/--/----';
    const data = new Date(dataIso);
    return data.toLocaleDateString('pt-BR');
  };

  const determinarCarimbo = (estado: string, dataPrevista: string) => {
    if (estado === 'DEVOLVIDO') return { classe: 'devolvido', texto: 'DEVOLVIDO' };
    if (estado === 'ATRASADO') return { classe: 'atrasado', texto: 'ATRASADO' };
    
    // Calcula diferença de dias para o vencimento
    const hoje = new Date();
    const prevista = new Date(dataPrevista);
    const diffDias = Math.ceil((prevista.getTime() - hoje.getTime()) / (1000 * 3600 * 24));
    
    if (diffDias < 0) return { classe: 'atrasado', texto: 'ATRASADO' };
    if (diffDias <= 3) return { classe: 'vence-logo', texto: 'VENCE LOGO' };
    
    return { classe: 'no-prazo', texto: 'NO PRAZO' };
  };

  // Filtragem local baseada na aba
  const exibirAtivos = abaAtiva === 'ATIVOS';
  const listaExibicao = emprestimos.filter(emp => {
    if (exibirAtivos) return emp.estado === 'ATIVO' || emp.estado === 'ATRASADO';
    return emp.estado === 'DEVOLVIDO';
  });

  return (
    <Layout>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        
        {/* Cabeçalho */}
        <div>
          <h1 style={{ fontFamily: '"Times New Roman", Times, serif', fontSize: '2.5rem', fontWeight: 'bold', color: '#2c1e16' }}>Fichas de Leitura</h1>
          <p style={{ color: '#5c4a3d', fontSize: '1.1rem', marginTop: '8px' }}>Seu registro pessoal de viagens literárias.</p>
        </div>

        {/* Notificação Flutuante de Sucesso (Toast) */}
        {mensagemSucesso && (
          <div style={{
            position: 'fixed', top: '30px', left: '50%', transform: 'translateX(-50%)',
            zIndex: 9999, backgroundColor: '#f1f8f5', border: '3px solid #059669',
            padding: '16px 32px', borderRadius: '4px', boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
            color: '#059669', fontFamily: '"Courier New", Courier, monospace',
            fontWeight: 'bold', fontSize: '1.2rem', letterSpacing: '1px',
            animation: 'pulsoSkeleton 1s infinite'
          }}>
            <CheckCircle style={{ display: 'inline', verticalAlign: 'text-bottom', marginRight: '8px' }} />
            {mensagemSucesso}
          </div>
        )}

        {/* Abas de Fita */}
        <div className="abas-container">
          <button 
            className={`aba-fita ${exibirAtivos ? 'ativa' : ''}`}
            onClick={() => setAbaAtiva('ATIVOS')}
          >
            Leituras Ativas
          </button>
          <button 
            className={`aba-fita ${!exibirAtivos ? 'ativa' : ''}`}
            onClick={() => setAbaAtiva('HISTORICO')}
          >
            Registros Anteriores
          </button>
        </div>

        {/* Skeletons ou Lista Vazia ou Fichas */}
        {carregando ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div className="skeleton-livro" style={{ height: '200px' }}></div>
            <div className="skeleton-livro" style={{ height: '200px', animationDelay: '0.2s' }}></div>
          </div>
        ) : listaExibicao.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '64px', backgroundColor: 'var(--cor-papel-polen)', border: '1px dashed #c2b4a3', borderRadius: '4px' }}>
            <BookMarked size={64} color="#8B7355" style={{ margin: '0 auto', marginBottom: '24px', opacity: 0.5 }} />
            <h2 style={{ fontFamily: '"Times New Roman", Times, serif', color: '#2c1e16', fontSize: '1.8rem', marginBottom: '16px' }}>NENHUM REGISTRO DE LEITURA ENCONTRADO NA SUA FICHA.</h2>
            <p style={{ color: '#5c4a3d', marginBottom: '32px' }}>Parece que você ainda não retirou nenhum exemplar nesta categoria.</p>
            <Link to="/catalogo" className="btn-santuario" style={{ display: 'inline-flex', padding: '12px 32px' }}>
              Explorar Prateleiras do Catálogo
            </Link>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
            {listaExibicao.map((emp) => {
              const carimbo = determinarCarimbo(emp.estado, emp.data_devolucao_prevista);
              
              return (
                <div key={emp.id} className="ficha-bolso">
                  
                  {/* Dados do Livro */}
                  <div className="ficha-bolso-conteudo" style={{ flex: 1 }}>
                    <h3>{emp.livro?.titulo || `Livro #${emp.id_livro}`}</h3>
                    <p style={{ fontWeight: 'bold' }}>AUTOR: <span style={{ fontWeight: 'normal' }}>{emp.livro?.autor || 'Desconhecido'}</span></p>
                    <p style={{ fontWeight: 'bold' }}>DATA DA RETIRADA: <span style={{ fontWeight: 'normal' }}>{formatarData(emp.data_emprestimo)}</span></p>
                    
                    {emp.data_devolucao_real && (
                      <p style={{ fontWeight: 'bold' }}>DATA DA DEVOLUÇÃO: <span style={{ fontWeight: 'normal' }}>{formatarData(emp.data_devolucao_real)}</span></p>
                    )}
                    
                    {exibirAtivos && (
                      <div style={{ marginTop: '24px' }}>
                        <button 
                          className="btn-santuario" 
                          onClick={() => darBaixa(emp.id)}
                          disabled={processandoBaixa === emp.id}
                        >
                          {processandoBaixa === emp.id ? 'Assinando Baixa...' : 'Dar Baixa na Obra (Devolver)'}
                        </button>
                      </div>
                    )}
                  </div>
                  
                  {/* Prazos e Carimbos */}
                  <div className="carimbo-prazo-container">
                    {!emp.data_devolucao_real && (
                      <div className="data-destaque">
                        PRAZO LIMIT: {formatarData(emp.data_devolucao_prevista)}
                      </div>
                    )}
                    <div className={`carimbo-prazo ${carimbo.classe}`}>
                      {carimbo.texto}
                    </div>
                  </div>
                  
                </div>
              );
            })}
          </div>
        )}

      </div>
    </Layout>
  );
};

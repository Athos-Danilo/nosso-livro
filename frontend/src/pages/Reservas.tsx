import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Layout } from '../components/Layout';
import { api } from '../services/api';
import { Bookmark, Hourglass, XCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import '../styles/index.css';

interface ReservaAPI {
  id: string;
  idLivro: string;
  estado: string; // PENDENTE, ATRIBUIDO, CONCLUIDO, CANCELADO
  posicao: number;
  prazoRetirada?: string | null;
  criadoEm: string;
}

interface LivroDetalhes {
  titulo: string;
  autor: string;
  capa_url?: string;
}

interface ReservaAgregada extends ReservaAPI {
  livro?: LivroDetalhes;
}

export const Reservas: React.FC = () => {
  const { usuario } = useAuth();
  
  const [reservas, setReservas] = useState<ReservaAgregada[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [removendoIds, setRemovendoIds] = useState<Set<string>>(new Set());

  const carregarReservas = async () => {
    if (!usuario?.id) return;
    
    setCarregando(true);
    try {
      // Busca a lista de reservas do usuário
      const respostaReservas = await api.get('/api/reservas/me');
      
      // O backend retorna um array "dados" contendo as reservas
      const listaReservas: ReservaAPI[] = respostaReservas.data?.dados || [];
      
      // Busca detalhes dos livros do catálogo em paralelo
      const promessasLivros = listaReservas.map(async (res) => {
        try {
          const resLivro = await api.get(`/api/livros/${res.idLivro}`);
          return { ...res, livro: resLivro.data };
        } catch (e) {
          return { ...res, livro: { titulo: 'Obra Desconhecida', autor: 'Autor Desconhecido' } };
        }
      });
      
      const agregados = await Promise.all(promessasLivros);
      
      // Exibir apenas PENDENTES e ATRIBUIDOS na fila principal
      const reservasAtivas = agregados.filter(
        r => r.estado === 'PENDENTE' || r.estado === 'ATRIBUIDO'
      );
      
      setReservas(reservasAtivas);
    } catch (erro) {
      console.error('Erro ao carregar reservas:', erro);
    } finally {
      setCarregando(false);
    }
  };

  useEffect(() => {
    carregarReservas();
  }, [usuario]);

  const cancelarReserva = async (id: string) => {
    // Inicia a animação de encolhimento adicionando à lista de remocao
    setRemovendoIds(prev => new Set(prev).add(id));
    
    try {
      await api.delete(`/api/reservas/${id}`);
      
      // Aguarda o término da animação CSS antes de remover do estado
      setTimeout(() => {
        setReservas(prev => prev.filter(r => r.id !== id));
      }, 400); // 400ms é a transição do .removendo
      
    } catch (erro) {
      console.error('Erro ao cancelar reserva:', erro);
      setRemovendoIds(prev => {
        const nova = new Set(prev);
        nova.delete(id);
        return nova;
      });
    }
  };

  const formatarPrazo = (dataIso?: string | null) => {
    if (!dataIso) return '';
    const data = new Date(dataIso);
    return data.toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
  };

  return (
    <Layout>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        
        {/* Cabeçalho Clássico */}
        <div style={{ borderBottom: '2px solid #8B7355', paddingBottom: '16px', marginBottom: '8px' }}>
          <h1 style={{ fontFamily: '"Times New Roman", Times, serif', fontSize: '2.5rem', fontWeight: 'bold', color: '#2c1e16' }}>Fila de Espera</h1>
          <p style={{ color: '#5c4a3d', fontSize: '1.1rem', marginTop: '8px', fontStyle: 'italic' }}>
            Aguardando pacientemente a devolução das seguintes obras:
          </p>
        </div>

        {/* FASE 5: Skeletons e Estado Vazio */}
        {carregando ? (
          <div className="lista-reservas">
            <div className="skeleton-livro" style={{ height: '180px', borderRadius: '4px' }}></div>
            <div className="skeleton-livro" style={{ height: '180px', borderRadius: '4px', animationDelay: '0.2s' }}></div>
          </div>
        ) : reservas.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '64px', backgroundColor: 'var(--cor-papel-polen)', border: '1px dashed #c2b4a3', borderRadius: '4px' }}>
            <Bookmark size={64} color="#8B7355" style={{ margin: '0 auto', marginBottom: '24px', opacity: 0.5 }} />
            <h2 style={{ fontFamily: '"Times New Roman", Times, serif', color: '#2c1e16', fontSize: '1.8rem', marginBottom: '16px', textTransform: 'uppercase' }}>
              Nenhum livro em espera registrado na sua ficha.
            </h2>
            <p style={{ color: '#5c4a3d', marginBottom: '32px', fontFamily: '"Courier New", Courier, monospace' }}>
              "A leitura é uma viagem cujo bilhete você já comprou."
            </p>
            <Link to="/catalogo" className="btn-santuario" style={{ display: 'inline-flex', padding: '12px 32px' }}>
              Explorar Prateleiras do Acervo
            </Link>
          </div>
        ) : (
          <div className="lista-reservas">
            {reservas.map((reserva) => {
              const estaRemovendo = removendoIds.has(reserva.id);
              const estaAtribuido = reserva.estado === 'ATRIBUIDO';
              
              // Simulação visual de carregamento da barra: exibe barra 100% cheia se for Posição 1 ou Atribuído, 
              // Do contrário, baseia-se num cálculo fictício (posições altas preenchem menos)
              const progresso = estaAtribuido ? 100 : Math.max(10, 100 - (reserva.posicao * 15));

              return (
                <div 
                  key={reserva.id} 
                  className={`ficha-reserva ${estaRemovendo ? 'removendo' : ''} ${estaAtribuido ? 'atribuido' : ''}`}
                >
                  {/* Capa 3D sutil */}
                  <div className="reserva-imagem-container">
                    {reserva.livro?.capa_url ? (
                      <img src={reserva.livro.capa_url} alt={reserva.livro.titulo} />
                    ) : (
                      <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#d8d0c5', fontStyle: 'italic', fontSize: '0.8rem', padding: '8px', textAlign: 'center' }}>
                        Sem Capa
                      </div>
                    )}
                  </div>

                  <div className="reserva-conteudo">
                    <h3 className="reserva-titulo">{reserva.livro?.titulo || 'Livro Desconhecido'}</h3>
                    <p className="reserva-autor">Por {reserva.livro?.autor || 'Desconhecido'}</p>
                    
                    {/* FASE 2: Indicador à Pena */}
                    <div style={{ marginTop: '24px', maxWidth: '300px' }}>
                      <div className="indicador-pena">
                        <Hourglass size={18} color="#8B7355" />
                        {estaAtribuido ? (
                          <span>Livro retornado à Biblioteca!</span>
                        ) : (
                          <span>
                            {reserva.posicao}º na fila de espera
                          </span>
                        )}
                      </div>
                      
                      {!estaAtribuido && (
                        <div className="barra-espera-container">
                          <div className="barra-espera-preenchimento" style={{ width: `${progresso}%` }}></div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* FASE 4: Ações e Carimbos */}
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '24px', minWidth: '220px' }}>
                    {estaAtribuido ? (
                      <>
                        <div className="carimbo-liberado">
                          LIBERADO PARA RETIRADA
                        </div>
                        {reserva.prazoRetirada && (
                          <div className="cronometro-guarda">
                            <Hourglass size={16} />
                            Retirar até {formatarPrazo(reserva.prazoRetirada)}
                          </div>
                        )}
                      </>
                    ) : (
                      <button 
                        className="btn-cancelar-reserva"
                        onClick={() => cancelarReserva(reserva.id)}
                        disabled={estaRemovendo}
                      >
                        <XCircle size={18} style={{ display: 'inline', verticalAlign: 'text-bottom', marginRight: '6px' }} />
                        Cancelar Reserva
                      </button>
                    )}
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

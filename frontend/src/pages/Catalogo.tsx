import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { Layout } from '../components/Layout';
import { api } from '../services/api';
import { BookOpen, Search, Filter, X, PenTool } from 'lucide-react';
import '../styles/index.css';

interface Livro {
  id: number;
  titulo: string;
  autor: string;
  isbn: string;
  categoria: string;
  ano_publicacao: number | null;
  capa_url: string | null;
  quantidade_total: number;
  quantidade_disponivel: number;
  id_biblioteca: number;
  ativo: boolean;
  biblioteca?: {
    nome: string;
    localizacao: string;
  };
}

export const Catalogo: React.FC = () => {
  const { usuario } = useAuth();
  const [livros, setLivros] = useState<Livro[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [busca, setBusca] = useState('');
  const [mostrarFiltros, setMostrarFiltros] = useState(false);
  const [filtroCategoria, setFiltroCategoria] = useState('');
  
  // Estados de criação de livro (para administradores)
  const [mostrarCriar, setMostrarCriar] = useState(false);
  const [novoLivro, setNovoLivro] = useState({
    titulo: '',
    autor: '',
    isbn: '',
    categoria: '',
    ano_publicacao: '' as string | number,
    quantidade_total: 1,
    id_biblioteca: 1
  });
  const [erroCriar, setErroCriar] = useState('');

  // Fases 3 e 4: Estados do Modal e Integração
  const [livroSelecionado, setLivroSelecionado] = useState<Livro | null>(null);
  const [processandoRequisicao, setProcessandoRequisicao] = useState(false);
  const [statusRequisicao, setStatusRequisicao] = useState<{ tipo: 'sucesso' | 'erro' | 'fila', mensagem: string } | null>(null);

  // Fases 5 e 6: Paginação, Skeletons e Cadastro
  const [pagina, setPagina] = useState(1);
  const [temMais, setTemMais] = useState(true);
  const [carregandoMais, setCarregandoMais] = useState(false);
  const [erroValidacaoCriar, setErroValidacaoCriar] = useState(false);
  const observadorReferencia = useRef<IntersectionObserver | null>(null);
  const ultimoLivroReferencia = useCallback((node: HTMLDivElement) => {
    if (carregando || carregandoMais) return;
    if (observadorReferencia.current) observadorReferencia.current.disconnect();
    
    observadorReferencia.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && temMais) {
        setPagina(prev => prev + 1);
      }
    });
    
    if (node) observadorReferencia.current.observe(node);
  }, [carregando, carregandoMais, temMais]);

  // Modificado para carregar paginado e buscar pelo título
  const carregarLivros = async (pageNum: number, tituloBusca: string) => {
    const limite = 12; // Número de livros por página
    const pulo = (pageNum - 1) * limite;
    
    try {
      const resposta = await api.get('/api/livros/', {
        params: {
          limite: limite,
          pulo: pulo,
          titulo: tituloBusca || undefined
        }
      });
      
      const novosLivros = resposta.data;
      if (novosLivros.length < limite) {
        setTemMais(false);
      } else {
        setTemMais(true);
      }

      if (pageNum === 1) {
        setLivros(novosLivros);
      } else {
        setLivros(prev => [...prev, ...novosLivros]);
      }
    } catch (erro) {
      console.error('Erro ao buscar livros:', erro);
    } finally {
      setCarregando(false);
      setCarregandoMais(false);
    }
  };

  // Debounce (Fase 6)
  useEffect(() => {
    setCarregando(true);
    const delayDebounce = setTimeout(() => {
      setPagina(1);
      carregarLivros(1, busca);
    }, 300);

    return () => clearTimeout(delayDebounce);
  }, [busca]);

  // Efeito de Paginação Infinita
  useEffect(() => {
    if (pagina > 1) {
      setCarregandoMais(true);
      carregarLivros(pagina, busca);
    }
  }, [pagina]);

  const handleCriarLivro = async (e: React.FormEvent) => {
    e.preventDefault();
    setErroCriar('');

    try {
      await api.post('/api/livros/', {
        ...novoLivro,
        ano_publicacao: novoLivro.ano_publicacao !== '' ? Number(novoLivro.ano_publicacao) : null,
        quantidade_total: Number(novoLivro.quantidade_total),
        quantidade_disponivel: Number(novoLivro.quantidade_total),
        id_biblioteca: Number(novoLivro.id_biblioteca)
      });
      setNovoLivro({ titulo: '', autor: '', isbn: '', categoria: '', ano_publicacao: '', quantidade_total: 1, id_biblioteca: 1 });
      
      setPagina(1);
      carregarLivros(1, busca);
    } catch (erro: any) {
      setErroValidacaoCriar(true);
      setErroCriar(erro.response?.data?.detail || 'Erro ao cadastrar livro');
    }
  };

  // Filtragem
  const livrosFiltrados = livros.filter(livro => {
    const matchCategoria = filtroCategoria ? livro.categoria.toLowerCase() === filtroCategoria.toLowerCase() : true;
    return matchCategoria;
  });

  const fecharModal = () => {
    setLivroSelecionado(null);
    setStatusRequisicao(null);
  };

  const solicitarEmprestimo = async (livro: Livro) => {
    setProcessandoRequisicao(true);
    setStatusRequisicao(null);
    try {
      await api.post('/api/emprestimos', {
        id_livro: String(livro.id),
        id_biblioteca: String(livro.id_biblioteca)
      });
      setStatusRequisicao({ tipo: 'sucesso', mensagem: 'EMPRÉSTIMO APROVADO' });
      setPagina(1);
      carregarLivros(1, busca);
    } catch (erro: any) {
      const msgErro = erro.response?.data?.erro || erro.response?.data?.detail || erro.message || 'Erro ao solicitar empréstimo';
      setStatusRequisicao({ tipo: 'erro', mensagem: msgErro });
    } finally {
      setProcessandoRequisicao(false);
    }
  };

  const entrarNaFila = async (livro: Livro) => {
    setProcessandoRequisicao(true);
    setStatusRequisicao(null);
    try {
      await api.post('/api/reservas', {
        idLivro: String(livro.id)
      });
      setStatusRequisicao({ tipo: 'fila', mensagem: 'VOCÊ ENTROU NA FILA' });
      setPagina(1);
      carregarLivros(1, busca);
    } catch (erro: any) {
      const msgErro = erro.response?.data?.mensagem || erro.response?.data?.erro || erro.message || 'Erro ao entrar na fila';
      setStatusRequisicao({ tipo: 'erro', mensagem: msgErro });
    } finally {
      setProcessandoRequisicao(false);
    }
  };

  return (
    <Layout>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
        
        {/* Cabeçalho */}
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 style={{ fontSize: '2rem', fontWeight: 700 }}>Catálogo de Livros</h1>
            <p style={{ color: 'var(--cor-texto-secundario)', maxWidth: '600px' }}>
              Navegue pelo nosso acervo infinito de conhecimento. Selecione uma obra para visualizar sua ficha ou solicitar um empréstimo.
            </p>
          </div>
        </header>

        {/* FASE 5: Botão Administrador e Formulário de Papel Pólen */}
        {usuario?.permissao === 'administrador' && (
          <div style={{ marginBottom: '16px' }}>
            {!mostrarCriar ? (
              <button
                onClick={() => setMostrarCriar(true)}
                className="btn-animado"
                style={{
                  display: 'flex', alignItems: 'center', gap: '8px',
                  backgroundColor: 'var(--cor-ouro-envelhecido)',
                  color: '#2C1E16',
                  padding: '12px 24px',
                  borderRadius: 'var(--raio-borda-md)',
                  fontWeight: 700,
                  border: '1px solid #8B7355',
                  boxShadow: '0 4px 6px rgba(0,0,0,0.3)',
                  fontFamily: '"Times New Roman", Times, serif',
                  letterSpacing: '1px'
                }}
              >
                <PenTool size={20} />
                Adicionar Obra ao Acervo
              </button>
            ) : (
              <div className="ficha-cadastro-polen">
                {erroValidacaoCriar && <div className="carimbo-invalido">INVÁLIDO</div>}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', borderBottom: '2px solid #8B7355', paddingBottom: '8px' }}>
                  <h3 style={{ fontSize: '1.5rem', fontFamily: '"Times New Roman", Times, serif', color: '#2C1E16', textTransform: 'uppercase' }}>Ficha de Catalogação - Nova Obra</h3>
                  <button onClick={() => { setMostrarCriar(false); setErroValidacaoCriar(false); }} style={{ background: 'none', border: 'none', color: '#8B7355', cursor: 'pointer' }}>
                    <X size={24} />
                  </button>
                </div>
                
                {erroCriar && <div style={{ color: 'var(--cor-erro)', marginBottom: '16px', fontWeight: 600 }}>{erroCriar}</div>}
                
                <form onSubmit={handleCriarLivro} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                  <div style={{ gridColumn: '1 / -1' }}>
                    <label style={{ color: '#5C4033', fontWeight: 600, fontSize: '0.9rem', textTransform: 'uppercase' }}>Título da Obra</label>
                    <input type="text" className="input-classico" value={novoLivro.titulo} onChange={e => { setNovoLivro({...novoLivro, titulo: e.target.value}); setErroValidacaoCriar(false); }} required />
                  </div>
                  <div>
                    <label style={{ color: '#5C4033', fontWeight: 600, fontSize: '0.9rem', textTransform: 'uppercase' }}>Autor</label>
                    <input type="text" className="input-classico" value={novoLivro.autor} onChange={e => { setNovoLivro({...novoLivro, autor: e.target.value}); setErroValidacaoCriar(false); }} required />
                  </div>
                  <div>
                    <label style={{ color: '#5C4033', fontWeight: 600, fontSize: '0.9rem', textTransform: 'uppercase' }}>ISBN</label>
                    <input type="text" className="input-classico" value={novoLivro.isbn} onChange={e => { setNovoLivro({...novoLivro, isbn: e.target.value}); setErroValidacaoCriar(false); }} required />
                  </div>
                  <div>
                    <label style={{ color: '#5C4033', fontWeight: 600, fontSize: '0.9rem', textTransform: 'uppercase' }}>Gênero/Categoria</label>
                    <input type="text" className="input-classico" value={novoLivro.categoria} onChange={e => { setNovoLivro({...novoLivro, categoria: e.target.value}); setErroValidacaoCriar(false); }} required />
                  </div>
                  <div>
                    <label style={{ color: '#5C4033', fontWeight: 600, fontSize: '0.9rem', textTransform: 'uppercase' }}>Ano (Ex: 1954)</label>
                    <input type="number" className="input-classico" value={novoLivro.ano_publicacao} onChange={e => { setNovoLivro({...novoLivro, ano_publicacao: e.target.value}); setErroValidacaoCriar(false); }} required />
                  </div>
                  <div>
                    <label style={{ color: '#5C4033', fontWeight: 600, fontSize: '0.9rem', textTransform: 'uppercase' }}>Quantidade Inicial (Estoque)</label>
                    <input type="number" className="input-classico" value={novoLivro.quantidade_total} onChange={e => { setNovoLivro({...novoLivro, quantidade_total: parseInt(e.target.value)}); setErroValidacaoCriar(false); }} min="1" required />
                  </div>
                  <div>
                    <label style={{ color: '#5C4033', fontWeight: 600, fontSize: '0.9rem', textTransform: 'uppercase' }}>ID da Biblioteca Origem</label>
                    <input type="number" className="input-classico" value={novoLivro.id_biblioteca} onChange={e => { setNovoLivro({...novoLivro, id_biblioteca: parseInt(e.target.value)}); setErroValidacaoCriar(false); }} min="1" required />
                  </div>
                  
                  <div style={{ gridColumn: '1 / -1', display: 'flex', justifyContent: 'flex-end', marginTop: '16px' }}>
                    <button type="submit" className="btn-animado" style={{
                      backgroundColor: '#1e3a8a',
                      color: '#f1ebd9',
                      padding: '12px 32px',
                      borderRadius: '4px',
                      fontWeight: 700,
                      border: '1px solid #1e3a8a',
                      fontFamily: '"Times New Roman", Times, serif',
                      letterSpacing: '1px'
                    }}>
                      Carimbar Registro
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        )}

        {/* Busca e Filtros (Gaveta) */}
        <section style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
            <div className="gaveta-busca" style={{ flex: 1 }}>
              <Search size={20} color="var(--cor-ouro-envelhecido)" />
              <input
                type="text"
                placeholder="Pesquisar no catálogo da biblioteca (título, autor, gênero)..."
                value={busca}
                onChange={e => setBusca(e.target.value)}
                style={{ width: '100%', height: '100%', backgroundColor: 'transparent', border: 'none', color: 'var(--cor-texto)' }}
              />
            </div>
            <button onClick={() => setMostrarFiltros(!mostrarFiltros)} className="card-glass btn-animado" style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '12px 18px',
              borderRadius: 'var(--raio-borda-md)',
              border: `1px solid ${mostrarFiltros ? 'var(--cor-ouro-envelhecido)' : 'var(--cor-borda)'}`,
              color: mostrarFiltros ? 'var(--cor-ouro-envelhecido)' : 'var(--cor-texto-secundario)'
            }}>
              <Filter size={18} />
              <span>Filtros</span>
            </button>
          </div>

          <div className="pasta-filtros" style={{
            maxHeight: mostrarFiltros ? '300px' : '0',
            opacity: mostrarFiltros ? 1 : 0,
            padding: mostrarFiltros ? '16px' : '0 16px',
            pointerEvents: mostrarFiltros ? 'auto' : 'none',
            borderWidth: mostrarFiltros ? '1px' : '0',
            display: 'flex',
            gap: '12px',
            flexWrap: 'wrap'
          }}>
            <button className="chip-filtro" onClick={() => setFiltroCategoria('')} style={{ backgroundColor: filtroCategoria === '' ? 'var(--cor-ouro-envelhecido)' : '' }}>Todos os Gêneros</button>
            <button className="chip-filtro" onClick={() => setFiltroCategoria('Ficção')} style={{ backgroundColor: filtroCategoria === 'Ficção' ? 'var(--cor-ouro-envelhecido)' : '' }}>Ficção</button>
            <button className="chip-filtro" onClick={() => setFiltroCategoria('Fantasia')} style={{ backgroundColor: filtroCategoria === 'Fantasia' ? 'var(--cor-ouro-envelhecido)' : '' }}>Fantasia</button>
            <button className="chip-filtro" onClick={() => setFiltroCategoria('Técnico')} style={{ backgroundColor: filtroCategoria === 'Técnico' ? 'var(--cor-ouro-envelhecido)' : '' }}>Técnico</button>
            <button className="chip-filtro" onClick={() => setFiltroCategoria('Romance')} style={{ backgroundColor: filtroCategoria === 'Romance' ? 'var(--cor-ouro-envelhecido)' : '' }}>Romance</button>
          </div>
        </section>

        {/* Listagem de Livros e Skeletons (Fase 6) */}
        <section>
          {carregando && pagina === 1 ? (
            <div className="grid-prateleira">
              {[...Array(8)].map((_, index) => (
                <div key={index} className="prateleira-base">
                  <div className="skeleton-livro"></div>
                </div>
              ))}
            </div>
          ) : livrosFiltrados.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '64px 0', color: 'var(--cor-texto-secundario)' }}>
              <BookOpen size={48} color="var(--cor-borda)" style={{ marginBottom: '16px', opacity: 0.5 }} />
              <p style={{ fontSize: '1.2rem', fontFamily: '"Times New Roman", Times, serif' }}>
                Nenhum tomo antigo encontrado neste corredor. Tente pesquisar por outro título.
              </p>
            </div>
          ) : (
            <>
              <div className="grid-prateleira">
                {livrosFiltrados.map((livro, index) => {
                  const ref = (index === livrosFiltrados.length - 1) ? ultimoLivroReferencia : null;
                  
                  return (
                    <div key={livro.id} className="prateleira-base" ref={ref}>
                      <div className="perspectiva-wrapper" onClick={() => setLivroSelecionado(livro)}>
                        <div className="livro-3d">
                          <div className="capa-livro">
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                              <span style={{
                                fontSize: '0.65rem',
                                fontWeight: 600,
                                backgroundColor: 'rgba(0,0,0,0.4)',
                                color: 'var(--cor-ouro-envelhecido)',
                                padding: '4px 8px',
                                borderRadius: '4px',
                                border: '1px solid rgba(212,175,55,0.3)'
                              }}>
                                {livro.categoria.toUpperCase()}
                              </span>
                            </div>

                        <h3 style={{ fontSize: '1.1rem', fontWeight: 800, marginTop: 'auto', marginBottom: '4px', lineHeight: 1.2, color: '#f8f4e6', textShadow: '1px 1px 2px rgba(0,0,0,0.8)' }}>
                          {livro.titulo}
                        </h3>
                        <p style={{ fontSize: '0.75rem', color: '#d1c7a3', fontWeight: 600, marginBottom: '24px' }}>
                          {livro.autor}
                        </p>

                        <div style={{ alignSelf: 'flex-end', marginTop: 'auto' }}>
                          {livro.quantidade_disponivel > 0 ? (
                            <span className="carimbo-disponivel">Disponível</span>
                          ) : (
                            <span className="carimbo-reservado">Fila de Espera</span>
                          )}
                        </div>
                      </div>
                      <div className="lombada-livro">
                        <span style={{ 
                          color: 'var(--cor-ouro-envelhecido)', 
                          fontSize: '0.6rem', 
                          fontWeight: 700, 
                          writingMode: 'vertical-rl', 
                          transform: 'rotate(180deg)', 
                          height: '100%', 
                          display: 'flex', 
                          alignItems: 'center', 
                          justifyContent: 'center',
                          padding: '16px 0',
                          opacity: 0.7
                        }}>
                          {livro.titulo.length > 20 ? livro.titulo.substring(0, 20) + '...' : livro.titulo}
                        </span>
                      </div>
                      <div className="paginas-livro"></div>
                    </div>
                  </div>
                </div>
              );
                })}
              </div>
              
              {/* Skeletons adicionais ao final da lista de carregamento paginado */}
              {carregandoMais && (
                <div className="grid-prateleira" style={{ marginTop: '24px' }}>
                  {[...Array(4)].map((_, index) => (
                    <div key={`more-${index}`} className="prateleira-base">
                      <div className="skeleton-livro"></div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </section>

      </div>

      {/* MODAL FICHA TÉCNICA (FASE 3) */}
      {livroSelecionado && (
        <div className="modal-fundo" onClick={fecharModal}>
          <div className="ficha-polen" onClick={e => e.stopPropagation()}>
            <button className="ficha-fechar" onClick={fecharModal}>
              <X size={28} />
            </button>

            {/* Carimbo de Status de Requisição Dinâmico */}
            {statusRequisicao && (
              <div className={`carimbo-status-modal ${
                statusRequisicao.tipo === 'sucesso' ? 'carimbo-disponivel' : 
                statusRequisicao.tipo === 'erro' ? 'carimbo-emprestado' : 'carimbo-reservado'
              }`}>
                {statusRequisicao.mensagem}
              </div>
            )}

            <div className="ficha-titulo">{livroSelecionado.titulo}</div>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
              <div className="ficha-dado"><strong>Autor:</strong><br/>{livroSelecionado.autor}</div>
              <div className="ficha-dado"><strong>Categoria:</strong><br/>{livroSelecionado.categoria}</div>
              <div className="ficha-dado"><strong>Ano:</strong><br/>{livroSelecionado.ano_publicacao || 'Desconhecido'}</div>
              <div className="ficha-dado"><strong>ISBN:</strong><br/>{livroSelecionado.isbn}</div>
            </div>

            <div className="ficha-dado" style={{ borderTop: '1px solid rgba(139, 115, 85, 0.3)', paddingTop: '16px' }}>
              <strong>Status do Acervo:</strong><br/>
              Biblioteca ID: {livroSelecionado.id_biblioteca} — {livroSelecionado.quantidade_disponivel} cópias disponíveis de {livroSelecionado.quantidade_total}.
            </div>

            <div className="ficha-acoes">
              {usuario?.permissao === 'administrador' ? (
                <div style={{ textAlign: 'center', color: '#5C4033', fontStyle: 'italic', padding: '8px', fontSize: '0.9rem' }}>
                  Como <strong>Administrador</strong>, seu perfil destina-se a gerenciar o acervo. <br/>Faça login como <strong>Membro</strong> para solicitar empréstimos ou entrar na fila.
                </div>
              ) : livroSelecionado.quantidade_disponivel > 0 ? (
                <button 
                  className="btn-solicitar"
                  onClick={() => solicitarEmprestimo(livroSelecionado)}
                  disabled={processandoRequisicao}
                  style={{ opacity: processandoRequisicao ? 0.7 : 1 }}
                >
                  {processandoRequisicao ? 'Carimbando...' : 'Solicitar Empréstimo'}
                </button>
              ) : (
                <button 
                  className="btn-fila"
                  onClick={() => entrarNaFila(livroSelecionado)}
                  disabled={processandoRequisicao}
                  style={{ opacity: processandoRequisicao ? 0.7 : 1 }}
                >
                  {processandoRequisicao ? 'Assinando...' : 'Entrar na Fila de Espera'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

    </Layout>
  );
};

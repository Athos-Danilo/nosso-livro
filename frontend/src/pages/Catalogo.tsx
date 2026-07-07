import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Layout } from '../components/Layout';
import { api } from '../services/api';
import { BookOpen, Search, Plus, Filter, BookMarked, Library, X, CheckCircle, Clock } from 'lucide-react';
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
  const [novoTitulo, setNovoTitulo] = useState('');
  const [novoAutor, setNovoAutor] = useState('');
  const [novoIsbn, setNovoIsbn] = useState('');
  const [novaCategoria, setNovaCategoria] = useState('');
  const [novoAno, setNovoAno] = useState<number | ''>('');
  const [novaQtd, setNovaQtd] = useState<number>(1);
  const [idBiblioteca, setIdBiblioteca] = useState<number>(1);
  const [erroCriar, setErroCriar] = useState('');
  const [sucessoCriar, setSucessoCriar] = useState('');

  // Fases 3 e 4: Estados do Modal e Integração
  const [livroSelecionado, setLivroSelecionado] = useState<Livro | null>(null);
  const [processandoRequisicao, setProcessandoRequisicao] = useState(false);
  const [statusRequisicao, setStatusRequisicao] = useState<{ tipo: 'sucesso' | 'erro' | 'fila', mensagem: string } | null>(null);

  const carregarLivros = async () => {
    setCarregando(true);
    try {
      const resposta = await api.get('/api/livros/');
      setLivros(resposta.data);
    } catch (erro) {
      console.error('Erro ao buscar catálogo de livros:', erro);
    } finally {
      setCarregando(false);
    }
  };

  useEffect(() => {
    carregarLivros();
  }, []);

  const handleCriarLivro = async (e: React.FormEvent) => {
    e.preventDefault();
    setErroCriar('');
    setSucessoCriar('');

    if (!novoTitulo || !novoAutor || !novoIsbn || !novaCategoria) {
      setErroCriar('Preencha os campos obrigatórios.');
      return;
    }

    try {
      await api.post('/api/livros/', {
        titulo: novoTitulo,
        autor: novoAutor,
        isbn: novoIsbn,
        categoria: novaCategoria,
        ano_publicacao: novoAno !== '' ? Number(novoAno) : null,
        quantidade_total: Number(novaQtd),
        quantidade_disponivel: Number(novaQtd),
        id_biblioteca: Number(idBiblioteca)
      });
      setSucessoCriar('Livro cadastrado com sucesso!');
      
      // Limpa formulário
      setNovoTitulo('');
      setNovoAutor('');
      setNovoIsbn('');
      setNovaCategoria('');
      setNovoAno('');
      setNovaQtd(1);
      
      carregarLivros(); // Recarrega catálogo
    } catch (erro: any) {
      setErroCriar(erro.response?.data?.detail || 'Erro ao cadastrar livro.');
    }
  };

  const livrosFiltrados = livros.filter(livro => {
    const matchBusca = livro.titulo.toLowerCase().includes(busca.toLowerCase()) ||
                       livro.autor.toLowerCase().includes(busca.toLowerCase()) ||
                       livro.categoria.toLowerCase().includes(busca.toLowerCase());
    
    const matchCategoria = filtroCategoria ? livro.categoria.toLowerCase() === filtroCategoria.toLowerCase() : true;

    return matchBusca && matchCategoria;
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
      carregarLivros(); // Atualiza quantidades
    } catch (erro: any) {
      setStatusRequisicao({ tipo: 'erro', mensagem: erro.response?.data?.erro || 'Erro ao solicitar empréstimo' });
    } finally {
      setProcessandoRequisicao(false);
    }
  };

  const entrarNaFila = async (livro: Livro) => {
    setProcessandoRequisicao(true);
    setStatusRequisicao(null);
    try {
      const res = await api.post('/api/reservas', {
        idLivro: String(livro.id)
      });
      setStatusRequisicao({ tipo: 'fila', mensagem: 'VOCÊ ENTROU NA FILA' });
      // Idealmente pegar a posição na fila do res.data, mas vamos apenas confirmar sucesso
      carregarLivros();
    } catch (erro: any) {
      setStatusRequisicao({ tipo: 'erro', mensagem: erro.response?.data?.mensagem || 'Erro ao entrar na fila' });
    } finally {
      setProcessandoRequisicao(false);
    }
  };

  return (
    <Layout>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
        
        {/* Cabeçalho */}
        <section style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 style={{ fontSize: '2rem', fontWeight: 700 }}>Catálogo de Livros</h1>
            <p style={{ color: 'var(--cor-texto-secundario)' }}>Explore e gerencie o acervo da biblioteca compartilhada</p>
          </div>
          
          {usuario?.permissao === 'administrador' && (
            <button
              onClick={() => setMostrarCriar(!mostrarCriar)}
              className="btn-animado"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                backgroundColor: 'var(--cor-primaria)',
                color: 'var(--cor-fundo)',
                padding: '12px 20px',
                borderRadius: 'var(--raio-borda-md)',
                fontWeight: 600
              }}
            >
              <Plus size={20} />
              <span>Novo Livro</span>
            </button>
          )}
        </section>

        {/* Formulário de Criação Rápida (Admin) */}
        {usuario?.permissao === 'administrador' && mostrarCriar && (
          <section className="card-glass" style={{ padding: '30px', border: '1px solid var(--cor-borda)' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '20px' }}>Cadastrar Novo Livro Físico</h3>
            
            {erroCriar && (
              <div style={{ padding: '12px', backgroundColor: 'rgba(239, 68, 68, 0.1)', color: 'var(--cor-erro)', borderRadius: 'var(--raio-borda-md)', border: '1px solid var(--cor-erro)', marginBottom: '16px', fontSize: '0.9rem' }}>
                {erroCriar}
              </div>
            )}
            {sucessoCriar && (
              <div style={{ padding: '12px', backgroundColor: 'rgba(34, 197, 94, 0.1)', color: 'var(--cor-sucesso)', borderRadius: 'var(--raio-borda-md)', border: '1px solid var(--cor-sucesso)', marginBottom: '16px', fontSize: '0.9rem' }}>
                {sucessoCriar}
              </div>
            )}

            <form onSubmit={handleCriarLivro} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '0.85rem', color: 'var(--cor-texto-secundario)' }}>Título *</label>
                <input style={{ backgroundColor: 'var(--cor-fundo)', border: '1px solid var(--cor-borda)', padding: '10px 14px', borderRadius: 'var(--raio-borda-md)' }} type="text" value={novoTitulo} onChange={e => setNovoTitulo(e.target.value)} placeholder="Título do livro" required />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '0.85rem', color: 'var(--cor-texto-secundario)' }}>Autor *</label>
                <input style={{ backgroundColor: 'var(--cor-fundo)', border: '1px solid var(--cor-borda)', padding: '10px 14px', borderRadius: 'var(--raio-borda-md)' }} type="text" value={novoAutor} onChange={e => setNovoAutor(e.target.value)} placeholder="Autor do livro" required />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '0.85rem', color: 'var(--cor-texto-secundario)' }}>ISBN (Apenas números) *</label>
                <input style={{ backgroundColor: 'var(--cor-fundo)', border: '1px solid var(--cor-borda)', padding: '10px 14px', borderRadius: 'var(--raio-borda-md)' }} type="text" value={novoIsbn} onChange={e => setNovoIsbn(e.target.value)} placeholder="97885..." required />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '0.85rem', color: 'var(--cor-texto-secundario)' }}>Categoria *</label>
                <input style={{ backgroundColor: 'var(--cor-fundo)', border: '1px solid var(--cor-borda)', padding: '10px 14px', borderRadius: 'var(--raio-borda-md)' }} type="text" value={novaCategoria} onChange={e => setNovaCategoria(e.target.value)} placeholder="Ficção, Técnico..." required />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '0.85rem', color: 'var(--cor-texto-secundario)' }}>Ano de Publicação</label>
                <input style={{ backgroundColor: 'var(--cor-fundo)', border: '1px solid var(--cor-borda)', padding: '10px 14px', borderRadius: 'var(--raio-borda-md)' }} type="number" value={novoAno} onChange={e => setNovoAno(e.target.value !== '' ? Number(e.target.value) : '')} placeholder="2020" />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '0.85rem', color: 'var(--cor-texto-secundario)' }}>Quantidade de Cópias</label>
                <input style={{ backgroundColor: 'var(--cor-fundo)', border: '1px solid var(--cor-borda)', padding: '10px 14px', borderRadius: 'var(--raio-borda-md)' }} type="number" min="1" value={novaQtd} onChange={e => setNovaQtd(Number(e.target.value))} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '0.85rem', color: 'var(--cor-texto-secundario)' }}>Biblioteca Coleta ID</label>
                <input style={{ backgroundColor: 'var(--cor-fundo)', border: '1px solid var(--cor-borda)', padding: '10px 14px', borderRadius: 'var(--raio-borda-md)' }} type="number" min="1" value={idBiblioteca} onChange={e => setIdBiblioteca(Number(e.target.value))} />
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                <button type="submit" className="btn-animado" style={{ backgroundColor: 'var(--cor-primaria)', color: 'var(--cor-fundo)', fontWeight: 600, padding: '12px', borderRadius: 'var(--raio-borda-md)', width: '100%' }}>
                  Salvar no Acervo
                </button>
              </div>
            </form>
          </section>
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

          {/* Painel Expansível de Filtros */}
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

        {/* Listagem de Livros */}
        <section>
          {carregando ? (
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--cor-texto-secundario)' }}>
              Carregando catálogo de livros...
            </div>
          ) : livrosFiltrados.length === 0 ? (
            <div className="card-glass" style={{ textAlign: 'center', padding: '60px', border: '1px solid var(--cor-borda)' }}>
              <BookMarked size={48} color="var(--cor-texto-desativado)" style={{ margin: '0 auto 16px auto' }} />
              <h3>Nenhum livro localizado</h3>
              <p style={{ color: 'var(--cor-texto-secundario)', marginTop: '8px' }}>
                Nenhum título foi cadastrado ou condiz com os termos da busca.
              </p>
            </div>
          ) : (
            <div className="grid-prateleira">
              {livrosFiltrados.map((livro) => (
                <div key={livro.id} className="prateleira-base">
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
              ))}
            </div>
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
              {livroSelecionado.quantidade_disponivel > 0 ? (
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

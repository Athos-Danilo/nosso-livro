import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Layout } from '../components/Layout';
import { api } from '../services/api';
import { BookOpen, Search, Plus, Filter, BookMarked, Library } from 'lucide-react';
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

  const livrosFiltrados = livros.filter(livro => 
    livro.titulo.toLowerCase().includes(busca.toLowerCase()) ||
    livro.autor.toLowerCase().includes(busca.toLowerCase()) ||
    livro.categoria.toLowerCase().includes(busca.toLowerCase())
  );

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

        {/* Busca e Filtros */}
        <section style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
          <div className="efeito-glow" style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            backgroundColor: 'var(--cor-card)',
            border: '1px solid var(--cor-borda)',
            padding: '12px 16px',
            borderRadius: 'var(--raio-borda-md)',
            flex: 1
          }}>
            <Search size={18} color="var(--cor-texto-desativado)" />
            <input
              type="text"
              placeholder="Pesquisar por título, autor ou categoria..."
              value={busca}
              onChange={e => setBusca(e.target.value)}
              style={{ width: '100%', height: '100%' }}
            />
          </div>
          <button className="card-glass btn-animado" style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '12px 18px',
            borderRadius: 'var(--raio-borda-md)',
            border: '1px solid var(--cor-borda)',
            color: 'var(--cor-texto-secundario)'
          }}>
            <Filter size={18} />
            <span>Filtros</span>
          </button>
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
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
              gap: '24px'
            }}>
              {livrosFiltrados.map((livro) => (
                <div key={livro.id} className="card-glass" style={{
                  padding: '24px',
                  border: '1px solid var(--cor-borda)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '16px',
                  justifyContent: 'space-between'
                }}>
                  <div>
                    {/* Capa do Livro (Simulada) */}
                    <div style={{
                      backgroundColor: 'var(--cor-card-hover)',
                      height: '180px',
                      borderRadius: 'var(--raio-borda-md)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      border: '1px solid var(--cor-borda)',
                      marginBottom: '16px'
                    }}>
                      <BookOpen size={48} color="var(--cor-texto-desativado)" />
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
                      <span style={{
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        backgroundColor: 'var(--cor-card-hover)',
                        color: 'var(--cor-primaria)',
                        padding: '4px 8px',
                        borderRadius: 'var(--raio-borda-sm)'
                      }}>
                        {livro.categoria}
                      </span>
                      <span style={{
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        color: livro.quantidade_disponivel > 0 ? 'var(--cor-sucesso)' : 'var(--cor-erro)'
                      }}>
                        {livro.quantidade_disponivel > 0 ? `${livro.quantidade_disponivel} disponíveis` : 'Fila de Espera'}
                      </span>
                    </div>

                    <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginTop: '12px', lineHeight: 1.3 }}>{livro.titulo}</h3>
                    <p style={{ fontSize: '0.85rem', color: 'var(--cor-texto-secundario)', marginTop: '4px' }}>Por {livro.autor}</p>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem', color: 'var(--cor-texto-secundario)' }}>
                      <Library size={14} color="var(--cor-acento)" />
                      <span>{livro.biblioteca?.nome || `Biblioteca (ID: ${livro.id_biblioteca})`}</span>
                    </div>

                    <button
                      className="btn-animado"
                      style={{
                        backgroundColor: 'transparent',
                        border: '1px solid var(--cor-primaria)',
                        color: 'var(--cor-primaria)',
                        padding: '10px',
                        borderRadius: 'var(--raio-borda-md)',
                        fontWeight: 600,
                        textAlign: 'center',
                        fontSize: '0.875rem'
                      }}
                    >
                      {livro.quantidade_disponivel > 0 ? 'Solicitar Empréstimo' : 'Entrar na Fila'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

      </div>
    </Layout>
  );
};

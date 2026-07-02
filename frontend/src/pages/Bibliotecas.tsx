import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Layout } from '../components/Layout';
import { api } from '../services/api';
import { Library, Plus, MapPin, CheckCircle, AlertCircle } from 'lucide-react';
import '../styles/index.css';

interface Biblioteca {
  id: number;
  nome: string;
  localizacao: string;
  ativo: boolean;
  criado_em: string;
}

export const Bibliotecas: React.FC = () => {
  const { usuario } = useAuth();
  const [bibliotecas, setBibliotecas] = useState<Biblioteca[]>([]);
  const [carregando, setCarregando] = useState(true);

  // Form de criação
  const [mostrarCriar, setMostrarCriar] = useState(false);
  const [nome, setNome] = useState('');
  const [localizacao, setLocalizacao] = useState('');
  const [erro, setErro] = useState('');
  const [sucesso, setSucesso] = useState('');

  const carregarBibliotecas = async () => {
    setCarregando(true);
    try {
      const resposta = await api.get('/api/bibliotecas/');
      setBibliotecas(resposta.data);
    } catch (erro) {
      console.error('Falha ao buscar bibliotecas do catálogo:', erro);
    } finally {
      setCarregando(false);
    }
  };

  useEffect(() => {
    carregarBibliotecas();
  }, []);

  const handleCriarBiblioteca = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro('');
    setSucesso('');

    if (!nome || !localizacao) {
      setErro('Preencha todos os campos obrigatórios.');
      return;
    }

    try {
      await api.post('/api/bibliotecas/', { nome, localizacao });
      setSucesso('Biblioteca cadastrada com sucesso!');
      setNome('');
      setLocalizacao('');
      carregarBibliotecas();
    } catch (err: any) {
      setErro(err.response?.data?.detail || 'Erro ao cadastrar biblioteca.');
    }
  };

  return (
    <Layout>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
        
        {/* Cabeçalho */}
        <section style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 style={{ fontSize: '2rem', fontWeight: 700 }}>Bibliotecas Físicas</h1>
            <p style={{ color: 'var(--cor-texto-secundario)' }}>Gerencie os pontos de retirada e devolução de livros do monorepo</p>
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
              <span>Nova Biblioteca</span>
            </button>
          )}
        </section>

        {/* Formulário de Nova Biblioteca */}
        {usuario?.permissao === 'administrador' && mostrarCriar && (
          <section className="card-glass" style={{ padding: '30px', border: '1px solid var(--cor-borda)' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '20px' }}>Cadastrar Nova Biblioteca Física</h3>

            {erro && (
              <div style={{ padding: '12px', backgroundColor: 'rgba(239, 68, 68, 0.1)', color: 'var(--cor-erro)', borderRadius: 'var(--raio-borda-md)', border: '1px solid var(--cor-erro)', marginBottom: '16px', fontSize: '0.9rem', display: 'flex', gap: '8px', alignItems: 'center' }}>
                <AlertCircle size={16} />
                <span>{erro}</span>
              </div>
            )}
            {sucesso && (
              <div style={{ padding: '12px', backgroundColor: 'rgba(34, 197, 94, 0.1)', color: 'var(--cor-sucesso)', borderRadius: 'var(--raio-borda-md)', border: '1px solid var(--cor-sucesso)', marginBottom: '16px', fontSize: '0.9rem', display: 'flex', gap: '8px', alignItems: 'center' }}>
                <CheckCircle size={16} />
                <span>{sucesso}</span>
              </div>
            )}

            <form onSubmit={handleCriarBiblioteca} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px', alignItems: 'flex-end' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '0.85rem', color: 'var(--cor-texto-secundario)' }}>Nome da Biblioteca *</label>
                <input style={{ backgroundColor: 'var(--cor-fundo)', border: '1px solid var(--cor-borda)', padding: '10px 14px', borderRadius: 'var(--raio-borda-md)' }} type="text" value={nome} onChange={e => setNome(e.target.value)} placeholder="Ex: Biblioteca Setorial de Tecnologia" required />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '0.85rem', color: 'var(--cor-texto-secundario)' }}>Localização Física *</label>
                <input style={{ backgroundColor: 'var(--cor-fundo)', border: '1px solid var(--cor-borda)', padding: '10px 14px', borderRadius: 'var(--raio-borda-md)' }} type="text" value={localizacao} onChange={e => setLocalizacao(e.target.value)} placeholder="Ex: Bloco B, 2º Andar" required />
              </div>
              <div>
                <button type="submit" className="btn-animado" style={{ backgroundColor: 'var(--cor-primaria)', color: 'var(--cor-fundo)', fontWeight: 600, padding: '12px', borderRadius: 'var(--raio-borda-md)', width: '100%' }}>
                  Salvar Biblioteca
                </button>
              </div>
            </form>
          </section>
        )}

        {/* Listagem */}
        <section>
          {carregando ? (
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--cor-texto-secundario)' }}>
              Carregando bibliotecas físicas...
            </div>
          ) : bibliotecas.length === 0 ? (
            <div className="card-glass" style={{ textAlign: 'center', padding: '60px', border: '1px solid var(--cor-borda)' }}>
              <Library size={48} color="var(--cor-texto-desativado)" style={{ margin: '0 auto 16px auto' }} />
              <h3>Nenhuma biblioteca cadastrada</h3>
              <p style={{ color: 'var(--cor-texto-secundario)', marginTop: '8px' }}>
                Não foram encontrados pontos de retirada físicos cadastrados no sistema.
              </p>
            </div>
          ) : (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
              gap: '24px'
            }}>
              {bibliotecas.map((bib) => (
                <div key={bib.id} className="card-glass" style={{
                  padding: '24px',
                  border: '1px solid var(--cor-borda)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '16px'
                }}>
                  <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                    <div style={{
                      backgroundColor: 'rgba(59, 130, 246, 0.1)',
                      padding: '12px',
                      borderRadius: 'var(--raio-borda-md)',
                      color: 'var(--cor-primaria)'
                    }}>
                      <Library size={24} />
                    </div>
                    <div>
                      <h3 style={{ fontSize: '1.2rem', fontWeight: 700 }}>{bib.nome}</h3>
                      <span style={{
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        backgroundColor: bib.ativo ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                        color: bib.ativo ? 'var(--cor-sucesso)' : 'var(--cor-erro)',
                        padding: '2px 8px',
                        borderRadius: 'var(--raio-borda-sm)',
                        display: 'inline-block',
                        marginTop: '4px'
                      }}>
                        {bib.ativo ? 'Ativa' : 'Inativa'}
                      </span>
                    </div>
                  </div>

                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    fontSize: '0.875rem',
                    color: 'var(--cor-texto-secundario)',
                    borderTop: '1px solid var(--cor-borda)',
                    paddingTop: '16px',
                    marginTop: '8px'
                  }}>
                    <MapPin size={16} color="var(--cor-acento)" />
                    <span>{bib.localizacao}</span>
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

import pytest
import jwt
from httpx import AsyncClient
from app.esquemas.livro import CriarLivro

def gerar_token_mockado(permissao: str) -> str:
    """Gera um token JWT mockado com a permissão informada."""
    payload = {
        "sub": "usuario-teste-id",
        "permissao": permissao,
        "whatsapp": "5511999999999",
        "nome": "Usuário de Teste"
    }
    return jwt.encode(payload, "chave_de_teste", algorithm="HS256")

@pytest.mark.asyncio
async def test_criar_e_listar_biblioteca(cliente_http: AsyncClient):
    """Valida a criação de uma biblioteca física com sucesso e sua posterior listagem."""
    token_admin = gerar_token_mockado("administrador")
    cabecalhos = {"Authorization": f"Bearer {token_admin}"}
    
    dados_biblioteca = {
        "nome": "Biblioteca Central de Testes",
        "localizacao": "Prédio B, Sala 402"
    }
    
    # Cadastra a biblioteca como administrador
    resposta_criacao = await cliente_http.post(
        "/api/bibliotecas/",
        json=dados_biblioteca,
        headers=cabecalhos
    )
    assert resposta_criacao.status_code == 201
    dados_retorno = resposta_criacao.json()
    assert dados_retorno["nome"] == dados_biblioteca["nome"]
    assert dados_retorno["localizacao"] == dados_biblioteca["localizacao"]
    assert dados_retorno["ativo"] is True
    assert "id" in dados_retorno
    
    # Consulta a listagem pública de bibliotecas
    resposta_listagem = await cliente_http.get("/api/bibliotecas/")
    assert resposta_listagem.status_code == 200
    bibliotecas = resposta_listagem.json()
    assert len(bibliotecas) >= 1
    assert any(b["id"] == dados_retorno["id"] for b in bibliotecas)

@pytest.mark.asyncio
async def test_validacao_isbn_pydantic():
    """Valida que o validador de ISBN do Pydantic lança erros para formatos incorretos."""
    # ISBN com letras deve falhar
    with pytest.raises(ValueError, match="O ISBN deve conter apenas números."):
        CriarLivro(
            titulo="Livro Teste",
            autor="Autor Teste",
            isbn="123456789X",
            categoria="Ficção",
            quantidade_total=10,
            quantidade_disponivel=10,
            id_biblioteca=1
        )
        
    # ISBN com tamanho incorreto deve falhar
    with pytest.raises(ValueError, match="O ISBN deve ter exatamente 10 ou 13 dígitos."):
        CriarLivro(
            titulo="Livro Teste",
            autor="Autor Teste",
            isbn="12345",
            categoria="Ficção",
            quantidade_total=10,
            quantidade_disponivel=10,
            id_biblioteca=1
        )

@pytest.mark.asyncio
async def test_restricoes_seguranca_e_permissoes(cliente_http: AsyncClient):
    """Garante que rotas protegidas barram usuários sem privilégios de administrador."""
    dados_biblioteca = {
        "nome": "Biblioteca Proibida",
        "localizacao": "Setor Secreto"
    }
    
    # 1. Sem passar o token JWT (deve retornar 401 Unauthorized)
    resposta_sem_token = await cliente_http.post("/api/bibliotecas/", json=dados_biblioteca)
    assert resposta_sem_token.status_code == 401
    
    # 2. Com token de permissão normal "membro" (deve retornar 403 Forbidden)
    token_membro = gerar_token_mockado("membro")
    cabecalhos_membro = {"Authorization": f"Bearer {token_membro}"}
    resposta_membro = await cliente_http.post(
        "/api/bibliotecas/",
        json=dados_biblioteca,
        headers=cabecalhos_membro
    )
    assert resposta_membro.status_code == 403
    assert resposta_membro.json()["detail"] == "Acesso negado: esta operação exige privilégios de administrador."

@pytest.mark.asyncio
async def test_acesso_sucesso_administrador(cliente_http: AsyncClient):
    """Garante que um administrador autenticado consegue operar em rotas protegidas."""
    token_admin = gerar_token_mockado("administrador")
    cabecalhos = {"Authorization": f"Bearer {token_admin}"}
    
    # Cria uma biblioteca
    dados_biblioteca = {
        "nome": "Biblioteca Admin",
        "localizacao": "Sala do Diretor"
    }
    resposta_bib = await cliente_http.post(
        "/api/bibliotecas/",
        json=dados_biblioteca,
        headers=cabecalhos
    )
    assert resposta_bib.status_code == 201
    id_biblioteca = resposta_bib.json()["id"]
    
    # Cria um livro associado
    dados_livro = {
        "titulo": "FastAPI Seguro",
        "autor": "Engenheiro Sênior",
        "isbn": "9788575226476",
        "categoria": "Tecnologia",
        "quantidade_total": 5,
        "quantidade_disponivel": 5,
        "id_biblioteca": id_biblioteca
    }
    resposta_livro = await cliente_http.post(
        "/api/livros/",
        json=dados_livro,
        headers=cabecalhos
    )
    assert resposta_livro.status_code == 201
    assert resposta_livro.json()["titulo"] == "FastAPI Seguro"

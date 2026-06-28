from fastapi import Header, HTTPException, status, Depends
import jwt

async def obter_usuario_atual(authorization: str = Header(None)) -> dict:
    """
    Dependência para extrair e decodificar o usuário a partir do token JWT
    passado no cabeçalho 'Authorization'. O Gateway de API já realiza a
    validação da assinatura e expiração, portanto decodificamos o payload
    sem validação de assinatura para maior agilidade.
    """
    if not authorization:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Cabeçalho de autorização ausente."
        )
    
    try:
        # Trata o formato "Bearer <token>" ou token direto
        partes = authorization.split(" ")
        if len(partes) == 2 and partes[0].lower() == "bearer":
            token = partes[1]
        else:
            token = authorization
            
        # Decodifica o payload do JWT sem validar assinatura
        dados_decodificados = jwt.decode(token, options={"verify_signature": False})
        
        usuario_id = dados_decodificados.get("sub")
        permissao = dados_decodificados.get("permissao")
        whatsapp = dados_decodificados.get("whatsapp")
        nome = dados_decodificados.get("nome")
        
        if not usuario_id:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Token de autenticação inválido: identificador de usuário ausente."
            )
            
        return {
            "id": usuario_id,
            "permissao": permissao,
            "whatsapp": whatsapp,
            "nome": nome
        }
    except Exception as erro:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Token de autenticação inválido ou corrompido: {str(erro)}"
        )

async def exigir_administrador(usuario: dict = Depends(obter_usuario_atual)) -> dict:
    """
    Dependência que restringe o acesso a rotas apenas para usuários
    com a permissão de 'administrador'.
    """
    if usuario.get("permissao") != "administrador":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Acesso negado: esta operação exige privilégios de administrador."
        )
    return usuario

from fastapi import Header, HTTPException, status
import jwt

async def obter_usuario_atual(authorization: str = Header(None)) -> dict:
    """
    Extrai e decodifica os dados do usuário a partir do token JWT no cabeçalho.
    Como o Gateway de API valida a assinatura, apenas decodificamos o payload
    para maior agilidade e performance.
    """
    if not authorization:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Cabeçalho de autorização ausente."
        )
    
    try:
        partes = authorization.split(" ")
        if len(partes) == 2 and partes[0].lower() == "bearer":
            token = partes[1]
        else:
            token = authorization
            
        dados_decodificados = jwt.decode(token, options={"verify_signature": False})
        
        usuario_id = dados_decodificados.get("sub")
        nome = dados_decodificados.get("nome")
        permissao = dados_decodificados.get("permissao")
        
        if not usuario_id:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Token de autenticação inválido: identificador de usuário ausente."
            )
            
        return {
            "id": usuario_id,
            "nome": nome,
            "permissao": permissao
        }
    except Exception as erro:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Token de autenticação inválido ou corrompido: {str(erro)}"
        )

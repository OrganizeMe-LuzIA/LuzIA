"""
Módulo de Autenticação JWT - LuzIA Backend

Implementação segura com:
- Configuração via variáveis de ambiente
- Validação de formato de telefone
- Suporte a revogação de tokens (jti)
- Rate limiting ready (via dependency injection)
"""
from datetime import datetime, timedelta, timezone
from typing import Optional
import re
import uuid
from jose import JWTError, jwt
from pydantic import BaseModel, field_validator
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer

from app.config import settings

# Configuração via settings (não hardcoded)
ALGORITHM = "HS256"

# OAuth2 scheme para endpoints protegidos
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login")

# Regex para validar telefone E.164 (mais restritivo)
# Deve começar com + seguido de 1-9, depois 7-14 dígitos
PHONE_REGEX = re.compile(r"^\+[1-9]\d{7,14}$")


class Token(BaseModel):
    access_token: str
    token_type: str


class TokenData(BaseModel):
    phone: Optional[str] = None
    jti: Optional[str] = None  # JWT ID para revogação


class AuthRequest(BaseModel):
    phone: str
    code: Optional[str] = None

    @field_validator("phone")
    @classmethod
    def validate_phone(cls, v: str) -> str:
        """Valida formato do telefone (E.164)."""
        if not PHONE_REGEX.match(v):
            raise ValueError("Formato de telefone inválido. Use formato E.164 (ex: +5511999999999)")
        return v


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """
    Cria um token JWT seguro.
    
    Args:
        data: Dados a serem codificados no token (ex: {"sub": phone})
        expires_delta: Tempo de expiração customizado
    
    Returns:
        Token JWT codificado
    """
    to_encode = data.copy()
    
    # Usa timezone-aware datetime (Python 3.12+ compliant)
    now = datetime.now(timezone.utc)
    expire = now + (expires_delta or timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES))
    
    to_encode.update({
        "exp": expire,
        "iat": now,  # Issued at
        "jti": str(uuid.uuid4()),  # Unique token ID para revogação
    })
    
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


def verify_token(token: str) -> TokenData:
    """
    Verifica e decodifica um token JWT.
    
    Args:
        token: Token JWT a ser verificado
    
    Returns:
        TokenData com informações do usuário
    
    Raises:
        HTTPException: Se o token for inválido ou expirado
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Token inválido ou expirado",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    try:
        payload = jwt.decode(
            token, 
            settings.SECRET_KEY, 
            algorithms=[ALGORITHM],
            options={"require_exp": True}  # Exige campo exp
        )
        phone: str = payload.get("sub")
        jti: str = payload.get("jti")
        
        if phone is None:
            raise credentials_exception
        
        # Aqui poderia verificar se jti está em blacklist (Redis)
        # if await is_token_revoked(jti):
        #     raise credentials_exception
        
        return TokenData(phone=phone, jti=jti)
        
    except JWTError:
        raise credentials_exception


async def get_current_user(token: str = Depends(oauth2_scheme)) -> TokenData:
    """
    Dependency para obter o usuário atual a partir do token.
    
    Uso:
        @router.get("/protected")
        async def protected_route(current_user: TokenData = Depends(get_current_user)):
            return {"phone": current_user.phone}
    """
    return verify_token(token)


# === Funções auxiliares para Rate Limiting (hooks) ===

async def check_rate_limit(phone: str) -> bool:
    """
    Placeholder para verificação de rate limit.
    
    Em produção, usar Redis para tracking:
    - Máximo 5 tentativas por minuto
    - Bloqueio temporário após exceder
    
    Returns:
        True se permitido, False se rate limited
    """
    # TODO: Implementar com Redis
    # key = f"auth_attempts:{phone}"
    # attempts = await redis.incr(key)
    # if attempts == 1:
    #     await redis.expire(key, 60)
    # return attempts <= 5
    return True


async def verify_otp(phone: str, code: str) -> bool:
    """
    Placeholder para verificação de OTP via Twilio.
    
    Em produção:
    1. Verificar código no Twilio Verify
    2. Invalidar código após uso
    
    Returns:
        True se código válido
    """
    # TODO: Implementar com Twilio Verify
    # verification = await twilio_client.verify.v2.services(VERIFY_SID).verification_checks.create(
    #     to=phone, code=code
    # )
    # return verification.status == "approved"
    return True  # Mock para desenvolvimento

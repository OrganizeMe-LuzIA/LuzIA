"""
Módulo de Autenticação JWT - LuzIA Backend

Implementação segura com:
- Configuração via variáveis de ambiente
- Validação de formato de email
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
from passlib.context import CryptContext

from app.core.config import settings

# Configuração via settings (não hardcoded)
ALGORITHM = "HS256"

# OAuth2 scheme para endpoints protegidos
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login")

# Regex para validar email
EMAIL_REGEX = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")

# Contexto de hash de senha
# Usa PBKDF2-SHA256 para evitar dependência de backend nativo do bcrypt.
pwd_context = CryptContext(schemes=["pbkdf2_sha256"], deprecated="auto")


class Token(BaseModel):
    access_token: str
    token_type: str


class TokenData(BaseModel):
    sub: Optional[str] = None
    email: Optional[str] = None
    jti: Optional[str] = None  # JWT ID para revogação


class AuthRequest(BaseModel):
    email: str
    password: str

    @field_validator("email")
    @classmethod
    def validate_email(cls, value: str) -> str:
        normalized = (value or "").strip().lower()
        if not EMAIL_REGEX.match(normalized):
            raise ValueError("Formato de email inválido.")
        return normalized

    @field_validator("password")
    @classmethod
    def validate_password(cls, value: str) -> str:
        if len((value or "").strip()) < 6:
            raise ValueError("Senha deve ter pelo menos 6 caracteres.")
        return value


class RegisterCredentialsRequest(BaseModel):
    email: str
    password: str
    phone: str

    @field_validator("email")
    @classmethod
    def validate_email(cls, value: str) -> str:
        normalized = (value or "").strip().lower()
        if not EMAIL_REGEX.match(normalized):
            raise ValueError("Formato de email inválido.")
        return normalized

    @field_validator("password")
    @classmethod
    def validate_password(cls, value: str) -> str:
        if len((value or "").strip()) < 6:
            raise ValueError("Senha deve ter pelo menos 6 caracteres.")
        return value

    @field_validator("phone")
    @classmethod
    def validate_phone(cls, value: str) -> str:
        if not re.fullmatch(r"^\+\d{10,15}$", value or ""):
            raise ValueError("Telefone deve estar no formato E.164")
        return value


def hash_password(password: str) -> str:
    """Gera hash de senha para persistência no banco."""
    return pwd_context.hash(password)


def verify_password(plain_password: str, password_hash: Optional[str]) -> bool:
    """Compara senha em texto puro com hash armazenado."""
    if not password_hash:
        return False
    try:
        return pwd_context.verify(plain_password, password_hash)
    except Exception:
        return False


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """
    Cria um token JWT seguro.
    
    Args:
        data: Dados a serem codificados no token (ex: {"sub": email})
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
        sub: str = payload.get("sub")
        jti: str = payload.get("jti")

        if sub is None:
            raise credentials_exception
        
        # Aqui poderia verificar se jti está em blacklist (Redis)
        # if await is_token_revoked(jti):
        #     raise credentials_exception
        
        email = sub.lower() if "@" in sub else None
        return TokenData(sub=sub, email=email, jti=jti)
        
    except JWTError:
        raise credentials_exception


async def get_current_user(token: str = Depends(oauth2_scheme)) -> TokenData:
    """
    Dependency para obter o usuário atual a partir do token.
    
    Uso:
        @router.get("/protected")
        async def protected_route(current_user: TokenData = Depends(get_current_user)):
            return {"email": current_user.email}
    """
    return verify_token(token)


# === Funções auxiliares para Rate Limiting (hooks) ===

async def check_rate_limit(identifier: str) -> bool:
    """
    Placeholder para verificação de rate limit.
    
    Em produção, usar Redis para tracking:
    - Máximo 5 tentativas por minuto
    - Bloqueio temporário após exceder
    
    Returns:
        True se permitido, False se rate limited
    """
    # TODO: Implementar com Redis
    # key = f"auth_attempts:{identifier}"
    # attempts = await redis.incr(key)
    # if attempts == 1:
    #     await redis.expire(key, 60)
    # return attempts <= 5
    return True

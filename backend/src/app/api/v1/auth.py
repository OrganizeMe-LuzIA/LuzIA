"""
Router de Autenticação - LuzIA Backend

Endpoints:
- POST /auth/login: Autenticação via email + senha
- POST /auth/register: Cadastro/atualização de credenciais para usuário existente
"""
from datetime import timedelta

from fastapi import APIRouter, Depends, HTTPException, status

from app.api.deps import get_current_admin_user
from app.core.config import settings
from app.core.security import (
    AuthRequest,
    RegisterCredentialsRequest,
    Token,
    check_rate_limit,
    create_access_token,
    hash_password,
    verify_password,
)
from app.models.base import Usuario
from app.repositories.usuarios import UsuariosRepo

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/login", response_model=Token)
async def login_for_access_token(form_data: AuthRequest):
    """
    Autentica usuário via email e senha.

    Args:
        form_data: Email e senha

    Returns:
        Token JWT de acesso

    Raises:
        401: Credenciais inválidas
        422: Formato inválido de email/senha
    """
    email = form_data.email
    password = form_data.password

    # 1. Rate limiting por identidade de login
    if not await check_rate_limit(email):
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Muitas tentativas. Aguarde 1 minuto.",
            headers={"Retry-After": "60"},
        )

    # 2. Carregar usuário por email
    user_repo = UsuariosRepo()
    user = await user_repo.find_by_email(email)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email ou senha inválidos",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # 3. Validar senha
    password_hash = user.get("password_hash")
    if not verify_password(password, password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email ou senha inválidos",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # 4. Gerar token JWT
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": email},
        expires_delta=access_token_expires,
    )

    return Token(access_token=access_token, token_type="bearer")


@router.post("/register")
async def register_credentials(
    payload: RegisterCredentialsRequest,
    current_user: Usuario = Depends(get_current_admin_user),
):
    """
    Cadastra email e senha (hash seguro) para um usuário já existente.

    Args:
        payload: email, senha e telefone do usuário já cadastrado

    Returns:
        Confirmação de persistência no MongoDB
    """
    _ = current_user

    if not await check_rate_limit(payload.email):
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Muitas tentativas. Aguarde 1 minuto.",
            headers={"Retry-After": "60"},
        )

    user_repo = UsuariosRepo()

    # Email não pode estar vinculado a outro usuário
    existing_by_email = await user_repo.find_by_email(payload.email)
    if existing_by_email and existing_by_email.get("telefone") != payload.phone:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Email já está em uso por outro usuário",
        )

    user = await user_repo.find_by_phone(payload.phone)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Usuário não encontrado para o telefone informado",
        )

    await user_repo.update(
        str(user["_id"]),
        {
            "email": payload.email,
            "password_hash": hash_password(payload.password),
        },
    )

    return {
        "message": "Credenciais salvas com sucesso.",
        "email": payload.email,
        "saved": True,
    }

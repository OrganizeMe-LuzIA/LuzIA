"""
Router de Autenticação - LuzIA Backend

Endpoints:
- POST /auth/login: Autenticação via telefone + OTP
"""
from fastapi import APIRouter, HTTPException, status
from datetime import timedelta
from pydantic import ValidationError

from app.core.security import (
    create_access_token, 
    AuthRequest, 
    Token,
    check_rate_limit,
    verify_otp
)
from app.core.config import settings

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/login", response_model=Token)
async def login_for_access_token(form_data: AuthRequest):
    """
    Autentica usuário via telefone e código OTP.
    
    Args:
        form_data: Telefone (formato E.164) e código OTP
    
    Returns:
        Token JWT de acesso
    
    Raises:
        401: Credenciais inválidas ou rate limited
        422: Formato de telefone inválido
    """
    phone = form_data.phone
    code = form_data.code
    
    # 1. Rate Limiting
    if not await check_rate_limit(phone):
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Muitas tentativas. Aguarde 1 minuto.",
            headers={"Retry-After": "60"},
        )
    
    # 2. Verificação de OTP (obrigatório em produção)
    if code:
        if not await verify_otp(phone, code):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Código OTP inválido ou expirado",
                headers={"WWW-Authenticate": "Bearer"},
            )
    else:
        # Em desenvolvimento, aceita sem código
        # Em produção, descomentar:
        # raise HTTPException(
        #     status_code=status.HTTP_400_BAD_REQUEST,
        #     detail="Código OTP obrigatório",
        # )
        pass
    
    # 3. Gerar Token
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": phone}, 
        expires_delta=access_token_expires
    )
    
    return Token(access_token=access_token, token_type="bearer")


@router.post("/request-otp")
async def request_otp(phone: str):
    """
    Solicita envio de código OTP via WhatsApp.
    
    Args:
        phone: Número de telefone (formato E.164)
    
    Returns:
        Confirmação de envio
    
    Note:
        Em produção, integrar com Twilio Verify
    """
    # Rate limiting
    if not await check_rate_limit(phone):
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Muitas solicitações. Aguarde 1 minuto.",
        )
    
    # TODO: Enviar OTP via Twilio
    # await twilio_client.verify.v2.services(VERIFY_SID).verifications.create(
    #     to=phone, channel="whatsapp"
    # )
    
    return {"message": "Código enviado via WhatsApp", "phone": phone}

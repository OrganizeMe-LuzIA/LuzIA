"""
Testes de Autenticação - LuzIA Backend

Testa:
- Criação e verificação de tokens JWT
- Validação de formato de telefone
- Tokens expirados/inválidos
"""
import pytest
from datetime import timedelta
from jose import jwt
from pydantic import ValidationError

from app.core.security import (
    create_access_token, 
    verify_token, 
    AuthRequest,
    TokenData,
    ALGORITHM
)
from app.core.config import settings


class TestAuthRequest:
    """Testes de validação do AuthRequest."""
    
    def test_valid_phone_formats(self):
        """Telefones válidos no formato E.164."""
        valid_phones = [
            "+5511999999999",
            "+14155551234",
            "+442071234567",
        ]
        for phone in valid_phones:
            req = AuthRequest(phone=phone)
            assert req.phone == phone
    
    def test_invalid_phone_formats(self):
        """Telefones inválidos devem falhar validação."""
        invalid_phones = [
            "abc123",
            "123",
            "+0123456789",  # Não pode começar com 0 após +
            "phone@email.com",
            "5511999999999",  # Sem + é inválido
            "+1",  # Muito curto
        ]
        for phone in invalid_phones:
            with pytest.raises(ValidationError):
                AuthRequest(phone=phone)


class TestJWT:
    """Testes de criação e verificação de JWT."""
    
    def test_create_token(self):
        """Cria token com dados válidos."""
        data = {"sub": "+5511999999999"}
        token = create_access_token(data, expires_delta=timedelta(minutes=5))
        
        assert isinstance(token, str)
        assert len(token) > 20
        
        # Decodifica para verificar conteúdo
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[ALGORITHM])
        assert payload["sub"] == "+5511999999999"
        assert "exp" in payload
        assert "iat" in payload
        assert "jti" in payload  # UUID único
    
    def test_verify_valid_token(self):
        """Verifica token válido."""
        data = {"sub": "+5511999999999"}
        token = create_access_token(data, expires_delta=timedelta(minutes=5))
        
        token_data = verify_token(token)
        
        assert isinstance(token_data, TokenData)
        assert token_data.phone == "+5511999999999"
        assert token_data.jti is not None
    
    def test_verify_invalid_token(self):
        """Token inválido deve levantar HTTPException."""
        from fastapi import HTTPException
        
        with pytest.raises(HTTPException) as excinfo:
            verify_token("invalid.token.here")
        
        assert excinfo.value.status_code == 401
    
    def test_verify_expired_token(self):
        """Token expirado deve levantar HTTPException."""
        from fastapi import HTTPException
        
        data = {"sub": "+5511999999999"}
        token = create_access_token(data, expires_delta=timedelta(seconds=-1))
        
        with pytest.raises(HTTPException) as excinfo:
            verify_token(token)
        
        assert excinfo.value.status_code == 401
    
    def test_token_without_sub(self):
        """Token sem 'sub' deve falhar."""
        from fastapi import HTTPException
        
        # Cria token manualmente sem 'sub'
        token = jwt.encode(
            {"exp": 9999999999, "iat": 1000000000},
            settings.SECRET_KEY,
            algorithm=ALGORITHM
        )
        
        with pytest.raises(HTTPException):
            verify_token(token)


class TestSecurityProperties:
    """Testes de propriedades de segurança."""
    
    def test_tokens_are_unique(self):
        """Cada token deve ter jti único."""
        data = {"sub": "+5511999999999"}
        tokens = [create_access_token(data) for _ in range(5)]
        
        jtis = []
        for token in tokens:
            payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[ALGORITHM])
            jtis.append(payload["jti"])
        
        # Todos os jti devem ser únicos
        assert len(set(jtis)) == 5
    
    def test_secret_key_from_settings(self):
        """Verifica que SECRET_KEY vem do settings."""
        data = {"sub": "+5511999999999"}
        token = create_access_token(data)
        
        # Deve decodificar com a chave do settings
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[ALGORITHM])
        assert payload["sub"] == "+5511999999999"
        
        # Não deve decodificar com chave errada
        from jose import JWTError
        with pytest.raises(JWTError):
            jwt.decode(token, "wrong-secret-key", algorithms=[ALGORITHM])

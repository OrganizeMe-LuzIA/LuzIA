# Autenticação e Autorização

> **Voltar para:** [📚 Documentação](../README.md) |  [🏛️ Arquitetura](ARQUITETURA.md)

---

## 🔐 Visão Geral

O LuzIA usa **JWT (JSON Web Tokens)** para autenticação stateless. A implementação inclui tokens com ID único (`jti`) para suporte a revogação, timestamps de emissão (`iat`), e expiração obrigatória (`exp`).

**Arquivo Principal:** [`backend/src/app/core/security.py`](../../backend/src/app/core/security.py)

---

## 🎫 JWT Authentication

### Configuração

| Parâmetro | Valor | Descrição |
|-----------|-------|-----------|
| **Algoritmo** | HS256 | Assinatura HMAC com SHA-256 |
| **Expiração** | 8 dias (11.520 min) | Configurável via `ACCESS_TOKEN_EXPIRE_MINUTES` |
| **SECRET_KEY** | Via `.env` | Nunca hardcoded |
| **jti** | UUID v4 | ID único por token (suporte a revogação) |
| **iat** | Timestamp UTC | Issued At para auditoria |
| **Timezone** | UTC-aware | Usa `datetime.now(timezone.utc)` |

### Geração de Token

```python
from app.core.security import create_access_token

token = create_access_token(data={"sub": user_email})
# Token inclui automaticamente: exp, iat, jti
```

### Verificação

```python
from app.core.security import get_current_user

@router.get("/protected")
async def protected_route(current_user: TokenData = Depends(get_current_user)):
    return {"email": current_user.email}
```

### Modelos de Autenticação

```python
class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    sub: Optional[str] = None     # Subject (email)
    email: Optional[str] = None   # Email extraído do sub
    jti: Optional[str] = None     # JWT ID para revogação

class AuthRequest(BaseModel):
    email: str       # Validado via regex
    password: str    # Mínimo 6 caracteres

class RegisterCredentialsRequest(BaseModel):
    email: str       # Validado via regex
    password: str    # Mínimo 6 caracteres
    phone: str       # Formato E.164 (+XXXXXXXXXXXX)
```

---

## 🔒 Hashing de Senhas

Usa **PBKDF2-SHA256** via `passlib.CryptContext` para evitar dependência de backend nativo do bcrypt:

```python
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["pbkdf2_sha256"], deprecated="auto")

hashed = pwd_context.hash("senha_secreta")
verified = pwd_context.verify("senha_secreta", hashed)
```

> **Nota:** Embora `requirements.txt` liste `passlib[bcrypt]`, o código utiliza `pbkdf2_sha256` como scheme ativo para portabilidade.

---

## 👥 Níveis de Acesso

| Role | Permissões |
|------|-----------|
| **admin_global** | Acesso total |
| **admin_org** | Gestão da organização |
| **gestor** | Relatórios do setor |
| **usuario** | Responder questionários |

---

## 🛡️ Rate Limiting

Hook preparado para integração com Redis (não implementado em produção ainda):

```python
async def check_rate_limit(identifier: str) -> bool:
    # TODO: Implementar com Redis
    # Máximo 5 tentativas por minuto
    return True
```

---

## 🔗 Documentos Relacionados

- [🏛️ Arquitetura](ARQUITETURA.md)
- [🏢 Organizações](ORGANIZACOES.md)
- [🔐 Segurança](../security/SEGURANCA.md)
- [🔌 API Reference](../api/API.md)

---

**Última Atualização:** 2026-02-16

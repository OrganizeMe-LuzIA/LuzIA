# Autenticação e Autorização

> **Voltar para:** [📚 Documentação](../README.md) |  [🏛️ Arquitetura](ARQUITETURA.md)

---

## 🔐 Visão Geral

O LuzIA usa **JWT (JSON Web Tokens)** para autenticação stateless com níveis de acesso baseados em roles.

---

## 🎫 JWT Authentication

### Geração de Token

```python
from app.core.security import create_access_token

def login(email: str, password: str):
    user = authenticate_user(email, password)
    token = create_access_token(data={"sub": user.id, "role": user.role})
    return {"access_token": token, "token_type": "bearer"}
```

### Verificação

```python
from app.api.deps import get_current_user

@router.get("/me")
async def read_users_me(current_user = Depends(get_current_user)):
    return current_user
```

---

## 👥 Níveis de Acesso

| Role | Permissões |
|------|-----------|
| **admin_global** | Acesso total |
| **admin_org** | Gestão da organização |
| **gestor** | Relatórios do setor |
| **usuario** | Responder questionários |

---

## 🔒 Hashing de Senhas

Usa **bcrypt** para hashing seguro:

```python
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

hashed = pwd_context.hash("senha_secreta")
verified = pwd_context.verify("senha_secreta", hashed)
```

---

## 🔗 Documentos Relacionados

- [🏛️ Arquitetura](ARQUITETURA.md)
- [🏢 Organizações](ORGANIZACOES.md)

---

**Última Atualização:** 2026-02-07

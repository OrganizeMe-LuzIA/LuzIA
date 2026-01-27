# Documentação de Segurança - LuzIA Backend

Este documento descreve as medidas de segurança implementadas no backend do LuzIA.

## 1. Autenticação JWT

### Implementação
- **Arquivo**: `app/auth.py`
- **Biblioteca**: `python-jose` com algoritmo HS256

### Características de Segurança
| Recurso | Descrição |
|---------|-----------|
| `SECRET_KEY` via `.env` | Chave nunca hardcoded no código |
| `jti` (JWT ID) | UUID único para cada token, permite revogação |
| `iat` (Issued At) | Timestamp de emissão para auditoria |
| `exp` obrigatório | Tokens expiram automaticamente |
| Timezone-aware | Usa `datetime.now(timezone.utc)` (Python 3.12+) |

### Configuração
```bash
# .env
SECRET_KEY=sua_chave_secreta_aqui  # Gere com: python3 -c "import secrets; print(secrets.token_urlsafe(32))"
ACCESS_TOKEN_EXPIRE_MINUTES=120
```

---

## 2. Validação de Entrada

### Telefone (E.164)
- **Regex**: `^\+[1-9]\d{7,14}$`
- Obriga formato internacional com `+`
- Rejeita números inválidos antes de chegar ao banco

### Pydantic Models
- Validação automática de tipos
- `StatusEnum` para status de usuário (não aceita valores arbitrários)

---

## 3. CORS (Cross-Origin Resource Sharing)

### Implementação
- **Arquivo**: `app/main.py`
- Configuração restritiva por padrão

### Configuração Atual
```python
allow_origins=CORS_ORIGINS,  # Lista de domínios autorizados
allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
allow_headers=["Authorization", "Content-Type", "Accept"],
max_age=600,  # Cache preflight por 10 minutos
```

### Configuração via `.env`
```bash
CORS_ORIGINS=http://localhost:3000,https://meudominio.com.br
```

---

## 4. Proteção contra Injeção

### NoSQL Injection (MongoDB)
- Uso de Motor/PyMongo com queries parametrizadas
- Validação de tipos via Pydantic antes de queries
- `ObjectId` validado antes de uso

### JWT Injection
- Biblioteca `python-jose` faz escape adequado
- Payload decodificado é validado antes de uso

---

## 5. Rate Limiting (Preparado)

### Hooks Implementados
```python
async def check_rate_limit(phone: str) -> bool:
    # TODO: Implementar com Redis
    return True
```

### Implementação Recomendada (Produção)
```python
# Com Redis
key = f"auth_attempts:{phone}"
attempts = await redis.incr(key)
if attempts == 1:
    await redis.expire(key, 60)
return attempts <= 5
```

---

## 6. Verificação OTP (Preparado)

### Hook Implementado
```python
async def verify_otp(phone: str, code: str) -> bool:
    # TODO: Implementar com Twilio Verify
    return True
```

### Integração Twilio (Produção)
```python
verification = await twilio_client.verify.v2.services(VERIFY_SID).verification_checks.create(
    to=phone, code=code
)
return verification.status == "approved"
```

---

## 7. Checklist de Segurança

| Item | Status | Arquivo |
|------|--------|---------|
| SECRET_KEY via env | ✅ | `.env` |
| JWT com expiração | ✅ | `auth.py` |
| JWT com jti (revogação) | ✅ | `auth.py` |
| Validação telefone E.164 | ✅ | `auth.py` |
| StatusEnum (não string livre) | ✅ | `models/base.py` |
| CORS restritivo | ✅ | `main.py` |
| Rate Limiting | ⏳ Hook pronto | `auth.py` |
| OTP Verification | ⏳ Hook pronto | `auth.py` |
| HTTPS | ⚠️ Infraestrutura | Nginx/Load Balancer |
| Logs de auditoria | ⏳ Pendente | - |

---

## 8. Próximos Passos (Produção)

1. **Configurar HTTPS** via Nginx ou Load Balancer
2. **Implementar Rate Limiting** com Redis
3. **Integrar Twilio Verify** para OTP real
4. **Adicionar logs de auditoria** (sem dados sensíveis)
5. **Proteger rotas sensíveis** com `Depends(get_current_user)`

---

*Última atualização: 11 de Janeiro de 2026*

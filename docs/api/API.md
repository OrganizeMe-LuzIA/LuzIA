# Documentação da API REST - LuzIA Backend

Este documento descreve os endpoints da API REST do LuzIA Backend.

## Base URL
```
/api/v1
```

## Autenticação
Todos os endpoints (exceto `/auth/login` e `/auth/request-otp`) requerem um token JWT no header:
```
Authorization: Bearer <token>
```

---

## Routers

### 1. Auth (`/auth`)
**Arquivo**: `app/routers/auth.py`

| Método | Endpoint | Descrição | Autenticação |
|--------|----------|-----------|--------------|
| POST | `/login` | Autentica usuário e retorna JWT | ❌ Não |
| POST | `/request-otp` | Solicita envio de OTP via WhatsApp | ❌ Não |

**Request Body (login)**:
```json
{
  "phone": "+5511999999999",
  "code": "123456"
}
```

**Response**:
```json
{
  "access_token": "eyJ...",
  "token_type": "bearer"
}
```

---

### 2. Organizações (`/organizacoes`)
**Arquivo**: `app/routers/organizacoes.py`

| Método | Endpoint | Descrição | Autenticação |
|--------|----------|-----------|--------------|
| POST | `/` | Cria nova organização | ✅ Admin |
| GET | `/` | Lista organizações | ✅ Admin |
| GET | `/{org_id}` | Detalhes de uma organização | ✅ Admin |

---

### 3. Questionários (`/questionarios`)
**Arquivo**: `app/routers/questionarios.py`

| Método | Endpoint | Descrição | Autenticação |
|--------|----------|-----------|--------------|
| GET | `/` | Lista questionários ativos | ✅ Usuário |
| GET | `/{q_id}` | Detalhes do questionário | ✅ Usuário |
| GET | `/{q_id}/perguntas` | Lista perguntas do questionário | ✅ Usuário |

---

### 4. Respostas (`/respostas`)
**Arquivo**: `app/routers/respostas.py`

| Método | Endpoint | Descrição | Autenticação |
|--------|----------|-----------|--------------|
| POST | `/` | Submete respostas em lote | ✅ Usuário |

**Request Body**:
```json
{
  "anonId": "anon123",
  "idQuestionario": "64a...",
  "respostas": [
    {"idPergunta": "p1", "valor": 3},
    {"idPergunta": "p2", "valor": 1}
  ]
}
```

> **Nota**: O envio dispara cálculo de diagnóstico em background.

---

### 5. Diagnósticos (`/diagnosticos`)
**Arquivo**: `app/routers/diagnosticos.py`

| Método | Endpoint | Descrição | Autenticação |
|--------|----------|-----------|--------------|
| GET | `/me` | Histórico de diagnósticos do usuário | ✅ Usuário |
| GET | `/{diag_id}` | Detalhes de um diagnóstico | ✅ Usuário (próprio) |

---

### 6. Relatórios (`/relatorios`)
**Arquivo**: `app/routers/relatorios.py`

| Método | Endpoint | Descrição | Autenticação |
|--------|----------|-----------|--------------|
| POST | `/gerar` | Gera relatório consolidado | ✅ Admin |
| GET | `/{rel_id}` | Obtém relatório pelo ID | ✅ Admin |

**Request Body (gerar)**:
```json
{
  "idQuestionario": "64a...",
  "idOrganizacao": "64b...",
  "idSetor": "64c...",
  "tipo": "organizacional"
}
```

---

## Testes

### Arquivo: `tests/test_routers.py`

| Teste | Descrição |
|-------|-----------|
| `test_health_check` | Verifica endpoint `/health` retorna 200 |
| `test_api_v1_auth_routes_exist` | Confirma que `/auth/login` existe |
| `test_routes_protected_unauthorized` | Valida que rotas protegidas retornam 401 sem token |
| `test_cors_headers` | Verifica headers CORS em preflight requests |

### Executar Testes
```bash
cd backend
python3 -m pytest tests/test_routers.py -v
```

### Resultado Esperado
```
tests/test_routers.py::test_health_check PASSED
tests/test_routers.py::test_api_v1_auth_routes_exist PASSED
tests/test_routers.py::test_routes_protected_unauthorized PASSED
tests/test_routers.py::test_cors_headers PASSED
```

---

## Dependências de Autenticação

| Dependência | Arquivo | Descrição |
|-------------|---------|-----------|
| `get_current_user` | `deps.py` | Obtém usuário do token |
| `get_current_active_user` | `deps.py` | Verifica se usuário está ativo |
| `get_current_admin_user` | `deps.py` | Verifica se usuário é admin |

---

*Última atualização: 12 de Janeiro de 2026*

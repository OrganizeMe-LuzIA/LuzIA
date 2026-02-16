# API Reference - LuzIA Backend

> **Voltar para:** [📚 Documentação](../README.md) | [🏛️ Arquitetura](../backend/ARQUITETURA.md)

---

## 📋 Visão Geral

- **Base URL:** `http://localhost:8000/api/v1`
- **Versão:** 2.1.1
- **Docs Interativa:** `http://localhost:8000/docs` (Swagger UI)
- **Autenticação:** Bearer Token (JWT) — ver [AUTENTICACAO.md](../backend/AUTENTICACAO.md)

---

## 🔐 Auth (`/api/v1/auth`)

**Arquivo:** [`backend/src/app/api/v1/auth.py`](../../backend/src/app/api/v1/auth.py)

| Método | Endpoint | Auth | Descrição |
|--------|----------|------|-----------|
| `POST` | `/auth/login` | ❌ | Login via email + senha |
| `POST` | `/auth/register` | 🔑 Admin | Cadastrar credenciais para usuário existente |

### `POST /auth/login`

```json
// Request
{ "email": "user@example.com", "password": "minhasenha123" }

// Response 200
{ "access_token": "eyJ...", "token_type": "bearer" }

// Response 401 — Email ou senha inválidos
// Response 429 — Rate limit (Retry-After: 60)
```

### `POST /auth/register`

```json
// Request (requer token Admin no header)
{ "email": "novo@empresa.com", "password": "senha123", "phone": "+5511999999999" }

// Response 200
{ "message": "Credenciais salvas com sucesso.", "email": "novo@empresa.com", "saved": true }

// Response 404 — Telefone não encontrado
// Response 409 — Email já em uso por outro usuário
```

---

## 🏢 Organizações (`/api/v1/organizacoes`)

**Arquivo:** [`backend/src/app/api/v1/organizacoes.py`](../../backend/src/app/api/v1/organizacoes.py)

| Método | Endpoint | Auth | Descrição |
|--------|----------|------|-----------|
| `POST` | `/organizacoes/` | 🔑 Admin | Criar organização (CNPJ validado) |
| `GET` | `/organizacoes/?limit=100` | 🔑 Admin | Listar todas |
| `GET` | `/organizacoes/{org_id}` | 🔑 Admin | Obter detalhes por ID |
| `PUT` | `/organizacoes/{org_id}` | 🔑 Admin | Atualizar organização |
| `DELETE` | `/organizacoes/{org_id}` | 🔑 Admin | Remover (bloqueia se há vínculos) |

### CNPJ Validation

O CNPJ é validado automaticamente pelo modelo Pydantic `Organizacao`, que utiliza `validar_cnpj()` de `core/validators.py` para verificar os dígitos verificadores.

---

## 🏗️ Setores (`/api/v1/setores`)

**Arquivo:** [`backend/src/app/api/v1/setores.py`](../../backend/src/app/api/v1/setores.py)

| Método | Endpoint | Auth | Descrição |
|--------|----------|------|-----------|
| `POST` | `/setores/` | 🔑 Admin | Criar setor (verifica existência da org) |
| `PUT` | `/setores/{setor_id}` | 🔑 Admin | Atualizar setor |
| `DELETE` | `/setores/{setor_id}` | 🔑 Admin | Remover (bloqueia se há usuários vinculados) |

---

## 📝 Questionários (`/api/v1/questionarios`)

**Arquivo:** [`backend/src/app/api/v1/questionarios.py`](../../backend/src/app/api/v1/questionarios.py)

| Método | Endpoint | Auth | Descrição |
|--------|----------|------|-----------|
| `GET` | `/questionarios/` | 👤 Ativo | Listar questionários ativos |
| `GET` | `/questionarios/{q_id}` | 👤 Ativo | Obter questionário por ID |
| `GET` | `/questionarios/{q_id}/perguntas` | 👤 Ativo | Listar perguntas do questionário |

---

## 📊 Respostas (`/api/v1/respostas`)

**Arquivo:** [`backend/src/app/api/v1/respostas.py`](../../backend/src/app/api/v1/respostas.py)

| Método | Endpoint | Auth | Descrição |
|--------|----------|------|-----------|
| `POST` | `/respostas/` | 👤 Ativo | Enviar respostas (dispara diagnóstico via Celery) |

```json
// Request
{
  "anonId": "USR_1234567890",
  "idQuestionario": "507f1f77bcf86cd799439011",
  "respostas": [
    { "idPergunta": "EL_EQ_01A", "valor": 3 },
    { "idPergunta": "EL_EQ_01B", "valorTexto": "Comentário opcional" }
  ]
}

// Response 201
{ "message": "Respostas salvas com sucesso. Diagnóstico em processamento.", "task_id": "abc123" }
```

> **Nota:** Sobrescreve respostas anteriores do mesmo questionário. O diagnóstico é processado em background pelo Celery.

---

## 🩺 Diagnósticos (`/api/v1/diagnosticos`)

**Arquivo:** [`backend/src/app/api/v1/diagnosticos.py`](../../backend/src/app/api/v1/diagnosticos.py)

| Método | Endpoint | Auth | Descrição |
|--------|----------|------|-----------|
| `GET` | `/diagnosticos/me` | 👤 Ativo | Histórico do usuário logado |
| `GET` | `/diagnosticos/{diag_id}` | 👤 Ativo | Obter diagnóstico por ID (somente próprio) |

---

## 📑 Relatórios (`/api/v1/relatorios`)

**Arquivo:** [`backend/src/app/api/v1/relatorios.py`](../../backend/src/app/api/v1/relatorios.py)

| Método | Endpoint | Auth | Descrição |
|--------|----------|------|-----------|
| `POST` | `/relatorios/gerar` | 🔑 Admin | Geração síncrona de relatório |
| `POST` | `/relatorios/gerar-async` | 🔑 Admin | Geração assíncrona via Celery |
| `GET` | `/relatorios/{rel_id}` | 🔑 Admin | Obter relatório por ID |

```json
// POST /relatorios/gerar — Request
{
  "idQuestionario": "507f1f77bcf86cd799439011",
  "idOrganizacao": "507f1f77bcf86cd799439012",
  "idSetor": null,
  "tipo": "organizacional"
}

// Response 201
{ "id": "507f1f77bcf86cd799439013", "message": "Relatório gerado com sucesso..." }

// POST /relatorios/gerar-async — Response 202
{ "task_id": "abc-123", "status": "queued", "message": "Geração de relatório enviada..." }
```

---

## 📊 Dashboard (`/api/v1/dashboard`)

**Arquivo:** [`backend/src/app/api/v1/dashboard.py`](../../backend/src/app/api/v1/dashboard.py)

> Todas as rotas requerem autenticação **Admin**. Existe um `legacy_router` mantido para compatibilidade com frontends antigos.

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| `GET` | `/dashboard/overview` | Resumo executivo (totais, alertas) |
| `GET` | `/dashboard/organizacoes` | Lista orgs com métricas |
| `GET` | `/dashboard/organizacoes/{org_id}` | Detalhes da organização |
| `GET` | `/dashboard/setores?org_id=X` | Setores (filtro opcional por org) |
| `GET` | `/dashboard/setores/{setor_id}` | Detalhes do setor |
| `GET` | `/dashboard/usuarios/ativos?org_id=X&setor_id=Y` | Usuários ativos |
| `GET` | `/dashboard/usuarios/{user_id}/progresso` | Progresso do usuário |
| `GET` | `/dashboard/questionarios/status` | Status de todos os questionários |
| `GET` | `/dashboard/questionarios/{q_id}/metricas` | Métricas do questionário |

### Rotas Legacy (compatibilidade)

As seguintes rotas também estão disponíveis sem o prefixo `/dashboard`:
- `GET /setores`, `GET /setores/{id}`
- `GET /usuarios/ativos`, `GET /usuarios/{id}/progresso`
- `GET /questionarios/status`, `GET /questionarios/{id}/metricas`
- `GET /overview`

---

## 🤖 WhatsApp Bot (`/webhook`)

**Arquivo:** [`backend/src/app/bot/endpoints.py`](../../backend/src/app/bot/endpoints.py)

| Método | Endpoint | Auth | Descrição |
|--------|----------|------|-----------|
| `POST` | `/webhook` | Twilio Signature | Recebe mensagens do WhatsApp |

> Detalhes em [WHATSAPP.md](../integracoes/WHATSAPP.md)

---

## 🔧 Utilitário

| Método | Endpoint | Auth | Descrição |
|--------|----------|------|-----------|
| `GET` | `/health` | ❌ | Health check do serviço |

---

## 📌 Dependency Injection

**Arquivo:** [`backend/src/app/api/deps.py`](../../backend/src/app/api/deps.py)

| Dependency | Descrição |
|-----------|-----------|
| `get_current_user` | Retorna `Usuario` do banco a partir do token JWT |
| `get_current_active_user` | Garante `is_active_user_status()` = True |
| `get_current_admin_user` | Garante `metadata.is_admin == True` |

---

## 🔗 Documentos Relacionados

- [🔐 Autenticação](../backend/AUTENTICACAO.md)
- [📦 Modelos](../backend/MODELOS.md)
- [⚡ Serviços](../backend/SERVICOS.md)
- [📱 WhatsApp](../integracoes/WHATSAPP.md)

---

**Última Atualização:** 2026-02-16

# Redis — Cache e Message Broker

> **Voltar para:** [📚 Documentação](../README.md) | [🏛️ Arquitetura](../backend/ARQUITETURA.md)

---

## 📋 Visão Geral

O Redis desempenha **dois papéis** no LuzIA:

1. **Cache de aplicação** — Reduz consultas ao MongoDB para dados frequentes
2. **Message Broker / Result Backend** — Gerencia filas de tarefas do Celery

---

## 💾 Cache de Aplicação

**Arquivo:** [`backend/src/app/core/cache.py`](../../backend/src/app/core/cache.py)

### CacheClient

```python
class CacheClient:
    """Cliente de cache assíncrono baseado em Redis."""

    async def get(self, key: str) -> Any | None
    async def set(self, key: str, value: Any, ttl: int | None = None) -> None
    async def delete(self, key: str) -> None
    async def invalidate_pattern(self, pattern: str) -> None
```

### Características

| Feature | Descrição |
|---------|-----------|
| **Serialização** | JSON (`json.dumps`/`json.loads`) |
| **TTL padrão** | 300 segundos (5 min), configurável via `CACHE_TTL` |
| **Invalidação** | Por chave individual ou padrão glob (`invalidate_pattern`) |
| **Graceful degradation** | Exceções são logadas, nunca propagadas — o sistema funciona sem Redis |

### Exemplo de Uso

```python
from app.core.cache import CacheClient

cache = CacheClient()

# Set com TTL customizado
await cache.set("org:123:metrics", {"total": 50}, ttl=600)

# Get (retorna None se não encontrado ou Redis indisponível)
data = await cache.get("org:123:metrics")

# Invalidar todas as chaves do padrão
await cache.invalidate_pattern("org:123:*")
```

---

## 📨 Message Broker (Celery)

O Redis funciona como broker de mensagens para o Celery, gerenciando as filas de tarefas assíncronas:

```mermaid
graph LR
    subgraph Broker
        Redis[(Redis :6379)]
    end
    API[FastAPI] -->|task.delay()| Redis
    Redis -->|consume| Worker1[Celery Worker]
    Worker1 -->|result| Redis
```

### Variáveis

```env
CELERY_BROKER_URL=redis://localhost:6379/0
CELERY_RESULT_BACKEND=redis://localhost:6379/0
REDIS_URL=redis://localhost:6379
```

---

## ⚙️ Configuração

### Variáveis de Ambiente

```env
# URL de conexão ao Redis
REDIS_URL=redis://localhost:6379

# TTL do cache em segundos (padrão: 300)
CACHE_TTL=300
```

### Docker

```yaml
# docker-compose.yml
redis:
  image: redis:7-alpine
  container_name: luzia-redis
  ports:
    - "6379:6379"
  volumes:
    - redis_data:/data
  healthcheck:
    test: ["CMD", "redis-cli", "ping"]
```

### Render (Produção)

```yaml
# render.yaml
- type: redis
  name: luzia-redis
  region: oregon
  plan: free
  maxmemoryPolicy: allkeys-lru
```

---

## 🛡️ Resiliência

O backend é projetado para funcionar **sem Redis**:
- O `CacheClient` captura exceções silenciosamente
- Sem cache, as requisições vão direto ao MongoDB
- Sem broker, tarefas Celery falham mas a API continua respondendo

---

## 🔗 Documentos Relacionados

- [📊 Celery](CELERY.md) — Workers que usam Redis como broker
- [🗄️ Database](../infra/DATABASE.md) — MongoDB (fonte primária de dados)
- [⚙️ Configuração](../guides/GUIA-CONFIGURACAO.md) — Variáveis de ambiente

---

**Última Atualização:** 2026-02-17

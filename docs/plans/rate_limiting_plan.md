# Plano de Implementação: Rate Limiting com SlowAPI e Redis

## Visão Geral
Este documento descreve o plano para implementar limitação de taxa (Rate Limiting) no backend do LuzIA para proteger a API contra abusos e garantir a disponibilidade do serviço.

## Objetivo
Implementar um sistema de Rate Limiting robusto, escalável e configurável utilizando `slowapi` (baseado no `limits`) integrado com Redis para armazenamento de estado distribuído.

## Stack Tecnológica
- **Biblioteca**: `slowapi`
- **Backend de Armazenamento**: Redis (já existente na infraestrutura)
- **Framework**: FastAPI

## Passos da Implementação

### 1. Dependências
Adicionar `slowapi` e `redis` (driver python) às dependências do projeto.

**Arquivo**: `backend/pyproject.toml`
```toml
dependencies = [
    # ...
    "slowapi>=0.1.8",
    "redis>=5.0.0",
]
```

### 2. Configuração (`backend/app/core/rate_limit.py`)
Criar um módulo centralizado para a configuração do Limiter.

- Inicializar `Limiter` com a chave remota do IP (`get_remote_address`).
- Configurar o backend de armazenamento usando a variável de ambiente `REDIS_URL`.
- Definir estratégia padrão (ex: `fixed-window`).

### 3. Integração com FastAPI (`backend/app/main.py`)
- Adicionar o middleware `SlowAPIMiddleware` à aplicação FastAPI.
- Adicionar o manipulador de exceção para `RateLimitExceeded` para retornar respostas JSON amigáveis (429 Too Many Requests).

### 4. Aplicação de Limites
Definir limites específicos para rotas críticas e um limite global (opcional).

#### Rotas Críticas (Exemplos):
- **Login (`/auth/login`)**: 5 requisições por minuto (evitar brute-force).
- **Rotas Públicas**: 20 requisições por minuto.
- **Rotas Autenticadas**: 100 requisições por minuto (pode ser ajustado por usuário).

### 5. Variáveis de Ambiente
Garantir que `REDIS_URL` esteja corretamente configurada no ambiente (já existente no `docker-compose.yml`).

## Exemplo de Código

```python
# app/core/rate_limit.py
from slowapi import Limiter
from slowapi.util import get_remote_address
import os

redis_url = os.getenv("REDIS_URL", "redis://localhost:6379")

limiter = Limiter(
    key_func=get_remote_address,
    storage_uri=redis_url,
    default_limits=["200 per day", "50 per hour"]
)
```

## Verificação
1. **Teste de Carga**: Disparar múltiplas requisições para uma rota protegida e verificar se o erro 429 é retornado após o limite.
2. **Inspeção do Redis**: Verificar se as chaves de limite estão sendo criadas no Redis.

## Impacto
- **Performance**: Mínimo impacto, dada a velocidade do Redis.
- **Segurança**: Aumento significativo na proteção contra DDoS de camada de aplicação e Brute-force.

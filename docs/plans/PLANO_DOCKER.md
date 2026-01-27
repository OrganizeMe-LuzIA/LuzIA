# Docker e Docker-Compose para LuzIA Backend

Containerização completa do backend LuzIA para garantir ambientes consistentes em desenvolvimento e produção.

## Arquivos a Criar

### Backend Container

#### [NEW] `Dockerfile`

Dockerfile multi-stage para o backend FastAPI:

- **Stage 1 (builder)**: Instala dependências em ambiente isolado
- **Stage 2 (runtime)**: Imagem slim com apenas runtime necessário
- Python 3.11-slim como base
- Usuário não-root para segurança
- Healthcheck integrado

---

### Orquestração

#### [NEW] `docker-compose.yml` (na raiz do projeto)

Serviços a serem incluídos:

| Serviço | Imagem | Porta | Descrição |
|---------|--------|-------|-----------|
| `backend` | Build local | 8000 | FastAPI app |
| `mongo` | mongo:7 | 27017 | Banco de dados |
| `redis` | redis:7-alpine | 6379 | Cache/Celery broker |
| `celery-worker` | Build local | - | Worker para tasks async |

**Configurações importantes:**
- Volumes persistentes para MongoDB
- Networks isoladas
- Variáveis de ambiente via `.env`
- Depends_on com healthchecks
- Init script MongoDB via volume mount

---

### Arquivos de Suporte

#### [NEW] `.dockerignore`

Excluir do build:
- `venv/`, `__pycache__/`
- `.git/`, `.env`
- `tests/`, `*.md`

#### [MODIFY] `.env.example`

Adicionar variáveis para Docker:
- `MONGO_URI=mongodb://mongo:27017` (nome do container)
- `REDIS_URL=redis://redis:6379`

---

## Plano de Verificação

### Teste Automatizado

```bash
# 1. Build das imagens
docker-compose build

# 2. Iniciar serviços
docker-compose up -d

# 3. Verificar healthcheck
docker-compose ps  # Todos devem estar "healthy"

# 4. Testar endpoint
curl http://localhost:8000/health
# Esperado: {"status": "healthy"}

# 5. Rodar testes dentro do container
docker-compose exec backend pytest tests/ -v

# 6. Cleanup
docker-compose down -v
```

### Checklist de Verificação Manual

- [ ] `docker-compose up` sobe todos os serviços sem erros
- [ ] API responde em `http://localhost:8000/`
- [ ] MongoDB acessível e inicializado com `init_final.js`
- [ ] Hot-reload funciona em desenvolvimento (alterar código e ver mudança)
- [ ] `docker-compose down -v` limpa tudo corretamente

---

## Estrutura Final

```
LuzIA/
├── docker-compose.yml          # Novo
└── backend/
    ├── Dockerfile              # Novo
    ├── .dockerignore           # Novo
    ├── .env.example            # Modificado
    └── mongo/
        └── init_final.js       # Existente (usado no init)
```

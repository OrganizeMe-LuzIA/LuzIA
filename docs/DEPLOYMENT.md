# Deployment do LuzIA

> **Voltar para:** [Documentação](README.md) | [README Principal](../README.md)

---

## Opções de Deploy

| Método | Descrição | Guia |
|--------|-----------|------|
| **Render.com + MongoDB Atlas** | Deploy atual em produção (recomendado) | [DEPLOY-RENDER.md](DEPLOY-RENDER.md) |
| **Docker Compose** | Desenvolvimento local com todos os serviços | Abaixo |
| **Manual** | Instalação direta sem containers | Abaixo |

---

## Produção: Render.com + MongoDB Atlas

O LuzIA está atualmente hospedado em produção usando:

- **Render.com** - Backend FastAPI (Docker) + Redis
- **MongoDB Atlas** - Banco de dados na nuvem

Para o guia completo de deploy em produção, consulte: **[DEPLOY-RENDER.md](DEPLOY-RENDER.md)**

### Visão Rápida

```
Render.com                         MongoDB Atlas
┌────────────────────┐             ┌──────────────────┐
│  luzia-backend     │────────────▶│  Cluster LuzIA   │
│  (Docker, Free)    │             │  (M0 Free)       │
│                    │             │  Database: LuzIA  │
│  luzia-redis       │             └──────────────────┘
│  (Redis, Free)     │
└────────────────────┘
```

O arquivo `render.yaml` na raiz do projeto configura automaticamente toda a infraestrutura via Blueprint.

---

## Docker Compose (Desenvolvimento Local)

### Pré-requisitos

- Docker 20.10+
- Docker Compose 2.0+

### Passos

```bash
# 1. Clone o repositório
git clone <repo-url>
cd LuzIA

# 2. Configure variáveis de ambiente
cp backend/.env.example backend/.env
# Edite backend/.env com suas configurações

# 3. Inicie os serviços
docker-compose up -d

# 4. Verifique os logs
docker-compose logs -f backend
```

### Serviços Incluídos

| Serviço | Porta | Descrição |
|---------|-------|-----------|
| `backend` | 8000 | FastAPI (com hot-reload) |
| `mongo` | 27018 | MongoDB 7 (com init script) |
| `redis` | 6379 | Redis 7 Alpine |

O MongoDB é iniciado automaticamente com os dados do questionário COPSOQ via `backend/mongo/init_final.js`.

### Comandos Úteis

```bash
# Parar todos os serviços
docker-compose down

# Reconstruir imagem do backend
docker-compose build backend

# Ver logs em tempo real
docker-compose logs -f

# Acessar shell do MongoDB
docker exec -it luzia-mongo mongosh LuzIA
```

---

## Deployment Manual

### Pré-requisitos

- Python 3.10+
- MongoDB 6.0+
- Redis 7.0+ (opcional, para cache)

### Instalação

```bash
# 1. Crie ambiente virtual
python -m venv venv
source venv/bin/activate    # Linux/Mac
# venv\Scripts\activate     # Windows

# 2. Instale dependências
pip install -r backend/requirements.txt

# 3. Configure variáveis de ambiente
cp backend/.env.example backend/.env
# Edite backend/.env

# 4. Inicie MongoDB (se não estiver rodando)
mongod --dbpath ./data/db

# 5. Execute o backend
cd backend
uvicorn src.app.main:app --host 0.0.0.0 --port 8000
```

Para desenvolvimento com auto-reload:

```bash
uvicorn src.app.main:app --reload
```

---

## Variáveis de Ambiente

**Obrigatórias:**

```env
MONGO_URI=mongodb://localhost:27017
MONGO_DB_NAME=LuzIA
SECRET_KEY=<chave-secreta-forte>
```

**WhatsApp (Twilio):**

```env
TWILIO_ACCOUNT_SID=ACXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
TWILIO_AUTH_TOKEN=your_auth_token_here
TWILIO_WHATSAPP_FROM=whatsapp:+1XXXXXXXXXX
TWILIO_WHATSAPP_NUMBER=whatsapp:+1XXXXXXXXXX
TWILIO_VALIDATE_SIGNATURE=false
```

**Opcionais:**

```env
REDIS_URL=redis://localhost:6379
ACCESS_TOKEN_EXPIRE_MINUTES=120
ENVIRONMENT=development
LOG_LEVEL=INFO
CORS_ORIGINS=http://localhost:3000,http://localhost:8080
```

Para gerar uma `SECRET_KEY` segura:

```bash
python3 -c "import secrets; print(secrets.token_urlsafe(32))"
```

Veja [Guia de Configuração](guides/GUIA-CONFIGURACAO.md) para detalhes completos.

---

## Health Check

Todos os ambientes expõem o endpoint de saúde:

```bash
curl http://localhost:8000/health
# Resposta: {"status": "healthy", "mongo": "connected"}
```

---

## CI/CD

O projeto inclui pipeline GitHub Actions (`.github/workflows/ci.yml`) que executa:

1. Linting com Ruff
2. Testes com pytest (com MongoDB service container)
3. Build da imagem Docker

O Render.com faz deploy automático a cada push na branch `main`.

---

## Troubleshooting

**Erro de conexão MongoDB:**
```bash
# Docker: verifique se o container está rodando
docker ps | grep mongo

# Atlas: teste a connection string
mongosh "mongodb+srv://user:pass@cluster.mongodb.net/LuzIA"
```

**Erro de autenticação JWT:**
```bash
# Verifique SECRET_KEY no .env
echo $SECRET_KEY
```

**Backend não responde no Render:**
- Verifique os logs no dashboard do Render
- Cold start pode levar ~30s no plano Free
- Confirme que o health check `/health` está respondendo

**Redis não disponível:**
- O backend funciona sem Redis (cache desativado)
- Verifique a variável `REDIS_URL`

---

**Última Atualização:** 2026-02-15

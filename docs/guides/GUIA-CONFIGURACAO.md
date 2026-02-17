# Guia de Configuração

> **Voltar para:** [Documentação](../README.md)

---

## Variáveis de Ambiente

Crie `backend/.env` a partir do template:

```bash
cp backend/.env.example backend/.env
```

### Obrigatórias

```env
# MongoDB
MONGO_URI=mongodb://localhost:27017
MONGO_DB_NAME=LuzIA

# JWT/Security
SECRET_KEY=sua-chave-super-secreta-aqui
ACCESS_TOKEN_EXPIRE_MINUTES=11520   # 8 dias
```

### WhatsApp (Twilio)

```env
# Credenciais Twilio (obtenha em https://console.twilio.com/)
TWILIO_ACCOUNT_SID=ACXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
TWILIO_AUTH_TOKEN=your_auth_token_here

# Número / remetente do WhatsApp
TWILIO_WHATSAPP_FROM=whatsapp:+1XXXXXXXXXX
TWILIO_WHATSAPP_NUMBER=whatsapp:+1XXXXXXXXXX

# (Opcional) Messaging Service
TWILIO_MESSAGING_SERVICE_SID=MGXXXXXXXXXXXXXXXXXXXXXXXXXXXX

# Validação de assinatura (ativar em produção)
TWILIO_VALIDATE_SIGNATURE=false

# Content Templates por escala COPSOQ
TWILIO_TEMPLATE_FREQUENCIA=HXxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_TEMPLATE_INTENSIDADE=HXxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_TEMPLATE_SATISFACAO=HXxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_TEMPLATE_CONFLITO_TF=HXxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_TEMPLATE_SAUDE_GERAL=HXxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_TEMPLATE_COMPORTAMENTO_OFENSIVO=HXxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

### Opcionais

```env
# Redis (cache e Celery broker)
REDIS_URL=redis://localhost:6379

# Celery (processamento assíncrono)
CELERY_BROKER_URL=redis://localhost:6379/0
CELERY_RESULT_BACKEND=redis://localhost:6379/0

# CORS - Origens permitidas
CORS_ORIGINS=http://localhost:3000,http://localhost:8080

# Ambiente
ENVIRONMENT=development
LOG_LEVEL=INFO

# MongoDB Pool (ajuste para produção)
MONGO_MAX_POOL_SIZE=100
MONGO_MIN_POOL_SIZE=10
MONGO_TIMEOUT_MS=5000

# Cache
CACHE_TTL=300

# Questionário (timeout em minutos)
QUESTIONNAIRE_TIMEOUT_MINUTES=60
```

---

## Gerando SECRET_KEY

```bash
python3 -c "import secrets; print(secrets.token_urlsafe(32))"
```

---

## MongoDB

### Local

```bash
mongod --dbpath ./data/db
```

### Docker

```bash
docker run -d -p 27017:27017 --name mongo mongo:7
```

### Atlas (Cloud)

```env
MONGO_URI=mongodb+srv://user:pass@cluster.mongodb.net/?retryWrites=true&w=majority
```

Veja [DEPLOY-RENDER.md](../DEPLOY-RENDER.md) para configuração completa do MongoDB Atlas.

---

## Redis

### Local

```bash
redis-server
```

### Docker

```bash
docker run -d -p 6379:6379 --name redis redis:7-alpine
```

O backend funciona sem Redis (cache desativado automaticamente).

---

**Última Atualização:** 2026-02-17

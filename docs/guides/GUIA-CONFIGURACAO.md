# Guia de Configuração

> **Voltar para:** [📚 Documentação](../README.md)

---

## 📝 Variáveis de Ambiente

Crie `backend/.env` com:

### Obrigatórias

```env
# MongoDB
MONGODB_URL=mongodb://localhost:27017
MONGODB_DB_NAME=luzia

# JWT/Security
SECRET_KEY=sua-chave-super-secreta-aqui
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
```

### Opcionais

```env
# WhatsApp
WHATSAPP_ENABLED=true
WHATSAPP_SESSION_PATH=./sessions

# Redis
REDIS_URL=redis://localhost:6379

# Celery
CELERY_BROKER_URL=redis://localhost:6379/0
CELERY_RESULT_BACKEND=redis://localhost:6379/1

# CORS
CORS_ORIGINS=http://localhost:3000,https://app.luzia.com
```

---

## 🔐 Gerando SECRET_KEY

```bash
python -c "import secrets; print(secrets.token_urlsafe(32))"
```

---

## 🗄️ MongoDB

### Local

```bash
mongod --dbpath ./data/db
```

### Docker

```bash
docker run -d -p 27017:27017 --name mongo mongo:6
```

### Atlas (Cloud)

```env
MONGODB_URL=mongodb+srv://user:pass@cluster.mongodb.net/
```

---

**Última Atualização:** 2026-02-07

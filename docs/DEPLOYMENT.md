# Deployment do LuzIA

> **Voltar para:** [📚 Documentação](docs/README.md)

---

## 🐳 Docker (Recomendado)

### Pré- requisitos

- Docker 20.10+
- Docker Compose 2.0+

### Passos

```bash
# 1. Clone o repositório
git clone <repo-url>
cd LuzIA

# 2. Configure variáveis de ambiente
cp backend/.env.example backend/.env
# Edite backend/.env

# 3. Inicie os serviços
docker-compose up -d

# 4. Verifique os logs
docker-compose logs -f backend
```

### Serviços

- `backend`: FastAPI (porta 8000)
- `mongodb`: MongoDB (porta 27017)
- `redis`: Redis (porta 6379)
- `celery`: Workers assíncronos

---

## 🖥️ Deployment Manual

### Pré-requisitos

- Python 3.10+
- MongoDB 6.0+
- Redis 7.0+ (opcional)

### Instalação

```bash
# 1. Crie ambiente virtual
python -m venv venv
source venv/bin/activate

# 2. Instale dependências
pip install -r backend/requirements.txt

# 3. Configure .env
cp backend/.env.example backend/.env

# 4. Inicie MongoDB
mongod --dbpath ./data/db

# 5. Execute backend
cd backend
uvicorn src.app.main:app --host 0.0.0.0 --port 8000
```

---

## ⚙️ Variáveis de Ambiente

**Obrigatórias:**

```env
MONGODB_URL=mongodb://localhost:27017
MONGODB_DB_NAME=luzia
SECRET_KEY=<chave-secreta>
```

**Opcionais:**

```env
REDIS_URL=redis://localhost:6379
CELERY_BROKER_URL=redis://localhost:6379/0
WHATSAPP_ENABLED=true
```

Veja [guia completo](docs/guides/GUIA-CONFIGURACAO.md).

---

## 🚀 Produção

### Recomendações

- Use HTTPS (Nginx/Traefik)
- Configure firewall
- Backup automático do MongoDB
- Monitoramento (Prometheus/Grafana)
- Logs centralizados
- Auto-scaling (Kubernetes)

---

## 🔍 Troubleshooting

**Erro de conexão MongoDB:**
```bash
# Verifique se MongoDB está rodando
docker ps | grep mongo
```

**Erro de autenticação:**
```bash
# Verifique SECRET_KEY no .env
```

---

**Última Atualização:** 2026-02-07

# Guia de Instalação

> **Voltar para:** [📚 Documentação](../README.md)

---

## 🐳 Docker (Recomendado)

```bash
# Clone e configure
git clone <repo-url> && cd LuzIA
cp backend/.env.example backend/.env

# Inicie
docker-compose up -d

# Acesse: http://localhost:8000/docs
```

---

## 🖥️ Local

### Pré-requisitos

- Python 3.10+
- MongoDB 7.0+
- Redis 7.0+ (opcional — cache e Celery)

### Passos

```bash
# 1. Ambiente virtual
python -m venv venv
source venv/bin/activate  # Linux/Mac
# venv\Scripts\activate   # Windows

# 2. Dependências
pip install -r backend/requirements.txt

# 3. MongoDB
mongod --dbpath ./data/db

# 4. Configuração
cp backend/.env.example backend/.env
# Edite backend/.env

# 5. Execute
cd backend
PYTHONPATH=src uvicorn app.main:app --reload
```

> **Atalho:** Na raiz do projeto, use `make run` para iniciar o servidor.
> O backend funciona **sem Redis** — o cache é desativado automaticamente.

---

##  ✅ Verificação

```bash
# Health check
curl http://localhost:8000/health

# Documentação interativa
# Abra: http://localhost:8000/docs
```

---

**Última Atualização:** 2026-02-17

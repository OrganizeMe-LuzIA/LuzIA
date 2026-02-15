# 🧠 LuzIA - Sistema Inteligente de Avaliação Psicossocial

> Automatize avaliações de riscos psicossociais no ambiente de trabalho via WhatsApp com análises baseadas em metodologias científicas validadas.

[![Python](https://img.shields.io/badge/Python-3.10+-blue.svg)](https://www.python.org/downloads/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.100+-green.svg)](https://fastapi.tiangolo.com/)
[![MongoDB](https://img.shields.io/badge/MongoDB-6.0+-green.svg)](https://www.mongodb.com/)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![COPSOQ II](https://img.shields.io/badge/COPSOQ_II-Implemented-success.svg)](docs/guides/GUIA-COPSOQ-II.md)

---

## 📋 Sobre o Projeto

**LuzIA** é um sistema completo para avaliação de riscos psicossociais no trabalho, desenvolvido para facilitar a aplicação de questionários científicos através de um canal acessível e familiar: o **WhatsApp**.

### 🎯 Principais Características

- ✅ **COPSOQ II Completo** - Implementação validada do Copenhagen Psychosocial Questionnaire (versões curta brasileira e média portuguesa)
- 🔒 **Privacidade por Design** - Respostas 100% anônimas com conformidade LGPD
- 💬 **WhatsApp Integration** - Interação natural via WhatsApp usando Twilio
- 📊 **Relatórios Inteligentes** - Diagnósticos individuais e organizacionais com insights acionáveis
- 🎨 **Classificação por Tercis** - Análise baseada em metodologia científica (verde/amarelo/vermelho)
- 🏢 **Multi-tenant** - Suporte a organizações, setores e usuários
- 🚀 **API RESTful** - Backend moderno com FastAPI e MongoDB

### 🌟 Destaques da Implementação COPSOQ II

O LuzIA conta com uma implementação **completa e validada** do COPSOQ II:

- **Classificação Científica**: Tercis corretos (favorável ≤2.33, intermediário 2.33-3.67, risco ≥3.67)
- **Dimensões de Proteção vs Risco**: Interpretação diferenciada conforme metodologia
- **Agregação por Domínios**: 7-8 domínios psicossociais (EL, OTC, RSL, ITI, VLT, SBE, CO, PER)
- **Índice de Proteção**: Cálculo baseado em dimensões favoráveis
- **Recomendações Contextualizadas**: Ações específicas por dimensão em risco

📖 [Documentação Completa COPSOQ II →](docs/guides/GUIA-COPSOQ-II.md)

---

## 🚀 Início Rápido

### Pré-requisitos

- Python 3.10 ou superior
- MongoDB 6.0+
- Redis (opcional, para cache e celery)
- Docker e Docker Compose (opcional)

### Instalação Local

```bash
# 1. Clone o repositório
git clone <repo-url>
cd LuzIA

# 2. Crie ambiente virtual
python -m venv venv
source venv/bin/activate  # Linux/Mac
# ou
venv\Scripts\activate     # Windows

# 3. Instale dependências
pip install -r backend/requirements.txt

# 4. Configure variáveis de ambiente
cp backend/.env.example backend/.env
# Edite backend/.env com suas configurações

# 5. Inicie MongoDB (se não estiver rodando)
mongod --dbpath ./data/db

# 6. Execute o backend
cd backend
uvicorn src.app.main:app --reload
```

O servidor estará disponível em `http://localhost:8000`

### Instalação com Docker

```bash
# Inicie todos os serviços
docker-compose up -d

# Verifique os logs
docker-compose logs -f backend
```

### Comandos Make Disponíveis

```bash
make help         # Lista todos os comandos disponíveis
make install      # Instala dependências
make run          # Inicia servidor de desenvolvimento
make test         # Executa todos os testes
make test-unit    # Apenas testes unitários
make test-int     # Apenas testes de integração
make lint         # Verifica código com ruff
make clean        # Remove arquivos temporários
make docker-up    # Inicia containers Docker
make docker-down  # Para containers Docker
```

---

## 📁 Estrutura do Projeto

```
LuzIA/
├── backend/                    # API Backend (FastAPI + Python 3.10+)
│   ├── src/app/
│   │   ├── api/v1/            # Endpoints da API REST
│   │   ├── core/              # Configuração, DB, Security, Cache
│   │   ├── models/            # Modelos Pydantic
│   │   ├── repositories/      # Camada de acesso a dados (9 repos)
│   │   ├── services/          # Lógica de negócio
│   │   │   ├── copsoq_scoring_service.py  # ✨ COPSOQ II
│   │   │   ├── diagnostico_service.py
│   │   │   ├── relatorio_service.py
│   │   │   ├── dashboard_service.py
│   │   │   └── twilio_content_service.py
│   │   ├── bot/               # Integração WhatsApp (Twilio)
│   │   └── workers/           # Tarefas Celery
│   ├── tests/                 # Testes (unit/integration/services)
│   ├── mongo/                 # Seeds e scripts MongoDB
│   └── Dockerfile             # Imagem Docker multi-stage
│
├── docs/                       # Documentação completa
│   ├── guides/                # Guias técnicos
│   ├── backend/               # Docs de arquitetura
│   ├── integracoes/           # WhatsApp, Celery, Redis
│   ├── infra/                 # Banco de dados
│   └── api/                   # Referência da API
│
├── infrastructure/             # Docker Compose alternativo
├── .github/workflows/          # CI/CD (GitHub Actions)
├── docker-compose.yml          # Stack local (Backend + MongoDB + Redis)
├── render.yaml                 # Deploy Render.com
├── Makefile                    # Automação de tarefas
├── CHANGELOG.md                # Histórico de versões
└── CONTRIBUTING.md             # Guia de contribuição
```

---

## 📚 Documentação

### 🎓 Começando

- [📖 Guia de Instalação](docs/guides/GUIA-INSTALACAO.md)
- [⚙️ Guia de Configuração](docs/guides/GUIA-CONFIGURACAO.md)
- [🚢 Deployment](docs/DEPLOYMENT.md)
- [☁️ Deploy no Render + MongoDB Atlas](docs/DEPLOY-RENDER.md)

### 🏗️ Arquitetura e Desenvolvimento

- [🏛️ Arquitetura do Backend](docs/backend/ARQUITETURA.md)
- [⚡ Serviços](docs/backend/SERVICOS.md)
- [🗄️ Banco de Dados](docs/infra/DATABASE.md)
- [🔌 API Reference](docs/api/API.md)

### 🎯 Funcionalidades Principais

- [✅ **COPSOQ II - Guia Completo**](docs/guides/GUIA-COPSOQ-II.md)
- [📊 Status da Implementação COPSOQ](docs/questionaries/STATUS_IMPLEMENTACAO_COPSOQ.md)
- [🔐 Autenticação](docs/backend/AUTENTICACAO.md)
- [🏢 Organizações e Setores](docs/backend/ORGANIZACOES.md)

### 🔗 Integrações

- [💬 WhatsApp/Twilio](docs/integracoes/WHATSAPP.md)
- [⚙️ Celery](docs/integracoes/CELERY.md)
- [🗃️ Redis](docs/integracoes/REDIS.md)

### 📖 Guias Técnicos

- [🧪 Testes](docs/guides/GUIA-TESTES.md)
- [📦 Repositórios](docs/guides/GUIA-REPOSITORIES.md)
- [🔍 MongoDB Compass](docs/guides/GUIA-COMPASS.md)

### 📋 Referências

- [📜 Índice Completo da Documentação](docs/README.md)
- [🎯 Objetivo do Projeto](docs/visao-geral/objetivo.md)
- [✨ Funcionalidades](docs/visao-geral/funcionalidades.md)

---

## 🧪 Executando Testes

```bash
# Todos os testes
pytest

# Com cobertura
pytest --cov=src/app --cov-report=html

# Apenas unitários
pytest tests/unit/

# Apenas integração
pytest tests/integration/

# Testes de serviço
pytest tests/services/ -v
```

---

## 🛠️ Variáveis de Ambiente

Principais variáveis de configuração (`backend/.env`):

```env
# MongoDB
MONGO_URI=mongodb://localhost:27017
MONGO_DB_NAME=LuzIA

# JWT
SECRET_KEY=your-secret-key-here
ACCESS_TOKEN_EXPIRE_MINUTES=120

# Twilio / WhatsApp
TWILIO_ACCOUNT_SID=ACXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
TWILIO_AUTH_TOKEN=your_auth_token_here
TWILIO_WHATSAPP_FROM=whatsapp:+1XXXXXXXXXX
TWILIO_WHATSAPP_NUMBER=whatsapp:+1XXXXXXXXXX

# Redis (opcional)
REDIS_URL=redis://localhost:6379

# Ambiente
ENVIRONMENT=development
LOG_LEVEL=INFO
```

Veja [Guia de Configuração](docs/guides/GUIA-CONFIGURACAO.md) para detalhes completos.

---

## 🤝 Como Contribuir

Contribuições são bem-vindas! Por favor:

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/MinhaFeature`)
3. Commit suas mudanças (`git commit -m 'Adiciona MinhaFeature'`)
4. Push para a branch (`git push origin feature/MinhaFeature`)
5. Abra um Pull Request

Leia [CONTRIBUTING.md](CONTRIBUTING.md) para diretrizes detalhadas.

---

## 📝 Changelog

Veja [CHANGELOG.md](CHANGELOG.md) para histórico de versões e mudanças.

---

## 🔐 Segurança

O projeto segue práticas de segurança rigorosas:

- Autenticação JWT
- Hashing de senhas com bcrypt
- Anonimização de dados (LGPD)
- Validação de entrada com Pydantic
- Rate limiting
- CORS configurável

Veja [docs/security/SEGURANCA.md](docs/security/SEGURANCA.md) para mais detalhes.

---

## 📄 Licença

Este projeto está sob a licença MIT. Veja [LICENSE](LICENSE) para mais informações.

---

## 👥 Equipe

Desenvolvido com ❤️ para facilitar avaliações de saúde mental no trabalho.

---

## 📞 Suporte

- 📖 [Documentação Completa](docs/README.md)
- 🐛 [Reportar Bug](https://github.com/user/repo/issues)
- 💡 [Solicitar Feature](https://github.com/user/repo/issues)

---

**Status do Projeto:** 🟢 Ativo e em desenvolvimento

**Última Atualização:** 2026-02-15

# Deploy no Render.com + MongoDB Atlas

> **Voltar para:** [Documentação](README.md) | [README Principal](../README.md) | [Deployment Geral](DEPLOYMENT.md)

O LuzIA está atualmente hospedado no **Render.com** (backend + Redis) com banco de dados no **MongoDB Atlas** (cloud). Este guia documenta toda a infraestrutura de produção.

---

## Arquitetura de Produção

```
┌─────────────────────────────────────────────────────┐
│                    Render.com                        │
│                                                     │
│  ┌─────────────────────┐  ┌──────────────────────┐  │
│  │  luzia-backend      │  │  luzia-redis         │  │
│  │  (Docker / Free)    │  │  (Redis / Free)      │  │
│  │  Região: Oregon     │  │  Região: Oregon      │  │
│  │  Porta: $PORT       │  │  Policy: allkeys-lru │  │
│  │  Health: /health    │  │                      │  │
│  └────────┬────────────┘  └──────────┬───────────┘  │
│           │                          │              │
└───────────┼──────────────────────────┼──────────────┘
            │                          │
            │  ┌───────────────────────┘
            │  │
            ▼  ▼
┌─────────────────────────────────────────────────────┐
│                 MongoDB Atlas                        │
│                                                     │
│  Cluster: LuzIA (M0 Free / Shared)                  │
│  Região: AWS us-east-1 (ou compatível)              │
│  Database: LuzIA                                     │
│  Collections: usuarios, organizacoes, questionarios, │
│    perguntas, respostas, diagnosticos, relatorios,   │
│    setores                                           │
└─────────────────────────────────────────────────────┘
```

---

## 1. Configuração do MongoDB Atlas

### 1.1 Criar Conta e Cluster

1. Acesse [mongodb.com/atlas](https://www.mongodb.com/atlas) e crie uma conta
2. Crie um novo **Projeto** (ex: `LuzIA`)
3. Crie um **Cluster**:
   - Plano: **M0 (Free)** - Shared
   - Provider: **AWS**
   - Região: **us-east-1** (Virginia) - mais próximo do Render Oregon
   - Nome do Cluster: `LuzIA` (ou outro de sua preferência)

### 1.2 Configurar Acesso ao Banco

1. **Database Access** (Security > Database Access):
   - Clique em **Add New Database User**
   - Authentication Method: **Password**
   - Username: `luzia-backend`
   - Password: gere uma senha forte (guarde-a para usar na connection string)
   - Database User Privileges: **Read and write to any database**
   - Clique em **Add User**

2. **Network Access** (Security > Network Access):
   - Clique em **Add IP Address**
   - Selecione **Allow Access from Anywhere** (`0.0.0.0/0`)
   - Isso é necessário porque o Render usa IPs dinâmicos no plano Free
   - Clique em **Confirm**

### 1.3 Obter a Connection String

1. No cluster, clique em **Connect**
2. Selecione **Connect your application**
3. Driver: **Python** / Version: **3.6 or later**
4. Copie a connection string. Será algo como:

```
mongodb+srv://luzia-backend:<password>@luzia.xxxxx.mongodb.net/?retryWrites=true&w=majority&appName=LuzIA
```

5. Substitua `<password>` pela senha criada no passo anterior

### 1.4 Criar o Database e Popular Dados Iniciais

1. No Atlas, acesse **Browse Collections**
2. Crie o database `LuzIA` (se não existir)
3. Para popular os questionários COPSOQ, conecte via `mongosh`:

```bash
# Conecte ao Atlas
mongosh "mongodb+srv://luzia-backend:<password>@luzia.xxxxx.mongodb.net/LuzIA"

# Execute os seeds
load("backend/mongo/seed_copsoq_curta_br.js")
load("backend/mongo/seed_copsoq_media_pt.js")
```

Alternativamente, use o **MongoDB Compass** para importar os dados.

### 1.5 Criar Índices

Execute o script de criação de índices apontando para o Atlas:

```bash
MONGO_URI="mongodb+srv://luzia-backend:<password>@luzia.xxxxx.mongodb.net" \
MONGO_DB_NAME="LuzIA" \
python backend/scripts/create_indexes.py
```

---

## 2. Configuração do Render.com

### 2.1 Criar Conta e Conectar Repositório

1. Acesse [render.com](https://render.com) e crie uma conta
2. Conecte sua conta GitHub/GitLab
3. Autorize o acesso ao repositório do LuzIA

### 2.2 Deploy via Blueprint (Recomendado)

O projeto inclui um arquivo `render.yaml` na raiz que configura automaticamente todos os serviços.

1. No dashboard do Render, clique em **New** > **Blueprint**
2. Selecione o repositório do LuzIA
3. O Render detectará automaticamente o `render.yaml`
4. Configure as variáveis marcadas como `sync: false` (valores sensíveis):

| Variável | Onde Obter |
|----------|-----------|
| `MONGO_URI` | Connection string do MongoDB Atlas (passo 1.3) |
| `TWILIO_ACCOUNT_SID` | [console.twilio.com](https://console.twilio.com) > Account SID |
| `TWILIO_AUTH_TOKEN` | [console.twilio.com](https://console.twilio.com) > Auth Token |
| `TWILIO_WHATSAPP_FROM` | Número WhatsApp Twilio (formato: `whatsapp:+1XXXXXXXXXX`) |
| `TWILIO_WHATSAPP_NUMBER` | Mesmo número acima |
| `TWILIO_MESSAGING_SERVICE_SID` | Twilio Console > Messaging Services |

5. Clique em **Apply** para iniciar o deploy

### 2.3 Deploy Manual (Alternativa)

Se preferir configurar manualmente:

#### Backend (Web Service)

1. **New** > **Web Service**
2. Conecte ao repositório
3. Configure:
   - **Name:** `luzia-backend`
   - **Region:** Oregon (US West)
   - **Branch:** `main`
   - **Runtime:** Docker
   - **Dockerfile Path:** `./backend/Dockerfile`
   - **Docker Context:** `./backend`
   - **Plan:** Free
   - **Health Check Path:** `/health`

4. Adicione as **Environment Variables** (veja seção 2.4)

#### Redis

1. **New** > **Redis**
2. Configure:
   - **Name:** `luzia-redis`
   - **Region:** Oregon (mesma do backend)
   - **Plan:** Free
   - **Maxmemory Policy:** `allkeys-lru`

3. Copie a **Internal Connection String** e use como `REDIS_URL` no backend

### 2.4 Variáveis de Ambiente no Render

Configure estas variáveis no serviço `luzia-backend`:

**Geradas automaticamente pelo Blueprint:**

| Variável | Valor |
|----------|-------|
| `SECRET_KEY` | Gerado automaticamente pelo Render |
| `REDIS_URL` | Conectado ao serviço `luzia-redis` |

**Configuradas manualmente:**

| Variável | Valor | Descrição |
|----------|-------|-----------|
| `MONGO_URI` | `mongodb+srv://...` | Connection string do Atlas |
| `MONGO_DB_NAME` | `LuzIA` | Nome do database |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | `120` | Expiração do token JWT |
| `ENVIRONMENT` | `production` | Ambiente de execução |
| `LOG_LEVEL` | `INFO` | Nível de log |
| `CORS_ORIGINS` | `*` | Origens permitidas (restringir em produção) |
| `MONGO_MAX_POOL_SIZE` | `50` | Conexões máximas MongoDB |
| `MONGO_MIN_POOL_SIZE` | `5` | Conexões mínimas MongoDB |
| `MONGO_TIMEOUT_MS` | `5000` | Timeout de conexão |
| `TWILIO_ACCOUNT_SID` | `ACXXX...` | SID da conta Twilio |
| `TWILIO_AUTH_TOKEN` | `xxx...` | Token de autenticação Twilio |
| `TWILIO_WHATSAPP_FROM` | `whatsapp:+1XXX` | Número remetente |
| `TWILIO_WHATSAPP_NUMBER` | `whatsapp:+1XXX` | Número WhatsApp |
| `TWILIO_VALIDATE_SIGNATURE` | `true` | Validar assinatura em produção |

---

## 3. O Arquivo render.yaml

O blueprint de deploy está em `render.yaml` na raiz do projeto:

```yaml
services:
  # Backend - FastAPI (Docker)
  - type: web
    name: luzia-backend
    runtime: docker
    region: oregon
    plan: free
    dockerfilePath: ./backend/Dockerfile
    dockerContext: ./backend
    branch: main
    healthCheckPath: /health
    envVars:
      - key: MONGO_URI
        sync: false              # Configurar manualmente (MongoDB Atlas)
      - key: MONGO_DB_NAME
        value: LuzIA
      - key: SECRET_KEY
        generateValue: true      # Gerado automaticamente
      - key: REDIS_URL
        fromService:             # Conectado ao Redis do Render
          name: luzia-redis
          type: redis
          property: connectionString
      # ... (demais variáveis)

  # Redis - Cache & Message Broker
  - type: redis
    name: luzia-redis
    region: oregon
    plan: free
    maxmemoryPolicy: allkeys-lru
```

### Pontos importantes do Blueprint

- **`sync: false`**: Variáveis sensíveis que devem ser configuradas manualmente no dashboard
- **`generateValue: true`**: O Render gera automaticamente um valor seguro
- **`fromService`**: Conecta automaticamente ao serviço Redis interno
- **`healthCheckPath`**: O Render monitora `/health` para garantir que o backend está operacional

---

## 4. Dockerfile de Produção

O `backend/Dockerfile` usa build multi-stage otimizado para o Render:

```dockerfile
# Stage 1: Builder - Compila dependências
FROM python:3.11-slim AS builder
# ... instala wheels das dependências

# Stage 2: Runtime - Imagem final leve
FROM python:3.11-slim AS runtime
# ... copia wheels, instala deps de runtime (WeasyPrint)
# Cria usuário não-root (segurança)
# Health check embutido
# Usa $PORT do Render (padrão: 8000)
CMD ["sh", "-c", "uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}"]
```

**Detalhes:**
- **Python 3.11-slim**: Imagem base leve
- **Usuário não-root** (`appuser`): Prática de segurança
- **`$PORT`**: O Render injeta a porta em runtime, o Dockerfile usa fallback 8000
- **WeasyPrint**: Dependências para geração de PDF de relatórios
- **Health check**: Monitoramento via endpoint `/health`

---

## 5. Conexão Resiliente com MongoDB Atlas

O backend implementa conexão resiliente para lidar com latência e cold starts no Render:

- **Pool de conexões**: `MONGO_MAX_POOL_SIZE=50`, `MONGO_MIN_POOL_SIZE=5`
- **Timeout**: `MONGO_TIMEOUT_MS=5000` (5 segundos)
- **Retry automático**: O driver Motor reconecta automaticamente
- **`retryWrites=true`**: Na connection string do Atlas, garante escrita resiliente

---

## 6. Limitações do Plano Free

### Render.com (Free)

| Limitação | Impacto |
|-----------|---------|
| **Spin-down após 15 min de inatividade** | Primeira requisição pode levar ~30s (cold start) |
| **750 horas/mês** | Suficiente para 1 serviço 24/7 |
| **Sem domínio customizado** | URL será `luzia-backend.onrender.com` |
| **512 MB RAM** | Adequado para a aplicação |
| **Build time limitado** | Builds Docker podem ser lentos |

### MongoDB Atlas (M0 Free)

| Limitação | Impacto |
|-----------|---------|
| **512 MB de armazenamento** | Suficiente para milhares de respostas |
| **Shared cluster** | Performance pode variar |
| **Sem backups automáticos** | Necessário backup manual |
| **100 conexões máximas** | Suficiente com pool configurado |
| **Sem alertas avançados** | Monitoramento básico apenas |

### Redis (Render Free)

| Limitação | Impacto |
|-----------|---------|
| **25 MB de memória** | Suficiente para cache de dashboard |
| **Policy allkeys-lru** | Remove chaves menos usadas quando cheio |
| **Sem persistência** | Cache é reconstruído após restart |

---

## 7. Deploy e Atualizações

### Deploy Automático

O Render faz deploy automático a cada push na branch `main`:

```
git push origin main → Render detecta → Build Docker → Deploy
```

### Deploy Manual

No dashboard do Render:
1. Vá ao serviço `luzia-backend`
2. Clique em **Manual Deploy** > **Deploy latest commit**

### Monitorar Deploy

1. Acesse o dashboard do Render
2. Vá em **Events** para ver o histórico de deploys
3. Vá em **Logs** para ver logs em tempo real
4. O endpoint `/health` retorna o status:

```json
{
  "status": "healthy",
  "mongo": "connected"
}
```

---

## 8. Webhook do Twilio em Produção

Após o deploy, configure o webhook do Twilio para apontar para o Render:

1. Acesse [console.twilio.com](https://console.twilio.com)
2. Navegue para **Messaging** > **Try it out** > **Send a WhatsApp message**
3. Configure o webhook:
   - **When a message comes in:** `https://luzia-backend.onrender.com/bot/twilio/whatsapp`
   - **Method:** `POST`
4. Ative `TWILIO_VALIDATE_SIGNATURE=true` no Render para segurança

---

## 9. Troubleshooting

### Backend não inicia

```bash
# Verifique os logs no dashboard do Render
# Ou acesse: https://dashboard.render.com > luzia-backend > Logs
```

**Causas comuns:**
- `MONGO_URI` incorreta ou sem acesso de rede configurado no Atlas
- `SECRET_KEY` não definida
- Erro de build no Dockerfile

### Erro de conexão com MongoDB Atlas

- Verifique se o IP `0.0.0.0/0` está na whitelist do Atlas (Network Access)
- Confirme que o usuário e senha na connection string estão corretos
- Teste a connection string localmente com `mongosh`

### Cold start lento (30+ segundos)

- Comportamento normal no plano Free do Render
- O serviço entra em sleep após 15 minutos de inatividade
- Considere um plano pago para serviço sempre ativo
- Alternativa: configure um serviço de ping externo (ex: UptimeRobot) para manter o serviço ativo

### Redis não conecta

- Verifique se o serviço `luzia-redis` está rodando no Render
- A variável `REDIS_URL` deve ser configurada via `fromService` no blueprint
- O backend funciona sem Redis (cache desativado)

### Webhook Twilio retorna erro

- Verifique se a URL do webhook está correta (com `/bot/twilio/whatsapp`)
- Em desenvolvimento, desative `TWILIO_VALIDATE_SIGNATURE`
- Verifique os logs para detalhes do erro

---

## 10. Backup do MongoDB Atlas

### Exportar Dados (Manual)

```bash
# Exportar todas as collections
mongodump --uri="mongodb+srv://luzia-backend:<password>@luzia.xxxxx.mongodb.net/LuzIA" --out=./backup

# Exportar collection específica
mongoexport --uri="mongodb+srv://..." --db=LuzIA --collection=respostas --out=respostas.json
```

### Restaurar Dados

```bash
# Restaurar backup completo
mongorestore --uri="mongodb+srv://..." ./backup

# Importar collection específica
mongoimport --uri="mongodb+srv://..." --db=LuzIA --collection=respostas --file=respostas.json
```

---

**Última Atualização:** 2026-02-15

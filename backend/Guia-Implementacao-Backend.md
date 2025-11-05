# LuzIA — Guia de Implementação do Backend

Este guia descreve como implementar a arquitetura do backend do projeto LuzIA, alinhando-se às especificações do produto e ao modelo de dados já definido no `init.js` e `ModeloConceitual.json`. O backend é em Python, com integração ao WhatsApp Business, armazenamento em MongoDB e geração de diagnósticos/relatórios.

## 1. Visão Geral da Arquitetura
- Objetivo: aplicar questionários (CoPsoQ II, DASS-21), coletar respostas, calcular diagnósticos e gerar relatórios, garantindo anonimização conforme LGPD.
- Camadas:
  - API HTTP (FastAPI) para integrações e painel administrativo.
  - Integração com WhatsApp (webhook + envio de mensagens via API Meta).
  - Serviços de domínio (regras de negócio: cálculo de métricas, diagnósticos, relatórios).
  - Repositórios (acesso a dados em MongoDB via `motor`).
  - Jobs assíncronos (celery/redis) para tarefas pesadas (geração de PDF, cálculos batch).
  - Observabilidade (logs estruturados e métricas básicas).

## 2. Stack Recomendada
- Framework web: FastAPI (`fastapi`, `uvicorn[standard]`).
- Driver MongoDB assíncrono: `motor`.
- Validação/Modelos: Pydantic v2 (`pydantic`).
- Autenticação: JWT (`python-jose`, `passlib`) — opcional para painel/admin.
- Jobs assíncronos (opcional): `celery` + `redis`.
- Geração de PDF (opcional): `weasyprint` ou `wkhtmltopdf` via `pdfkit`.
- Logs: `structlog` ou logging padrão.

## 3. Estrutura de Pastas (sugerida)
```
backend/
  app/
    main.py            # inicializa FastAPI e routers
    config.py          # leitura de env e configurações
    db.py              # conexão com Mongo (motor)
    routers/
      organizacoes.py
      setores.py
      usuarios.py
      questionarios.py
      perguntas.py
      respostas.py
      diagnosticos.py
      relatorios.py
      whatsapp_webhook.py
    models/            # modelos Pydantic (request/response)
    repositories/      # acesso a coleções Mongo
    services/          # regras de negócio e cálculos
    workers/           # tarefas assíncronas (celery)
    utils/             # utilitários (ObjectId, anonimização, etc.)
  mongo/
    init.js            # criação das coleções
    WSL-MongoDB-Setup.md
  .env                 # variáveis de ambiente
  requirements.txt
```

## 4. Modelo de Dados (coleções) — mapeamento
Conforme `backend/mongo/init.js` (idempotente):
- `organizacoes`: `cnpj`, `nome`.
- `setores`: `idOrganizacao`, `nome`, `descricao`.
- `usuarios`: `telefone`, `idOrganizacao`, `anonId`, `status`, `dataCadastro`.
- `questionarios`: `nome`, `versao`, `descricao`, `dominios[]`, `escala`, `totalPerguntas`, `ativo`.
- `perguntas`: `idQuestionario`, `dominio`, `dimensao`, `idPergunta`, `texto`, `tipo`, `sinal`, `itemInvertido`, `escala`.
- `respostas`: `anonId`, `idQuestionario`, `data`, `respostas[]` com `{valor:int[0..4], idPergunta}`.
- `diagnosticos`: `anonId`, `idQuestionario`, `resultadoGlobal`, `dimensoes[]`, `dataAnalise`.
- `relatorios`: `idQuestionario`, `idOrganizacao`, `idSetor`, `anonId`, `tipoRelatorio`, `geradoPor`, `dataGeracao`, `metricas{mediaRiscoGlobal,double; indiceProtecao,double; totalRespondentes,int}`, `dominios[]` com `dimensoes[]`, `recomendacoes[]`, `observacoes`.

Observações:
- Em produção, ajuste `validationLevel` para `moderate` e `validationAction` para `error` usando `collMod`.
- Considere índices em: `usuarios(anonId)`, `setores(idOrganizacao)`, `perguntas(idQuestionario)`, `respostas(idQuestionario, anonId)`, `relatorios(idQuestionario, idOrganizacao, idSetor, tipoRelatorio, dataGeracao)`.

## 5. Configuração do Ambiente
- MongoDB local: `mongodb://localhost:27017/LuzIA` (ver `WSL-MongoDB-Setup.md`).
- Arquivo `.env` (exemplo):
```
MONGO_URI=mongodb://localhost:27017
MONGO_DB_NAME=LuzIA
API_PORT=8000
JWT_SECRET=troque_por_um_segredo
JWT_EXPIRE_MINUTES=120
WHATSAPP_VERIFY_TOKEN=troque
WHATSAPP_APP_SECRET=troque
WHATSAPP_ACCESS_TOKEN=EAAG...  # token de app Meta
```

`requirements.txt`:
```
fastapi
uvicorn[standard]
motor
pydantic
python-dotenv
python-jose[cryptography]
passlib[bcrypt]
structlog
celery
redis
pdfkit
weasyprint
```

## 6. Conexão com Mongo (motor) — exemplo
```python
# app/db.py
from motor.motor_asyncio import AsyncIOMotorClient
import os

_client = None

def get_client():
    global _client
    if _client is None:
        uri = os.getenv("MONGO_URI", "mongodb://localhost:27017")
        _client = AsyncIOMotorClient(uri)
    return _client

async def get_db():
    client = get_client()
    db_name = os.getenv("MONGO_DB_NAME", "LuzIA")
    return client[db_name]
```

## 7. Inicialização do App
```python
# app/main.py
from fastapi import FastAPI
from .routers import organizacoes, relatorios, whatsapp_webhook

app = FastAPI(title="LuzIA Backend")

app.include_router(organizacoes.router, prefix="/organizacoes", tags=["organizacoes"])
app.include_router(relatorios.router, prefix="/relatorios", tags=["relatorios"])
app.include_router(whatsapp_webhook.router, prefix="/whatsapp", tags=["whatsapp"])
```

Executar:
```
uvicorn app.main:app --reload --port 8000
```

## 8. Padrão de Camadas
- Routers: recebem requisições HTTP, validam entrada e chamam serviços.
- Services: regras de negócio (cálculos de métricas, composição de relatórios, anonimização).
- Repositories: encapsulam acesso a coleções Mongo (CRUD e queries).

Exemplo de Repository:
```python
# app/repositories/relatorios_repo.py
from typing import Any, Dict
from ..db import get_db

class RelatoriosRepo:
    async def insert(self, doc: Dict[str, Any]):
        db = await get_db()
        return await db.relatorios.insert_one(doc)

    async def find_by_questionario(self, qid):
        db = await get_db()
        return await db.relatorios.find({"idQuestionario": qid}).to_list(length=100)
```

## 9. Endpoints Principais (sugestão)
- `POST /organizacoes`: criar organização.
- `POST /setores`: criar setor.
- `POST /usuarios`: cadastrar usuário (gera `anonId` e status inicial).
- `GET /questionarios`: listar questionários ativos.
- `GET /perguntas?questionario=...`: listar perguntas.
- `POST /respostas`: receber lote de respostas de um respondente.
- `POST /diagnosticos/generate`: calcular diagnóstico para `anonId + idQuestionario`.
- `POST /relatorios/generate`: consolidar por `organizacao/setor` e calcular métricas.
- `GET /relatorios?filters...`: listar relatórios.
- `GET /whatsapp/webhook` e `POST /whatsapp/webhook`: verificação e recepção de mensagens.

## 10. Integração com WhatsApp Business (Meta)
- Verificação de webhook (`GET`): responder `hub.challenge` quando `hub.verify_token` bater com `WHATSAPP_VERIFY_TOKEN`.
- Recepção (`POST`): processar mensagens, mapear usuário → `anonId`, e registrar eventos.
- Envio de mensagens: usar `WHATSAPP_ACCESS_TOKEN` para chamadas à Graph API.

Exemplo de webhook (simplificado):
```python
# app/routers/whatsapp_webhook.py
from fastapi import APIRouter, Request
import os

router = APIRouter()

@router.get("/webhook")
async def verify(mode: str = "", challenge: str = "", verify_token: str = ""):
    if mode == "subscribe" and verify_token == os.getenv("WHATSAPP_VERIFY_TOKEN"):
        return int(challenge)
    return {"status": "forbidden"}

@router.post("/webhook")
async def receive(req: Request):
    payload = await req.json()
    # TODO: parse mensagens, chamar serviços para registrar respostas
    return {"status": "ok"}
```

## 11. Serviços de Cálculo (diagnósticos e relatórios)
- Entrada: respostas por `anonId` e `idQuestionario`.
- Processamento:
  - Correção de itens invertidos; aplicação de escala.
  - Cálculo por dimensão/domínio; agregação em indicadores (risco/proteção).
  - Regras específicas dos instrumentos (CoPsoQ II, DASS-21).
- Saída:
  - `diagnosticos`: por indivíduo (se aplicável) com `resultadoGlobal` e `dimensoes`.
  - `relatorios`: consolidados por `organizacao/setor` com métricas e recomendações.

Sinalização de risco/proteção:
- Usar campo `sinal` em `perguntas` para determinar se maior valor indica risco ou proteção.

## 12. Segurança e LGPD
- Anonimização: usar `anonId` em vez de dados pessoais nas coleções de respostas/diagnósticos/relatórios.
- Separação de dados pessoais: guardar o mínimo necessário em `usuarios`.
- Controle de acesso: JWT para endpoints administrativos.
- Criptografia em repouso (opcional): considerar MongoDB Encrypted Storage Engine.
- Logs sem dados sensíveis; mascarar campos como telefone.

## 13. Jobs Assíncronos (opcional)
- `celery` + `redis` para tarefas de:
  - Geração de PDF dos relatórios.
  - Reprocessamento de diagnósticos.
  - Envios em massa via WhatsApp.

## 14. Configuração e Banco de Dados
- Inicialize o banco com `backend/mongo/init.js`:
```
mongosh --file "C:/Users/danie/Desktop/LuzIA/LuzIA-1/backend/mongo/init.js" "mongodb://localhost:27017/LuzIA"
```
- No WSL, use o caminho `/mnt/c/...` (ver `WSL-MongoDB-Setup.md`).

## 15. Execução Local
- Instale dependências:
```
pip install -r requirements.txt
```
- Rode o servidor:
```
uvicorn app.main:app --reload --port 8000
```
- Teste saúde:
```
curl http://localhost:8000/docs
```

## 16. Testes
- Unitários com `pytest` para services e repositories.
- Fakes/Stubs para Mongo (p. ex. `mongomock` para testes síncronos ou fixtures isoladas).
- Testes de integração dos endpoints críticos (`respostas`, `relatorios`).

## 17. Observabilidade
- Logs estruturados com `structlog` (correlação por `anonId`/request-id).
- Métricas básicas (requests/seg, tempos, erros por endpoint) — opcional via Prometheus.

## 18. Deploy (sugestão)
- Docker Compose:
  - `backend` (FastAPI + Uvicorn)
  - `mongodb`
  - `redis` (se usar celery)
- Variáveis de ambiente injetadas via `.env`.
- Reverse proxy (Nginx) para TLS e roteamento.

## 19. Próximos Passos
- Implementar esqueleto do projeto (pastas/arquivos conforme acima).
- Codificar repositories para cada coleção.
- Codificar services de cálculo (DASS-21 e CoPsoQ II).
- Expor endpoints e fluxos de webhook do WhatsApp.
- Ajustar validações do Mongo para `error` em produção e criar índices.
- Adicionar geração de relatórios PDF e dashboards.

---
Este guia serve como referência de alto nível. A partir dele, você consegue estruturar o backend, conectar ao banco já definido, e evoluir para os módulos de integração e geração de relatórios/diagnósticos conforme as especificações do projeto.
# LuzIA — Guia de Implementação do Backend

Este guia descreve como implementar a arquitetura do backend do projeto LuzIA, alinhando-se às especificações do produto e ao modelo de dados já definido no `init.js` e `ModeloConceitual.json`. O backend é em Python, com integração ao WhatsApp Business, armazenamento em MongoDB e geração de diagnósticos/relatórios.

## 1. Visão Geral da Arquitetura
- Objetivo: aplicar questionários (CoPsoQ II), coletar respostas, calcular diagnósticos e gerar relatórios, garantindo anonimização conforme LGPD.
- Camadas:
  - API HTTP (FastAPI) para integrações e painel administrativo.
  - Integração com WhatsApp via Twilio (webhook + envio de mensagens).
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

### 4.1 Especificações Técnicas dos Questionários

#### CoPsoQ II (versão média)
- **Estrutura**:
  - Domínios: Exigências no trabalho, trabalho ativo, desenvolvimento profissional, etc.
  - Escala Likert: 0 (Nunca) a 4 (Sempre)
  - Itens invertidos: Requerem tratamento especial no cálculo
  - Cálculo de escores: Média dos itens por domínio, com ajuste para itens invertidos

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
TWILIO_ACCOUNT_SID=seu_account_sid
TWILIO_AUTH_TOKEN=seu_auth_token
TWILIO_WHATSAPP_NUMBER=whatsapp:+14155238886  # Número do Twilio Sandbox
```

`requirements.txt`:
```
fastapi
uvicorn[standard]
motor
pydantic
python-dotenv
passlib[bcrypt]
structlog
celery
redis
pdfkit
weasyprint
twilio
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

## 10. Fluxo de Comunicação via WhatsApp

### 10.1 Mensagens do Sistema
1. **Boas-vindas**:
   ```
   Olá! Você foi convidado a participar de uma avaliação psicossocial.
   Responda este questionário de forma anônima para nos ajudar a melhorar o ambiente de trabalho.
   ```

2. **Envio de Questionário**:
   - Enviar 3-5 perguntas por mensagem
   - Incluir instruções claras sobre a escala de resposta
   - Exemplo: "Responda de 0 a 4, onde 0=Nunca e 4=Sempre"

3. **Lembretes**:
   - Enviar após 24h de inatividade
   - Limite de 3 lembretes por questionário

4. **Confirmação de Envio**:
   ```
   Obrigado por responder! Suas respostas foram registradas de forma anônima.
   ```

## 11. Dashboard e Visualização de Dados

### 11.1 Métricas Principais
- Nível de risco psicossocial por setor
- Taxa de resposta
- Evolução temporal dos indicadores
- Comparativo entre setores

### 11.2 Endpoints da API para Dashboard
- `GET /api/dashboard/metricas-gerais`
- `GET /api/dashboard/evolucao-mensal`
- `GET /api/dashboard/comparativo-setores`

## 12. Integração com WhatsApp via Twilio
- Configuração do webhook no Twilio para receber mensagens
- Processamento de mensagens recebidas e mapeamento de usuário → `anonId`
- Envio de mensagens usando a API do Twilio

Exemplo de implementação do webhook:
```python
# app/routers/twilio_webhook.py
from fastapi import APIRouter, Request, HTTPException
from twilio.request_validator import RequestValidator
import os
from twilio.rest import Client

router = APIRouter()

# Configuração do cliente Twilio
account_sid = os.getenv('TWILIO_ACCOUNT_SID')
auth_token = os.getenv('TWILIO_AUTH_TOKEN')
twilio_number = os.getenv('TWILIO_WHATSAPP_NUMBER')
client = Client(account_sid, auth_token)

@router.post("/webhook")
async def receive_message(request: Request):
    form_data = await request.form()
    
    # Validar a requisição vinda do Twilio
    validator = RequestValidator(auth_token)
    url = str(request.url)
    signature = request.headers.get('X-Twilio-Signature', '')
    
    if not validator.validate(url, form_data, signature):
        raise HTTPException(status_code=400, detail="Invalid request signature")
    
    # Processar a mensagem recebida
    from_number = form_data.get('From', '')
    message_body = form_data.get('Body', '').strip().lower()
    
    # Aqui você pode adicionar a lógica para processar as respostas
    # e enviar as próximas perguntas ou confirmações
    
    return {"status": "ok"}

# Função para enviar mensagem
async def send_whatsapp_message(to_number: str, message: str):
    try:
        message = client.messages.create(
            body=message,
            from_=f"whatsapp:{twilio_number}",
            to=f"whatsapp:{to_number}"
        )
        return {"status": "sent", "message_sid": message.sid}
    except Exception as e:
        return {"status": "error", "error": str(e)}
```

## 11. Serviços de Cálculo (diagnósticos e relatórios)
- Entrada: respostas por `anonId` e `idQuestionario`.
- Processamento:
  - Correção de itens invertidos; aplicação de escala.
  - Cálculo por dimensão/domínio; agregação em indicadores (risco/proteção).
  - Regras específicas do instrumento CoPsoQ II.
- Saída:
  - `diagnosticos`: por indivíduo (se aplicável) com `resultadoGlobal` e `dimensoes`.
  - `relatorios`: consolidados por `organizacao/setor` com métricas e recomendações.

Sinalização de risco/proteção:
- Usar campo `sinal` em `perguntas` para determinar se maior valor indica risco ou proteção.

## 13. Segurança e LGPD (Expandido)

### 13.1 Processo de Anonimização
1. **Geração do anonId**:
   ```python
   import hashlib
   def gerar_anon_id(telefone, salt):
       return hashlib.sha256(f"{telefone}{salt}".encode()).hexdigest()
   ```

2. **Políticas de Retenção**:
   - Dados brutos: 6 meses
   - Dados anonimizados: 5 anos
   - Exclusão sob demanda conforme LGPD

### 13.2 Criptografia
- Em trânsito: TLS 1.2+
- Em repouso: MongoDB Encrypted Storage Engine
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

## 19. Monitoramento e Métricas

### 19.1 Métricas de Uso
- Total de questionários respondidos
- Taxa de conclusão
- Tempo médio de resposta

### 19.2 Alertas
- Queda na taxa de resposta
- Aumento nos níveis de risco
- Problemas na integração com Twilio

## 20. Fluxo de Trabalho Completo

1. **Cadastro**:
   - Administrador cadastra organização e setores
   - Importa lista de colaboradores (CSV/API)

2. **Aplicação**:
   - Envio automático de convites via WhatsApp
   - Acompanhamento de respostas em tempo real

3. **Análise**:
   - Cálculo automático de escores
   - Geração de relatórios
   - Alertas para casos críticos

4. **Acompanhamento**:
   - Dashboards interativos
   - Exportação de relatórios
   - Agendamento de novas avaliações

## 21. Próximos Passos
- Implementar esqueleto do projeto (pastas/arquivos conforme acima).
- Codificar repositories para cada coleção.
- Codificar services de cálculo (DASS-21 e CoPsoQ II).
- Expor endpoints e fluxos de webhook do WhatsApp.
- Ajustar validações do Mongo para `error` em produção e criar índices.
- Adicionar geração de relatórios PDF e dashboards.

---
Este guia serve como referência de alto nível. A partir dele, você consegue estruturar o backend, conectar ao banco já definido, e evoluir para os módulos de integração e geração de relatórios/diagnósticos conforme as especificações do projeto.
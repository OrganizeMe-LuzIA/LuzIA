# Celery — Processamento Assíncrono

> **Voltar para:** [📚 Documentação](../README.md) | [🏛️ Arquitetura](../backend/ARQUITETURA.md)

---

## 📋 Visão Geral

O LuzIA utiliza **Celery** para processamento assíncrono de tarefas pesadas, como cálculo de diagnósticos e geração de relatórios organizacionais. Isso garante que a API responda rapidamente enquanto o trabalho pesado é feito em background.

---

## ⚙️ Configuração

### Variáveis de Ambiente

```env
CELERY_BROKER_URL=redis://localhost:6379/0
CELERY_RESULT_BACKEND=redis://localhost:6379/0
```

> Definidas em [`backend/src/app/core/config.py`](../../backend/src/app/core/config.py) como parte da classe `Settings`.

### Integração com Redis

O Celery utiliza **Redis** como broker de mensagens e backend de resultados:

```mermaid
graph LR
    API[FastAPI API] -->|.delay()| Redis[(Redis Broker)]
    Redis -->|consume| Worker[Celery Worker]
    Worker -->|result| Redis
```

---

## 📁 Workers

**Diretório:** [`backend/src/app/workers/`](../../backend/src/app/workers/)

### `diagnostico_tasks.py`

```python
@shared_task(name="calculate_diagnostico")
def calculate_diagnostico(anon_id: str, questionario_id: str) -> dict:
    """
    1. Busca respostas do usuário (por anonId + questionário)
    2. Carrega questionário e perguntas do MongoDB
    3. Calcula pontuações usando DiagnosticoService
    4. Salva o diagnóstico no banco
    """
```

**Disparado por:** `POST /api/v1/respostas/` — ao submeter respostas

### `relatorio_tasks.py`

```python
@shared_task(name="generate_organizational_report")
def generate_organizational_report(
    questionario_id: str, org_id: str, gerado_por: str
) -> dict:
    """Gera relatório organizacional agregando todos os diagnósticos da organização."""

@shared_task(name="generate_sector_report")
def generate_sector_report(
    questionario_id: str, setor_id: str, org_id: str, gerado_por: str
) -> dict:
    """Gera relatório setorial agregando diagnósticos do setor."""
```

**Disparado por:** `POST /api/v1/relatorios/gerar-async`

---

## 🔄 Fluxo de Tipo

```
Usuário responde questionário
    → POST /respostas/
        → calculate_diagnostico.delay(anon_id, questionario_id)
            → DiagnosticoService.calculate_score()
                → salva Diagnostico no MongoDB

Admin solicita relatório assíncrono
    → POST /relatorios/gerar-async
        → generate_organizational_report.delay(...)
        ou → generate_sector_report.delay(...)
            → RelatorioService.generate_relatorio()
                → salva Relatorio no MongoDB
```

---

## 🚀 Executando o Worker

```bash
# Dentro do diretório backend/
celery -A app.workers.diagnostico_tasks worker --loglevel=info

# Ou via docker-compose (quando descomentado)
docker compose up celery-worker
```

> **Nota:** O `docker-compose.yml` possui a configuração do Celery worker comentada. Descomentar para uso em produção.

---

## 📊 Monitoramento

O Celery retorna `task_id` que pode ser usado para rastreamento:

```json
// Resposta do POST /respostas/
{ "message": "Respostas salvas...", "task_id": "abc-123-def" }

// Resposta do POST /relatorios/gerar-async
{ "task_id": "xyz-456", "status": "queued", "message": "..." }
```

---

## 🔗 Documentos Relacionados

- [🔄 Redis](REDIS.md) — Broker e backend de resultados
- [⚡ Serviços](../backend/SERVICOS.md) — Lógica de negócio executada pelos workers
- [🔌 API](../api/API.md) — Endpoints que disparam tarefas

---

**Última Atualização:** 2026-02-16

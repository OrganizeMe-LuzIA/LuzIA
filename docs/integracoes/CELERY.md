# Celery - Tarefas Assíncronas

> **Voltar para:** [📚 Documentação](../README.md)

---

## ⚙️ Configuração

```env
CELERY_BROKER_URL=redis://localhost:6379/0
CELERY_RESULT_BACKEND=redis://localhost:6379/1
```

---

## 📋 Tarefas

- `gerar_relatorio_async`: Relatórios grandes
- `enviar_notificacoes_massa`: Notificações em lote

---

## 🚀 Execução

```bash
celery -A src.app.workers.celery_app worker --loglevel=info
```

---

**Última Atualização:** 2026-02-07

# Melhorias Planejadas — LuzIA

> **Última Atualização:** 2026-02-17
> **Status Atual:** v2.1.2 — Implementação COPSOQ II completa e validada

---

## ✅ Concluído (v2.0.0 – v2.1.2)

As seguintes melhorias foram identificadas e já estão implementadas:

- **COPSOQ II completo** — versão curta brasileira (40 itens) e média portuguesa (76 itens)
- **Classificação por tercis** — metodologia científica validada (≤2.33 / 2.33-3.67 / ≥3.67)
- **StatusEnum** — validação de status de usuário via Enum (`não iniciado`, `em andamento`, `finalizado`)
- **Autenticação JWT** — tokens com `jti`, `iat`, expiração de 8 dias (11.520 min)
- **Hashing PBKDF2-SHA256** — via `passlib.CryptContext`
- **Validação de CNPJ** — dígitos verificadores via `core/validators.py`
- **Validação de telefone E.164** — regex `^\+\d{10,15}$`
- **Cache Redis** — `CacheClient` com TTL, invalidação por padrão e graceful degradation
- **Celery Workers** — tarefas assíncronas para diagnósticos e relatórios
- **Índices MongoDB** — 14 índices criados para otimização de queries
- **Documentação OpenAPI** — metadata enriquecida com exemplos por endpoint
- **Testes de serviços** — cobertura 88–95% em `COPSOQScoringService`, `DiagnosticoService`, `RelatorioService`
- **Anonimização LGPD** — `anonId` UUID desvinculado de dados pessoais
- **Dashboard Service** — 10 métodos com métricas e KPIs em tempo real
- **Twilio Content Templates** — 6 escalas COPSOQ com fallback para texto simples
- **Multi-tenant** — organizações, setores e roles (`admin_global`, `admin_org`, `gestor`, `usuario`)
- **Deploy Render + MongoDB Atlas** — ambiente de produção configurado via `render.yaml`
- **Frontend Next.js 14** — dashboard com Recharts, TypeScript e Tailwind CSS

---

## 🔄 Em Andamento

- **Testes de integração** — expandir cobertura para todos os repositórios e endpoints
- **Frontend dashboard** — melhorias visuais e fluxos de relatórios

---

## 📋 Backlog (Próximos Passos)

### Alta Prioridade

| Item | Descrição |
|------|-----------|
| **Rate Limiting** | Implementar com Redis: máx. 5 tentativas/minuto por IP (`check_rate_limit` já tem hook pronto) |
| **Exportação PDF** | Geração de relatórios em PDF via WeasyPrint (serviço `RelatorioExportService` já existe) |
| **Exportação Excel** | Geração de planilhas via OpenPyXL |
| **Logs de Auditoria** | Registrar ações sensíveis sem expor dados pessoais |

### Média Prioridade

| Item | Descrição |
|------|-----------|
| **Análise Temporal** | Comparação de relatórios ao longo do tempo por organização |
| **Benchmarking Setorial** | Comparação entre setores da mesma organização |
| **Tutorial do Dashboard** | Guia de uso para gestores no painel web |
| **Configuração de Workers em Produção** | Guia de deploy do Celery em ambientes cloud |

### Baixa Prioridade

| Item | Descrição |
|------|-----------|
| **OTP via Twilio Verify** | Verificação de telefone por código SMS/WhatsApp |
| **HTTPS via Nginx** | Terminalização SSL para deploy on-premises |
| **Exemplos de Integração Frontend** | Snippets de chamadas à API para desenvolvedores frontend |
| **Internacionalização** | Suporte multilíngue além de `pt-BR` e `pt-PT` |

---

## 🔗 Documentos Relacionados

- [CHANGELOG.md](../../CHANGELOG.md) — Histórico de versões
- [STATUS_IMPLEMENTACAO_COPSOQ.md](../questionaries/STATUS_IMPLEMENTACAO_COPSOQ.md) — Status do COPSOQ II
- [GUIA-COPSOQ-II.md](../guides/GUIA-COPSOQ-II.md) — Implementação completa do COPSOQ II
- [SEGURANCA.md](../security/SEGURANCA.md) — Checklist de segurança e próximos passos

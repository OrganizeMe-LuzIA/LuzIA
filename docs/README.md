# Índice da Documentação LuzIA

> **Última atualização:** 2026-02-15

---

## Documentação Principal

### Visão Geral
- [Objetivo do Projeto](./visao-geral/objetivo.md)
- [Funcionalidades](./visao-geral/funcionalidades.md)
- [Lógica de Funcionamento](./visao-geral/Logica-de-funcionamento.md)

### Deployment e Infraestrutura
- [Deployment Geral](./DEPLOYMENT.md) - Docker, manual e produção
- **[Deploy no Render + MongoDB Atlas](./DEPLOY-RENDER.md)** ⭐ - Guia completo do ambiente de produção atual
- [Banco de Dados MongoDB](./infra/DATABASE.md) - Collections, queries e índices

### Guias Técnicos
- **[GUIA-COPSOQ-II.md](./guides/GUIA-COPSOQ-II.md)** ⭐ - Implementação completa do COPSOQ II
- [GUIA-INSTALACAO.md](./guides/GUIA-INSTALACAO.md) - Guia de instalação
- [GUIA-CONFIGURACAO.md](./guides/GUIA-CONFIGURACAO.md) - Guia de configuração
- [GUIA-COMPASS.md](./guides/GUIA-COMPASS.md) - MongoDB Compass
- [GUIA-DATA-ACCESS.md](./guides/GUIA-DATA-ACCESS.md) - Acesso a dados
- [GUIA-REPOSITORIES.md](./guides/GUIA-REPOSITORIES.md) - Padrões de repositórios
- [GUIA-TESTES.md](./guides/GUIA-TESTES.md) - Testes automatizados
- [Guia-Implementacao-Backend.md](./guides/Guia-Implementacao-Backend.md) - Backend geral

### Arquitetura e Backend
- [Arquitetura do Backend](./backend/ARQUITETURA.md) - Camadas, stack e fluxos
- [Serviços](./backend/SERVICOS.md) - Camada de serviços
- [Modelos de Dados](./backend/MODELOS.md) - Schemas Pydantic
- [Autenticação](./backend/AUTENTICACAO.md) - JWT e segurança
- [Organizações e Setores](./backend/ORGANIZACOES.md) - Gestão multi-tenant

### Integrações
- [WhatsApp / Twilio](./integracoes/WHATSAPP.md) - Bot conversacional via Twilio
- [Celery](./integracoes/CELERY.md) - Tarefas assíncronas
- [Redis](./integracoes/REDIS.md) - Cache e message broker

### API
- [API Reference](./api/API.md) - Documentação de endpoints

### Status e Planos
- **[STATUS_IMPLEMENTACAO_COPSOQ.md](./questionaries/STATUS_IMPLEMENTACAO_COPSOQ.md)** ⭐ - Status atual COPSOQ II
- [MELHORIAS.md](./versions/MELHORIAS.md) - Melhorias planejadas

### Planos de Implementação
- **[PLANO_COPSOQ_DATABASE_FINAL.md](./plans/PLANO_COPSOQ_DATABASE_FINAL.md)** ⭐ - Especificação COPSOQ II
- [PLANO_COPSOQ_DATABASE_REVISADO.md](./plans/PLANO_COPSOQ_DATABASE_REVISADO.md)
- [PLANO_COPSOQ_DATABASE.md](./plans/PLANO_COPSOQ_DATABASE.md)

### Segurança
- [Segurança](./security/SEGURANCA.md) - Práticas de segurança

### Versões
- [Release 2.1.0](./versions/RELEASE_2.1.0.md)
- [Changelog](../CHANGELOG.md)

---

## COPSOQ II - Implementação Completa

### Status Atual: Implementado e Validado (100%)

A implementação do questionário **COPSOQ II** (Copenhagen Psychosocial Questionnaire) está **completa e pronta para produção**, com conformidade total à metodologia oficial.

#### Documentos Principais

| Documento | Descrição | Status |
|-----------|-----------|--------|
| [GUIA-COPSOQ-II.md](./guides/GUIA-COPSOQ-II.md) | Guia completo de implementação com arquitetura, serviços, modelos e exemplos | Completo |
| [STATUS_IMPLEMENTACAO_COPSOQ.md](./questionaries/STATUS_IMPLEMENTACAO_COPSOQ.md) | Status detalhado com mudanças do último commit | Atualizado |
| [PLANO_COPSOQ_DATABASE_FINAL.md](./plans/PLANO_COPSOQ_DATABASE_FINAL.md) | Especificação técnica das duas versões | Referência |

#### Componentes Implementados

- **COPSOQScoringService** - Lógica de scoring e classificação por tercis
- **DiagnosticoService** - Processamento de respostas individuais
- **RelatorioService** - Agregação organizacional e geração de insights
- **DashboardService** - Métricas e KPIs com cache Redis
- **TwilioContentService** - Templates interativos para WhatsApp
- **Modelos Pydantic** - RelatorioDominio, RelatorioDimensao, DiagnosticoDimensao

#### Capacidades

**Diagnósticos Individuais:**
- Classificação por tercis (verde/amarelo/vermelho)
- Análise por dimensões de proteção e risco
- Resultados baseados em metodologia COPSOQ II

**Relatórios Organizacionais:**
- Agregação por domínios (EL, OTC, RSL, ITI, VLT, SBE, CO, PER)
- Distribuição de respostas por tercil
- Métricas: Média de Risco Global, Índice de Proteção
- Recomendações contextualizadas por dimensão

**Bot WhatsApp (Twilio):**
- Fluxo conversacional completo
- Content Templates interativos por escala
- Auto-registro de usuários
- Diagnóstico automático ao finalizar

---

## Como Usar Esta Documentação

### Para Desenvolvedores

1. **Configurar o ambiente:**
   - Siga [GUIA-INSTALACAO.md](./guides/GUIA-INSTALACAO.md)
   - Configure com [GUIA-CONFIGURACAO.md](./guides/GUIA-CONFIGURACAO.md)

2. **Entender a Implementação COPSOQ II:**
   - Leia [GUIA-COPSOQ-II.md](./guides/GUIA-COPSOQ-II.md) para arquitetura completa
   - Consulte [STATUS_IMPLEMENTACAO_COPSOQ.md](./questionaries/STATUS_IMPLEMENTACAO_COPSOQ.md) para últimas mudanças

3. **Deploy em produção:**
   - Siga [DEPLOY-RENDER.md](./DEPLOY-RENDER.md) para Render + MongoDB Atlas

4. **Testes:**
   - Siga [GUIA-TESTES.md](./guides/GUIA-TESTES.md)

### Para Gestores de Projeto

1. **Status da Implementação:**
   - Leia [STATUS_IMPLEMENTACAO_COPSOQ.md](./questionaries/STATUS_IMPLEMENTACAO_COPSOQ.md)

2. **Planejamento:**
   - Consulte [MELHORIAS.md](./versions/MELHORIAS.md) para próximos passos

---

## Links Rápidos

### Mais Acessados
- [GUIA-COPSOQ-II.md](./guides/GUIA-COPSOQ-II.md)
- [DEPLOY-RENDER.md](./DEPLOY-RENDER.md)
- [STATUS_IMPLEMENTACAO_COPSOQ.md](./questionaries/STATUS_IMPLEMENTACAO_COPSOQ.md)
- [GUIA-TESTES.md](./guides/GUIA-TESTES.md)
- [WhatsApp / Twilio](./integracoes/WHATSAPP.md)

### Arquivos de Referência (Código)
- [copsoq_scoring_service.py](../backend/src/app/services/copsoq_scoring_service.py)
- [diagnostico_service.py](../backend/src/app/services/diagnostico_service.py)
- [relatorio_service.py](../backend/src/app/services/relatorio_service.py)
- [dashboard_service.py](../backend/src/app/services/dashboard_service.py)
- [bot/flow.py](../backend/src/app/bot/flow.py)
- [base.py (Modelos)](../backend/src/app/models/base.py)
- [render.yaml](../render.yaml)

---

## Convenções

- ⭐ = Documento principal/atualizado recentemente

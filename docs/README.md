# Índice da Documentação LuzIA

> **Última atualização:** 2026-02-08

---

## 📚 Documentação Principal

### Visão Geral
- [Objetivo do Projeto](./visao-geral/objetivo.md)
- [Funcionalidades](./visao-geral/funcionalidades.md)
- [README](./visao-geral/README.md)

### Guias Técnicos
- **[GUIA-COPSOQ-II.md](./guides/GUIA-COPSOQ-II.md)** ⭐ - Implementação completa do COPSOQ II
- [GUIA-COMPASS.md](./guides/GUIA-COMPASS.md) - MongoDB Compass
- [GUIA-DATA-ACCESS.md](./guides/GUIA-DATA-ACCESS.md) - Acesso a dados
- [GUIA-REPOSITORIES.md](./guides/GUIA-REPOSITORIES.md) - Padrões de repositórios
- [GUIA-TESTES.md](./guides/GUIA-TESTES.md) - Testes automatizados
- [Guia-Implementacao-Backend.md](./guides/Guia-Implementacao-Backend.md) - Backend geral

### Status e Planos
- **[STATUS_IMPLEMENTACAO_COPSOQ.md](./STATUS_IMPLEMENTACAO_COPSOQ.md)** ⭐ - Status atual COPSOQ II
- [MELHORIAS.md](./MELHORIAS.md) - Melhorias planejadas

### Planos de Implementação
- **[PLANO_COPSOQ_DATABASE_FINAL.md](./plans/PLANO_COPSOQ_DATABASE_FINAL.md)** ⭐ - Especificação COPSOQ II
- [PLANO_COPSOQ_DATABASE_REVISADO.md](./plans/PLANO_COPSOQ_DATABASE_REVISADO.md)
- [PLANO_COPSOQ_DATABASE.md](./plans/PLANO_COPSOQ_DATABASE.md)

### Segurança
- [security/](./security/) - Documentação de segurança

### API
- [api/](./api/) - Documentação de endpoints

---

## 🎯 COPSOQ II - Implementação Completa

### Status Atual: ✅ Implementado e Validado (100%)

A implementação do questionário **COPSOQ II** (Copenhagen Psychosocial Questionnaire) está **completa e pronta para produção**, com conformidade total à metodologia oficial.

#### Documentos Principais

| Documento | Descrição | Status |
|-----------|-----------|--------|
| [GUIA-COPSOQ-II.md](./guides/GUIA-COPSOQ-II.md) | Guia completo de implementação com arquitetura, serviços, modelos e exemplos | ✅ Completo |
| [STATUS_IMPLEMENTACAO_COPSOQ.md](./STATUS_IMPLEMENTACAO_COPSOQ.md) | Status detalhado com mudanças do último commit | ✅ Atualizado |
| [PLANO_COPSOQ_DATABASE_FINAL.md](./plans/PLANO_COPSOQ_DATABASE_FINAL.md) | Especificação técnica das duas versões | ✅ Referência |

#### Componentes Implementados

- ✅ **COPSOQScoringService** - Lógica de scoring e classificação por tercis
- ✅ **DiagnosticoService** - Processamento de respostas individuais
- ✅ **RelatorioService** - Agregação organizacional e geração de insights
- ✅ **Modelos Pydantic** - RelatorioDominio, RelatorioDimensao, DiagnosticoDimensao

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

**Gráficos e Visualizações:**
- Gráficos de barras por dimensão
- Gráficos de radar por domínio
- Distribuição de tercis (stacked bar)
- Heatmap de riscos
- Scorecard de métricas

#### Últimas Atualizações

**Commit:** `0ca25eae7` - 2026-02-07 15:36  
**Branch:** `feat-questionary-logic`

**Mudanças:**
- Integração completa do COPSOQScoringService no DiagnosticoService
- Implementação de agregação por domínios/dimensões no RelatorioService
- Novos modelos: RelatorioDominio, RelatorioDimensao
- Cálculos corretos de métricas (Índice de Proteção, Média de Risco)
- Geração de recomendações específicas por dimensão

---

## 📖 Como Usar Esta Documentação

### Para Desenvolvedores

1. **Entender a Implementação COPSOQ II:**
   - Leia [GUIA-COPSOQ-II.md](./guides/GUIA-COPSOQ-II.md) para arquitetura completa
   - Consulte [STATUS_IMPLEMENTACAO_COPSOQ.md](./STATUS_IMPLEMENTACAO_COPSOQ.md) para últimas mudanças

2. **Implementar Funcionalidades:**
   - Veja exemplos práticos no [GUIA-COPSOQ-II.md](./guides/GUIA-COPSOQ-II.md#exemplos-de-uso)
   - Consulte modelos de dados na seção [Modelos de Dados](./guides/GUIA-COPSOQ-II.md#modelos-de-dados)

3. **Testes:**
   - Siga [GUIA-TESTES.md](./guides/GUIA-TESTES.md)
   - Veja seção [Validação e Testes](./guides/GUIA-COPSOQ-II.md#validação-e-testes)

### Para Gestores de Projeto

1. **Status da Implementação:**
   - Leia [STATUS_IMPLEMENTACAO_COPSOQ.md](./STATUS_IMPLEMENTACAO_COPSOQ.md)
   - Confira [Checklist de Validação](./STATUS_IMPLEMENTACAO_COPSOQ.md#checklist-de-validação)

2. **Planejamento:**
   - Consulte [MELHORIAS.md](./MELHORIAS.md) para próximos passos
   - Veja [Próximos Passos](./STATUS_IMPLEMENTACAO_COPSOQ.md#-próximos-passos-opcionais)

### Para Analistas de Dados

1. **Estrutura de Dados:**
   - Veja [Modelos de Dados](./guides/GUIA-COPSOQ-II.md#modelos-de-dados)
   - Consulte [Geração de Insights](./guides/GUIA-COPSOQ-II.md#geração-de-insights-e-relatórios)

2. **Gráficos e Visualizações:**
   - Veja [Gráficos Suportados](./guides/GUIA-COPSOQ-II.md#gráficos-suportados)
   - Exemplos de [Insights](./guides/GUIA-COPSOQ-II.md#insights-organizacionais-relatório)

---

## 🔗 Links Rápidos

### Mais Acessados
- [✅ GUIA-COPSOQ-II.md](./guides/GUIA-COPSOQ-II.md)
- [✅ STATUS_IMPLEMENTACAO_COPSOQ.md](./STATUS_IMPLEMENTACAO_COPSOQ.md)
- [GUIA-REPOSITORIES.md](./guides/GUIA-REPOSITORIES.md)
- [GUIA-TESTES.md](./guides/GUIA-TESTES.md)

### Arquivos de Referência
- [copsoq_scoring_service.py](../backend/src/app/services/copsoq_scoring_service.py)
- [diagnostico_service.py](../backend/src/app/services/diagnostico_service.py)
- [relatorio_service.py](../backend/src/app/services/relatorio_service.py)
- [base.py (Modelos)](../backend/src/app/models/base.py)

---

## 📝 Convenções

- ⭐ = Documento principal/atualizado recentemente
- ✅ = Implementado e validado
- ⚠️ = Em desenvolvimento
- 🔴 = Deprecado/desatualizado

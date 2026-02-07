# Changelog

Todas as mudanças notáveis neste projeto serão documentadas neste arquivo.

O formato é baseado em [Keep a Changelog](https://keepachangelog.com/pt-BR/1.0.0/),
e este projeto adere ao [Semantic Versioning](https://semver.org/lang/pt-BR/).

---

## [Não Lançado]

### Planejado
- Dashboard frontend interativo
- Análise temporal de relatórios
- Benchmarking setorial
- Exportação PDF de relatórios

---

## [2.0.0] - 2026-02-07

### ✨ Adicionado
- **COPSOQ II Completo** - Implementação validada com 100% de conformidade
  - Suporte a versão curta brasileira (40 itens)
  - Suporte a versão média portuguesa (76 itens)
  - Classificação por tercis científicos (≤2.33, 2.33-3.67, ≥3.67)
  - Diferenciação de dimensões de proteção vs risco
  - Inversão de itens específicos (VLT_CV_03, VLT_CH_01)
- **Relatórios Organizacionais**
  - Agregação por domínios e dimensões
  - Distribuição de tercis
  - Índice de proteção (0-100%)
  - Recomendações contextualizadas por dimensão
- **Modelos de Dados**
  - `RelatorioDominio` e `RelatorioDimensao`
  - Campos `codigoDominio`, `sinal`, `total_itens`, `itens_respondidos`
  - Enum `ClassificacaoTercil`

### 🔧 Modificado
- `DiagnosticoService` - Integração completa com `COPSOQScoringService`
- `RelatorioService` - Agregação real ao invés de lista vazia de domínios
- Cálculo de resultado global baseado em distribuição de classificações
- Métricas organizacionais baseadas em dimensões (não mais arbitrárias)

### 📚 Documentação
- README principal reestruturado com badges e features
- Documentação backend completa (arquitetura, serviços, modelos)
- `GUIA-COPSOQ-II.md` - Guia completo de implementação
- `STATUS_IMPLEMENTACAO_COPSOQ.md` - Status detalhado
- Guias de instalação, configuração e deployment
- Documentação de banco de dados e integrações

---

## [1.0.0] - 2025-XX-XX

### Adicionado
- API Backend com FastAPI
- Autenticação JWT
- Sistema de organizações e setores
- Integração WhatsApp (Baileys)
- CRUD de questionários e respostas
- Repositórios com MongoDB

---

**Links:**
- [COPSOQ II - Guia Completo](docs/guides/GUIA-COPSOQ-II.md)
- [Documentação](docs/README.md)

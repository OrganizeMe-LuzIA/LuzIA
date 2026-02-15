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

## [2.1.1] - 2026-02-15

### Documentação
- **Correção geral da documentação** - Alinhamento completo com o código real
  - Corrigido: referências a "Baileys" substituídas por "Twilio" em toda a documentação
  - Corrigido: variáveis de ambiente (`MONGODB_URL` → `MONGO_URI`, `MONGODB_DB_NAME` → `MONGO_DB_NAME`)
  - Corrigido: links quebrados no README e índice de documentação
  - Corrigido: estrutura de diretórios na ARQUITETURA.md (bot/, workers/, repositories/, services/, core/)
  - Corrigido: licença no FastAPI metadata (Proprietary → MIT)
  - Corrigido: variável de ambiente no CI/CD (`MONGODB_URL` → `MONGO_URI`)
- **Novo: [DEPLOY-RENDER.md](docs/DEPLOY-RENDER.md)** - Guia completo de deploy no Render.com + MongoDB Atlas
  - Configuração passo a passo do MongoDB Atlas (cluster, acesso, connection string)
  - Configuração do Render.com (Blueprint, serviços, variáveis)
  - Documentação do render.yaml e Dockerfile de produção
  - Limitações dos planos free e troubleshooting
  - Guia de backup e restauração do MongoDB Atlas
- **Reescrita: [WHATSAPP.md](docs/integracoes/WHATSAPP.md)** - Documentação da integração Twilio
  - Endpoints reais (webhook, dev/incoming, dev/user)
  - Configuração de variáveis Twilio e Content Templates
  - Fluxo conversacional completo do bot
  - Segurança (validação de assinatura) e troubleshooting
- **Atualização: [DEPLOYMENT.md](docs/DEPLOYMENT.md)** - Reestruturado com seção de produção
- **Atualização: [docs/README.md](docs/README.md)** - Índice corrigido com paths reais
- **Atualização: [README.md](README.md)** - Estrutura, variáveis e links corrigidos

---

## [2.1.0] - 2026-02-07

### ✨ Adicionado
- **Sistema de Cache Redis** - Otimização de performance para dashboard
  - Cache de métrica de overview com TTL configurável (5 minutos)
  - Invalidação automática em operações de escrita
  - Suporte a padrões de cache flexíveis
- **Script de Índices MongoDB** - Otimização de queries
  - Índices unique para `usuarios.telefone` e `usuarios.anonId`
  - Índices compound para filtros hierárquicos
  - Script de migração idempotente com rollback
  - Documentação de índices criados
- **Validadores de Domínio** - Validação robusta de dados
  - Validação de CNPJ (formato e algoritmo)
  - Validação de telefone E.164
  - Validators reutilizáveis em módulo centralizado
- **Documentação OpenAPI Enriquecida**
  - Metadata detalhada com descrição e contato
  - Tags organizadas por funcionalidade
  - Exemplos de request/response em endpoints
  - Licença e versão do projeto

### 🔧 Modificado
- `DashboardService.get_overview()` - Integração com cache Redis
- `Organizacao` model - Validação de CNPJ obrigatória
- `Usuario` model - Validação de formato telefone E.164
- `config.py` - Adicionadas configurações REDIS_URL e CACHE_TTL
- Dashboard endpoints - Documentação OpenAPI completa

### 🧪 Testes
- **Testes de Serviços** - Cobertura completa dos serviços principais
  - Testes unitários para `COPSOQScoringService` (43 linhas, ~95% cobertura)
  - Testes unitários para `DiagnosticoService` (112 linhas, ~90% cobertura)
  - Testes unitários para `RelatorioService` (63 linhas, ~88% cobertura)
  - Configuração de pytest aprimorada com fixtures compartilhadas
- **Reorganização de Testes** - Consolidação de testes de integração
  - Unificação de testes duplicados em diretório `backend/tests/`
  - Melhorias em `conftest.py` para fixtures reutilizáveis

### 🏗️ Infraestrutura
- Adicionado serviço Redis ao `docker-compose.yml`
- Configuração de pytest com coverage (meta: 80%)
- Dependências: `redis`, `pytest-cov`, `validate-docbr`

### 🛠️ Scripts e Ferramentas
- **Script de Migração** - Automação de índices e testes
  - Novo script `run_migrations_and_tests.sh` para automação completa
  - Idempotência aprimorada em `create_indexes.py`
  - Melhor tratamento de erros em criação de índices
  - Validação automática de integridade do banco

### 📚 Documentação
- Plano de implementação de melhorias (6 semanas)
- Auditoria completa do backend (21 entidades, 8 repos, 4 services)
- Guias de uso para cache e validadores
- Release notes detalhadas v2.1.0 com exemplos práticos

### 🚀 Performance
- Redução estimada de 50-80% em queries com índices
- Cache elimina recálculo de overview a cada requisição
- TTL de 5 minutos balanceia atualização vs carga

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
- Integração WhatsApp (Twilio)
- CRUD de questionários e respostas
- Repositórios com MongoDB

---

**Links:**
- [COPSOQ II - Guia Completo](docs/guides/GUIA-COPSOQ-II.md)
- [Documentação](docs/README.md)

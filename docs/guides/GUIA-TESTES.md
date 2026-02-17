# Guia de Testes — LuzIA Backend

> **Voltar para:** [📚 Documentação](../README.md)

---

## 1. Estrutura de Testes

Os testes utilizam `pytest` e `pytest-asyncio` para suportar operações assíncronas com o MongoDB via `motor`.

```
backend/tests/
├── conftest.py                              # Fixtures compartilhadas
│   ├── test_client                          # Cliente HTTP para testar a API FastAPI
│   └── test_db                              # Banco de dados temporário (LuzIA_test)
├── services/
│   ├── test_copsoq_scoring_service.py       # COPSOQScoringService (~95% cobertura)
│   ├── test_diagnostico_service.py          # DiagnosticoService (~90% cobertura)
│   └── test_relatorio_service.py           # RelatorioService (~88% cobertura)
├── integration/
│   ├── test_copsoq_v3_migration.py
│   ├── test_diagnosticos_integration.py
│   ├── test_organizacoes_integration.py
│   ├── test_questionarios_integration.py
│   ├── test_repositories_integration.py
│   └── test_respostas_integration.py
└── unit/                                    # Testes unitários
```

**Sobre as fixtures:**
- `test_client` — Inicializa o app FastAPI (com ciclo de vida/lifespan) e retorna um cliente HTTP assíncrono
- `test_db` — Cria banco `LuzIA_test`, executa os testes, e remove o banco ao final para não afetar o banco de produção

---

## 2. Instalação de Dependências

```bash
cd backend
pip install -r requirements/dev.txt
```

Ou individualmente:

```bash
pip install pytest pytest-asyncio pytest-cov httpx motor pydantic-settings
```

---

## 3. Como Executar os Testes

```bash
# Acesse o diretório do backend
cd backend

# Configure o PYTHONPATH
export PYTHONPATH=src   # Linux/Mac
# set PYTHONPATH=src    # Windows (cmd)

# Execute todos os testes
python -m pytest tests/ -v

# Com cobertura
python -m pytest tests/ --cov=src/app --cov-report=html --cov-report=term-missing
```

### Opções Úteis do Pytest

| Flag | Descrição |
|------|-----------|
| `-v` | Modo detalhado (mostra nome de cada teste) |
| `-s` | Mostra saídas de `print` no terminal |
| `-x` | Para na primeira falha |
| `--cov` | Relatório de cobertura |
| `--cov-report=html` | Relatório HTML em `htmlcov/` |

---

## 4. Testes de Serviços

Desde a versão 2.1.0, os serviços principais possuem testes unitários com alta cobertura.

### COPSOQScoringService (~95% cobertura)

**Arquivo:** `backend/tests/services/test_copsoq_scoring_service.py`

**Testes implementados:**
- Classificação por tercis científicos (≤2.33, 2.33-3.67, ≥3.67)
- Cálculo de médias por dimensão
- Inversão de itens específicos (VLT_CV_03, VLT_CH_01)
- Agregação por domínios COPSOQ II
- Edge cases para dados incompletos

```bash
python -m pytest tests/services/test_copsoq_scoring_service.py -v
```

### DiagnosticoService (~90% cobertura)

**Arquivo:** `backend/tests/services/test_diagnostico_service.py`

**Testes implementados:**
- Criação de diagnósticos individuais
- Processamento de respostas
- Integração com COPSOQScoringService
- Validação de entrada
- Casos com dados parciais

```bash
python -m pytest tests/services/test_diagnostico_service.py -v
```

### RelatorioService (~88% cobertura)

**Arquivo:** `backend/tests/services/test_relatorio_service.py`

**Testes implementados:**
- Geração de relatórios organizacionais
- Geração de relatórios setoriais
- Cálculos estatísticos (Média de Risco, Índice de Proteção)
- Geração de insights e recomendações
- Agregação por domínios

```bash
python -m pytest tests/services/test_relatorio_service.py -v
```

---

## 5. Testes de Integração

Os testes de integração requerem MongoDB em execução (local ou Docker):

```bash
# Via Docker (recomendado)
docker-compose up -d mongo

# Execute os testes de integração
python -m pytest tests/integration/ -v
```

---

## 6. Executar Todos os Testes

```bash
# Todos os testes com cobertura
python -m pytest tests/ -v --cov=src/app --cov-report=html

# Apenas testes de serviços
python -m pytest tests/services/ -v

# Apenas testes de integração
python -m pytest tests/integration/ -v

# Teste específico
python -m pytest tests/services/test_copsoq_scoring_service.py::test_classificacao_tercis -v
```

---

## 7. Script de Automação

**Script:** `backend/scripts/run_migrations_and_tests.sh`

Automatiza a criação de índices MongoDB e a execução de testes:

```bash
bash backend/scripts/run_migrations_and_tests.sh
```

**O que o script faz:**
1. Cria índices MongoDB (idempotente)
2. Executa testes de integração
3. Executa testes de serviços com cobertura
4. Valida integridade do banco

---

## 8. Próximos Passos

- Adicionar novos arquivos de teste em `tests/` seguindo o padrão de nomenclatura `test_*.py`
- Implementar testes de integração para cada repositório (`repositories/`)
- Mockar serviços externos (como Twilio) para testes unitários puros

---

**Última Atualização:** 2026-02-17

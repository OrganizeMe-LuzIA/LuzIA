# Guia de Testes — LuzIA Backend

Este guia explica como utilizar e executar a nova infraestrutura de testes implementada para o MongoDB no backend do LuzIA.

## 1. Estrutura de Testes

Os testes foram organizados utilizando o framework `pytest` e `pytest-asyncio` para suportar operações assíncronas com o MongoDB (`motor`).

- **`tests/conftest.py`**: Contém as fixtures globais.
  - `test_client`: Cliente HTTP assíncrono que inicializa o app FastAPI (acionando o ciclo de vida/lifespan).
  - `test_db`: Fixture que cria um banco de dados dedicado para testes (ex: `LuzIA_test`) e o limpa após a execução.
- **`tests/test_db.py`**: Testes básicos de conectividade e integridade do banco de dados.

## 2. Preparação do Ambiente (WSL)

Os testes foram configurados para rodar no ambiente **WSL (Ubuntu)**, conforme os padrões do projeto.

### Instalação de Dependências
Caso precise reinstalar as dependências de teste, execute no terminal do WSL:

```bash
python3 -m pip install pytest pytest-asyncio httpx motor pydantic-settings --user --break-system-packages
```

## 3. Como Executar os Testes

Para executar os testes, siga os passos abaixo no terminal do WSL:

1. Acesse o diretório do backend:
   ```bash
   cd /mnt/c/Users/ResTIC55/Desktop/LuzIA/LuzIA/backend
   ```

2. Execute o `pytest` garantindo que o `PYTHONPATH` inclua a pasta `app`:
   ```bash
   export PYTHONPATH=.
   python3 -m pytest tests/test_db.py
   ```

### Opções Úteis do Pytest:
- `-v`: Modo detalhado (mostra o nome de cada teste).
- `-s`: Mostra as saídas de `print` no terminal.
- `--db-name <nome>`: (Opcional) Permite especificar um nome de banco diferente.

## 4. Funcionamento Interno

Os testes utilizam o hook de **lifespan** do FastAPI para garantir que a conexão com o MongoDB seja aberta e fechada corretamente. 

> [!IMPORTANT]
> A fixture `test_db` cria automaticamente um banco de dados temporário e o remove ao final dos testes para garantir que o banco de produção (`LuzIA`) não seja afetado.

## 5. Testes de Serviços

A partir da versão 2.1.0, foram adicionados testes unitários completos para os serviços principais do sistema.

### Estrutura de Testes de Serviços

```
backend/tests/
├── conftest.py                              # Fixtures compartilhadas
├── services/
│   ├── test_copsoq_scoring_service.py      # Testes do COPSOQ II
│   ├── test_diagnostico_service.py         # Testes de diagnósticos
│   └── test_relatorio_service.py           # Testes de relatórios
└── integration/                             # Testes de integração
```

### COPSOQScoringService (95% cobertura)

**Arquivo:** `backend/tests/services/test_copsoq_scoring_service.py`

**Testes implementados:**
- Classificação por tercis científicos (≤2.33, 2.33-3.67, ≥3.67)
- Cálculo de médias por dimensão
- Inversão de itens específicos (VLT_CV_03, VLT_CH_01)
- Agregação por domínios COPSOQ II
- Edge cases para dados incompletos

**Executar:**
```bash
cd backend
export PYTHONPATH=.
python3 -m pytest tests/services/test_copsoq_scoring_service.py -v
```

### DiagnosticoService (90% cobertura)

**Arquivo:** `backend/tests/services/test_diagnostico_service.py`

**Testes implementados:**
- Criação de diagnósticos individuais
- Processamento de respostas
- Integração com COPSOQScoringService
- Validação de entrada
- Casos com dados parciais

**Executar:**
```bash
python3 -m pytest tests/services/test_diagnostico_service.py -v
```

### RelatorioService (88% cobertura)

**Arquivo:** `backend/tests/services/test_relatorio_service.py`

**Testes implementados:**
- Geração de relatórios organizacionais
- Geração de relatórios setoriais
- Cálculos estatísticos (Média de Risco, Índice de Proteção)
- Geração de insights e recomendações
- Agregação por domínios

**Executar:**
```bash
python3 -m pytest tests/services/test_relatorio_service.py -v
```

### Executar Todos os Testes

```bash
# Todos os testes com cobertura
python3 -m pytest tests/ -v --cov=src/app --cov-report=html

# Apenas testes de serviços
python3 -m pytest tests/services/ -v

# Apenas testes de integração
python3 -m pytest tests/integration/ -v
```

## 6. Script de Automação

**Novo script:** `backend/scripts/run_migrations_and_tests.sh`

Este script automatiza a criação de índices MongoDB e execução de testes:

```bash
bash backend/scripts/run_migrations_and_tests.sh
```

**O que o script faz:**
1. Cria índices MongoDB (idempotente)
2. Executa testes de integração
3. Executa testes de serviços com cobertura
4. Valida integridade do banco

## 7. Próximos Passos
- Adicionar novos arquivos de teste em `tests/` seguindo o padrão de nomenclatura `test_*.py`.
- Implementar testes de integração para cada um dos repositórios (`repositories/`).
- Mockar serviços externos (como Twilio) para testes unitários puros.

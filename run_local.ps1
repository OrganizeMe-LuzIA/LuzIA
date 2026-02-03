# Script para rodar o LuzIA Backend localmente (Windows/PowerShell)

Write-Host "=== Configurando ambiente local para LuzIA ===" -ForegroundColor Cyan

# 1. Verifica/Cria Virtual Environment
if (-not (Test-Path ".venv")) {
    Write-Host "Criando virtual environment (.venv)..." -ForegroundColor Yellow
    try {
        py -m venv .venv
    } catch {
        Write-Host "Erro ao criar venv com 'py'. Tentando 'python'..." -ForegroundColor Red
        python -m venv .venv
    }
}

# 2. Ativa o ambiente virtual (Escopo do script)
Write-Host "Ativando ambiente virtual..." -ForegroundColor Yellow
if (Test-Path ".\.venv\Scripts\Activate.ps1") {
    # Dot-sourcing para carregar no escopo atual
    . .\.venv\Scripts\Activate.ps1
} else {
    Write-Error "Script de ativação não encontrado. Verifique a instalação do Python."
    exit 1
}

# 3. Instala dependências
Write-Host "Instalando dependências..." -ForegroundColor Yellow
pip install -r backend/requirements.txt

# 4. Configura PYTHONPATH (Aponta para src)
$env:PYTHONPATH = "$PWD\backend\src"
Write-Host "PYTHONPATH configurado: $env:PYTHONPATH" -ForegroundColor Gray

# 5. Inicia o servidor
Write-Host "Iniciando servidor Uvicorn..." -ForegroundColor Green
Write-Host "Acesse a documentação em: http://127.0.0.1:8000/docs" -ForegroundColor Cyan
python -m uvicorn app.main:app --reload

.PHONY: help install dev test lint run clean docker-up docker-down

help:
	@echo "Comandos disponíveis:"
	@echo "  make install     - Instala dependências de produção"
	@echo "  make dev         - Instala dependências de desenvolvimento"
	@echo "  make test        - Executa todos os testes"
	@echo "  make test-unit   - Executa testes unitários"
	@echo "  make test-int    - Executa testes de integração"
	@echo "  make lint        - Verifica código com ruff"
	@echo "  make run         - Inicia servidor de desenvolvimento"
	@echo "  make clean       - Remove arquivos temporários"
	@echo "  make docker-up   - Inicia containers Docker"
	@echo "  make docker-down - Para containers Docker"

install:
	cd backend && pip install -r requirements.txt

dev:
	cd backend && pip install -r requirements/dev.txt

test:
	cd backend && pytest tests/ -v

test-unit:
	cd backend && pytest tests/unit/ -v

test-int:
	cd backend && pytest tests/integration/ -v

lint:
	cd backend && ruff check .

run:
	cd backend && uvicorn app.main:app --reload

clean:
	find . -type d -name "__pycache__" -exec rm -rf {} + 2>/dev/null || true
	find . -type d -name ".pytest_cache" -exec rm -rf {} + 2>/dev/null || true
	find . -type f -name "*.pyc" -delete 2>/dev/null || true

docker-up:
	docker compose -f infrastructure/docker/docker-compose.yml up -d

docker-down:
	docker compose -f infrastructure/docker/docker-compose.yml down

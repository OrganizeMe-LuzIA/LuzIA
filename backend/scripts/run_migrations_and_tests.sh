#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "${ROOT_DIR}"

export PYTHONPATH="${ROOT_DIR}/src:${PYTHONPATH:-}"

TEST_TARGET="${1:-tests}"

echo "[1/2] Running migrations..."
python3 scripts/run_migrations.py

echo "[2/2] Running tests (${TEST_TARGET})..."
if python3 -c "import pytest_cov" >/dev/null 2>&1; then
  pytest -q "${TEST_TARGET}"
else
  echo "[info] pytest-cov not installed, running without pyproject addopts coverage flags."
  pytest -q -o addopts='' "${TEST_TARGET}"
fi

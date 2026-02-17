# Contribuindo para o LuzIA

Obrigado por considerar contribuir para o LuzIA! 🎉

---

## 📋 Processo de Contribuição

1. **Fork** o repositório
2. Crie uma **branch** para sua feature: `git checkout -b feature/minha-feature`
3. **Commit** suas mudanças seguindo o padrão de commits abaixo
4. **Push** para a branch: `git push origin feature/minha-feature`
5. Abra um **Pull Request** com descrição clara do que foi feito e por quê

---

## 📝 Padrões de Commit

Usamos [Conventional Commits](https://www.conventionalcommits.org/):

| Prefixo | Uso |
|---------|-----|
| `feat:` | Nova funcionalidade |
| `fix:` | Correção de bug |
| `docs:` | Documentação |
| `refactor:` | Refatoração sem mudança de comportamento |
| `test:` | Adição ou correção de testes |
| `chore:` | Manutenção (dependências, CI/CD, etc.) |
| `perf:` | Melhoria de performance |

**Exemplos:**
```
feat: adicionar exportação de relatório em PDF
fix: corrigir cálculo de índice de proteção no RelatorioService
docs: atualizar GUIA-COPSOQ-II com exemplo de dimensão de proteção
test: adicionar testes unitários para COPSOQScoringService
```

---

## 🧪 Antes de Submeter um PR

Execute obrigatoriamente:

```bash
cd backend

# Linting
ruff check src/

# Testes
export PYTHONPATH=src
python -m pytest tests/ -v

# Cobertura (meta: ≥80%)
python -m pytest tests/ --cov=src/app --cov-report=term-missing
```

Ou use os atalhos do Makefile na raiz do projeto:

```bash
make lint
make test
```

---

## 📁 Estrutura de Código

### Backend

- Siga o padrão de camadas: **API → Service → Repository**
- Não coloque lógica de negócio em repositórios
- Use `async/await` em todas as operações de I/O
- Valide dados de entrada com modelos Pydantic
- Adicione testes para novas funcionalidades (pasta `backend/tests/`)

### Frontend

- Siga as convenções TypeScript do projeto
- Use componentes Tailwind CSS existentes antes de criar novos
- Mantenha separação entre lógica de estado (context/) e UI (components/)

---

## 🗂️ Criando Novos Endpoints

1. Crie o router em `backend/src/app/api/v1/`
2. Registre-o em `backend/src/app/main.py`
3. Adicione validação via Pydantic
4. Use `Depends(get_current_active_user)` ou `Depends(get_current_admin_user)` para auth
5. Documente no `docs/api/API.md`

---

## 📖 Atualizando a Documentação

Ao fazer uma mudança relevante, atualize os arquivos de documentação correspondentes:

| Mudança | Documento |
|---------|-----------|
| Novo endpoint | `docs/api/API.md` |
| Novo modelo | `docs/backend/MODELOS.md` |
| Nova variável de ambiente | `docs/guides/GUIA-CONFIGURACAO.md` |
| Mudança de arquitetura | `docs/backend/ARQUITETURA.md` |
| Nova versão | `CHANGELOG.md` |

---

## ❓ Dúvidas?

Abra uma [Issue](https://github.com/user/repo/issues) para discussão antes de começar uma mudança grande.

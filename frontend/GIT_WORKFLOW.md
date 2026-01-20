## Workflow de Commits e Versionamento

### Padrão de Commits (Conventional Commits)

Seguir o padrão de commits convencionais para manter o histórico organizado:

**Formato:**
```
<type>(<scope>): <subject>

<body> (opcional)
```

**Tipos:**
- `feat`: Nova funcionalidade
- `fix`: Correção de bug
- `docs`: Documentação
- `style`: Formatação, ponto-e-vírgula, etc (sem mudança de código)
- `refactor`: Refatoração de código
- `test`: Adição ou modificação de testes
- `chore`: Manutenção, atualização de dependências

**Exemplos:**
```bash
git commit -m "feat(auth): add login page with OTP flow"
git commit -m "feat(dashboard): implement metrics cards"
git commit -m "fix(api): correct axios interceptor for 401 errors"
git commit -m "style(components): format Button component with prettier"
git commit -m "refactor(stores): simplify auth store logic"
git commit -m "chore(deps): update vuetify to v3.5.0"
```

### Workflow Recomendado

1. **Sempre dar pull antes de começar:**
   ```bash
   git pull origin feat-frontend-implementation
   ```

2. **Trabalhar em features pequenas e incrementais**
   - Cada commit deve representar uma unidade lógica de trabalho
   - Commits frequentes são melhores que commits grandes

3. **Antes de commitar:**
   ```bash
   git status                    # Ver arquivos modificados
   git add src/views/Dashboard.vue  # Adicionar arquivos específicos
   # OU
   git add .                     # Adicionar tudo
   ```

4. **Fazer commit:**
   ```bash
   git commit -m "feat(dashboard): add metrics overview section"
   ```

5. **Push regular para o GitHub:**
   ```bash
   git push origin feat-frontend-implementation
   ```

### Organização de Commits por Feature

**Exemplo de sequência para Dashboard:**
1. `feat(dashboard): create DashboardView component structure`
2. `feat(dashboard): add metrics cards with mock data`
3. `feat(dashboard): integrate vue-chartjs for charts`
4. `feat(dashboard): add data table for recent reports`
5. `style(dashboard): improve responsive layout`

### Mensagens de Commit Claras

✅ **Bom:**
```
feat(api): add axios client with JWT interceptors
feat(router): configure Vue Router with navigation guards
feat(vuetify): setup Material Design theme configuration
```

❌ **Evitar:**
```
update files
fix bug
changes
WIP
```

### Quando Fazer Push

- Após completar uma feature funcional
- No final do dia de trabalho
- Antes de mudar de contexto/branch
- Quando precisar compartilhar código com o time

### Branch Strategy

- **Branch atual:** `feat-frontend-implementation`
- Manter branch sempre atualizada com `main`
- Quando feature estiver completa, criar Pull Request para `main`

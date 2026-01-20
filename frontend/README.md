# Frontend LuzIA

Frontend do sistema LuzIA - Sistema de Avaliação Psicossocial no Trabalho.

## 🚀 Tecnologias

- **Vue.js 3** - Framework progressivo
- **Vite** - Build tool rápido
- **Vuetify 3** - Framework Material Design
- **Vue Router** - Navegação SPA
- **Pinia** - Gerenciamento de estado
- **Axios** - Cliente HTTP
- **Chart.js + vue-chartjs** - Gráficos e visualizações

## 📦 Instalação

```bash
# Instalar dependências
npm install

# Rodar em modo desenvolvimento
npm run dev

# Build para produção
npm run build

# Preview do build de produção
npm run preview
```

## 🏗️ Estrutura do Projeto

```
frontend/
├── src/
│   ├── api/              # Cliente HTTP e endpoints
│   │   ├── client.js
│   │   └── endpoints/
│   ├── components/       # Componentes reutilizáveis
│   │   └── shared/
│   ├── mocks/           # Dados mockados para desenvolvimento
│   ├── plugins/         # Plugins Vue (Vuetify)
│   ├── router/          # Configuração de rotas
│   ├── stores/          # Pinia stores
│   ├── utils/           # Funções utilitárias
│   ├── views/           # Páginas principais
│   ├── App.vue
│   └── main.js
├── public/
├── .env.example
└── package.json
```

## 🎨 Componentes Reutilizáveis

### MetricCard
Cartão para exibir métricas com ícone e valor.

```vue
<MetricCard
  label="Total de Questionários"
  :value="12"
  icon="mdi-clipboard-check"
  color="primary"
/>
```

### Card
Cartão genérico com título opcional.

```vue
<Card title="Título" icon="mdi-icon">
  <p>Conteúdo</p>
</Card>
```

### PageContainer
Container para páginas com título e ações.

```vue
<PageContainer title="Página">
  <template #actions>
    <v-btn>Ação</v-btn>
  </template>
  <!-- Conteúdo -->
</PageContainer>
```

## 🔌 Integração com Backend

A aplicação está preparada para integração com o backend FastAPI em `http://localhost:8000/api/v1`.

Configure a URL base no arquivo `.env`:

```
VITE_API_URL=http://localhost:8000/api/v1
```

### Endpoints Disponíveis

Os módulos de API estão em `src/api/endpoints/`:

- **organizations.js** - CRUD de organizações
- **questionnaires.js** - Listagem de questionários
- **responses.js** - Envio de respostas
- **diagnostics.js** - Consulta de diagnósticos
- **reports.js** - Geração e visualização de relatórios

## 🎯 Features Implementadas

### ✅ Implementado e Funcional

- **Dashboard Completo**
  - 4 cards de métricas (Total Questionários, Taxa de Resposta, Nível de Risco, Índice de Proteção)
  - Gráfico de linha (Evolução Temporal)
  - Gráfico de barras (Comparativo por Setor)
  - Tabela de relatórios recentes

- **Gestão de Organizações**
  - Listagem com tabela Vuetify
  - Busca e filtros
  - CRUD completo (criar, editar, visualizar)
  - Mock data para desenvolvimento

- **Questionários Interativos**
  - Listagem de questionários disponíveis (CoPsoQ II, DASS-21)
  - Aplicação multi-step com progress bar
  - Navegação Anterior/Próxima/Concluir
  - Escala Likert (0-4) com labels
  - Dialog de confirmação ao finalizar
  - Mock data com 5 perguntas de exemplo

- **Relatórios Detalhados**
  - Listagem com filtros (Organização, Setor, Tipo)
  - Cards com métricas resumidas
  - Visualização detalhada com:
    - Métricas globais (risco, proteção, respondentes)
    - Análise por domínios e dimensões
    - Recomendações estruturadas
  - Dialog de geração de relatórios
  - Mock data com 3 relatórios completos

- **Design e UX**
  - Navegação com sidebar Material Design
  - Tema dark personalizado
  - Responsividade total (mobile-first)
  - Animações e transições suaves
  - Ícones Material Design Icons

### ⏳ Aguardando Backend

- **Autenticação JWT + OTP**
  - Login com telefone
  - Verificação OTP via WhatsApp
  - Session management
  - Protected routes

- **Integração API**
  - Substituir mock data por endpoints reais
  - Error handling e retry logic
  - Loading states
  - Real-time updates

### 📸 Screenshots

A aplicação foi testada e está totalmente funcional. Veja exemplos visuais:


- **Dashboard**: Métricas com gráficos Chart.js
- **Organizações**: CRUD funcional com busca
- **Questionários**: Formulário interativo multi-step
- **Relatórios**: Visualização detalhada com filtros

## 📝 Dados Mockados

Durante o desenvolvimento, a aplicação utiliza dados mockados para permitir testes sem depender do backend:

### Localização dos Mocks

- `src/mocks/dashboard.js` - Métricas, evolução temporal, setores
- `src/mocks/questionnaires.js` - CoPsoQ II e DASS-21 com perguntas
- `src/mocks/reports.js` - Relatórios com métricas detalhadas

### Substituição por API Real

Quando o backend estiver disponível:

1. Remover imports de mocks nos componentes
2. Substituir por chamadas aos endpoints em `src/api/endpoints/`
3. Os módulos de API já estão implementados e prontos
4. Testar integração e ajustar error handling se necessário

## 🧪 Testes

### Testes Manuais Realizados

Todos os fluxos foram testados manualmente:

✅ **Dashboard**
- Exibição de métricas
- Renderização de gráficos
- Tabela de relatórios

✅ **Organizações**
- Listagem e busca
- Criação de nova organização
- Edição de organização existente

✅ **Questionários**  
- Visualização de questionários
- Aplicação multi-step
- Navegação entre perguntas
- Finalização com sucesso

✅ **Relatórios**
- Filtros funcionais
- Visualização detalhada
- Expansion panels de domínios
- Dialog de geração

### Como Testar

```bash
# 1. Iniciar servidor de desenvolvimento
npm run dev

# 2. Abrir http://localhost:5173

# 3. Navegar pelas páginas usando a sidebar

# 4. Testar funcionalidades:
#    - Dashboard: visualizar métricas e gráficos
#    - Organizações: criar/editar organizações
#    - Questionários: iniciar CoPsoQ II, responder perguntas
#    - Relatórios: filtrar e visualizar detalhes
```

## 📝 Observações Importantes

### Autenticação
Por enquanto, **todas as rotas são públicas**. Não há login ou proteção de rotas. A autenticação será implementada quando o backend fornecer os endpoints necessários (`/auth/login`, `/auth/request-otp`).

### Estado Atual vs. Produção

| Aspecto | Desenvolvimento (Atual) | Produção (Futuro) |
|---------|------------------------|-------------------|
| Dados | Mocks estáticos | API REST real |
| Autenticação | Pública | JWT + OTP obrigatório |
| Rotas | Todas abertas | Protected com guards |
| Error Handling | Console.log | Toast notifications |

## 🔨 Workflow de Desenvolvimento

### Antes de Começar

```bash
# Sempre sincronizar com a branch principal
git checkout feat-frontend-implementation
git pull origin feat-frontend-implementation
```

### Durante o Desenvolvimento

1. **Trabalhe em features pequenas** - Uma funcionalidade por vez
2. **Teste localmente** - Use `npm run dev` e verifique no navegador
3. **Commits incrementais** - Não espere terminar tudo para commitar

### Padrão de Commits

Siga o padrão [Conventional Commits](../GIT_WORKFLOW.md):

```bash
# Exemplos práticos
git add src/views/DashboardView.vue
git commit -m "feat(dashboard): add monthly evolution chart"

git add src/components/shared/MetricCard.vue  
git commit -m "refactor(components): simplify MetricCard props"

git add src/api/endpoints/reports.js
git commit -m "fix(api): correct report filters query params"

git add src/mocks/questionnaires.js
git commit -m "chore(mocks): add DASS-21 questionnaire data"
```

### Tipos de Commit

- `feat`: Nova funcionalidade
- `fix`: Correção de bug
- `refactor`: Refatoração sem mudança de comportamento
- `style`: Formatação, espaçamento (sem mudança de código)
- `docs`: Documentação
- `test`: Testes
- `chore`: Manutenção, dependências

### Estrutura de Commits Recomendada

```bash
# 1. Adicionar arquivos específicos (preferível)
git add src/views/NewView.vue src/mocks/new-data.js
git commit -m "feat(views): add new feature view with mock data"

# 2. Verificar mudanças antes de commitar
git status
git diff src/components/MyComponent.vue

# 3. Commitar com mensagem descritiva
git commit -m "fix(component): resolve reactivity issue in MyComponent"
```

## 🚀 Deploy

### Build para Produção

```bash
# Gerar build otimizado
npm run build

# Preview do build localmente
npm run preview
```

Os arquivos serão gerados em `dist/` e estarão prontos para deploy em qualquer servidor estático (Vercel, Netlify, AWS S3, etc.).

### Variáveis de Ambiente

Criar arquivo `.env.production`:

```env
VITE_API_URL=https://api.luzia.example.com/api/v1
```

## 📚 Recursos Adicionais

- [Documentação Vue.js 3](https://vuejs.org/)
- [Documentação Vuetify 3](https://vuetifyjs.com/)
- [Documentação Chart.js](https://www.chartjs.org/)
- [Material Design Icons](https://pictogrammers.com/library/mdi/)

## 🤝 Contribuindo

1. Sempre faça pull antes de começar
2. Trabalhe na branch `feat-frontend-implementation`
3. Siga o padrão de commits
4. Teste suas mudanças localmente
5. Mantenha o código limpo e documentado

## 📄 Licença

Este projeto faz parte do sistema LuzIA para avaliação psicossocial no trabalho.

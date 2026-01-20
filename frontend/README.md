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

- ✅ Dashboard com métricas e gráficos
- ✅ Gestão de organizações (CRUD)
- ✅ Navegação com sidebar
- ✅ Tema Material Design (dark/light)
- ✅ Responsividade
- ⏳ Aplicação de questionários (aguardando backend)
- ⏳ Geração de relatórios (aguardando backend)
- ⏳ Autenticação JWT + OTP (aguardando backend)

## 📝 Observações

### Autenticação
Por enquanto, todas as rotas são públicas. A autenticação será implementada quando o backend estiver pronto.

### Dados Mockados
O dashboard utiliza dados mockados em `src/mocks/dashboard.js`. Substitua pelas chamadas de API reais quando disponível.

## 🔨 Workflow de Desenvolvimento

1. Sempre dar `git pull` antes de começar
2. Trabalhar em features pequenas e incrementais
3. Fazer commits frequentes seguindo [Conventional Commits](../GIT_WORKFLOW.md)
4. Testar localmente antes de commitar

```bash
# Exemplo de commit
git add .
git commit -m "feat(dashboard): add metrics overview section"
```

## 📄 Licença

Este projeto faz parte do sistema LuzIA para avaliação psicossocial no trabalho.

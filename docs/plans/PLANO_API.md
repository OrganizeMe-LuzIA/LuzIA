# Plano de Implementação - Routers e Endpoints REST

Este plano detalha a exposição das funcionalidades do backend LuzIA através de uma API REST segura e organizada.

## Objetivo
Implementar os controllers (routers) que conectarão as requisições HTTP aos repositórios e serviços de domínio já existentes, aplicando autenticação e validação.

## Estrutura da API
Todos os endpoints novos estarão sob o prefixo `/api/v1` (configurável).

### 1. Autenticação e Segurança
- **Middleware**: `get_current_user` será injetado em rotas protegidas.
- **Roles**:
    - `ADMIN`: Acesso total (Organizações, Setores, Relatórios Gerais).
    - `USER` (Respondente): Acesso apenas a seus diagnósticos e fluxo de resposta.

### 2. Endpoints Propostos

#### A. Gestão Administrativa (`/organizacoes`, `/setores`)
- `POST /organizacoes`: Criar organização (Admin).
- `GET /organizacoes`: Listar organizações.
- `POST /setores`: Criar setor vinculado a organização.
- `GET /setores/{org_id}`: Listar setores de uma organização.

#### B. Gestão de Questionários (`/questionarios`)
- `POST /questionarios`: Criar/Importar novo questionário (Admin).
- `GET /questionarios`: Listar questionários ativos.
- `GET /questionarios/{id}/perguntas`: Obter estrutura completa para renderização.

#### C. Fluxo de Resposta (`/respostas`)
- `POST /respostas`: Enviar lote de respostas (salva parcial ou final).
    - **Validação**: Verifica se `idPergunta` pertence ao questionário.
    - **Side-effect**: Se finalizado, dispara cálculo de diagnóstico assíncrono.

#### D. Diagnósticos e Relatórios (`/diagnosticos`, `/relatorios`)
- `GET /diagnosticos/me`: Retorna diagnósticos do usuário autenticado.
- `POST /relatorios/gerar`: Solicita geração de relatório consolidado (Admin).
    - *Parâmetros*: `idOrganizacao`, `idSetor`, `tipoRelatorio`.
- `GET /relatorios/{id}`: Baixar JSON/PDF do relatório.

## Plano de Ação

### Fase 1: Setup e Base
1. [ ] Criar `app/routers/deps.py` para dependências comuns (Admin check, Pagination).
2. [ ] Atualizar `main.py` para incluir novos routers.

### Fase 2: Implementação dos Routers
3. [ ] `app/routers/organizacoes.py`: CRUD básico.
4. [ ] `app/routers/questionarios.py`: Leitura e Criação.
5. [ ] `app/routers/respostas.py`: Recebimento seguro de respostas.
6. [ ] `app/routers/diagnosticos.py`: Exposição do `DiagnosticoService`.
7. [ ] `app/routers/relatorios.py`: Exposição do `RelatorioService`.

## Validação
- Testes de integração para cada Router usando `TestClient` do FastAPI.
- Verificação de proteção de rotas (tentar acessar sem token deve retornar 401).

---
*Este documento deve ser aprovado antes do início da codificação.*

# Documentação da Camada de Repositórios — LuzIA Backend

Este documento descreve a arquitetura, lógica e padrões utilizados na camada de acesso a dados do backend do LuzIA.

---

## 1. Visão Geral

A camada de repositórios implementa o **Repository Pattern**, desacoplando a lógica de negócio do acesso direto ao MongoDB. Cada coleção do banco possui seu próprio repositório dedicado.

### Estrutura de Arquivos

```
backend/app/repositories/
├── __init__.py          # Exports centralizados
├── organizacoes.py      # Gerenciamento de organizações
├── setores.py           # Gerenciamento de setores
├── usuarios.py          # Gerenciamento de usuários
├── questionarios.py     # Questionários e perguntas
├── respostas.py         # Respostas aos questionários
├── diagnosticos.py      # Diagnósticos individuais
└── relatorios.py        # Relatórios consolidados
```

---

## 2. Padrões Implementados

### 2.1 Tratamento de Erros

Todos os métodos que recebem IDs externos tratam `bson.errors.InvalidId` para evitar exceções não controladas:

```python
from bson.errors import InvalidId

async def get_organization(self, org_id: str) -> Optional[Dict[str, Any]]:
    try:
        db = await get_db()
        return await db[self.collection_name].find_one({"_id": ObjectId(org_id)})
    except InvalidId:
        logger.warning(f"ID de organização inválido: {org_id}")
        return None
```

**Comportamento:** Em caso de ID inválido, o método retorna `None` (para buscas) ou `False` (para operações de modificação), permitindo que a camada de serviço trate adequadamente.

### 2.2 Logging Padronizado

Cada repositório utiliza um logger próprio para rastreabilidade:

```python
import logging
logger = logging.getLogger(__name__)
```

**Logs gerados:**
- `INFO`: Criação de novos documentos
- `WARNING`: IDs inválidos ou operações que falharam silenciosamente

### 2.3 Conversão Automática de ObjectId

O MongoDB utiliza `ObjectId` como identificador primário. Os repositórios convertem strings automaticamente:

```python
def _ensure_object_id(self, data: Dict[str, Any], field: str) -> None:
    """Converte um campo string para ObjectId se necessário."""
    if field in data and isinstance(data[field], str):
        data[field] = ObjectId(data[field])
```

### 2.4 Docstrings no Formato Google

Todos os métodos públicos possuem documentação completa:

```python
async def create_organization(self, org_data: Dict[str, Any]) -> str:
    """
    Cria uma nova organização no banco de dados.

    Args:
        org_data: Dicionário contendo 'cnpj' e 'nome'.

    Returns:
        O ID da organização criada como string.
    """
```

---

## 3. Repositórios Implementados

### 3.1 OrganizacoesRepo

**Arquivo:** `organizacoes.py`  
**Coleção:** `organizacoes`

| Método | Descrição |
|--------|-----------|
| `create_organization(org_data)` | Cria uma nova organização |
| `get_organization(org_id)` | Busca por ID |
| `find_by_cnpj(cnpj)` | Busca por CNPJ |
| `list_organizations(limit)` | Lista todas as organizações |
| `update_organization(org_id, data)` | Atualiza dados |
| `delete_organization(org_id)` | Remove organização |

---

### 3.2 SetoresRepo

**Arquivo:** `setores.py`  
**Coleção:** `setores`

| Método | Descrição |
|--------|-----------|
| `create_sector(sector_data)` | Cria um novo setor vinculado a uma organização |
| `get_sector(sector_id)` | Busca por ID |
| `get_sectors_by_org(org_id)` | Lista setores de uma organização |
| `update_sector(sector_id, data)` | Atualiza dados |
| `delete_sector(sector_id)` | Remove setor |

**Lógica especial:** O campo `idOrganizacao` é automaticamente convertido para `ObjectId` na criação.

---

### 3.3 UsuariosRepo

**Arquivo:** `usuarios.py`  
**Coleção:** `usuarios`

| Método | Descrição |
|--------|-----------|
| `find_by_phone(phone)` | Busca por telefone |
| `find_by_anon_id(anon_id)` | Busca por ID anônimo |
| `create_user(user_data)` | Cria novo usuário |
| `update_chat_state(phone, state)` | Atualiza estado do bot em `metadata.chat_state` |
| `update_status(phone, status)` | Atualiza status do usuário |
| `mark_as_responded(phone)` | Marca como tendo respondido |
| `list_users_by_org(org_id, setor_id)` | Lista usuários por organização/setor |
| `delete_user(phone)` | Remove usuário |

**Campos automáticos na criação:**
- `dataCadastro`: Data atual
- `status`: `"aguardando_confirmacao"`
- `respondido`: `False`

---

### 3.4 QuestionariosRepo e PerguntasRepo

**Arquivo:** `questionarios.py`  
**Coleções:** `questionarios` e `perguntas`

#### QuestionariosRepo

| Método | Descrição |
|--------|-----------|
| `get_active_questionnaire(name)` | Busca questionário ativo por nome |
| `get_by_id(questionario_id)` | Busca por ID |
| `list_questionnaires(only_active)` | Lista questionários |

#### PerguntasRepo

| Método | Descrição |
|--------|-----------|
| `get_questions(id_questionario, only_active)` | Lista perguntas ordenadas por `idPergunta` |
| `get_question_by_id(id_pergunta)` | Busca pergunta pelo identificador de negócio |
| `count_questions(id_questionario)` | Conta perguntas ativas |

---

### 3.5 RespostasRepo

**Arquivo:** `respostas.py`  
**Coleção:** `respostas`

| Método | Descrição |
|--------|-----------|
| `push_answer(anon_id, id_questionario, id_pergunta, valor)` | Adiciona resposta ao array (upsert) |
| `get_answers(anon_id, id_questionario)` | Busca respostas de um respondente |
| `get_all_answers_for_questionnaire(id_questionario)` | Lista todas as respostas (para métricas) |
| `count_respondents(id_questionario)` | Conta respondentes |
| `delete_answers(anon_id, id_questionario)` | Remove respostas |

**Lógica de `push_answer`:**
```python
# Upsert: cria sessão se não existir, adiciona resposta ao array
await db["respostas"].update_one(
    {"anonId": anon_id, "idQuestionario": q_id},
    {
        "$push": {"respostas": {"valor": valor, "idPergunta": id_pergunta}},
        "$set": {"data": datetime.utcnow()}
    },
    upsert=True
)
```

---

### 3.6 DiagnosticosRepo

**Arquivo:** `diagnosticos.py`  
**Coleção:** `diagnosticos`

| Método | Descrição |
|--------|-----------|
| `create_diagnostico(diagnostico_data)` | Cria diagnóstico individual |
| `get_by_anon_id(anon_id, questionario_id)` | Lista diagnósticos do respondente |
| `get_latest_by_anon_id(anon_id, questionario_id)` | Busca o mais recente |
| `get_by_id(diagnostico_id)` | Busca por ID |

**Campos automáticos:**
- `dataAnalise`, `dataCriacao`, `atualizadoEm`

---

### 3.7 RelatoriosRepo

**Arquivo:** `relatorios.py`  
**Coleção:** `relatorios`

| Método | Descrição |
|--------|-----------|
| `create_relatorio(relatorio_data)` | Cria relatório consolidado |
| `find_by_filters(questionario_id, org_id, setor_id, tipo, limit)` | Busca com filtros |
| `get_by_id(relatorio_id)` | Busca por ID |
| `delete_relatorio(relatorio_id)` | Remove relatório |

---

## 4. Como Utilizar

### Import Centralizado

```python
from app.repositories import (
    OrganizacoesRepo,
    SetoresRepo,
    UsuariosRepo,
    QuestionariosRepo,
    PerguntasRepo,
    RespostasRepo,
    DiagnosticosRepo,
    RelatoriosRepo
)
```

### Exemplo de Uso em um Serviço

```python
from app.repositories import OrganizacoesRepo, SetoresRepo

class OrganizacaoService:
    def __init__(self):
        self.org_repo = OrganizacoesRepo()
        self.setor_repo = SetoresRepo()

    async def criar_organizacao_com_setores(self, dados_org, lista_setores):
        # Cria a organização
        org_id = await self.org_repo.create_organization(dados_org)
        
        # Cria os setores vinculados
        for setor in lista_setores:
            setor["idOrganizacao"] = org_id
            await self.setor_repo.create_sector(setor)
        
        return org_id
```

---

## 5. Mapeamento com o Banco de Dados

| Repositório | Coleção MongoDB | Campos Obrigatórios |
|-------------|-----------------|---------------------|
| OrganizacoesRepo | `organizacoes` | `cnpj`, `nome` |
| SetoresRepo | `setores` | `idOrganizacao`, `nome` |
| UsuariosRepo | `usuarios` | `telefone`, `idOrganizacao`, `anonId`, `status` |
| QuestionariosRepo | `questionarios` | `nome`, `versao`, `ativo` |
| PerguntasRepo | `perguntas` | `idQuestionario`, `idPergunta`, `texto`, `tipo`, `escala` |
| RespostasRepo | `respostas` | `anonId`, `idQuestionario`, `respostas` |
| DiagnosticosRepo | `diagnosticos` | `anonId`, `idQuestionario`, `resultadoGlobal`, `dataAnalise` |
| RelatoriosRepo | `relatorios` | `idQuestionario`, `tipoRelatorio`, `dataGeracao` |

---

## 6. Notas Importantes

### Anonimização (LGPD)
- O campo `anonId` é gerado via hash SHA-256 do telefone + salt
- As coleções `respostas`, `diagnosticos` e `relatorios` utilizam `anonId` em vez do telefone
- A associação `telefone ↔ anonId` existe apenas na coleção `usuarios`

### Performance
- Índices recomendados estão definidos em `mongo/init_final.js`
- Os métodos `to_list()` possuem limite padrão de 100-1000 documentos

### Concorrência
- Todas as operações são assíncronas (`async/await`)
- O driver `motor` gerencia o pool de conexões automaticamente

---

## 7. Histórico de Alterações

| Data | Alteração |
|------|-----------|
| 2026-01-06 | Criação inicial dos repositórios `organizacoes`, `setores`, `diagnosticos`, `relatorios` |
| 2026-01-06 | Refatoração completa: tratamento de erros, logging, docstrings |
| 2026-01-06 | Criação de `respostas.py` (extraído de `usuarios.py`) |
| 2026-01-06 | Separação de `PerguntasRepo` de `QuestionariosRepo` |
| 2026-01-06 | Atualização do `__init__.py` com exports centralizados |

---

> **Referência:** Para detalhes sobre o esquema do banco de dados, consulte `mongo/init_final.js` e `Guia-Implementacao-Backend.md`.

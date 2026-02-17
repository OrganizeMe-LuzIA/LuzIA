# Camada de Acesso a Dados (Repositories) — LuzIA

Esta camada é responsável por toda a interação direta com o MongoDB, utilizando o driver assíncrono `motor`. Seguimos o padrão **Repository Pattern** para desacoplar a lógica de negócio do banco de dados.

## 1. Localização dos Arquivos

- **Modelos Pydantic**: `src/app/models/base.py` — Definem a estrutura dos dados e validação.
- **Repositórios**: `src/app/repositories/`
  - `base_repository.py`: Repositório base com operações CRUD genéricas.
  - `organizacoes.py`: Gerencia organizações (CNPJ validado, vínculos protegidos).
  - `setores.py`: Gerencia setores vinculados a organizações.
  - `usuarios.py`: Gerencia perfis de usuários e estados de conversa.
  - `questionarios.py`: Gerencia questionários (COPSOQ II e outros).
  - `perguntas.py`: Gerencia perguntas associadas a questionários.
  - `respostas.py`: Gerencia respostas dos usuários.
  - `diagnosticos.py`: Gerencia diagnósticos individuais calculados.
  - `relatorios.py`: Gerencia relatórios organizacionais/setoriais.

## 2. Implementação Técnica

### UsuariosRepo (`src/app/repositories/usuarios.py`)

Responsável pelo ciclo de vida do usuário no bot:

- `find_by_phone(phone)`: Busca um usuário pelo número do WhatsApp.
- `find_by_email(email)`: Busca um usuário pelo email.
- `find_by_anon_id(anon_id)`: Busca pelo ID anônimo (LGPD).
- `create_user(data)`: Registra um novo respondente com `status="não iniciado"`.
- `update_chat_state(phone, state)`: Atualiza o estado da conversa dentro do campo `metadata.chat_state`.
- `update_status(phone, status)`: Atualiza o status do usuário (`"não iniciado"` / `"em andamento"` / `"finalizado"`).
- `mark_as_responded(phone)`: Marca o campo `respondido = True`.

### QuestionariosRepo (`src/app/repositories/questionarios.py`)

Responsável por gerenciar o conteúdo dos questionários:

- `get_active_questionnaire(name)`: Busca as configurações gerais do instrumento.
- `list_questionnaires(only_active)`: Retorna todos os questionários (filtro opcional por ativos).
- `get_by_id(questionario_id)`: Busca um questionário por ObjectId.

### PerguntasRepo (`src/app/repositories/perguntas.py`)

Responsável pelas perguntas de um questionário:

- `get_questions(id_questionario)`: Retorna a lista de perguntas ordenada por `ordem`.
- `get_question_by_id(id_pergunta)`: Busca pelo identificador de negócio (`EL_EQ_01A`, etc.).
- `count_questions(id_questionario)`: Conta perguntas ativas.

### RespostasRepo (`src/app/repositories/respostas.py`)

Responsável pelas respostas coletadas via bot:

- `push_answer(anon_id, id_questionario, id_pergunta, valor)`: Insere uma resposta no array `respostas` (upsert).
- `get_answers(anon_id, id_questionario)`: Recupera as respostas de um respondente.

## 3. Por que usar Repositórios?

1. **Desacoplamento**: Se decidirmos trocar o MongoDB por outro banco no futuro, alteramos apenas os arquivos na pasta `repositories`.
2. **Tipagem**: Usamos classes Pydantic para garantir que o que sai do banco é o que a aplicação espera.
3. **Facilidade de Teste**: Podemos criar testes simulando o banco de dados de forma isolada.

## 4. Como usar no código

Sempre instancie o repositório dentro do seu serviço ou router:

```python
from app.repositories.usuarios import UsuariosRepo

user_repo = UsuariosRepo()
user = await user_repo.find_by_phone("+5511999999999")
```

> [!NOTE]
> Todas as chamadas são **assíncronas** (`async/await`), aproveitando a alta performance do FastAPI e Motor.

## 5. Relacionamento entre Repositórios

```
OrganizacoesRepo ──1:N──▶ SetoresRepo
OrganizacoesRepo ──1:N──▶ UsuariosRepo
SetoresRepo      ──1:N──▶ UsuariosRepo
UsuariosRepo     ──1:N──▶ RespostasRepo  (via anonId)
RespostasRepo    ──1:1──▶ DiagnosticosRepo (via anonId)
DiagnosticosRepo ──N:1──▶ RelatoriosRepo  (agregação org/setor)
```

---

> **Referência completa:** Para a lista detalhada de métodos de cada repositório, consulte [GUIA-REPOSITORIES.md](./GUIA-REPOSITORIES.md).

**Última Atualização:** 2026-02-17

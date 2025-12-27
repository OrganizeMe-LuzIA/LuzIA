# Camada de Acesso a Dados (Repositories) — LuzIA

Esta camada é responsável por toda a interação direta com o MongoDB, utilizando o driver assíncrono `motor`. Seguimos o padrão **Repository Pattern** para desacoplar a lógica de negócio do banco de dados.

## 1. Localização dos Arquivos
- **Modelos Pydantic**: `app/models/base.py` (Definem a estrutura dos dados e validação).
- **Repositórios**: `app/repositories/`
    - `usuarios.py`: Gerencia perfis de usuários, estados de conversa e respostas.
    - `questionarios.py`: Gerencia a busca por instrumentos (ex: CoPsoQ II) e suas respectivas perguntas.

## 2. Implementação Técnica

### UsuariosRepo (`app/repositories/usuarios.py`)
Responsável pelo ciclo de vida do usuário no bot:
- `find_by_phone(phone)`: Busca um usuário pelo número do WhatsApp.
- `create_user(data)`: Registra um novo respondente.
- `update_chat_state(phone, state)`: Atualiza o estado da conversa dentro do campo `metadata.chat_state` (evitando violar a validação do banco).
- `push_answer(anon_id, id_questionario, id_pergunta, valor)`: Insere uma resposta no array `respostas` da coleção de respostas, mantendo o histórico da sessão.

### QuestionariosRepo (`app/repositories/questionarios.py`)
Responsável por gerenciar o conteúdo dos questionários:
- `get_active_questionnaire(name)`: Busca as configurações gerais do instrumento.
- `get_questions(id_questionario)`: Retorna a lista de perguntas ordenada (usando `idQuestionario` como filtro).

## 3. Por que usar Repositórios?
1. **Desacoplamento**: Se decidirmos trocar o MongoDB por outro banco no futuro, alteramos apenas os arquivos na pasta `repositories`.
2. **Tipagem**: Usamos classes Pydantic para garantir que o que sai do banco é o que a aplicação espera.
3. **Facilidade de Teste**: Podemos criar testes simulando o banco de dados de forma isolada.

## 4. Como usar no código
Sempre instancie o repositório dentro do seu serviço ou router:

```python
from app.repositories.usuarios import UsuariosRepo

user_repo = UsuariosRepo()
user = await user_repo.find_by_phone("5511999999999")
```

> [!NOTE]
> Todas as chamadas são **assíncronas** (`async/await`), aproveitando a alta performance do FastAPI e Motor.

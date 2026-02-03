# Implementação do Questionário COPSOQ II no Banco de Dados (REVISADO)

Este documento detalha a implementação da lógica do questionário COPSOQ II (Copenhagen Psychosocial Questionnaire, Versão Portuguesa) no banco de dados MongoDB do sistema LuzIA, **incluindo as atualizações necessárias nos modelos de aplicação (Pydantic)**.

## 1. Alterações no Esquema do Banco de Dados (MongoDB)

### 1.1 Coleção `questionarios`

A estrutura deve suportar a definição rica de domínios e escalas.

```javascript
{
  "nome": "COPSOQ II - Versão Média Portuguesa",
  "versao": "2.0",
  "descricao": "Copenhagen Psychosocial Questionnaire - Versão Portuguesa adaptada...",
  "tipo": "psicossocial", // Novo campo para categorização
  "dominios": [
    {
      "codigo": "EL", 
      "nome": "Exigências Laborais", 
      "ordem": 1,
      "descricao": "Avalia o ritmo e carga de trabalho" // Opcional
    },
    // ... outros domínios
  ],
  "escalasPossiveis": [
    "frequencia", 
    "intensidade", 
    "comportamento_ofensivo"
  ],
  "totalPerguntas": 76,
  "ativo": true
}
```

### 1.2 Coleção `perguntas`

Exemplo de estrutura completa para uma pergunta:

```javascript
{
  "idQuestionario": ObjectId("..."),
  "codigoDominio": "EL", // Essencial para agrupamento rápido
  "dominio": "Exigências Laborais",
  "dimensao": "Exigências quantitativas",
  "idPergunta": "EL_EQ_01",
  "texto": "A sua carga de trabalho acumula-se por ser mal distribuída?",
  "tipoEscala": "frequencia", // Substitui 'tipo', mais descritivo ou usa 'tipo' mapeado
  "sinal": "risco",
  "itemInvertido": false,
  "ordem": 1,
  "opcoesResposta": [
    {"valor": 1, "texto": "Nunca/quase nunca"},
    {"valor": 2, "texto": "Raramente"},
    {"valor": 3, "texto": "Às vezes"},
    {"valor": 4, "texto": "Frequentemente"},
    {"valor": 5, "texto": "Sempre"}
  ],
  // Para comportamentos ofensivos:
  "subPergunta": {
    "condicao": "valor > 0",
    "texto": "Se sim, de quem?",
    "tipoResposta": "multipla_escolha",
    "opcoes": ["Colegas", "Chefia", "Subordinados", "Clientes"]
  }
}
```

---

## 2. Atualizações nos Modelos da Aplicação (Python/Pydantic)

> [!IMPORTANT]
> O arquivo `backend/src/app/models/base.py` deve ser atualizado para refletir a nova estrutura rica do banco de dados. O código atual não suporta a estrutura de domínios como objetos nem as opções de resposta variáveis.

### 2.1 Atualização de `Questionario`

**Arquivo Alvo:** `backend/src/app/models/base.py`

```python
class Dominio(BaseModel):
    codigo: str
    nome: str
    ordem: int
    descricao: Optional[str] = None

class Questionario(BaseModel):
    nome: str
    versao: str
    descricao: str
    # Mudança de List[str] para List[Dominio]
    dominios: List[Dominio] 
    escalasPossiveis: List[str] # Novo
    totalPerguntas: int
    ativo: bool = True
```

### 2.2 Atualização de `Pergunta`

**Arquivo Alvo:** `backend/src/app/models/base.py`

```python
class OpcaoResposta(BaseModel):
    valor: int
    texto: str

class SubPergunta(BaseModel):
    condicao: str
    texto: str
    tipoResposta: str
    opcoes: List[str]

class Pergunta(BaseModel):
    idQuestionario: Any
    codigoDominio: str # Novo
    dominio: str
    dimensao: str
    idPergunta: str
    texto: str
    tipoEscala: str # Renomear de 'tipo' ou manter alias
    sinal: str = "risco"
    itemInvertido: bool = False
    opcoesResposta: List[OpcaoResposta] # Novo: essencial para o frontend/bot saber as opções
    subPergunta: Optional[SubPergunta] = None # Novo
    ordem: int # Novo
    ativo: bool = True
```

---

## 3. Lógica de Scoring (Pontuação)

O serviço de scoring (`copsoq_scoring_service.py`) deve ser implementado para lidar com:
1.  **Inversão de Itens**: Detectar automaticamente itens invertidos baseados no ID ou flag.
2.  **Cálculo de Médias**: Média simples por dimensão (check de nulos).
3.  **Mapeamento de Tercis**:
    *   **Fatores de Risco**: (ex: Stress) Baixo valor = Favorável.
    *   **Fatores de Proteção**: (ex: Satisfação) Alto valor = Favorável.

### Mapeamento de Fatores

| Tipo | Regra | Tercil Favorável (Verde) |
|------|-------|--------------------------|
| **Risco** | Pior quanto maior | < 2.33 |
| **Proteção** | Melhor quanto maior | > 3.67 |

---

## 4. Plano de Execução

1.  **Atualizar Modelos Pydantic** (`backend/src/app/models/base.py`):
    *   Adicionar classes `Dominio`, `OpcaoResposta`, `SubPergunta`.
    *   Atualizar `Questionario` e `Pergunta`.
2.  **Criar Script de Seed** (`backend/mongo/seed_copsoq_ii.js`):
    *   Popular com a estrutura completa e correta.
3.  **Implementar Scoring Service** (`backend/src/app/services/copsoq_scoring_service.py`).
4.  **Validar Ingestão**:
    *   Garantir que o bot ou API que lê as perguntas consiga serializar o novo modelo Pydantic corretamente.

## 5. Arquivos Envolvidos

| Arquivo | Status | Ação |
|---------|--------|------|
| `docs/plans/PLANO_COPSOQ_DATABASE_REVISADO.md` | **Novo** | Documento mestre de referência. |
| `backend/src/app/models/base.py` | **Existente** | **Modificar** (Breaking Change). |
| `backend/mongo/seed_copsoq_ii.js` | **Novo** | Criar script de população. |
| `backend/src/app/services/copsoq_scoring_service.py` | **Novo** | Criar lógica de negócios. |

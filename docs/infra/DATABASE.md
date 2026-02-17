# Banco de Dados — MongoDB

> **Voltar para:** [📚 Documentação](../README.md)

---

## 📊 Collections Principais

### `usuarios`

```javascript
{
  "_id": ObjectId("..."),
  "telefone": "+5511999999999",
  "email": "user@example.com",
  "password_hash": "$pbkdf2-sha256$29000$...",
  "idOrganizacao": ObjectId("..."),
  "idSetor": ObjectId("..."),
  "numeroUnidade": "A-301",
  "anonId": "USR_1234567890",
  "status": "não iniciado",           // "finalizado", "em andamento", "não iniciado"
  "respondido": false,
  "dataCadastro": ISODate("..."),
  "metadata": {"is_admin": false}
}
```

**Índices:**
- `{telefone: 1}` (unique) — busca por telefone no login/registro
- `{anonId: 1}` (unique) — busca anônima para diagnósticos
- `{email: 1}` (unique, sparse) — busca por email no login
- `{idOrganizacao: 1, idSetor: 1}` — filtro por organização/setor

### `organizacoes`

```javascript
{
  "_id": ObjectId("..."),
  "cnpj": "12345678000100",           // CNPJ validado (dígitos verificadores)
  "nome": "Empresa XYZ Ltda",
  "codigo": "EXY"                     // Código opcional
}
```

**Índices:**
- `{cnpj: 1}` (unique)

### `setores`

```javascript
{
  "_id": ObjectId("..."),
  "idOrganizacao": ObjectId("..."),
  "nome": "Recursos Humanos",
  "descricao": "Departamento de RH"
}
```

**Índices:**
- `{idOrganizacao: 1, nome: 1}` (unique) — nome único por organização

### `questionarios`

```javascript
{
  "_id": ObjectId("..."),
  "nome": "COPSOQ II - Versão Curta Brasileira",
  "codigo": "COPSOQ_CURTA_BR",
  "versao": "2.0",
  "tipo": "psicossocial",
  "idioma": "pt-BR",
  "descricao": "...",
  "dominios": [
    {"codigo": "EL", "nome": "Exigências Laborais", "ordem": 1, "descricao": "..."}
  ],
  "escalasPossiveis": ["frequencia", "intensidade", "satisfacao"],
  "totalPerguntas": 40,
  "ativo": true
}
```

**Índices:**
- `{codigo: 1}` (unique)

### `perguntas`

```javascript
{
  "_id": ObjectId("..."),
  "idQuestionario": ObjectId("..."),
  "codigoDominio": "EL",
  "dominio": "Exigências Laborais",
  "dimensao": "Exigências quantitativas",
  "idPergunta": "EL_EQ_01A",
  "texto": "Você atrasa a entrega do seu trabalho?",
  "tipoEscala": "frequencia",
  "sinal": "risco",
  "itemInvertido": false,
  "ordem": 1,
  "opcoesResposta": [
    {"valor": 0, "texto": "Nunca"},
    {"valor": 1, "texto": "Raramente"},
    {"valor": 2, "texto": "Às vezes"},
    {"valor": 3, "texto": "Frequentemente"},
    {"valor": 4, "texto": "Sempre"}
  ],
  "subPergunta": null,
  "ativo": true
}
```

**Índices:**
- `{idPergunta: 1}` (unique)
- `{idQuestionario: 1, ordem: 1}`

### `respostas`

```javascript
{
  "_id": ObjectId("..."),
  "anonId": "USR_1234567890",
  "idQuestionario": ObjectId("..."),
  "data": ISODate("..."),
  "respostas": [
    {"idPergunta": "EL_EQ_01A", "valor": 3},
    {"idPergunta": "CO_CO_01", "valor": [1, 2], "valorTexto": null}
  ]
}
```

**Índices:**
- `{anonId: 1, idQuestionario: 1}` (unique) — uma resposta por questionário/usuário

### `diagnosticos`

```javascript
{
  "_id": ObjectId("..."),
  "anonId": "USR_1234567890",
  "idQuestionario": ObjectId("..."),
  "resultadoGlobal": "intermediario",
  "pontuacaoGlobal": 2.15,
  "dimensoes": [
    {
      "dominio": "Exigências Laborais",
      "codigoDominio": "EL",
      "dimensao": "Exigências quantitativas",
      "pontuacao": 3.5,
      "classificacao": "intermediario",
      "sinal": "risco",
      "total_itens": 3,
      "itens_respondidos": 3
    }
  ],
  "dataAnalise": ISODate("...")
}
```

**Índices:**
- `{anonId: 1}` — busca por usuário anônimo

### `relatorios`

```javascript
{
  "_id": ObjectId("..."),
  "idQuestionario": ObjectId("..."),
  "idOrganizacao": ObjectId("..."),
  "idSetor": null,
  "tipoRelatorio": "organizacional",
  "geradoPor": "admin@empresa.com",
  "dataGeracao": ISODate("..."),
  "metricas": {
    "mediaRiscoGlobal": 1.8,
    "indiceProtecao": 65.5,
    "totalRespondentes": 25
  },
  "dominios": [
    {
      "codigo": "EL",
      "nome": "Exigências Laborais",
      "dimensoes": [
        {
          "dimensao": "Exigências quantitativas",
          "media": 2.1,
          "distribuicao": {"favoravel": 15, "intermediario": 8, "risco": 2},
          "classificacao": "favoravel",
          "sinal": "risco"
        }
      ],
      "media_dominio": 2.3,
      "classificacao_predominante": "favoravel"
    }
  ],
  "recomendacoes": ["Atenção a..."],
  "observacoes": null
}
```

**Índices:**
- `{idOrganizacao: 1, dataGeracao: -1}`

---

## 🔍 Queries Comuns

### Buscar usuários de uma organização

```javascript
db.usuarios.find({idOrganizacao: ObjectId("...")})
```

### Diagnósticos de um setor

```javascript
db.usuarios.aggregate([
  {$match: {idSetor: ObjectId("...")}},
  {$lookup: {
    from: "diagnosticos",
    localField: "anonId",
    foreignField: "anonId",
    as: "diagnostico"
  }}
])
```

### Relatórios recentes de uma organização

```javascript
db.relatorios.find({
  idOrganizacao: ObjectId("..."),
  dataGeracao: {$gte: ISODate("2026-01-01")}
}).sort({dataGeracao: -1})
```

---

## ⚙️ Conexão

**Arquivo:** [`backend/src/app/core/database.py`](../../backend/src/app/core/database.py)

```python
# Motor (driver async para MongoDB)
client = AsyncIOMotorClient(settings.MONGO_URI)
db = client[settings.MONGO_DB_NAME]
```

### Pool de Conexões

```env
MONGO_MAX_POOL_SIZE=100   # 50 em produção (Render)
MONGO_MIN_POOL_SIZE=10    # 5 em produção (Render)
MONGO_TIMEOUT_MS=5000
```

### Retry Logic

A conexão ao MongoDB inclui lógica de retry no startup (`lifespan` do FastAPI):
- Tenta conectar com `server_info()` a cada segundo
- Máximo de tentativas configurável

---

## 📝 Migrações

O schema é validado em runtime via Pydantic. Atualizações de schema são aplicadas diretamente no código — não há ferramenta de migração (como Alembic) pois o MongoDB é schemaless.

---

**Última Atualização:** 2026-02-17

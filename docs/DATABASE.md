# Banco de Dados -  MongoDB

> **Voltar para:** [📚 Documentação](README.md)

---

## 📊 Collections Principais

### `usuarios`

```javascript
{
  "_id": ObjectId("..."),
  "telefone": "+5511999999999",
  "idOrganizacao": ObjectId("..."),
  "idSetor": ObjectId("..."),
  "anonId": "USR_1234567890",
  "status": "ativo",
  "respondido": false,
  "dataCadastro": ISODate("...")
}
```

**Índices:**
- `{email: 1}` (unique)
- `{anonId: 1}` (unique)
- `{idOrganizacao: 1, idSetor: 1}`

### `organizacoes`

```javascript
{
  "_id": ObjectId("..."),
  "cnpj": "12345678000100",
  "nome": "Empresa  XYZ Ltda"
}
```

**Índices:**
- `{cnpj: 1}` (unique)

### `questionarios`

```javascript
{
  "_id": ObjectId("..."),
  "nome": "COPSOQ II - Versão Curta Brasileira",
  "codigo": "COPSOQ_CURTA_BR",
  "versao": "2.0",
  "idioma": "pt-BR",
  "totalPerguntas": 40,
  "dominios": [{codigo: "EL", nome: "Exigências Laborais", ...}],
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
  "ordem": 1
}
```

**Índices:**
- `{idQuestionario: 1, ordem: 1}`
- `{idPergunta: 1}` (unique)

### `respostas`

```javascript
{
  "_id": ObjectId("..."),
  "anonId": "USR_1234567890",
  "idQuestionario": ObjectId("..."),
  "data": ISODate("..."),
  "respostas": [
    {idPergunta: "EL_EQ_01A", valor: 3},
    {idPergunta: "EL_EQ_01B", valor: 2},
    //...
  ]
}
```

**Índices:**
- `{anonId: 1, idQuestionario: 1}` (unique)

### ` diagnosticos`

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
- `{anonId: 1}`

### `relatorios`

```javascript
{
  "_id": ObjectId("..."),
  "idQuestionario": ObjectId("..."),
  "idOrganizacao": ObjectId("..."),
  "tipoRelatorio": "organizacional",
  "geradoPor": "admin@empresa.com",
  "dataGeracao": ISODate("..."),
  "metricas": {
    "mediaRiscoGlobal": 1.8,
    "indiceProtecao": 65.5,
    "totalRespondentes": 25
  },
  "dominios": [{codigo: "EL", nome: "...", dimensoes: [...]}],
  "recomendacoes": ["..."]
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

### Relatórios recentes

```javascript
db.relatorios.find({
  idOrganizacao: ObjectId("..."),
  dataGeracao: {$gte: ISODate("2026-01-01")}
}).sort({dataGeracao: -1})
```

---

## 📝 Migr Actions

Atualizações de schema são aplicadas diretamente no código através de validação Pydantic.

---

**Última Atualização:** 2026-02-07

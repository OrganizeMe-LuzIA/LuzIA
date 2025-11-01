use("LuzIA");

// Create collection only if it doesn't exist (idempotent reruns)
function createIfNotExists(name, options) {
  if (!db.getCollectionNames().includes(name)) {
    db.createCollection(name, options);
  } else {
    print(`Collection ${name} already exists, skipping creation.`);
  }
}

createIfNotExists("organizacoes", {
  "capped": false,
  "validator": {
    "$jsonSchema": {
      "bsonType": "object",
      "title": "organizacoes",
      "properties": {
        "_id": { "bsonType": "objectId" },
        "cnpj": { "bsonType": "string" },
        "nome": { "bsonType": "string" }
      },
      "additionalProperties": false,
      "required": ["cnpj", "nome"]
    }
  },
  "validationLevel": "off",
  "validationAction": "warn"
});

createIfNotExists("setores", {
  "capped": false,
  "validator": {
    "$jsonSchema": {
      "bsonType": "object",
      "title": "setores",
      "properties": {
        "_id": { "bsonType": "objectId" },
        "idOrganizacao": { "bsonType": "objectId" },
        "nome": { "bsonType": "string" },
        "descricao": { "bsonType": "string" }
      },
      "additionalProperties": false,
      "required": ["idOrganizacao", "nome"]
    }
  },
  "validationLevel": "off",
  "validationAction": "warn"
});

createIfNotExists("usuarios", {
  "capped": false,
  "validator": {
    "$jsonSchema": {
      "bsonType": "object",
      "title": "usuarios",
      "properties": {
        "_id": { "bsonType": "objectId" },
        "telefone": { "bsonType": "string" },
        "idOrganizacao": { "bsonType": "objectId" },
        "status": { "bsonType": "string", "enum": ["ativo", "inativo", "aguardando_confirmacao"] },
        "respondido": { "bsonType": "bool" },
        "anonId": { "bsonType": "string" },
        "dataCadastro": { "bsonType": "date" }
      },
      "additionalProperties": false,
      "required": ["telefone", "idOrganizacao", "anonId"]
    }
  },
  "validationLevel": "off",
  "validationAction": "warn"
});

createIfNotExists("questionarios", {
  "capped": false,
  "validator": {
    "$jsonSchema": {
      "bsonType": "object",
      "title": "questionarios",
      "properties": {
        "_id": { "bsonType": "objectId" },
        "nome": { "bsonType": "string" },
        "versao": { "bsonType": "string" },
        "descricao": { "bsonType": "string" },
        "dominios": { "bsonType": "array", "additionalItems": true, "items": { "bsonType": "string" } },
        "escala": { "bsonType": "string" },
        "totalPerguntas": { "bsonType": "int" },
        "ativo": { "bsonType": "bool" }
      },
      "additionalProperties": false
    }
  },
  "validationLevel": "off",
  "validationAction": "warn"
});

createIfNotExists("perguntas", {
  "capped": false,
  "validator": {
    "$jsonSchema": {
      "bsonType": "object",
      "title": "perguntas",
      "properties": {
        "_id": { "bsonType": "objectId" },
        "idQuestionario": { "bsonType": "string" },
        "dominio": { "bsonType": "string" },
        "dimensao": { "bsonType": "string" },
        "idPergunta": { "bsonType": "string" },
        "texto": { "bsonType": "string" },
        "tipo": { "bsonType": "string" },
        "sinal": { "bsonType": "string", "enum": ["risco", "protecao"] },
        "itemInvertido": { "bsonType": "bool" },
        "escala": { "bsonType": "int", "maximum": 5, "minimum": 1 }
      },
      "additionalProperties": false,
      "required": ["idQuestionario", "idPergunta"]
    }
  },
  "validationLevel": "off",
  "validationAction": "warn"
});

createIfNotExists("respostas", {
  "capped": false,
  "validator": {
    "$jsonSchema": {
      "bsonType": "object",
      "title": "respostas",
      "properties": {
        "_id": { "bsonType": "objectId" },
        "anonId": { "bsonType": "string" },
        "idQuestionario": { "bsonType": "objectId" },
        "data": { "bsonType": "date" },
        "respostas": {
          "bsonType": "array",
          "additionalItems": true,
          "items": {
            "bsonType": "object",
            "properties": {
              "valor": { "bsonType": "int", "maximum": 4, "minimum": 0 },
              "idPergunta": { "bsonType": "string" }
            },
            "additionalProperties": false,
            "required": ["valor", "idPergunta"]
          }
        }
      },
      "additionalProperties": false,
      "required": ["anonId", "idQuestionario", "respostas"]
    }
  },
  "validationLevel": "off",
  "validationAction": "warn"
});

createIfNotExists("diagnosticos", {
  "capped": false,
  "validator": {
    "$jsonSchema": {
      "bsonType": "object",
      "title": "diagnosticos",
      "properties": {
        "_id": { "bsonType": "objectId" },
        "anonId": { "bsonType": "string" },
        "idQuestionario": { "bsonType": "string" },
        "resultadoGlobal": { "bsonType": "string" },
        "dimensoes": { "bsonType": "array", "additionalItems": true, "items": [ { "bsonType": "string" }, { "bsonType": "string" } ] },
        "dataAnalise": { "bsonType": "date" }
      },
      "additionalProperties": false
    }
  },
  "validationLevel": "off",
  "validationAction": "warn"
});

createIfNotExists("relatorios", {
  "capped": false,
  "validator": {
    "$jsonSchema": {
      "bsonType": "object",
      "title": "relatorios",
      "properties": {
        "_id": { "bsonType": "objectId" },
        "idQuestionario": { "bsonType": "objectId" },
        "idOrganizacao": { "bsonType": "objectId" },
        "idSetor": { "bsonType": "objectId" },
        "anonId": { "bsonType": "string" },
        "tipoRelatorio": { "bsonType": "string", "enum": ["organizacional", "setorial", "individual"] },
        "geradoPor": { "bsonType": "string" },
        "dataGeracao": { "bsonType": "date" },
        "metricas": {
          "bsonType": "object",
          "properties": {
            "mediaRiscoGlobal": { "bsonType": "double" },
            "indiceProtecao": { "bsonType": "double" },
            "totalRespondentes": { "bsonType": "int" }
          },
          "additionalProperties": false
        },
        "dominios": {
          "bsonType": "array",
          "additionalItems": true,
          "items": {
            "bsonType": "object",
            "properties": {
              "nome": { "bsonType": "string" },
              "media": { "bsonType": "double" },
              "nivelRisco": { "bsonType": "string" },
              "dimensoes": {
                "bsonType": "array",
                "additionalItems": true,
                "items": {
                  "bsonType": "object",
                  "properties": {
                    "nome": { "bsonType": "string" },
                    "media": { "bsonType": "double" },
                    "nivelRisco": { "bsonType": "string" }
                  },
                  "additionalProperties": false
                }
              }
            },
            "additionalProperties": false
          }
        },
        "recomendacoes": {
          "bsonType": "array",
          "additionalItems": true,
          "items": { "bsonType": "string" }
        },
        "observacoes": { "bsonType": "string" }
      },
      "additionalProperties": false,
      "required": ["idQuestionario", "tipoRelatorio", "dataGeracao"]
    }
  },
  "validationLevel": "off",
  "validationAction": "warn"
});
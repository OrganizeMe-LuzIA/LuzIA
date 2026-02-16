// Copie todo o conteúdo do arquivo atual até a linha 420
use("LuzIA");

// Create collection only if it doesn't exist (idempotent reruns)
function createIfNotExists(name, options) {
  if (!db.getCollectionNames().includes(name)) {
    db.createCollection(name, options);
    print(`Collection ${name} criada com sucesso.`);
  } else {
    print(`Collection ${name} já existe, pulando criação.`);
  }
}

// Função para configurar índices
function ensureIndexes() {
  // Índice para usuários
  db.usuarios.createIndex({ "anonId": 1 }, { unique: true });
  db.usuarios.createIndex({ "telefone": 1 }, { unique: true });
  db.usuarios.createIndex({ "email": 1 }, { unique: true, sparse: true });
  db.usuarios.createIndex({ "idOrganizacao": 1, "idSetor": 1 });
  
  // Índices para organizações
  db.organizacoes.createIndex({ "cnpj": 1 }, { unique: true });
  db.organizacoes.createIndex({ "codigo": 1 }, { unique: true, sparse: true });
  
  // Índices para setores
  db.setores.createIndex({ "idOrganizacao": 1 });
  
  // Índices para perguntas e respostas
  db.perguntas.createIndex({ "idQuestionario": 1 });
  db.perguntas.createIndex({ "idPergunta": 1 }, { unique: true });
  
  // Índices para respostas
  db.respostas.createIndex({ "idQuestionario": 1 });
  db.respostas.createIndex({ "anonId": 1 });
  db.respostas.createIndex({ "data": -1 });
  
  // Índices para relatórios
  db.relatorios.createIndex({ "idQuestionario": 1 });
  db.relatorios.createIndex({ "idOrganizacao": 1 });
  db.relatorios.createIndex({ "idSetor": 1 });
  db.relatorios.createIndex({ "tipoRelatorio": 1 });
  db.relatorios.createIndex({ "dataGeracao": -1 });
  
  print("Índices criados/verificados com sucesso.");
}

// Função para ativar validação estrita em produção
function enableStrictValidation() {
  const collections = [
    "organizacoes", 
    "setores", 
    "usuarios", 
    "questionarios", 
    "perguntas", 
    "respostas", 
    "diagnosticos", 
    "relatorios"
  ];
  
  collections.forEach(collName => {
    const collInfo = db.getCollectionInfos({name: collName})[0];
    if (collInfo && collInfo.options && collInfo.options.validator) {
      db.runCommand({
        collMod: collName,
        validator: collInfo.options.validator,
        validationLevel: "moderate",
        validationAction: "error"
      });
      print(`Validação estrita ativada para a coleção ${collName}`);
    }
  });
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
        "nome": { "bsonType": "string" },
        "codigo": { "bsonType": "string" }
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
        "telefone": { 
          "bsonType": "string",
          "pattern": "^\\+?[1-9]\\d{1,14}$",
          "description": "Número de telefone no formato E.164"
        },
        "email": {
          "bsonType": ["string", "null"],
          "pattern": "^[^@\\s]+@[^@\\s]+\\.[^@\\s]+$",
          "description": "Email para autenticação do usuário"
        },
        "password_hash": {
          "bsonType": ["string", "null"],
          "description": "Hash seguro da senha do usuário"
        },
        "idOrganizacao": { 
          "bsonType": "objectId",
          "description": "Referência à organização do usuário"
        },
        "idSetor": {
          "bsonType": ["objectId", "null"],
          "description": "Referência opcional ao setor do usuário"
        },
        "numeroUnidade": {
          "bsonType": ["string", "null"],
          "description": "Número opcional da unidade do usuário"
        },
        "status": { 
          "bsonType": "string", 
          "enum": ["ativo", "inativo", "aguardando_confirmacao"],
          "default": "aguardando_confirmacao",
          "description": "Status atual do usuário no sistema"
        },
        "respondido": { 
          "bsonType": "bool",
          "default": false,
          "description": "Indica se o usuário já respondeu ao questionário"
        },
        "anonId": { 
          "bsonType": "string",
          "description": "Identificador anônimo para vinculação das respostas"
        },
        "dataCadastro": { 
          "bsonType": "date",
          "description": "Data de cadastro do usuário no sistema",
          "default": { "$date": new Date().toISOString() }
        },
        "ultimoAcesso": {
          "bsonType": ["date", "null"],
          "description": "Data do último acesso do usuário"
        },
        "metadata": {
          "bsonType": "object",
          "additionalProperties": true,
          "description": "Metadados adicionais do usuário"
        }
      },
      "additionalProperties": false,
      "required": ["telefone", "idOrganizacao", "anonId", "status"]
    }
  },
  "validationLevel": "moderate",
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
        "idQuestionario": { 
          "bsonType": "objectId",
          "description": "Referência ao questionário ao qual a pergunta pertence"
        },
        "dominio": { 
          "bsonType": "string",
          "description": "Domínio da pergunta (ex: 'Demandas Psicológicas')"
        },
        "dimensao": { 
          "bsonType": "string",
          "description": "Dimensão específica dentro do domínio"
        },
        "idPergunta": { 
          "bsonType": "string",
          "description": "Identificador único da pergunta no questionário"
        },
        "texto": { 
          "bsonType": "string",
          "description": "Texto completo da pergunta"
        },
        "tipo": { 
          "bsonType": "string",
          "enum": ["escala_likert", "multipla_escolha", "texto"],
          "description": "Tipo da pergunta"
        },
        "sinal": { 
          "bsonType": "string", 
          "enum": ["risco", "protecao"],
          "description": "Indica se a pergunta mede risco ou proteção"
        },
        "itemInvertido": { 
          "bsonType": "bool",
          "description": "Indica se o item deve ser invertido no cálculo do escore"
        },
        "escala": { 
          "bsonType": "int", 
          "minimum": 1,
          "maximum": 5,
          "description": "Número de opções da escala (ex: 5 para escala de 1 a 5)"
        },
        "ativo": {
          "bsonType": "bool",
          "description": "Indica se a pergunta está ativa e deve ser exibida",
          "default": true
        },
        "multipla": {
        "bsonType": "bool",
        "description": "Se true, permite múltiplas alternativas (ex: 1,3,5)",
        "default": false
        },
        "ordem": {
          "bsonType": "int",
          "minimum": 1,
          "description": "Ordem de exibição da pergunta no questionário",
          "default": 1
        }
      },
      "additionalProperties": false,
      "required": ["idQuestionario", "idPergunta", "texto", "tipo", "escala", "ordem"]
    }
  },
  "validationLevel": "moderate",
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
              "valor": {
                "description": "Resposta numérica (0 a 5) ou múltiplas respostas (ex: [1,3,5]).",
                "oneOf": [
                  { "bsonType": "int", "minimum": 0, "maximum": 5 },
                  { "bsonType": "array", "items": { "bsonType": "int", "minimum": 0, "maximum": 5 } }
                ]
              },
              "valorTexto": {
                "bsonType": "string",
                "description": "Resposta de texto livre para perguntas abertas."
              },
              "idPergunta": { "bsonType": "string" }
            },
            "additionalProperties": false,
            "required": ["idPergunta"],
            "oneOf": [
              { "required": ["valor"] },
              { "required": ["valorTexto"] }
            ]
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
        "anonId": { 
          "bsonType": "string",
          "description": "ID anônimo do respondente"
        },
        "idQuestionario": { 
          "bsonType": "objectId",
          "description": "Referência ao questionário respondido"
        },
        "resultadoGlobal": { 
          "bsonType": "string",
          "description": "Classificação geral do diagnóstico (ex: 'Baixo Risco', 'Médio Risco', 'Alto Risco')"
        },
        "pontuacaoGlobal": {
          "bsonType": "double",
          "minimum": 0,
          "maximum": 100,
          "description": "Pontuação global do questionário (0-100)"
        },
        "dimensoes": { 
          "bsonType": "array", 
          "items": {
            "bsonType": "object",
            "properties": {
              "dominio": { "bsonType": "string" },
              "dimensao": { "bsonType": "string" },
              "pontuacao": { "bsonType": "double" },
              "classificacao": { "bsonType": "string" },
              "itens": {
                "bsonType": "array",
                "items": {
                  "bsonType": "object",
                  "properties": {
                    "idPergunta": { "bsonType": "string" },
                    "resposta": { "bsonType": ["int", "string"] },
                    "peso": { "bsonType": "int" }
                  },
                  "required": ["idPergunta", "resposta"]
                }
              }
            },
            "required": ["dominio", "dimensao", "pontuacao", "classificacao"]
          }
        },
        "dataAnalise": { 
          "bsonType": "date",
          "description": "Data em que a análise foi realizada"
        },
        "dataCriacao": {
          "bsonType": "date",
          "description": "Data de criação do registro",
          "default": { "$date": new Date().toISOString() }
        },
        "atualizadoEm": {
          "bsonType": "date",
          "description": "Data da última atualização",
          "default": { "$date": new Date().toISOString() }
        }
      },
      "additionalProperties": false,
      "required": ["anonId", "idQuestionario", "resultadoGlobal", "dataAnalise"]
    }
  },
  "validationLevel": "moderate",
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

// Adicione as seguintes linhas após a linha 421
print("\n=== Iniciando configuração pós-criação ===");

// Cria os índices necessários
print("\nConfigurando índices...");
ensureIndexes();

// Ativa a validação estrita (modo produção)
print("\nAtivando validação estrita...");
// Descomente a linha abaixo para ativar a validação estrita em produção
// enableStrictValidation();

print("\n=== Configuração concluída com sucesso! ===\n");

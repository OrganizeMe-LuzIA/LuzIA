/*
 * Migração COPSOQ_CURTA_BR v2 -> v3
 *
 * Objetivos:
 * 1) Gerar backup dos documentos impactados.
 * 2) Atualizar metadados do questionário para versão 3.0.
 * 3) Registrar versão do questionário em respostas/diagnósticos/relatórios
 *    para manter rastreabilidade histórica.
 *
 * Uso:
 *   mongosh LuzIA < migration_copsoq_v2_to_v3.js
 */

const CODIGO_QUESTIONARIO = "COPSOQ_CURTA_BR";
const VERSAO_ORIGEM = "2.0";
const VERSAO_DESTINO = "3.0";
const DATA_MIGRACAO = new Date();

const questionario = db.questionarios.findOne({ codigo: CODIGO_QUESTIONARIO });

if (!questionario) {
  print(`❌ Questionário ${CODIGO_QUESTIONARIO} não encontrado.`);
  quit(1);
}

if (questionario.versao === VERSAO_DESTINO) {
  print(`ℹ️ ${CODIGO_QUESTIONARIO} já está na versão ${VERSAO_DESTINO}. Nenhuma ação necessária.`);
  quit(0);
}

if (questionario.versao !== VERSAO_ORIGEM) {
  print(
    `❌ Versão inesperada para migração. Esperado ${VERSAO_ORIGEM}, encontrado ${questionario.versao}.`
  );
  quit(1);
}

const perguntas = db.perguntas.find({ idQuestionario: questionario._id }).toArray();
const respostas = db.respostas.find({ idQuestionario: questionario._id }).toArray();
const diagnosticos = db.diagnosticos.find({ idQuestionario: questionario._id }).toArray();
const relatorios = db.relatorios.find({ idQuestionario: questionario._id }).toArray();

// Backup versionado para permitir rollback manual auditável.
db.backup_copsoq_v2_to_v3.insertOne({
  codigoQuestionario: CODIGO_QUESTIONARIO,
  versaoOrigem: VERSAO_ORIGEM,
  versaoDestino: VERSAO_DESTINO,
  dataMigracao: DATA_MIGRACAO,
  questionario,
  perguntas,
  respostas,
  diagnosticos,
  relatorios,
});

const perguntaTextoLivre = {
  idQuestionario: questionario._id,
  codigoDominio: "OBS",
  dominio: "Observações finais",
  dimensao: "Relato livre",
  idPergunta: "OBS_TL_01",
  ordem: 41,
  texto: "Não há mais perguntas. Nesta página você pode escrever mais sobre as suas condições de trabalho, estresse, saúde, etc.",
  tipoEscala: "texto_livre",
  sinal: "risco",
  itemInvertido: false,
  opcoesResposta: null,
  subPergunta: null,
  ativo: true,
};

const perguntaExistente = db.perguntas.findOne({
  idQuestionario: questionario._id,
  idPergunta: "OBS_TL_01",
});
if (!perguntaExistente) {
  db.perguntas.insertOne(perguntaTextoLivre);
}

const totalPerguntas = db.perguntas.countDocuments({ idQuestionario: questionario._id });

db.questionarios.updateOne(
  { _id: questionario._id },
  {
    $set: {
      versao: VERSAO_DESTINO,
      totalPerguntas: totalPerguntas,
      dataAtualizacao: DATA_MIGRACAO,
      metodoPontuacao: "faixas_soma_copsoq_curta_br_pdf2",
      escalasPossiveis: [
        "frequencia",
        "intensidade",
        "satisfacao",
        "conflito_tf",
        "saude_geral",
        "comportamento_ofensivo",
        "texto_livre",
      ],
    },
    $push: {
      historicoVersoes: {
        de: VERSAO_ORIGEM,
        para: VERSAO_DESTINO,
        data: DATA_MIGRACAO,
      },
    },
    $addToSet: {
      dominios: {
        codigo: "OBS",
        nome: "Observações finais",
        ordem: 8,
      },
    },
  }
);

// Rastreabilidade: grava a versão do questionário no momento da migração.
db.respostas.updateMany(
  { idQuestionario: questionario._id, questionarioVersao: { $exists: false } },
  { $set: { questionarioVersao: VERSAO_ORIGEM } }
);
db.diagnosticos.updateMany(
  { idQuestionario: questionario._id, questionarioVersao: { $exists: false } },
  { $set: { questionarioVersao: VERSAO_ORIGEM } }
);
db.relatorios.updateMany(
  { idQuestionario: questionario._id, questionarioVersao: { $exists: false } },
  { $set: { questionarioVersao: VERSAO_ORIGEM } }
);

print(`✅ Migração concluída para ${CODIGO_QUESTIONARIO}: ${VERSAO_ORIGEM} -> ${VERSAO_DESTINO}`);
print(`Backup salvo em backup_copsoq_v2_to_v3 na data ${DATA_MIGRACAO.toISOString()}`);
print(`Perguntas vinculadas ao questionário: ${totalPerguntas}`);

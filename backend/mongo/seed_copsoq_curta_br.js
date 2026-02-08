/*
 * COPSOQ II - Versão Curta Brasileira
 * 
 * Script de seed para MongoDB
 * Referência: Gonçalves, Moriguchi, Chaves & Sato (2021)
 * Atualização: baseline v3.0 com estrutura vigente no repositório.
 * 
 * Uso: mongosh LuzIA < seed_copsoq_curta_br.js
 */

// Limpar dados anteriores se existirem
db.questionarios.deleteOne({ codigo: "COPSOQ_CURTA_BR" });

// =============================================================================
// Inserir Questionário
// =============================================================================

const questionarioCurtaBR = db.questionarios.insertOne({
    nome: "COPSOQ II - Versão Curta Brasileira",
    codigo: "COPSOQ_CURTA_BR",
    versao: "3.0",
    tipo: "psicossocial",
    idioma: "pt-BR",
    descricao: "Copenhagen Psychosocial Questionnaire II - Versão Curta validada para o Brasil (Gonçalves, Moriguchi, Chaves & Sato, 2021). Estrutura vigente no sistema: 40 itens fechados + 1 item de texto livre, 8 domínios e 24 dimensões.",
    dominios: [
        { codigo: "EL", nome: "Exigências Laborais", ordem: 1 },
        { codigo: "OTC", nome: "Organização do Trabalho e Conteúdo", ordem: 2 },
        { codigo: "RSL", nome: "Relações Sociais e Liderança", ordem: 3 },
        { codigo: "ITI", nome: "Interface Trabalho-Indivíduo", ordem: 4 },
        { codigo: "VLT", nome: "Valores no Local de Trabalho", ordem: 5 },
        { codigo: "SBE", nome: "Saúde e Bem-Estar", ordem: 6 },
        { codigo: "CO", nome: "Comportamentos Ofensivos", ordem: 7 },
        { codigo: "OBS", nome: "Observações finais", ordem: 8 }
    ],
    escalasPossiveis: ["frequencia", "intensidade", "satisfacao", "conflito_tf", "saude_geral", "comportamento_ofensivo", "texto_livre"],
    totalPerguntas: 41,
    ativo: true,
    dataCriacao: new Date()
});

const idQuestionario = questionarioCurtaBR.insertedId;
print("Questionário inserido com ID: " + idQuestionario);

// =============================================================================
// Opções de Resposta por Tipo de Escala
// =============================================================================

const escalaFrequencia = [
    { valor: 4, texto: "Sempre" },
    { valor: 3, texto: "Frequentemente" },
    { valor: 2, texto: "Às vezes" },
    { valor: 1, texto: "Raramente" },
    { valor: 0, texto: "Nunca" }
];

const escalaFrequenciaInvertida = [
    { valor: 0, texto: "Sempre" },
    { valor: 1, texto: "Frequentemente" },
    { valor: 2, texto: "Às vezes" },
    { valor: 3, texto: "Raramente" },
    { valor: 4, texto: "Nunca" }
];

const escalaIntensidade = [
    { valor: 4, texto: "Em grande parte" },
    { valor: 3, texto: "Em boa parte" },
    { valor: 2, texto: "De certa forma" },
    { valor: 1, texto: "Pouco" },
    { valor: 0, texto: "Muito pouco" }
];

const escalaSatisfacao = [
    { valor: 3, texto: "Muito satisfeito" },
    { valor: 2, texto: "Satisfeito" },
    { valor: 1, texto: "Insatisfeito" },
    { valor: 0, texto: "Muito insatisfeito" }
];

const escalaConflitoTF = [
    { valor: 3, texto: "Sim, com certeza" },
    { valor: 2, texto: "Sim, até certo ponto" },
    { valor: 1, texto: "Sim, mas muito pouco" },
    { valor: 0, texto: "Não, realmente não" }
];

const escalaSaudeGeral = [
    { valor: 4, texto: "Excelente" },
    { valor: 3, texto: "Muito boa" },
    { valor: 2, texto: "Boa" },
    { valor: 1, texto: "Razoável" },
    { valor: 0, texto: "Ruim" }
];

const escalaComportamentoOfensivo = [
    { valor: 4, texto: "Sim, diariamente" },
    { valor: 3, texto: "Sim, semanalmente" },
    { valor: 2, texto: "Sim, mensalmente" },
    { valor: 1, texto: "Sim, poucas vezes" },
    { valor: 0, texto: "Não" }
];

const subPerguntaAgressor = {
    condicao: "valor > 0",
    texto: "Se sim, de quem?",
    tipoResposta: "multipla_escolha",
    opcoes: ["Colegas", "Gerente, supervisor", "Subordinados", "Clientes, fregueses, pacientes"]
};

// =============================================================================
// Perguntas
// =============================================================================

const perguntas = [
    // EL - Exigências Laborais (6 itens)
    {
        codigoDominio: "EL", dominio: "Exigências Laborais", dimensao: "Exigências quantitativas",
        idPergunta: "EL_EQ_01A", ordem: 1,
        texto: "Você atrasa a entrega do seu trabalho?",
        tipoEscala: "frequencia", sinal: "risco", opcoesResposta: escalaFrequencia
    },
    {
        codigoDominio: "EL", dominio: "Exigências Laborais", dimensao: "Exigências quantitativas",
        idPergunta: "EL_EQ_01B", ordem: 2,
        texto: "O tempo para realizar as suas tarefas no trabalho é suficiente?",
        tipoEscala: "frequencia_inv", sinal: "protecao", opcoesResposta: escalaFrequenciaInvertida
    },
    {
        codigoDominio: "EL", dominio: "Exigências Laborais", dimensao: "Ritmo de trabalho",
        idPergunta: "EL_RT_01A", ordem: 3,
        texto: "É necessário manter um ritmo acelerado no trabalho?",
        tipoEscala: "frequencia", sinal: "risco", opcoesResposta: escalaFrequencia
    },
    {
        codigoDominio: "EL", dominio: "Exigências Laborais", dimensao: "Ritmo de trabalho",
        idPergunta: "EL_RT_01B", ordem: 4,
        texto: "Você trabalha em ritmo acelerado ao longo de toda jornada?",
        tipoEscala: "frequencia", sinal: "risco", opcoesResposta: escalaFrequencia
    },
    {
        codigoDominio: "EL", dominio: "Exigências Laborais", dimensao: "Exigências emocionais",
        idPergunta: "EL_EE_01A", ordem: 5,
        texto: "Seu trabalho coloca você em situações emocionalmente desgastantes?",
        tipoEscala: "frequencia", sinal: "risco", opcoesResposta: escalaFrequencia
    },
    {
        codigoDominio: "EL", dominio: "Exigências Laborais", dimensao: "Exigências emocionais",
        idPergunta: "EL_EE_01B", ordem: 6,
        texto: "Você tem que lidar com os problemas pessoais de outras pessoas como parte do seu trabalho?",
        tipoEscala: "frequencia", sinal: "risco", opcoesResposta: escalaFrequencia
    },

    // OTC - Organização do Trabalho e Conteúdo (8 itens)
    {
        codigoDominio: "OTC", dominio: "Organização do Trabalho e Conteúdo", dimensao: "Influência no trabalho",
        idPergunta: "OTC_IT_01A", ordem: 7,
        texto: "Você tem um alto grau de influência nas decisões sobre o seu trabalho?",
        tipoEscala: "frequencia", sinal: "protecao", opcoesResposta: escalaFrequencia
    },
    {
        codigoDominio: "OTC", dominio: "Organização do Trabalho e Conteúdo", dimensao: "Influência no trabalho",
        idPergunta: "OTC_IT_01B", ordem: 8,
        texto: "Você pode interferir na quantidade de trabalho atribuída a você?",
        tipoEscala: "frequencia", sinal: "protecao", opcoesResposta: escalaFrequencia
    },
    {
        codigoDominio: "OTC", dominio: "Organização do Trabalho e Conteúdo", dimensao: "Possibilidades de desenvolvimento",
        idPergunta: "OTC_PD_01A", ordem: 9,
        texto: "Você tem a possibilidade de aprender coisas novas através do seu trabalho?",
        tipoEscala: "intensidade", sinal: "protecao", opcoesResposta: escalaIntensidade
    },
    {
        codigoDominio: "OTC", dominio: "Organização do Trabalho e Conteúdo", dimensao: "Possibilidades de desenvolvimento",
        idPergunta: "OTC_PD_01B", ordem: 10,
        texto: "Seu trabalho exige que você tome iniciativas?",
        tipoEscala: "intensidade", sinal: "protecao", opcoesResposta: escalaIntensidade
    },
    {
        codigoDominio: "OTC", dominio: "Organização do Trabalho e Conteúdo", dimensao: "Significado do trabalho",
        idPergunta: "OTC_ST_01A", ordem: 11,
        texto: "Seu trabalho é significativo?",
        tipoEscala: "intensidade", sinal: "protecao", opcoesResposta: escalaIntensidade
    },
    {
        codigoDominio: "OTC", dominio: "Organização do Trabalho e Conteúdo", dimensao: "Significado do trabalho",
        idPergunta: "OTC_ST_01B", ordem: 12,
        texto: "Você sente que o trabalho que faz é importante?",
        tipoEscala: "intensidade", sinal: "protecao", opcoesResposta: escalaIntensidade
    },
    {
        codigoDominio: "OTC", dominio: "Organização do Trabalho e Conteúdo", dimensao: "Compromisso com local de trabalho",
        idPergunta: "OTC_CLT_01A", ordem: 13,
        texto: "Você sente que o seu local de trabalho é muito importante para você?",
        tipoEscala: "intensidade", sinal: "protecao", opcoesResposta: escalaIntensidade
    },
    {
        codigoDominio: "OTC", dominio: "Organização do Trabalho e Conteúdo", dimensao: "Compromisso com local de trabalho",
        idPergunta: "OTC_CLT_01B", ordem: 14,
        texto: "Você recomendaria a um amigo que se candidatasse a uma vaga no seu local de trabalho?",
        tipoEscala: "intensidade", sinal: "protecao", opcoesResposta: escalaIntensidade
    },

    // RSL - Relações Sociais e Liderança (10 itens)
    {
        codigoDominio: "RSL", dominio: "Relações Sociais e Liderança", dimensao: "Previsibilidade",
        idPergunta: "RSL_PR_01A", ordem: 15,
        texto: "No seu local de trabalho, você é informado antecipadamente sobre decisões importantes, mudanças ou planos para o futuro?",
        tipoEscala: "intensidade", sinal: "protecao", opcoesResposta: escalaIntensidade
    },
    {
        codigoDominio: "RSL", dominio: "Relações Sociais e Liderança", dimensao: "Previsibilidade",
        idPergunta: "RSL_PR_01B", ordem: 16,
        texto: "Você recebe toda a informação necessária para fazer bem o seu trabalho?",
        tipoEscala: "intensidade", sinal: "protecao", opcoesResposta: escalaIntensidade
    },
    {
        codigoDominio: "RSL", dominio: "Relações Sociais e Liderança", dimensao: "Recompensas",
        idPergunta: "RSL_RE_01A", ordem: 17,
        texto: "O seu trabalho é reconhecido e valorizado pelos seus superiores?",
        tipoEscala: "intensidade", sinal: "protecao", opcoesResposta: escalaIntensidade
    },
    {
        codigoDominio: "RSL", dominio: "Relações Sociais e Liderança", dimensao: "Recompensas",
        idPergunta: "RSL_RE_01B", ordem: 18,
        texto: "Você é tratado de forma justa no seu local de trabalho?",
        tipoEscala: "intensidade", sinal: "protecao", opcoesResposta: escalaIntensidade
    },
    {
        codigoDominio: "RSL", dominio: "Relações Sociais e Liderança", dimensao: "Transparência do papel",
        idPergunta: "RSL_TP_01A", ordem: 19,
        texto: "O seu trabalho tem objetivos/metas claros(as)?",
        tipoEscala: "intensidade", sinal: "protecao", opcoesResposta: escalaIntensidade
    },
    {
        codigoDominio: "RSL", dominio: "Relações Sociais e Liderança", dimensao: "Transparência do papel",
        idPergunta: "RSL_TP_01B", ordem: 20,
        texto: "Você sabe exatamente o que se espera de você no trabalho?",
        tipoEscala: "intensidade", sinal: "protecao", opcoesResposta: escalaIntensidade
    },
    {
        codigoDominio: "RSL", dominio: "Relações Sociais e Liderança", dimensao: "Qualidade da liderança",
        idPergunta: "RSL_QL_01A", ordem: 21,
        texto: "Você diria que o seu superior imediato dá alta prioridade para a satisfação com trabalho?",
        tipoEscala: "intensidade", sinal: "protecao", opcoesResposta: escalaIntensidade
    },
    {
        codigoDominio: "RSL", dominio: "Relações Sociais e Liderança", dimensao: "Qualidade da liderança",
        idPergunta: "RSL_QL_01B", ordem: 22,
        texto: "Você diria que o seu superior imediato é bom no planejamento do trabalho?",
        tipoEscala: "intensidade", sinal: "protecao", opcoesResposta: escalaIntensidade
    },
    {
        codigoDominio: "RSL", dominio: "Relações Sociais e Liderança", dimensao: "Apoio social de superiores",
        idPergunta: "RSL_ASS_01A", ordem: 23,
        texto: "Com que frequência o seu superior imediato está disposto a ouvir os seus problemas no trabalho?",
        tipoEscala: "frequencia", sinal: "protecao", opcoesResposta: escalaFrequencia
    },
    {
        codigoDominio: "RSL", dominio: "Relações Sociais e Liderança", dimensao: "Apoio social de superiores",
        idPergunta: "RSL_ASS_01B", ordem: 24,
        texto: "Com que frequência você recebe ajuda e suporte do seu superior imediato?",
        tipoEscala: "frequencia", sinal: "protecao", opcoesResposta: escalaFrequencia
    },

    // ITI - Interface Trabalho-Indivíduo (3 itens)
    {
        codigoDominio: "ITI", dominio: "Interface Trabalho-Indivíduo", dimensao: "Satisfação no trabalho",
        idPergunta: "ITI_ST_01", ordem: 25,
        texto: "Qual o seu nível de satisfação com o seu trabalho como um todo, considerando todos os aspectos?",
        tipoEscala: "satisfacao", sinal: "protecao", opcoesResposta: escalaSatisfacao
    },
    {
        codigoDominio: "ITI", dominio: "Interface Trabalho-Indivíduo", dimensao: "Conflito trabalho-família",
        idPergunta: "ITI_CTF_01A", ordem: 26,
        texto: "Você sente que o seu trabalho consome tanto sua energia que ele tem um efeito negativo na sua vida particular?",
        tipoEscala: "conflito_tf", sinal: "risco", opcoesResposta: escalaConflitoTF
    },
    {
        codigoDominio: "ITI", dominio: "Interface Trabalho-Indivíduo", dimensao: "Conflito trabalho-família",
        idPergunta: "ITI_CTF_01B", ordem: 27,
        texto: "Você sente que o seu trabalho ocupa tanto tempo que ele tem um efeito negativo na sua vida particular?",
        tipoEscala: "conflito_tf", sinal: "risco", opcoesResposta: escalaConflitoTF
    },

    // VLT - Valores no Local de Trabalho (4 itens)
    {
        codigoDominio: "VLT", dominio: "Valores no Local de Trabalho", dimensao: "Confiança vertical",
        idPergunta: "VLT_CV_01A", ordem: 28,
        texto: "Você pode confiar nas informações que vêm dos seus superiores?",
        tipoEscala: "intensidade", sinal: "protecao", opcoesResposta: escalaIntensidade
    },
    {
        codigoDominio: "VLT", dominio: "Valores no Local de Trabalho", dimensao: "Confiança vertical",
        idPergunta: "VLT_CV_01B", ordem: 29,
        texto: "Os seus superiores confiam que os funcionários farão bem seu trabalho?",
        tipoEscala: "intensidade", sinal: "protecao", opcoesResposta: escalaIntensidade
    },
    {
        codigoDominio: "VLT", dominio: "Valores no Local de Trabalho", dimensao: "Justiça e respeito",
        idPergunta: "VLT_JR_01A", ordem: 30,
        texto: "Os conflitos são resolvidos de forma justa?",
        tipoEscala: "intensidade", sinal: "protecao", opcoesResposta: escalaIntensidade
    },
    {
        codigoDominio: "VLT", dominio: "Valores no Local de Trabalho", dimensao: "Justiça e respeito",
        idPergunta: "VLT_JR_01B", ordem: 31,
        texto: "O trabalho é distribuído de forma justa?",
        tipoEscala: "intensidade", sinal: "protecao", opcoesResposta: escalaIntensidade
    },

    // SBE - Saúde e Bem-Estar (5 itens)
    {
        codigoDominio: "SBE", dominio: "Saúde e Bem-Estar", dimensao: "Saúde geral",
        idPergunta: "SBE_SG_01", ordem: 32,
        texto: "Em geral, você diria que a sua saúde é:",
        tipoEscala: "saude_geral", sinal: "protecao", opcoesResposta: escalaSaudeGeral
    },
    {
        codigoDominio: "SBE", dominio: "Saúde e Bem-Estar", dimensao: "Burnout",
        idPergunta: "SBE_BO_01A", ordem: 33,
        texto: "Com que frequência você tem se sentido fisicamente esgotado?",
        tipoEscala: "frequencia", sinal: "risco", opcoesResposta: escalaFrequencia
    },
    {
        codigoDominio: "SBE", dominio: "Saúde e Bem-Estar", dimensao: "Burnout",
        idPergunta: "SBE_BO_01B", ordem: 34,
        texto: "Com que frequência você tem se sentido emocionalmente esgotado?",
        tipoEscala: "frequencia", sinal: "risco", opcoesResposta: escalaFrequencia
    },
    {
        codigoDominio: "SBE", dominio: "Saúde e Bem-Estar", dimensao: "Stress",
        idPergunta: "SBE_ST_01A", ordem: 35,
        texto: "Com que frequência você tem se sentido estressado?",
        tipoEscala: "frequencia", sinal: "risco", opcoesResposta: escalaFrequencia
    },
    {
        codigoDominio: "SBE", dominio: "Saúde e Bem-Estar", dimensao: "Stress",
        idPergunta: "SBE_ST_01B", ordem: 36,
        texto: "Com que frequência você tem se sentido irritado?",
        tipoEscala: "frequencia", sinal: "risco", opcoesResposta: escalaFrequencia
    },

    // CO - Comportamentos Ofensivos (4 itens)
    {
        codigoDominio: "CO", dominio: "Comportamentos Ofensivos", dimensao: "Atenção sexual indesejada",
        idPergunta: "CO_ASI_01", ordem: 37,
        texto: "Você foi exposto a atenção sexual indesejada no seu local de trabalho durante os últimos 12 meses?",
        tipoEscala: "comportamento_ofensivo", sinal: "risco",
        opcoesResposta: escalaComportamentoOfensivo, subPergunta: subPerguntaAgressor
    },
    {
        codigoDominio: "CO", dominio: "Comportamentos Ofensivos", dimensao: "Ameaças de violência",
        idPergunta: "CO_AV_01", ordem: 38,
        texto: "Você foi exposto a ameaças de violência no seu local de trabalho nos últimos 12 meses?",
        tipoEscala: "comportamento_ofensivo", sinal: "risco",
        opcoesResposta: escalaComportamentoOfensivo, subPergunta: subPerguntaAgressor
    },
    {
        codigoDominio: "CO", dominio: "Comportamentos Ofensivos", dimensao: "Violência física",
        idPergunta: "CO_VF_01", ordem: 39,
        texto: "Você foi exposto a violência física em seu local de trabalho durante os últimos 12 meses?",
        tipoEscala: "comportamento_ofensivo", sinal: "risco",
        opcoesResposta: escalaComportamentoOfensivo, subPergunta: subPerguntaAgressor
    },
    {
        codigoDominio: "CO", dominio: "Comportamentos Ofensivos", dimensao: "Bullying",
        idPergunta: "CO_BU_01", ordem: 40,
        texto: "Você foi exposto a \"bullying\" no seu local de trabalho nos últimos 12 meses?",
        tipoEscala: "comportamento_ofensivo", sinal: "risco",
        opcoesResposta: escalaComportamentoOfensivo, subPergunta: subPerguntaAgressor
    },
    {
        codigoDominio: "OBS", dominio: "Observações finais", dimensao: "Relato livre",
        idPergunta: "OBS_TL_01", ordem: 41,
        texto: "Não há mais perguntas. Nesta página você pode escrever mais sobre as suas condições de trabalho, estresse, saúde, etc.",
        tipoEscala: "texto_livre", sinal: "risco", opcoesResposta: null
    }
];

// Adicionar campos comuns e inserir
perguntas.forEach(p => {
    p.idQuestionario = idQuestionario;
    p.itemInvertido = false;
    p.ativo = true;
    if (!p.subPergunta) {
        p.subPergunta = null;
    }
});

// Remover perguntas anteriores do mesmo questionário
db.perguntas.deleteMany({ idQuestionario: idQuestionario });

// Inserir todas as perguntas
const resultado = db.perguntas.insertMany(perguntas);
print("Inseridas " + resultado.insertedIds.length + " perguntas");

// Validação
const totalInserido = db.perguntas.countDocuments({ idQuestionario: idQuestionario });
const totalEsperado = perguntas.length;
print("Total de perguntas no banco: " + totalInserido + "/" + totalEsperado);

if (totalInserido === totalEsperado) {
    print("✅ Seed COPSOQ II Versão Curta Brasileira concluído com sucesso!");
} else {
    print("❌ ERRO: Esperado " + totalEsperado + " perguntas, encontradas " + totalInserido);
}

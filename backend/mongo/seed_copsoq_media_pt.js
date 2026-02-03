/*
 * COPSOQ II - Versão Média Portuguesa (76 perguntas)
 * 
 * Script de seed para MongoDB
 * Referência: COPSOQ II Versão Portuguesa - Manual de utilização
 * 
 * Uso: mongosh LuzIA < seed_copsoq_media_pt.js
 */

// Limpar dados anteriores se existirem
db.questionarios.deleteOne({ codigo: "COPSOQ_MEDIA_PT" });

// =============================================================================
// Inserir Questionário
// =============================================================================

const questionarioMediaPT = db.questionarios.insertOne({
    nome: "COPSOQ II - Versão Média Portuguesa",
    codigo: "COPSOQ_MEDIA_PT",
    versao: "2.0",
    tipo: "psicossocial",
    idioma: "pt-PT",
    descricao: "Copenhagen Psychosocial Questionnaire II - Versão Média Portuguesa. 76 perguntas distribuídas em 8 domínios e 29 dimensões.",
    dominios: [
        { codigo: "EL", nome: "Exigências Laborais", ordem: 1 },
        { codigo: "OTC", nome: "Organização do Trabalho e Conteúdo", ordem: 2 },
        { codigo: "RSL", nome: "Relações Sociais e Liderança", ordem: 3 },
        { codigo: "ITI", nome: "Interface Trabalho-Indivíduo", ordem: 4 },
        { codigo: "VLT", nome: "Valores no Local de Trabalho", ordem: 5 },
        { codigo: "PER", nome: "Personalidade", ordem: 6 },
        { codigo: "SBE", nome: "Saúde e Bem-Estar", ordem: 7 },
        { codigo: "CO", nome: "Comportamentos Ofensivos", ordem: 8 }
    ],
    escalasPossiveis: ["frequencia", "intensidade", "comportamento_ofensivo"],
    totalPerguntas: 76,
    ativo: true,
    dataCriacao: new Date()
});

const idQuestionario = questionarioMediaPT.insertedId;
print("Questionário inserido com ID: " + idQuestionario);

// =============================================================================
// Opções de Resposta por Tipo de Escala
// =============================================================================

const escalaFrequencia = [
    { valor: 5, texto: "Sempre" },
    { valor: 4, texto: "Frequentemente" },
    { valor: 3, texto: "Às vezes" },
    { valor: 2, texto: "Raramente" },
    { valor: 1, texto: "Nunca/quase nunca" }
];

const escalaIntensidade = [
    { valor: 5, texto: "Extremamente" },
    { valor: 4, texto: "Muito" },
    { valor: 3, texto: "De certa forma" },
    { valor: 2, texto: "Pouco" },
    { valor: 1, texto: "Nada/quase nada" }
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
    opcoes: ["Colegas", "Chefia", "Subordinados", "Clientes/pacientes"]
};

// =============================================================================
// Perguntas
// =============================================================================

const perguntas = [
    // EL - Exigências Laborais (8 itens)
    { codigoDominio: "EL", dominio: "Exigências Laborais", dimensao: "Exigências quantitativas", idPergunta: "EL_EQ_01", ordem: 1, texto: "A sua carga de trabalho acumula-se por ser mal distribuída?", tipoEscala: "frequencia", sinal: "risco", opcoesResposta: escalaFrequencia },
    { codigoDominio: "EL", dominio: "Exigências Laborais", dimensao: "Exigências quantitativas", idPergunta: "EL_EQ_02", ordem: 2, texto: "Com que frequência não tem tempo para completar todas as tarefas?", tipoEscala: "frequencia", sinal: "risco", opcoesResposta: escalaFrequencia },
    { codigoDominio: "EL", dominio: "Exigências Laborais", dimensao: "Exigências quantitativas", idPergunta: "EL_EQ_03", ordem: 3, texto: "Precisa fazer horas extra?", tipoEscala: "frequencia", sinal: "risco", opcoesResposta: escalaFrequencia },
    { codigoDominio: "EL", dominio: "Exigências Laborais", dimensao: "Ritmo de trabalho", idPergunta: "EL_RT_01", ordem: 4, texto: "Precisa trabalhar muito rapidamente?", tipoEscala: "frequencia", sinal: "risco", opcoesResposta: escalaFrequencia },
    { codigoDominio: "EL", dominio: "Exigências Laborais", dimensao: "Exigências cognitivas", idPergunta: "EL_EC_01", ordem: 5, texto: "O seu trabalho exige a sua atenção constante?", tipoEscala: "frequencia", sinal: "risco", opcoesResposta: escalaFrequencia },
    { codigoDominio: "EL", dominio: "Exigências Laborais", dimensao: "Exigências cognitivas", idPergunta: "EL_EC_02", ordem: 6, texto: "O seu trabalho requer que tome decisões difíceis?", tipoEscala: "frequencia", sinal: "risco", opcoesResposta: escalaFrequencia },
    { codigoDominio: "EL", dominio: "Exigências Laborais", dimensao: "Exigências cognitivas", idPergunta: "EL_EC_03", ordem: 7, texto: "O seu trabalho requer que seja bom a propor novas ideias?", tipoEscala: "frequencia", sinal: "risco", opcoesResposta: escalaFrequencia },
    { codigoDominio: "EL", dominio: "Exigências Laborais", dimensao: "Exigências emocionais", idPergunta: "EL_EE_01", ordem: 8, texto: "O seu trabalho é emocionalmente exigente?", tipoEscala: "frequencia", sinal: "risco", opcoesResposta: escalaFrequencia },

    // OTC - Organização do Trabalho e Conteúdo (12 itens)
    { codigoDominio: "OTC", dominio: "Organização do Trabalho e Conteúdo", dimensao: "Influência no trabalho", idPergunta: "OTC_IT_01", ordem: 9, texto: "Tem influência sobre a quantidade de trabalho que lhe compete?", tipoEscala: "frequencia", sinal: "protecao", opcoesResposta: escalaFrequencia },
    { codigoDominio: "OTC", dominio: "Organização do Trabalho e Conteúdo", dimensao: "Influência no trabalho", idPergunta: "OTC_IT_02", ordem: 10, texto: "Tem influência sobre o tipo de tarefas que faz?", tipoEscala: "frequencia", sinal: "protecao", opcoesResposta: escalaFrequencia },
    { codigoDominio: "OTC", dominio: "Organização do Trabalho e Conteúdo", dimensao: "Influência no trabalho", idPergunta: "OTC_IT_03", ordem: 11, texto: "Tem influência sobre a ordem de realização das tarefas?", tipoEscala: "frequencia", sinal: "protecao", opcoesResposta: escalaFrequencia },
    { codigoDominio: "OTC", dominio: "Organização do Trabalho e Conteúdo", dimensao: "Influência no trabalho", idPergunta: "OTC_IT_04", ordem: 12, texto: "Participa na escolha das pessoas com quem trabalha?", tipoEscala: "frequencia", sinal: "protecao", opcoesResposta: escalaFrequencia },
    { codigoDominio: "OTC", dominio: "Organização do Trabalho e Conteúdo", dimensao: "Possibilidades de desenvolvimento", idPergunta: "OTC_PD_01", ordem: 13, texto: "O seu trabalho exige que tenha iniciativa?", tipoEscala: "frequencia", sinal: "protecao", opcoesResposta: escalaFrequencia },
    { codigoDominio: "OTC", dominio: "Organização do Trabalho e Conteúdo", dimensao: "Possibilidades de desenvolvimento", idPergunta: "OTC_PD_02", ordem: 14, texto: "O seu trabalho permite-lhe aprender coisas novas?", tipoEscala: "frequencia", sinal: "protecao", opcoesResposta: escalaFrequencia },
    { codigoDominio: "OTC", dominio: "Organização do Trabalho e Conteúdo", dimensao: "Possibilidades de desenvolvimento", idPergunta: "OTC_PD_03", ordem: 15, texto: "O seu trabalho permite-lhe usar as suas competências?", tipoEscala: "frequencia", sinal: "protecao", opcoesResposta: escalaFrequencia },
    { codigoDominio: "OTC", dominio: "Organização do Trabalho e Conteúdo", dimensao: "Significado do trabalho", idPergunta: "OTC_ST_01", ordem: 16, texto: "O seu trabalho tem significado para si?", tipoEscala: "intensidade", sinal: "protecao", opcoesResposta: escalaIntensidade },
    { codigoDominio: "OTC", dominio: "Organização do Trabalho e Conteúdo", dimensao: "Significado do trabalho", idPergunta: "OTC_ST_02", ordem: 17, texto: "Sente que o trabalho que faz é importante?", tipoEscala: "intensidade", sinal: "protecao", opcoesResposta: escalaIntensidade },
    { codigoDominio: "OTC", dominio: "Organização do Trabalho e Conteúdo", dimensao: "Significado do trabalho", idPergunta: "OTC_ST_03", ordem: 18, texto: "Sente-se motivado e envolvido no seu trabalho?", tipoEscala: "intensidade", sinal: "protecao", opcoesResposta: escalaIntensidade },
    { codigoDominio: "OTC", dominio: "Organização do Trabalho e Conteúdo", dimensao: "Compromisso com local de trabalho", idPergunta: "OTC_CLT_01", ordem: 19, texto: "Gosta de falar sobre o seu local de trabalho com outras pessoas?", tipoEscala: "intensidade", sinal: "protecao", opcoesResposta: escalaIntensidade },
    { codigoDominio: "OTC", dominio: "Organização do Trabalho e Conteúdo", dimensao: "Compromisso com local de trabalho", idPergunta: "OTC_CLT_02", ordem: 20, texto: "Sente que os problemas do seu local de trabalho são seus também?", tipoEscala: "intensidade", sinal: "protecao", opcoesResposta: escalaIntensidade },

    // RSL - Relações Sociais e Liderança (21 itens)
    { codigoDominio: "RSL", dominio: "Relações Sociais e Liderança", dimensao: "Previsibilidade", idPergunta: "RSL_PR_01", ordem: 21, texto: "É informado com antecedência sobre decisões importantes?", tipoEscala: "frequencia", sinal: "protecao", opcoesResposta: escalaFrequencia },
    { codigoDominio: "RSL", dominio: "Relações Sociais e Liderança", dimensao: "Previsibilidade", idPergunta: "RSL_PR_02", ordem: 22, texto: "Recebe toda a informação de que necessita para fazer bem o trabalho?", tipoEscala: "frequencia", sinal: "protecao", opcoesResposta: escalaFrequencia },
    { codigoDominio: "RSL", dominio: "Relações Sociais e Liderança", dimensao: "Recompensas", idPergunta: "RSL_RE_01", ordem: 23, texto: "O seu trabalho é reconhecido e apreciado pela chefia?", tipoEscala: "frequencia", sinal: "protecao", opcoesResposta: escalaFrequencia },
    { codigoDominio: "RSL", dominio: "Relações Sociais e Liderança", dimensao: "Recompensas", idPergunta: "RSL_RE_02", ordem: 24, texto: "A chefia do seu local de trabalho respeita-o(a)?", tipoEscala: "frequencia", sinal: "protecao", opcoesResposta: escalaFrequencia },
    { codigoDominio: "RSL", dominio: "Relações Sociais e Liderança", dimensao: "Recompensas", idPergunta: "RSL_RE_03", ordem: 25, texto: "É tratado(a) de forma justa no seu local de trabalho?", tipoEscala: "frequencia", sinal: "protecao", opcoesResposta: escalaFrequencia },
    { codigoDominio: "RSL", dominio: "Relações Sociais e Liderança", dimensao: "Transparência do papel", idPergunta: "RSL_TP_01", ordem: 26, texto: "O seu trabalho tem objetivos claros?", tipoEscala: "intensidade", sinal: "protecao", opcoesResposta: escalaIntensidade },
    { codigoDominio: "RSL", dominio: "Relações Sociais e Liderança", dimensao: "Transparência do papel", idPergunta: "RSL_TP_02", ordem: 27, texto: "Sabe exatamente o que é esperado de si no trabalho?", tipoEscala: "intensidade", sinal: "protecao", opcoesResposta: escalaIntensidade },
    { codigoDominio: "RSL", dominio: "Relações Sociais e Liderança", dimensao: "Transparência do papel", idPergunta: "RSL_TP_03", ordem: 28, texto: "Sabe exatamente quais são as suas responsabilidades?", tipoEscala: "intensidade", sinal: "protecao", opcoesResposta: escalaIntensidade },
    { codigoDominio: "RSL", dominio: "Relações Sociais e Liderança", dimensao: "Conflitos de papéis", idPergunta: "RSL_CP_01", ordem: 29, texto: "Faz coisas no trabalho que uns aceitam mas outros não?", tipoEscala: "frequencia", sinal: "risco", opcoesResposta: escalaFrequencia },
    { codigoDominio: "RSL", dominio: "Relações Sociais e Liderança", dimensao: "Conflitos de papéis", idPergunta: "RSL_CP_02", ordem: 30, texto: "Por vezes tem de fazer coisas que deveriam ser feitas de outra forma?", tipoEscala: "frequencia", sinal: "risco", opcoesResposta: escalaFrequencia },
    { codigoDominio: "RSL", dominio: "Relações Sociais e Liderança", dimensao: "Conflitos de papéis", idPergunta: "RSL_CP_03", ordem: 31, texto: "Por vezes tem de fazer coisas que considera desnecessárias?", tipoEscala: "frequencia", sinal: "risco", opcoesResposta: escalaFrequencia },
    { codigoDominio: "RSL", dominio: "Relações Sociais e Liderança", dimensao: "Qualidade da liderança", idPergunta: "RSL_QL_01", ordem: 32, texto: "A sua chefia garante boas oportunidades de desenvolvimento?", tipoEscala: "intensidade", sinal: "protecao", opcoesResposta: escalaIntensidade },
    { codigoDominio: "RSL", dominio: "Relações Sociais e Liderança", dimensao: "Qualidade da liderança", idPergunta: "RSL_QL_02", ordem: 33, texto: "A sua chefia dá prioridade à satisfação no trabalho?", tipoEscala: "intensidade", sinal: "protecao", opcoesResposta: escalaIntensidade },
    { codigoDominio: "RSL", dominio: "Relações Sociais e Liderança", dimensao: "Qualidade da liderança", idPergunta: "RSL_QL_03", ordem: 34, texto: "A sua chefia é boa a planear o trabalho?", tipoEscala: "intensidade", sinal: "protecao", opcoesResposta: escalaIntensidade },
    { codigoDominio: "RSL", dominio: "Relações Sociais e Liderança", dimensao: "Qualidade da liderança", idPergunta: "RSL_QL_04", ordem: 35, texto: "A sua chefia é boa a resolver conflitos?", tipoEscala: "intensidade", sinal: "protecao", opcoesResposta: escalaIntensidade },
    { codigoDominio: "RSL", dominio: "Relações Sociais e Liderança", dimensao: "Apoio social de superiores", idPergunta: "RSL_ASS_01", ordem: 36, texto: "Com que frequência a sua chefia fala consigo sobre o seu trabalho?", tipoEscala: "frequencia", sinal: "protecao", opcoesResposta: escalaFrequencia },
    { codigoDominio: "RSL", dominio: "Relações Sociais e Liderança", dimensao: "Apoio social de superiores", idPergunta: "RSL_ASS_02", ordem: 37, texto: "Com que frequência tem ajuda e apoio da sua chefia?", tipoEscala: "frequencia", sinal: "protecao", opcoesResposta: escalaFrequencia },
    { codigoDominio: "RSL", dominio: "Relações Sociais e Liderança", dimensao: "Apoio social de superiores", idPergunta: "RSL_ASS_03", ordem: 38, texto: "Com que frequência a sua chefia fala sobre o seu desempenho?", tipoEscala: "frequencia", sinal: "protecao", opcoesResposta: escalaFrequencia },
    { codigoDominio: "RSL", dominio: "Relações Sociais e Liderança", dimensao: "Apoio social de colegas", idPergunta: "RSL_ASC_01", ordem: 39, texto: "Com que frequência tem ajuda e apoio dos colegas?", tipoEscala: "frequencia", sinal: "protecao", opcoesResposta: escalaFrequencia },
    { codigoDominio: "RSL", dominio: "Relações Sociais e Liderança", dimensao: "Apoio social de colegas", idPergunta: "RSL_ASC_02", ordem: 40, texto: "Com que frequência os colegas falam consigo sobre o seu desempenho?", tipoEscala: "frequencia", sinal: "protecao", opcoesResposta: escalaFrequencia },
    { codigoDominio: "RSL", dominio: "Relações Sociais e Liderança", dimensao: "Apoio social de colegas", idPergunta: "RSL_ASC_03", ordem: 41, texto: "Com que frequência os colegas estão disponíveis para o/a ouvir?", tipoEscala: "frequencia", sinal: "protecao", opcoesResposta: escalaFrequencia },

    // ITI - Interface Trabalho-Indivíduo (8 itens)
    { codigoDominio: "ITI", dominio: "Interface Trabalho-Indivíduo", dimensao: "Insegurança laboral", idPergunta: "ITI_IL_01", ordem: 42, texto: "Sente-se preocupado(a) em ficar desempregado(a)?", tipoEscala: "intensidade", sinal: "risco", opcoesResposta: escalaIntensidade },
    { codigoDominio: "ITI", dominio: "Interface Trabalho-Indivíduo", dimensao: "Satisfação no trabalho", idPergunta: "ITI_ST_01", ordem: 43, texto: "Em relação ao seu trabalho em geral, quão satisfeito(a) está?", tipoEscala: "intensidade", sinal: "protecao", opcoesResposta: escalaIntensidade },
    { codigoDominio: "ITI", dominio: "Interface Trabalho-Indivíduo", dimensao: "Satisfação no trabalho", idPergunta: "ITI_ST_02", ordem: 44, texto: "Quão satisfeito está com as suas perspetivas de trabalho?", tipoEscala: "intensidade", sinal: "protecao", opcoesResposta: escalaIntensidade },
    { codigoDominio: "ITI", dominio: "Interface Trabalho-Indivíduo", dimensao: "Satisfação no trabalho", idPergunta: "ITI_ST_03", ordem: 45, texto: "Quão satisfeito está com as condições físicas do local de trabalho?", tipoEscala: "intensidade", sinal: "protecao", opcoesResposta: escalaIntensidade },
    { codigoDominio: "ITI", dominio: "Interface Trabalho-Indivíduo", dimensao: "Satisfação no trabalho", idPergunta: "ITI_ST_04", ordem: 46, texto: "Quão satisfeito está com a forma como as suas capacidades são utilizadas?", tipoEscala: "intensidade", sinal: "protecao", opcoesResposta: escalaIntensidade },
    { codigoDominio: "ITI", dominio: "Interface Trabalho-Indivíduo", dimensao: "Conflito trabalho-família", idPergunta: "ITI_CTF_01", ordem: 47, texto: "O seu trabalho exige muita energia, afetando a sua vida privada?", tipoEscala: "frequencia", sinal: "risco", opcoesResposta: escalaFrequencia },
    { codigoDominio: "ITI", dominio: "Interface Trabalho-Indivíduo", dimensao: "Conflito trabalho-família", idPergunta: "ITI_CTF_02", ordem: 48, texto: "O seu trabalho exige muito tempo, afetando a sua vida privada?", tipoEscala: "frequencia", sinal: "risco", opcoesResposta: escalaFrequencia },
    { codigoDominio: "ITI", dominio: "Interface Trabalho-Indivíduo", dimensao: "Conflito trabalho-família", idPergunta: "ITI_CTF_03", ordem: 49, texto: "A sua família e amigos dizem que trabalha demais?", tipoEscala: "frequencia", sinal: "risco", opcoesResposta: escalaFrequencia },

    // VLT - Valores no Local de Trabalho (12 itens)
    { codigoDominio: "VLT", dominio: "Valores no Local de Trabalho", dimensao: "Confiança vertical", idPergunta: "VLT_CV_01", ordem: 50, texto: "A chefia confia nos trabalhadores para fazerem bem o trabalho?", tipoEscala: "intensidade", sinal: "protecao", opcoesResposta: escalaIntensidade, itemInvertido: false },
    { codigoDominio: "VLT", dominio: "Valores no Local de Trabalho", dimensao: "Confiança vertical", idPergunta: "VLT_CV_02", ordem: 51, texto: "Confia na informação da chefia?", tipoEscala: "intensidade", sinal: "protecao", opcoesResposta: escalaIntensidade, itemInvertido: false },
    { codigoDominio: "VLT", dominio: "Valores no Local de Trabalho", dimensao: "Confiança vertical", idPergunta: "VLT_CV_03", ordem: 52, texto: "A chefia esconde informação dos trabalhadores?", tipoEscala: "frequencia", sinal: "risco", opcoesResposta: escalaFrequencia, itemInvertido: true },
    { codigoDominio: "VLT", dominio: "Valores no Local de Trabalho", dimensao: "Confiança horizontal", idPergunta: "VLT_CH_01", ordem: 53, texto: "Os trabalhadores escondem informação uns dos outros?", tipoEscala: "frequencia", sinal: "risco", opcoesResposta: escalaFrequencia, itemInvertido: true },
    { codigoDominio: "VLT", dominio: "Valores no Local de Trabalho", dimensao: "Confiança horizontal", idPergunta: "VLT_CH_02", ordem: 54, texto: "Os trabalhadores escondem informação da chefia?", tipoEscala: "frequencia", sinal: "risco", opcoesResposta: escalaFrequencia, itemInvertido: false },
    { codigoDominio: "VLT", dominio: "Valores no Local de Trabalho", dimensao: "Confiança horizontal", idPergunta: "VLT_CH_03", ordem: 55, texto: "Confia nos seus colegas de trabalho?", tipoEscala: "intensidade", sinal: "protecao", opcoesResposta: escalaIntensidade, itemInvertido: false },
    { codigoDominio: "VLT", dominio: "Valores no Local de Trabalho", dimensao: "Justiça e respeito", idPergunta: "VLT_JR_01", ordem: 56, texto: "Os conflitos são resolvidos de forma justa?", tipoEscala: "intensidade", sinal: "protecao", opcoesResposta: escalaIntensidade },
    { codigoDominio: "VLT", dominio: "Valores no Local de Trabalho", dimensao: "Justiça e respeito", idPergunta: "VLT_JR_02", ordem: 57, texto: "As sugestões dos trabalhadores são tratadas com seriedade?", tipoEscala: "intensidade", sinal: "protecao", opcoesResposta: escalaIntensidade },
    { codigoDominio: "VLT", dominio: "Valores no Local de Trabalho", dimensao: "Justiça e respeito", idPergunta: "VLT_JR_03", ordem: 58, texto: "O trabalho é distribuído de forma justa?", tipoEscala: "intensidade", sinal: "protecao", opcoesResposta: escalaIntensidade },
    { codigoDominio: "VLT", dominio: "Valores no Local de Trabalho", dimensao: "Comunidade social no trabalho", idPergunta: "VLT_CST_01", ordem: 59, texto: "Há um bom ambiente entre colegas?", tipoEscala: "intensidade", sinal: "protecao", opcoesResposta: escalaIntensidade },
    { codigoDominio: "VLT", dominio: "Valores no Local de Trabalho", dimensao: "Comunidade social no trabalho", idPergunta: "VLT_CST_02", ordem: 60, texto: "Há boa cooperação entre os colegas?", tipoEscala: "intensidade", sinal: "protecao", opcoesResposta: escalaIntensidade },
    { codigoDominio: "VLT", dominio: "Valores no Local de Trabalho", dimensao: "Comunidade social no trabalho", idPergunta: "VLT_CST_03", ordem: 61, texto: "Sente-se parte de uma comunidade no local de trabalho?", tipoEscala: "intensidade", sinal: "protecao", opcoesResposta: escalaIntensidade },

    // PER - Personalidade (2 itens)
    { codigoDominio: "PER", dominio: "Personalidade", dimensao: "Auto-eficácia", idPergunta: "PER_AE_01", ordem: 62, texto: "É capaz de resolver a maioria dos problemas se se esforçar?", tipoEscala: "intensidade", sinal: "protecao", opcoesResposta: escalaIntensidade },
    { codigoDominio: "PER", dominio: "Personalidade", dimensao: "Auto-eficácia", idPergunta: "PER_AE_02", ordem: 63, texto: "Consegue sempre resolver problemas difíceis se tentar o suficiente?", tipoEscala: "intensidade", sinal: "protecao", opcoesResposta: escalaIntensidade },

    // SBE - Saúde e Bem-Estar (9 itens)
    { codigoDominio: "SBE", dominio: "Saúde e Bem-Estar", dimensao: "Saúde geral", idPergunta: "SBE_SG_01", ordem: 64, texto: "Em geral, como descreveria a sua saúde?", tipoEscala: "intensidade", sinal: "protecao", opcoesResposta: escalaIntensidade },
    { codigoDominio: "SBE", dominio: "Saúde e Bem-Estar", dimensao: "Stress", idPergunta: "SBE_ST_01", ordem: 65, texto: "Com que frequência se sentiu stressado(a)?", tipoEscala: "frequencia", sinal: "risco", opcoesResposta: escalaFrequencia },
    { codigoDominio: "SBE", dominio: "Saúde e Bem-Estar", dimensao: "Stress", idPergunta: "SBE_ST_02", ordem: 66, texto: "Com que frequência se sentiu tenso(a) ou nervoso(a)?", tipoEscala: "frequencia", sinal: "risco", opcoesResposta: escalaFrequencia },
    { codigoDominio: "SBE", dominio: "Saúde e Bem-Estar", dimensao: "Burnout", idPergunta: "SBE_BO_01", ordem: 67, texto: "Com que frequência se sentiu fisicamente exausto(a)?", tipoEscala: "frequencia", sinal: "risco", opcoesResposta: escalaFrequencia },
    { codigoDominio: "SBE", dominio: "Saúde e Bem-Estar", dimensao: "Burnout", idPergunta: "SBE_BO_02", ordem: 68, texto: "Com que frequência se sentiu emocionalmente exausto(a)?", tipoEscala: "frequencia", sinal: "risco", opcoesResposta: escalaFrequencia },
    { codigoDominio: "SBE", dominio: "Saúde e Bem-Estar", dimensao: "Problemas em dormir", idPergunta: "SBE_PD_01", ordem: 69, texto: "Com que frequência teve dificuldades em adormecer?", tipoEscala: "frequencia", sinal: "risco", opcoesResposta: escalaFrequencia },
    { codigoDominio: "SBE", dominio: "Saúde e Bem-Estar", dimensao: "Problemas em dormir", idPergunta: "SBE_PD_02", ordem: 70, texto: "Com que frequência acordou várias vezes durante a noite?", tipoEscala: "frequencia", sinal: "risco", opcoesResposta: escalaFrequencia },
    { codigoDominio: "SBE", dominio: "Saúde e Bem-Estar", dimensao: "Sintomas depressivos", idPergunta: "SBE_SD_01", ordem: 71, texto: "Com que frequência se sentiu triste?", tipoEscala: "frequencia", sinal: "risco", opcoesResposta: escalaFrequencia },
    { codigoDominio: "SBE", dominio: "Saúde e Bem-Estar", dimensao: "Sintomas depressivos", idPergunta: "SBE_SD_02", ordem: 72, texto: "Com que frequência sentiu falta de interesse pelas coisas?", tipoEscala: "frequencia", sinal: "risco", opcoesResposta: escalaFrequencia },

    // CO - Comportamentos Ofensivos (4 itens)
    { codigoDominio: "CO", dominio: "Comportamentos Ofensivos", dimensao: "Atenção sexual indesejada", idPergunta: "CO_ASI_01", ordem: 73, texto: "Foi exposto(a) a atenção sexual indesejada nos últimos 12 meses?", tipoEscala: "comportamento_ofensivo", sinal: "risco", opcoesResposta: escalaComportamentoOfensivo, subPergunta: subPerguntaAgressor },
    { codigoDominio: "CO", dominio: "Comportamentos Ofensivos", dimensao: "Ameaças de violência", idPergunta: "CO_AV_01", ordem: 74, texto: "Foi exposto(a) a ameaças de violência nos últimos 12 meses?", tipoEscala: "comportamento_ofensivo", sinal: "risco", opcoesResposta: escalaComportamentoOfensivo, subPergunta: subPerguntaAgressor },
    { codigoDominio: "CO", dominio: "Comportamentos Ofensivos", dimensao: "Violência física", idPergunta: "CO_VF_01", ordem: 75, texto: "Foi exposto(a) a violência física nos últimos 12 meses?", tipoEscala: "comportamento_ofensivo", sinal: "risco", opcoesResposta: escalaComportamentoOfensivo, subPergunta: subPerguntaAgressor },
    { codigoDominio: "CO", dominio: "Comportamentos Ofensivos", dimensao: "Bullying", idPergunta: "CO_BU_01", ordem: 76, texto: "Foi exposto(a) a bullying nos últimos 12 meses?", tipoEscala: "comportamento_ofensivo", sinal: "risco", opcoesResposta: escalaComportamentoOfensivo, subPergunta: subPerguntaAgressor }
];

// Adicionar campos comuns e inserir
perguntas.forEach(p => {
    p.idQuestionario = idQuestionario;
    if (p.itemInvertido === undefined) {
        p.itemInvertido = false;
    }
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
print("Total de perguntas no banco: " + totalInserido + "/76");

if (totalInserido === 76) {
    print("✅ Seed COPSOQ II Versão Média Portuguesa concluído com sucesso!");
} else {
    print("❌ ERRO: Esperado 76 perguntas, encontradas " + totalInserido);
}

// Verificar itens invertidos
const itensInvertidos = db.perguntas.countDocuments({ idQuestionario: idQuestionario, itemInvertido: true });
print("Itens invertidos: " + itensInvertidos + "/2");

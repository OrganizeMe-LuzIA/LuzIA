// Mock data para questionários - CoPsoQ II
export const mockQuestionnaires = [
    {
        id: '1',
        nome: 'CoPsoQ II - Versão Média',
        versao: '2.0',
        descricao: 'Questionário de Avaliação Psicossocial no Trabalho - Copenhagen Psychosocial Questionnaire',
        totalPerguntas: 30,
        ativo: true,
        dominios: [
            'Exigências no trabalho',
            'Trabalho ativo e desenvolvimento de habilidades',
            'Apoio social e qualidade da liderança',
            'Insegurança',
            'Interface casa-trabalho',
            'Saúde e bem-estar'
        ],
        escala: '0 (Nunca) a 4 (Sempre)'
    },
    {
        id: '2',
        nome: 'DASS-21',
        versao: '1.0',
        descricao: 'Escala de Depressão, Ansiedade e Estresse',
        totalPerguntas: 21,
        ativo: true,
        dominios: ['Depressão', 'Ansiedade', 'Estresse'],
        escala: '0 (Não se aplicou) a 3 (Aplicou-se muito)'
    }
]

export const mockQuestions = {
    '1': [
        {
            id: 'q1',
            idQuestionario: '1',
            dominio: 'Exigências no trabalho',
            dimensao: 'Exigências quantitativas',
            idPergunta: 'QNT01',
            texto: 'Com que frequência você tem que fazer suas tarefas de trabalho muito rapidamente?',
            tipo: 'escala_likert',
            sinal: 'risco',
            itemInvertido: false,
            escala: 5,
            opcoes: [
                { valor: 0, label: 'Nunca' },
                { valor: 1, label: 'Raramente' },
                { valor: 2, label: 'Às vezes' },
                { valor: 3, label: 'Frequentemente' },
                { valor: 4, label: 'Sempre' }
            ]
        },
        {
            id: 'q2',
            idQuestionario: '1',
            dominio: 'Exigências no trabalho',
            dimensao: 'Exigências quantitativas',
            idPergunta: 'QNT02',
            texto: 'Com que frequência você fica atrasado com seu trabalho?',
            tipo: 'escala_likert',
            sinal: 'risco',
            itemInvertido: false,
            escala: 5,
            opcoes: [
                { valor: 0, label: 'Nunca' },
                { valor: 1, label: 'Raramente' },
                { valor: 2, label: 'Às vezes' },
                { valor: 3, label: 'Frequentemente' },
                { valor: 4, label: 'Sempre' }
            ]
        },
        {
            id: 'q3',
            idQuestionario: '1',
            dominio: 'Trabalho ativo e desenvolvimento',
            dimensao: 'Influência no trabalho',
            idPergunta: 'INF01',
            texto: 'Você tem influência sobre a quantidade de trabalho que lhe é atribuída?',
            tipo: 'escala_likert',
            sinal: 'protecao',
            itemInvertido: true,
            escala: 5,
            opcoes: [
                { valor: 0, label: 'Nunca' },
                { valor: 1, label: 'Raramente' },
                { valor: 2, label: 'Às vezes' },
                { valor: 3, label: 'Frequentemente' },
                { valor: 4, label: 'Sempre' }
            ]
        },
        {
            id: 'q4',
            idQuestionario: '1',
            dominio: 'Trabalho ativo e desenvolvimento',
            dimensao: 'Influência no trabalho',
            idPergunta: 'INF02',
            texto: 'Você pode decidir quando fazer uma pausa?',
            tipo: 'escala_likert',
            sinal: 'protecao',
            itemInvertido: true,
            escala: 5,
            opcoes: [
                { valor: 0, label: 'Nunca' },
                { valor: 1, label: 'Raramente' },
                { valor: 2, label: 'Às vezes' },
                { valor: 3, label: 'Frequentemente' },
                { valor: 4, label: 'Sempre' }
            ]
        },
        {
            id: 'q5',
            idQuestionario: '1',
            dominio: 'Apoio social',
            dimensao: 'Apoio de colegas',
            idPergunta: 'APO01',
            texto: 'Com que frequência você recebe ajuda e apoio de seus colegas?',
            tipo: 'escala_likert',
            sinal: 'protecao',
            itemInvertido: true,
            escala: 5,
            opcoes: [
                { valor: 0, label: 'Nunca' },
                { valor: 1, label: 'Raramente' },
                { valor: 2, label: 'Às vezes' },
                { valor: 3, label: 'Frequentemente' },
                { valor: 4, label: 'Sempre' }
            ]
        }
    ],
    '2': [
        {
            id: 'q1',
            idQuestionario: '2',
            dominio: 'Depressão',
            idPergunta: 'DEP01',
            texto: 'Achei difícil me acalmar',
            tipo: 'escala_likert',
            sinal: 'risco',
            itemInvertido: false,
            escala: 4,
            opcoes: [
                { valor: 0, label: 'Não se aplicou' },
                { valor: 1, label: 'Aplicou-se um pouco' },
                { valor: 2, label: 'Aplicou-se bastante' },
                { valor: 3, label: 'Aplicou-se muito' }
            ]
        }
    ]
}

export const mockUserResponses = {
    questionarioId: '1',
    respondido: true,
    dataResposta: '2026-01-15T10:30:00Z',
    progresso: 100,
    respostas: [
        { idPergunta: 'QNT01', valor: 2 },
        { idPergunta: 'QNT02', valor: 3 },
        { idPergunta: 'INF01', valor: 2 },
        { idPergunta: 'INF02', valor: 1 },
        { idPergunta: 'APO01', valor: 3 }
    ]
}

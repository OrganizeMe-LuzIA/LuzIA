// Mock data para relatórios
export const mockReports = [
    {
        id: 'rel001',
        idQuestionario: '1',
        idOrganizacao: 'org001',
        organizacao: 'Empresa ABC Ltda',
        idSetor: 'set001',
        setor: 'TI',
        tipoRelatorio: 'setorial',
        geradoPor: 'admin@empresa.com',
        dataGeracao: '2026-01-15T14:30:00Z',
        status: 'Concluído',
        metricas: {
            mediaRiscoGlobal: 2.1,
            indiceProtecao: 3.8,
            totalRespondentes: 45
        },
        dominios: [
            {
                nome: 'Exigências no trabalho',
                media: 2.3,
                nivelRisco: 'Médio',
                dimensoes: [
                    { nome: 'Exigências quantitativas', media: 2.5, nivelRisco: 'Médio' },
                    { nome: 'Exigências emocionais', media: 2.1, nivelRisco: 'Baixo' }
                ]
            },
            {
                nome: 'Trabalho ativo e desenvolvimento',
                media: 3.5,
                nivelRisco: 'Baixo',
                dimensoes: [
                    { nome: 'Influência no trabalho', media: 3.4, nivelRisco: 'Baixo' },
                    { nome: 'Desenvolvimento de habilidades', media: 3.6, nivelRisco: 'Baixo' }
                ]
            },
            {
                nome: 'Apoio social',
                media: 3.9,
                nivelRisco: 'Baixo',
                dimensoes: [
                    { nome: 'Apoio de colegas', media: 4.0, nivelRisco: 'Baixo' },
                    { nome: 'Apoio de superiores', media: 3.8, nivelRisco: 'Baixo' }
                ]
            }
        ],
        recomendacoes: [
            'Implementar programas de gestão de carga de trabalho',
            'Fortalecer canais de comunicação entre equipes',
            'Promover atividades de integração e bem-estar'
        ],
        observacoes: 'Resultados gerais positivos com pontos de atenção nas exigências quantitativas.'
    },
    {
        id: 'rel002',
        idQuestionario: '1',
        idOrganizacao: 'org001',
        organizacao: 'Empresa ABC Ltda',
        tipoRelatorio: 'organizacional',
        geradoPor: 'admin@empresa.com',
        dataGeracao: '2026-01-10T09:00:00Z',
        status: 'Concluído',
        metricas: {
            mediaRiscoGlobal: 2.4,
            indiceProtecao: 3.6,
            totalRespondentes: 150
        },
        dominios: [
            {
                nome: 'Exigências no trabalho',
                media: 2.6,
                nivelRisco: 'Médio',
                dimensoes: [
                    { nome: 'Exigências quantitativas', media: 2.8, nivelRisco: 'Médio' },
                    { nome: 'Exigências emocionais', media: 2.4, nivelRisco: 'Médio' }
                ]
            },
            {
                nome: 'Trabalho ativo e desenvolvimento',
                media: 3.4,
                nivelRisco: 'Baixo',
                dimensoes: [
                    { nome: 'Influência no trabalho', media: 3.2, nivelRisco: 'Baixo' },
                    { nome: 'Desenvolvimento de habilidades', media: 3.6, nivelRisco: 'Baixo' }
                ]
            }
        ],
        recomendacoes: [
            'Revisar distribuição de cargas de trabalho entre setores',
            'Implementar programa de treinamento em gestão de estresse',
            'Criar comitê de acompanhamento psicossocial'
        ],
        observacoes: 'Necessário atenção especial aos setores operacionais.'
    },
    {
        id: 'rel003',
        idQuestionario: '1',
        idOrganizacao: 'org002',
        organizacao: 'Organização XYZ S.A.',
        idSetor: 'set005',
        setor: 'Vendas',
        tipoRelatorio: 'setorial',
        geradoPor: 'rh@xyz.com',
        dataGeracao: '2026-01-08T16:45:00Z',
        status: 'Concluído',
        metricas: {
            mediaRiscoGlobal: 2.8,
            indiceProtecao: 3.2,
            totalRespondentes: 30
        },
        dominios: [
            {
                nome: 'Exigências no trabalho',
                media: 3.2,
                nivelRisco: 'Alto',
                dimensoes: [
                    { nome: 'Exigências quantitativas', media: 3.5, nivelRisco: 'Alto' },
                    { nome: 'Exigências emocionais', media: 2.9, nivelRisco: 'Médio' }
                ]
            },
            {
                nome: 'Apoio social',
                media: 3.0,
                nivelRisco: 'Médio',
                dimensoes: [
                    { nome: 'Apoio de colegas', media: 3.2, nivelRisco: 'Baixo' },
                    { nome: 'Apoio de superiores', media: 2.8, nivelRisco: 'Médio' }
                ]
            }
        ],
        recomendacoes: [
            'URGENTE: Revisar metas e prazos da equipe de vendas',
            'Implementar programa de apoio psicológico',
            'Realizar workshop de gestão de conflitos e comunicação'
        ],
        observacoes: 'Situação requer atenção imediata da gestão.'
    }
]

export const mockReportFilters = {
    organizacoes: [
        { id: 'org001', nome: 'Empresa ABC Ltda' },
        { id: 'org002', nome: 'Organização XYZ S.A.' },
        { id: 'org003', nome: 'Instituto de Pesquisa' }
    ],
    setores: [
        { id: 'set001', nome: 'TI', idOrganizacao: 'org001' },
        { id: 'set002', nome: 'Administrativo', idOrganizacao: 'org001' },
        { id: 'set003', nome: 'Operacional', idOrganizacao: 'org001' },
        { id: 'set004', nome: 'RH', idOrganizacao: 'org002' },
        { id: 'set005', nome: 'Vendas', idOrganizacao: 'org002' }
    ],
    questionarios: [
        { id: '1', nome: 'CoPsoQ II - Versão Média' },
        { id: '2', nome: 'DASS-21' }
    ],
    tiposRelatorio: ['organizacional', 'setorial', 'individual']
}

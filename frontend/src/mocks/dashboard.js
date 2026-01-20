// Mock data para desenvolvimento - substituir quando backend estiver pronto
export const mockDashboardMetrics = {
    totalQuestionarios: 12,
    taxaResposta: 85.5,
    nivelMedioRisco: 2.3,
    indiceProtecao: 3.7,
}

export const mockEvolution = [
    { mes: 'Jan', risco: 2.1, protecao: 3.5 },
    { mes: 'Fev', risco: 2.3, protecao: 3.6 },
    { mes: 'Mar', risco: 2.2, protecao: 3.8 },
    { mes: 'Abr', risco: 2.4, protecao: 3.7 },
    { mes: 'Mai', risco: 2.3, protecao: 3.7 },
]

export const mockSetoresComparativo = [
    { setor: 'Administrativo', risco: 2.1 },
    { setor: 'Operacional', risco: 2.5 },
    { setor: 'TI', risco: 2.0 },
    { setor: 'Vendas', risco: 2.7 },
    { setor: 'RH', risco: 1.9 },
]

export const mockDistribuicaoRisco = [
    { nivel: 'Baixo', count: 45 },
    { nivel: 'Médio', count: 30 },
    { nivel: 'Alto', count: 15 },
    { nivel: 'Muito Alto', count: 10 },
]

export const mockRelatoriosRecentes = [
    {
        id: 1,
        tipo: 'Organizacional',
        organizacao: 'Empresa ABC',
        data: '2026-01-15',
        risco: 2.3,
        status: 'Concluído',
    },
    {
        id: 2,
        tipo: 'Setorial',
        organizacao: 'Empresa ABC',
        setor: 'TI',
        data: '2026-01-10',
        risco: 2.0,
        status: 'Concluído',
    },
    {
        id: 3,
        tipo: 'Setorial',
        organizacao: 'Empresa XYZ',
        setor: 'Vendas',
        data: '2026-01-08',
        risco: 2.7,
        status: 'Concluído',
    },
]

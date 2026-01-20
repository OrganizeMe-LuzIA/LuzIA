export const mockDashboardData = {
    metrics: {
        totalQuestionarios: 12,
        taxaResposta: 78.5,
        nivelMedioRisco: 2.3,
        indiceProtecao: 3.8,
    },
    evolutionData: {
        labels: ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun'],
        datasets: [
            {
                label: 'Nível de Risco',
                data: [2.1, 2.3, 2.5, 2.4, 2.3, 2.3],
                borderColor: '#ef4444',
                backgroundColor: 'rgba(239, 68, 68, 0.1)',
                tension: 0.4,
            },
            {
                label: 'Índice de Proteção',
                data: [3.5, 3.6, 3.7, 3.8, 3.9, 3.8],
                borderColor: '#10b981',
                backgroundColor: 'rgba(16, 185, 129, 0.1)',
                tension: 0.4,
            },
        ],
    },
    sectorComparison: {
        labels: ['RH', 'TI', 'Vendas', 'Marketing', 'Operações'],
        datasets: [
            {
                label: 'Nível de Risco Médio',
                data: [2.1, 1.9, 2.8, 2.3, 2.5],
                backgroundColor: [
                    '#6366f1',
                    '#8b5cf6',
                    '#ec4899',
                    '#f59e0b',
                    '#10b981',
                ],
            },
        ],
    },
    riskDistribution: {
        labels: ['Baixo', 'Médio', 'Alto', 'Crítico'],
        datasets: [
            {
                data: [35, 45, 15, 5],
                backgroundColor: ['#10b981', '#f59e0b', '#ef4444', '#991b1b'],
            },
        ],
    },
    recentReports: [
        {
            id: 1,
            organization: 'Empresa XYZ',
            sector: 'TI',
            date: '2026-01-15',
            type: 'setorial',
            riskLevel: 'Médio',
        },
        {
            id: 2,
            organization: 'Empresa ABC',
            sector: 'RH',
            date: '2026-01-12',
            type: 'organizacional',
            riskLevel: 'Baixo',
        },
        {
            id: 3,
            organization: 'Empresa XYZ',
            sector: 'Vendas',
            date: '2026-01-10',
            type: 'setorial',
            riskLevel: 'Alto',
        },
    ],
}

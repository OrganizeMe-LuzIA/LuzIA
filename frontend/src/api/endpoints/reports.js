import apiClient from '../client'

/**
 * API endpoints para Relatórios
 */

export async function generateReport(data) {
    const response = await apiClient.post('/relatorios/gerar', data)
    return response.data
}

export async function getReport(id) {
    const response = await apiClient.get(`/relatorios/${id}`)
    return response.data
}

export async function listReports(filters = {}) {
    const response = await apiClient.get('/relatorios', { params: filters })
    return response.data
}

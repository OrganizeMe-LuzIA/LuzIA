import apiClient from '../client'

/**
 * API endpoints para Diagnósticos
 */

export async function getMyDiagnostics() {
    const response = await apiClient.get('/diagnosticos/me')
    return response.data
}

export async function getDiagnostic(id) {
    const response = await apiClient.get(`/diagnosticos/${id}`)
    return response.data
}

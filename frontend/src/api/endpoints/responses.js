import apiClient from '../client'

/**
 * API endpoints para Respostas
 */

export async function submitResponses(data) {
    const response = await apiClient.post('/respostas', data)
    return response.data
}

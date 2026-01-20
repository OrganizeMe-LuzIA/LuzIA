import apiClient from '../client'

/**
 * API endpoints para Organizações
 */

export async function listOrganizations() {
    const response = await apiClient.get('/organizacoes')
    return response.data
}

export async function getOrganization(id) {
    const response = await apiClient.get(`/organizacoes/${id}`)
    return response.data
}

export async function createOrganization(data) {
    const response = await apiClient.post('/organizacoes', data)
    return response.data
}

export async function updateOrganization(id, data) {
    const response = await apiClient.put(`/organizacoes/${id}`, data)
    return response.data
}

export async function deleteOrganization(id) {
    const response = await apiClient.delete(`/organizacoes/${id}`)
    return response.data
}

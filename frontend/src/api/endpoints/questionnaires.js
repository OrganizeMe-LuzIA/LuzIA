import apiClient from '../client'

/**
 * API endpoints para Questionários
 */

export async function listQuestionnaires() {
    const response = await apiClient.get('/questionarios')
    return response.data
}

export async function getQuestionnaire(id) {
    const response = await apiClient.get(`/questionarios/${id}`)
    return response.data
}

export async function getQuestionnaireQuestions(id) {
    const response = await apiClient.get(`/questionarios/${id}/perguntas`)
    return response.data
}

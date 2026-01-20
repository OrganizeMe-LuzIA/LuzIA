import apiClient from './client'

export const loginUser = async (phone, code) => {
    const response = await apiClient.post('/auth/login', { phone, code })
    return response.data
}

export const requestOTP = async (phone) => {
    const response = await apiClient.post('/auth/request-otp', { phone })
    return response.data
}

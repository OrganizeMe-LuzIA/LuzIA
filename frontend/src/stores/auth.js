import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { loginUser, requestOTP } from '@/api/endpoints/auth'

export const useAuthStore = defineStore('auth', () => {
    const token = ref(localStorage.getItem('access_token'))
    const user = ref(null)
    const loading = ref(false)
    const error = ref(null)

    const isAuthenticated = computed(() => !!token.value)
    const isAdmin = computed(() => user.value?.metadata?.is_admin === true)

    async function login(phone, code) {
        try {
            loading.value = true
            error.value = null
            const data = await loginUser(phone, code)
            token.value = data.access_token
            localStorage.setItem('access_token', data.access_token)
            // TODO: Buscar dados do usuário após login
            await fetchUser()
        } catch (err) {
            error.value = err.response?.data?.detail || 'Erro ao fazer login'
            throw err
        } finally {
            loading.value = false
        }
    }

    async function sendOTP(phone) {
        try {
            loading.value = true
            error.value = null
            await requestOTP(phone)
        } catch (err) {
            error.value = err.response?.data?.detail || 'Erro ao solicitar código'
            throw err
        } finally {
            loading.value = false
        }
    }

    async function fetchUser() {
        // TODO: Implementar busca de dados do usuário
        // const response = await apiClient.get('/users/me')
        // user.value = response.data
    }

    function logout() {
        token.value = null
        user.value = null
        localStorage.removeItem('access_token')
    }

    return {
        token,
        user,
        loading,
        error,
        isAuthenticated,
        isAdmin,
        login,
        sendOTP,
        logout,
    }
})

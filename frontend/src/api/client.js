import axios from 'axios'

const apiClient = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1',
    headers: {
        'Content-Type': 'application/json',
    },
    timeout: 10000,
})

// Request interceptor (para adicionar token JWT quando implementar autenticação)
apiClient.interceptors.request.use(
    (config) => {
        // TODO: Quando implementar autenticação, adicionar token aqui
        // const token = localStorage.getItem('access_token')
        // if (token) {
        //   config.headers.Authorization = `Bearer ${token}`
        // }
        return config
    },
    (error) => {
        return Promise.reject(error)
    }
)

// Response interceptor para tratamento de erros
apiClient.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response) {
            // O servidor respondeu com um status de erro
            console.error('API Error:', error.response.status, error.response.data)

            // TODO: Quando implementar autenticação
            // if (error.response.status === 401) {
            //   localStorage.removeItem('access_token')
            //   window.location.href = '/login'
            // }
        } else if (error.request) {
            // A requisição foi feita mas não houve resposta
            console.error('Network Error:', error.request)
        } else {
            console.error('Error:', error.message)
        }
        return Promise.reject(error)
    }
)

export default apiClient

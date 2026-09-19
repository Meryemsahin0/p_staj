import axios from 'axios'
import { useAuthStore } from '../store/auth'
import router from '../router'

const api = axios.create({ baseURL: '/api/v1' })

// Her isteğe JWT token'ı ekle
api.interceptors.request.use((config) => {
  const auth = useAuthStore()
  if (auth.token) {
    config.headers.Authorization = `Bearer ${auth.token}`
  }
  return config
})

// 401 alındığında oturumu kapat ve login'e yönlendir
api.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response && error.response.status === 401) {
      const auth = useAuthStore()
      auth.logout()
      router.push('/login')
    }
    return Promise.reject(error)
  }
)

export default api

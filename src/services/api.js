import axios from 'axios'
import { useAuthStore } from '../stores/auth'
import { ElMessage } from 'element-plus'
import { getApiBaseUrl, logger } from '../utils/config'

// Create axios instance
const api = axios.create({
  baseURL: getApiBaseUrl(),
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
})

// Request interceptor
api.interceptors.request.use(
  (config) => {
    // Add authentication token to requests
    const authStore = useAuthStore()
    const token = authStore.token
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    
    // Add timestamp to prevent caching
    config.params = {
      ...config.params,
      _t: Date.now()
    }
    
    return config
  },
  (error) => {
    logger.error('Request interceptor error:', error)
    return Promise.reject(error)
  }
)

// Response interceptor
api.interceptors.response.use(
  (response) => {
    // Handle successful responses
    return response.data
  },
  (error) => {
    const authStore = useAuthStore()
    
    // Handle different error status codes
    if (error.response) {
      const { status, data } = error.response
      
      switch (status) {
        case 401:
          // Unauthorized - clear auth and redirect to login
          ElMessage.error('登录已过期，请重新登录')
          authStore.logout()
          window.location.href = '/login'
          break
          
        case 403:
          // Forbidden
          ElMessage.error('权限不足，无法访问该资源')
          break
          
        case 404:
          // Not found
          ElMessage.error('请求的资源不存在')
          break
          
        case 422:
          // Validation error
          if (data.errors) {
            const errorMessages = Object.values(data.errors).flat()
            ElMessage.error(errorMessages[0] || '数据验证失败')
          } else {
            ElMessage.error(data.message || '数据验证失败')
          }
          break
          
        case 429:
          // Too many requests
          ElMessage.error('请求过于频繁，请稍后再试')
          break
          
        case 500:
          // Server error
          ElMessage.error('服务器内部错误，请稍后重试')
          break
          
        default:
          ElMessage.error(data.message || '网络请求失败')
      }
    } else if (error.request) {
      // Network error
      ElMessage.error('网络连接失败，请检查网络设置')
    } else {
      // Other errors
      ElMessage.error('请求配置错误')
    }
    
    return Promise.reject(error)
  }
)

export default api
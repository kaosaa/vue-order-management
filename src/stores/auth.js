import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { getApiUrl, logger } from '../utils/config'

export const useAuthStore = defineStore('auth', () => {
  // State
  const user = ref(null)
  const token = ref(null)
  const isLoading = ref(false)

  // Getters
  const isAuthenticated = computed(() => !!token.value && !!user.value)
  const isAdmin = computed(() => user.value?.role === 'admin')
  const isUser = computed(() => user.value?.role === 'user')


  // Actions
  const setAuth = (userData, authToken) => {
    user.value = userData
    token.value = authToken
    
    // Store in localStorage for persistence
    localStorage.setItem('auth_user', JSON.stringify(userData))
    localStorage.setItem('auth_token', authToken)
  }

  const login = async (credentials) => {
    isLoading.value = true
    try {
      const { phone, password } = credentials
      
      const response = await fetch(getApiUrl('/auth/login'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ phone, password })
      })
      
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || '登录失败')
      }
      
      const data = await response.json()
      setAuth(data.user, data.token)
      return { success: true, user: data.user }
      
    } catch (error) {
      console.error('Login error:', error)
      throw error
    } finally {
      isLoading.value = false
    }
  }

  const register = async (userData) => {
    isLoading.value = true
    try {
      // Convert camelCase to snake_case for backend
      const backendData = {
        real_name: userData.realName,
        phone: userData.phone,
        alipay_account: userData.alipayAccount,
        password: userData.password
      }

      const response = await fetch(getApiUrl('/auth/register'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(backendData)
      })
      
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || '注册失败')
      }
      
      const data = await response.json()
      setAuth(data.user, data.token)
      return { success: true, user: data.user }
      
    } catch (error) {
      console.error('Registration error:', error)
      throw error
    } finally {
      isLoading.value = false
    }
  }

  const logout = async () => {
    try {
      if (token.value) {
        await fetch(getApiUrl('/auth/logout'), {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token.value}`
          }
        })
      }
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      user.value = null
      token.value = null
      
      // Clear localStorage
      localStorage.removeItem('auth_user')
      localStorage.removeItem('auth_token')
    }
  }

  const initializeAuth = () => {
    // Initialize auth state from localStorage
    const storedUser = localStorage.getItem('auth_user')
    const storedToken = localStorage.getItem('auth_token')
    
    if (storedUser && storedToken) {
      try {
        user.value = JSON.parse(storedUser)
        token.value = storedToken
      } catch (error) {
        console.error('Error parsing stored auth data:', error)
        logout()
      }
    }
  }

  const updateUserProfile = async (updatedData) => {
    try {
      const response = await fetch(getApiUrl('/auth/profile'), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token.value}`
        },
        body: JSON.stringify(updatedData)
      })
      
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || '更新个人信息失败')
      }
      
      const data = await response.json()
      user.value = data.user
      localStorage.setItem('auth_user', JSON.stringify(user.value))
      return { success: true, user: data.user }
      
    } catch (error) {
      console.error('Update profile error:', error)
      throw error
    }
  }

  const changePassword = async (passwordData) => {
    try {
      const response = await fetch(getApiUrl('/auth/password'), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token.value}`
        },
        body: JSON.stringify(passwordData)
      })
      
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || '修改密码失败')
      }
      
      const data = await response.json()
      return { success: true, message: data.message }
      
    } catch (error) {
      console.error('Change password error:', error)
      throw error
    }
  }

  const verifyToken = async () => {
    if (!token.value) return false
    
    try {
      const response = await fetch(getApiUrl('/auth/verify'), {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token.value}`
        }
      })
      
      if (!response.ok) {
        logout()
        return false
      }
      
      const data = await response.json()
      user.value = data.user
      localStorage.setItem('auth_user', JSON.stringify(user.value))
      return true
      
    } catch (error) {
      console.error('Token verification error:', error)
      logout()
      return false
    }
  }

  return {
    // State
    user,
    token,
    isLoading,
    
    // Getters
    isAuthenticated,
    isAdmin,
    isUser,
    
    // Actions
    login,
    register,
    logout,
    setAuth,
    initializeAuth,
    updateUserProfile,
    changePassword,
    verifyToken
  }
})
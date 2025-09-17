import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useAuthStore } from './auth'
import { getApiUrl, logger } from '../utils/config'

export const useAdminStore = defineStore('admin', () => {
  // State
  const users = ref([])
  const isLoading = ref(false)
  const adminLogs = ref([])

  // Getters
  const activeUsers = computed(() => users.value.filter(u => u.status === 'active'))
  const inactiveUsers = computed(() => users.value.filter(u => u.status === 'inactive'))
  const userStats = computed(() => ({
    total: users.value.length,
    active: activeUsers.value.length,
    inactive: inactiveUsers.value.length,
    admins: users.value.filter(u => u.role === 'admin').length,
    regularUsers: users.value.filter(u => u.role === 'user').length
  }))


  // Helper function to get auth headers
  const getAuthHeaders = () => {
    const authStore = useAuthStore()
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${authStore.token}`
    }
  }

  // Actions
  const fetchUsers = async () => {
    isLoading.value = true
    try {
      const response = await fetch(getApiUrl('/admin/users'), {
        method: 'GET',
        headers: getAuthHeaders()
      })
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const data = await response.json()
      users.value = data.users || []
    } catch (error) {
      console.error('Error fetching users:', error)
      throw error
    } finally {
      isLoading.value = false
    }
  }

  const updateUser = async (userId, userData) => {
    try {
      // Convert camelCase to snake_case for backend
      const backendData = {}
      if (userData.realName !== undefined) backendData.real_name = userData.realName
      if (userData.alipayAccount !== undefined) backendData.alipay_account = userData.alipayAccount
      if (userData.status !== undefined) backendData.status = userData.status
      if (userData.role !== undefined) backendData.role = userData.role

      const response = await fetch(getApiUrl(`/admin/users/${userId}`), {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(backendData)
      })
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const data = await response.json()
      const updatedUser = data.user
      
      const index = users.value.findIndex(u => u.id === userId)
      if (index !== -1) {
        users.value[index] = updatedUser
      }

      // Log the admin action
      await logAdminAction('update_user', {
        targetUserId: userId,
        changes: userData
      })

      return updatedUser
    } catch (error) {
      console.error('Error updating user:', error)
      throw error
    }
  }

  const toggleUserStatus = async (userId) => {
    try {
      const user = users.value.find(u => u.id === userId)
      if (!user) {
        throw new Error('User not found')
      }

      const newStatus = user.status === 'active' ? 'inactive' : 'active'
      
      const response = await fetch(getApiUrl(`/admin/users/${userId}/toggle-status`), {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ status: newStatus })
      })
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const data = await response.json()
      const updatedUser = data.user
      
      const index = users.value.findIndex(u => u.id === userId)
      if (index !== -1) {
        users.value[index] = updatedUser
      }
      
      await logAdminAction('toggle_user_status', {
        targetUserId: userId,
        oldStatus: user.status,
        newStatus: newStatus
      })
      
      return updatedUser
    } catch (error) {
      console.error('Error toggling user status:', error)
      throw error
    }
  }

  const getUserById = (userId) => {
    return users.value.find(u => u.id === userId)
  }

  const searchUsers = (searchTerm) => {
    if (!searchTerm) return users.value
    
    const term = searchTerm.toLowerCase()
    return users.value.filter(user => 
      user.realName.toLowerCase().includes(term) ||
      user.phone.includes(term) ||
      user.alipayAccount.toLowerCase().includes(term)
    )
  }

  const fetchAdminLogs = async (limit = 50) => {
    try {
      const response = await fetch(getApiUrl(`/admin/logs?limit=${limit}`), {
        method: 'GET',
        headers: getAuthHeaders()
      })
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const data = await response.json()
      adminLogs.value = data.logs || []
      return adminLogs.value
    } catch (error) {
      console.error('Error fetching admin logs:', error)
      throw error
    }
  }

  const logAdminAction = async (action, details) => {
    try {
      const response = await fetch(getApiUrl('/admin/logs'), {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          action,
          details,
          timestamp: new Date().toISOString()
        })
      })
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const data = await response.json()
      const logEntry = data.log
      
      // Add to local state
      adminLogs.value.unshift(logEntry)
      
      // Keep only last 1000 logs to prevent memory issues
      if (adminLogs.value.length > 1000) {
        adminLogs.value = adminLogs.value.slice(0, 1000)
      }
      
      return logEntry
    } catch (error) {
      console.error('Error logging admin action:', error)
      // Don't throw here as logging shouldn't break the main functionality
    }
  }

  const getAdminLogs = (limit = 50) => {
    return adminLogs.value.slice(0, limit)
  }

  const validatePhoneNumber = (phone) => {
    // Chinese mobile phone number validation
    const phoneRegex = /^1[3-9]\d{9}$/
    return phoneRegex.test(phone)
  }

  const validateAlipayAccount = (account) => {
    // Basic email format validation for Alipay account
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    const phoneRegex = /^1[3-9]\d{9}$/
    
    // Alipay account can be email or phone number
    return emailRegex.test(account) || phoneRegex.test(account)
  }

  const checkDuplicatePhone = async (phone, excludeUserId = null) => {
    try {
      const response = await fetch(getApiUrl(`/auth/check-duplicate?phone=${encodeURIComponent(phone)}&excludeUserId=${excludeUserId || ''}`), {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      })
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const data = await response.json()
      return data.duplicate
    } catch (error) {
      console.error('Error checking duplicate phone:', error)
      // Fallback to local check
      return users.value.some(user => 
        user.phone === phone && user.id !== excludeUserId
      )
    }
  }

  const checkDuplicateAlipay = async (alipayAccount, excludeUserId = null) => {
    try {
      const response = await fetch(getApiUrl(`/auth/check-duplicate?alipayAccount=${encodeURIComponent(alipayAccount)}&excludeUserId=${excludeUserId || ''}`), {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      })
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const data = await response.json()
      return data.duplicate
    } catch (error) {
      console.error('Error checking duplicate alipay:', error)
      // Fallback to local check
      return users.value.some(user => 
        user.alipayAccount === alipayAccount && user.id !== excludeUserId
      )
    }
  }

  const fetchStats = async () => {
    try {
      const response = await fetch(getApiUrl('/admin/stats'), {
        method: 'GET',
        headers: getAuthHeaders()
      })
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const data = await response.json()
      return data
    } catch (error) {
      console.error('Error fetching stats:', error)
      // Return mock data as fallback
      return {
        users: { total: userStats.value.total, active: userStats.value.active },
        orders: { total: 1248, pending: 23 },
        products: { total: 89, active: 76 },
        couriers: { total: 12, active: 12 }
      }
    }
  }

  const exportUsersToExcel = () => {
    const exportData = users.value.map(user => ({
      'ID': user.id,
      '真实姓名': user.realName,
      '手机号': user.phone,
      '支付宝账户': user.alipayAccount,
      '角色': user.role === 'admin' ? '管理员' : '普通用户',
      '状态': user.status === 'active' ? '启用' : '禁用',
      '创建时间': new Date(user.createdAt).toLocaleString('zh-CN'),
      '最后登录': user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleString('zh-CN') : '从未登录'
    }))

    return exportData
  }

  return {
    // State
    users,
    isLoading,
    adminLogs,
    
    // Getters
    activeUsers,
    inactiveUsers,
    userStats,
    
    // Actions
    fetchUsers,
    updateUser,
    toggleUserStatus,
    getUserById,
    searchUsers,
    fetchAdminLogs,
    logAdminAction,
    getAdminLogs,
    fetchStats,
    validatePhoneNumber,
    validateAlipayAccount,
    checkDuplicatePhone,
    checkDuplicateAlipay,
    exportUsersToExcel
  }
})
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useAuthStore } from './auth'
import { getApiUrl, logger } from '../utils/config'

export const useOrderStore = defineStore('order', () => {
  // State
  const orders = ref([])
  const isLoading = ref(false)
  const currentOrder = ref(null)

  // Getters
  const userOrders = computed(() => {
    const authStore = useAuthStore()
    if (authStore.isAdmin) {
      return orders.value
    }
    return orders.value.filter(order => order.userId === authStore.user?.id)
  })

  const orderStats = computed(() => {
    const authStore = useAuthStore()
    const relevantOrders = authStore.isAdmin ? orders.value : userOrders.value
    
    return {
      total: relevantOrders.length,
      pending: relevantOrders.filter(o => o.status === 'pending').length,
      completed: relevantOrders.filter(o => o.status === 'completed').length,
      cancelled: relevantOrders.filter(o => o.status === 'cancelled').length
    }
  })


  // Helper function to get auth headers
  const getAuthHeaders = () => {
    const authStore = useAuthStore()
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${authStore.token}`
    }
  }

  // Actions
  const fetchOrders = async () => {
    isLoading.value = true
    try {
      const authStore = useAuthStore()
      // Use the correct endpoint for regular users
      const endpoint = authStore.isAdmin ? '/admin/orders' : '/orders/my-orders'

      const response = await fetch(getApiUrl(endpoint), {
        method: 'GET',
        headers: getAuthHeaders()
      })
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const data = await response.json()
      orders.value = data.orders || []
    } catch (error) {
      console.error('Error fetching orders:', error)
      throw error
    } finally {
      isLoading.value = false
    }
  }

  const createOrder = async (orderData) => {
    try {
      const response = await fetch(getApiUrl('/orders'), {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(orderData)
      })
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const data = await response.json()
      const newOrder = data.order
      orders.value.push(newOrder)
      return newOrder
    } catch (error) {
      console.error('Error creating order:', error)
      throw error
    }
  }

  const updateOrder = async (orderId, updateData) => {
    try {
      const authStore = useAuthStore()

      // Regular users can only cancel orders
      if (!authStore.isAdmin && updateData.status && updateData.status !== 'cancelled') {
        throw new Error('You can only cancel your own orders')
      }

      // Use the appropriate endpoint
      const endpoint = authStore.isAdmin
        ? `/admin/orders/${orderId}`
        : `/orders/${orderId}/cancel`

      const response = await fetch(getApiUrl(endpoint), {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(updateData)
      })
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const data = await response.json()
      const updatedOrder = data.order
      
      const index = orders.value.findIndex(o => o.id === orderId)
      if (index !== -1) {
        orders.value[index] = updatedOrder
      }
      
      return updatedOrder
    } catch (error) {
      console.error('Error updating order:', error)
      throw error
    }
  }

  const cancelOrder = async (orderId) => {
    try {
      return await updateOrder(orderId, { status: 'cancelled' })
    } catch (error) {
      console.error('Error cancelling order:', error)
      throw error
    }
  }

  const completeOrder = async (orderId) => {
    try {
      return await updateOrder(orderId, { status: 'completed' })
    } catch (error) {
      console.error('Error completing order:', error)
      throw error
    }
  }

  const deleteOrder = async (orderId) => {
    try {
      const authStore = useAuthStore()
      if (!authStore.isAdmin) {
        throw new Error('Only admins can delete orders')
      }
      
      const response = await fetch(getApiUrl(`/admin/orders/${orderId}`), {
        method: 'DELETE',
        headers: getAuthHeaders()
      })
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      // Remove from local state
      const index = orders.value.findIndex(o => o.id === orderId)
      if (index !== -1) {
        orders.value.splice(index, 1)
      }
    } catch (error) {
      console.error('Error deleting order:', error)
      throw error
    }
  }

  const getOrderById = (orderId) => {
    return orders.value.find(o => o.id === orderId)
  }

  const getUserOrderHistory = (userId) => {
    return orders.value
      .filter(o => o.userId === userId)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
  }

  const validateTrackingNumber = async (courierId, trackingNumber) => {
    try {
      const response = await fetch(getApiUrl('/validate-tracking'), {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          courierId,
          trackingNumber
        })
      })
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const data = await response.json()
      return data.valid
    } catch (error) {
      console.error('Error validating tracking number:', error)
      // Fallback to basic client-side validation
      return trackingNumber && trackingNumber.length >= 8 && trackingNumber.length <= 30
    }
  }

  const searchOrders = async (searchParams) => {
    try {
      const authStore = useAuthStore()
      // Use my-orders endpoint with query params for regular users
      const endpoint = authStore.isAdmin ? '/admin/orders' : '/orders/my-orders'

      const queryParams = new URLSearchParams()
      Object.entries(searchParams).forEach(([key, value]) => {
        if (value) {
          queryParams.append(key, value)
        }
      })

      const response = await fetch(getApiUrl(`${endpoint}?${queryParams}`), {
        method: 'GET',
        headers: getAuthHeaders()
      })
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const data = await response.json()
      return data.orders || []
    } catch (error) {
      console.error('Error searching orders:', error)
      throw error
    }
  }

  const exportToExcel = () => {
    const exportData = orders.value.map(order => ({
      '订单ID': order.id,
      '用户ID': order.userId,
      '用户姓名': order.user?.realName || '未知用户',
      '用户手机': order.user?.phone || '未知',
      '商品名称': order.product?.name || order.productName || '未知商品',
      '商品价格': order.product?.price || order.price || 0,
      '数量': order.quantity,
      '总金额': order.totalAmount,
      '快递公司': order.courier?.name || order.courierName || '未知快递',
      '快递单号': order.trackingNumber || '暂无',
      '订单状态': order.status === 'pending' ? '待处理' : 
                 order.status === 'completed' ? '已完成' : 
                 order.status === 'cancelled' ? '已取消' : order.status,
      '创建时间': new Date(order.createdAt).toLocaleString('zh-CN'),
      '更新时间': new Date(order.updatedAt).toLocaleString('zh-CN'),
      '备注': order.notes || '无'
    }))

    return exportData
  }

  const getOrderStatistics = async (dateRange = null) => {
    try {
      const authStore = useAuthStore()
      if (!authStore.isAdmin) {
        throw new Error('Only admins can access order statistics')
      }
      
      let url = getApiUrl('/admin/orders/statistics')
      if (dateRange && dateRange.start && dateRange.end) {
        const params = new URLSearchParams({
          startDate: dateRange.start,
          endDate: dateRange.end
        })
        url += `?${params}`
      }
      
      const response = await fetch(url, {
        method: 'GET',
        headers: getAuthHeaders()
      })
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const data = await response.json()
      return data.statistics
    } catch (error) {
      console.error('Error fetching order statistics:', error)
      throw error
    }
  }

  return {
    // State
    orders,
    isLoading,
    currentOrder,
    
    // Getters
    userOrders,
    orderStats,
    
    // Actions
    fetchOrders,
    createOrder,
    updateOrder,
    cancelOrder,
    completeOrder,
    deleteOrder,
    getOrderById,
    getUserOrderHistory,
    validateTrackingNumber,
    searchOrders,
    exportToExcel,
    getOrderStatistics
  }
})
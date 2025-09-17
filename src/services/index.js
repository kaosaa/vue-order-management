import api from './api'

// Authentication API
export const authAPI = {
  // User login
  login: (credentials) => {
    return api.post('/auth/login', credentials)
  },
  
  // User registration
  register: (userData) => {
    return api.post('/auth/register', userData)
  },
  
  // Refresh token
  refreshToken: () => {
    return api.post('/auth/refresh')
  },
  
  // Logout
  logout: () => {
    return api.post('/auth/logout')
  },
  
  // Verify token
  verifyToken: () => {
    return api.get('/auth/verify')
  },
  
  // Get current user profile
  getProfile: () => {
    return api.get('/auth/profile')
  },
  
  // Update user profile
  updateProfile: (userData) => {
    return api.put('/auth/profile', userData)
  }
}

// User management API (Admin only)
export const userAPI = {
  // Get all users
  getUsers: (params = {}) => {
    return api.get('/users', { params })
  },
  
  // Get user by ID
  getUserById: (userId) => {
    return api.get(`/users/${userId}`)
  },
  
  // Update user
  updateUser: (userId, userData) => {
    return api.put(`/users/${userId}`, userData)
  },
  
  // Delete user (soft delete)
  deleteUser: (userId) => {
    return api.delete(`/users/${userId}`)
  },
  
  // Toggle user status (active/inactive)
  toggleUserStatus: (userId) => {
    return api.patch(`/users/${userId}/toggle-status`)
  },
  
  // Search users
  searchUsers: (searchTerm) => {
    return api.get('/users/search', { params: { q: searchTerm } })
  },
  
  // Validate phone number
  validatePhone: (phone) => {
    return api.post('/users/validate-phone', { phone })
  },
  
  // Check if phone exists
  checkPhoneExists: (phone) => {
    return api.get('/users/check-phone', { params: { phone } })
  }
}

// Products API
export const productAPI = {
  // Get all products
  getProducts: (params = {}) => {
    return api.get('/products', { params })
  },
  
  // Get active products only
  getActiveProducts: () => {
    return api.get('/products/active')
  },
  
  // Get product by ID
  getProductById: (productId) => {
    return api.get(`/products/${productId}`)
  },
  
  // Create new product (Admin only)
  createProduct: (productData) => {
    return api.post('/products', productData)
  },
  
  // Update product (Admin only)
  updateProduct: (productId, productData) => {
    return api.put(`/products/${productId}`, productData)
  },
  
  // Delete product (Admin only)
  deleteProduct: (productId) => {
    return api.delete(`/products/${productId}`)
  },
  
  // Toggle product status (Admin only)
  toggleProductStatus: (productId) => {
    return api.patch(`/products/${productId}/toggle-status`)
  }
}

// Couriers API
export const courierAPI = {
  // Get all couriers
  getCouriers: (params = {}) => {
    return api.get('/couriers', { params })
  },
  
  // Get active couriers only
  getActiveCouriers: () => {
    return api.get('/couriers/active')
  },
  
  // Get courier by ID
  getCourierById: (courierId) => {
    return api.get(`/couriers/${courierId}`)
  },
  
  // Create new courier (Admin only)
  createCourier: (courierData) => {
    return api.post('/couriers', courierData)
  },
  
  // Update courier (Admin only)
  updateCourier: (courierId, courierData) => {
    return api.put(`/couriers/${courierId}`, courierData)
  },
  
  // Delete courier (Admin only)
  deleteCourier: (courierId) => {
    return api.delete(`/couriers/${courierId}`)
  },
  
  // Toggle courier status (Admin only)
  toggleCourierStatus: (courierId) => {
    return api.patch(`/couriers/${courierId}/toggle-status`)
  },
  
  // Validate tracking number format
  validateTrackingNumber: (courierId, trackingNumber) => {
    return api.post('/couriers/validate-tracking', { courierId, trackingNumber })
  }
}

// Orders API
export const orderAPI = {
  // Get orders (filtered by user role)
  getOrders: (params = {}) => {
    return api.get('/orders', { params })
  },
  
  // Get user's orders
  getUserOrders: (userId) => {
    return api.get(`/orders/user/${userId}`)
  },
  
  // Get order by ID
  getOrderById: (orderId) => {
    return api.get(`/orders/${orderId}`)
  },
  
  // Create new order
  createOrder: (orderData) => {
    return api.post('/orders', orderData)
  },
  
  // Update order (Admin only)
  updateOrder: (orderId, orderData) => {
    return api.put(`/orders/${orderId}`, orderData)
  },
  
  // Cancel order
  cancelOrder: (orderId) => {
    return api.patch(`/orders/${orderId}/cancel`)
  },
  
  // Complete order (Admin only)
  completeOrder: (orderId) => {
    return api.patch(`/orders/${orderId}/complete`)
  },
  
  // Get order statistics
  getOrderStats: () => {
    return api.get('/orders/stats')
  },
  
  // Export orders to Excel
  exportOrders: (params = {}) => {
    return api.get('/orders/export', { 
      params,
      responseType: 'blob' // For file download
    })
  }
}

// General API utilities
export const utilAPI = {
  // Health check
  healthCheck: () => {
    return api.get('/health')
  },
  
  // Get system statistics
  getSystemStats: () => {
    return api.get('/stats')
  },
  
  // Upload file
  uploadFile: (file, type = 'general') => {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('type', type)
    
    return api.post('/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
  }
}

// Export all APIs
export default {
  auth: authAPI,
  user: userAPI,
  product: productAPI,
  courier: courierAPI,
  order: orderAPI,
  util: utilAPI
}
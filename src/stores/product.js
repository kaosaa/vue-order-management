import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useAuthStore } from './auth'
import { getApiUrl, logger } from '../utils/config'

export const useProductStore = defineStore('product', () => {
  // State
  const products = ref([])
  const couriers = ref([])
  const isLoading = ref(false)

  // Getters
  const activeProducts = computed(() => products.value.filter(p => p.status === 'active'))
  const activeCouriers = computed(() => couriers.value.filter(c => c.status === 'active'))


  // Helper function to get auth headers
  const getAuthHeaders = () => {
    const authStore = useAuthStore()
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${authStore.token}`
    }
  }

  // Actions
  const fetchProducts = async () => {
    isLoading.value = true
    try {
      const response = await fetch(getApiUrl('/admin/products'), {
        method: 'GET',
        headers: getAuthHeaders()
      })
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const data = await response.json()
      products.value = data.products || []
    } catch (error) {
      console.error('Error fetching products:', error)
      throw error
    } finally {
      isLoading.value = false
    }
  }

  const fetchCouriers = async () => {
    isLoading.value = true
    try {
      const response = await fetch(getApiUrl('/admin/couriers'), {
        method: 'GET',
        headers: getAuthHeaders()
      })
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const data = await response.json()
      couriers.value = data.couriers || []
    } catch (error) {
      console.error('Error fetching couriers:', error)
      throw error
    } finally {
      isLoading.value = false
    }
  }

  const addProduct = async (productData) => {
    try {
      const response = await fetch(getApiUrl('/admin/products'), {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(productData)
      })
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const data = await response.json()
      const newProduct = data.product
      products.value.push(newProduct)
      return newProduct
    } catch (error) {
      console.error('Error adding product:', error)
      throw error
    }
  }

  const updateProduct = async (productId, productData) => {
    try {
      const response = await fetch(getApiUrl(`/admin/products/${productId}`), {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(productData)
      })
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const data = await response.json()
      const updatedProduct = data.product
      
      const index = products.value.findIndex(p => p.id === productId)
      if (index !== -1) {
        products.value[index] = updatedProduct
      }
      
      return updatedProduct
    } catch (error) {
      console.error('Error updating product:', error)
      throw error
    }
  }

  const deleteProduct = async (productId) => {
    try {
      const response = await fetch(getApiUrl(`/admin/products/${productId}`), {
        method: 'DELETE',
        headers: getAuthHeaders()
      })
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      // Remove from local state
      const index = products.value.findIndex(p => p.id === productId)
      if (index !== -1) {
        products.value.splice(index, 1)
      }
    } catch (error) {
      console.error('Error deleting product:', error)
      throw error
    }
  }

  const addCourier = async (courierData) => {
    try {
      const response = await fetch(getApiUrl('/admin/couriers'), {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(courierData)
      })
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const data = await response.json()
      const newCourier = data.courier
      couriers.value.push(newCourier)
      return newCourier
    } catch (error) {
      console.error('Error adding courier:', error)
      throw error
    }
  }

  const updateCourier = async (courierId, courierData) => {
    try {
      const response = await fetch(getApiUrl(`/admin/couriers/${courierId}`), {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(courierData)
      })
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const data = await response.json()
      const updatedCourier = data.courier
      
      const index = couriers.value.findIndex(c => c.id === courierId)
      if (index !== -1) {
        couriers.value[index] = updatedCourier
      }
      
      return updatedCourier
    } catch (error) {
      console.error('Error updating courier:', error)
      throw error
    }
  }

  const deleteCourier = async (courierId) => {
    try {
      const response = await fetch(getApiUrl(`/admin/couriers/${courierId}`), {
        method: 'DELETE',
        headers: getAuthHeaders()
      })
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      // Remove from local state
      const index = couriers.value.findIndex(c => c.id === courierId)
      if (index !== -1) {
        couriers.value.splice(index, 1)
      }
    } catch (error) {
      console.error('Error deleting courier:', error)
      throw error
    }
  }

  const getCourierById = (courierId) => {
    return couriers.value.find(c => c.id === courierId)
  }

  const getProductById = (productId) => {
    return products.value.find(p => p.id === productId)
  }

  return {
    // State
    products,
    couriers,
    isLoading,
    
    // Getters
    activeProducts,
    activeCouriers,
    
    // Actions
    fetchProducts,
    fetchCouriers,
    addProduct,
    updateProduct,
    deleteProduct,
    addCourier,
    updateCourier,
    deleteCourier,
    getCourierById,
    getProductById
  }
})
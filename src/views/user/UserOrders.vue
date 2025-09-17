<template>
  <div class="user-orders">
    <!-- Page Header -->
    <div class="page-header">
      <div class="header-content">
        <h1>创建订单</h1>
        <p>填写订单信息，快速下单</p>
      </div>
      <div class="header-actions">
        <el-button @click="resetForm" :disabled="isSubmitting">
          <el-icon><Refresh /></el-icon>
          重置表单
        </el-button>
      </div>
    </div>

    <!-- Order Form -->
    <div class="order-form-container">
      <el-card class="form-card">
        <el-form
          ref="orderFormRef"
          :model="orderForm"
          :rules="orderRules"
          label-width="120px"
          label-position="left"
        >
          <!-- Product Selection -->
          <el-form-item label="选择商品" prop="productId">
            <el-select
              v-model="orderForm.productId"
              placeholder="请选择商品"
              @change="onProductChange"
              style="width: 100%"
            >
              <el-option
                v-for="product in products"
                :key="product.id"
                :label="product.name"
                :value="product.id"
                :disabled="product.status !== 'active'"
              >
                <div class="product-option">
                  <span class="product-name">{{ product.name }}</span>
                  <span class="product-price">¥{{ product.price }}</span>
                </div>
              </el-option>
            </el-select>
          </el-form-item>

          <!-- Product Info Display -->
          <el-form-item v-if="selectedProduct" label="商品详情">
            <el-card class="product-info-card">
              <div class="product-details">
                <div class="detail-item">
                  <span class="detail-label">商品名称：</span>
                  <span class="detail-value">{{ selectedProduct.name }}</span>
                </div>
                <div class="detail-item">
                  <span class="detail-label">单价：</span>
                  <span class="detail-value price">¥{{ selectedProduct.price }}</span>
                </div>
                <div class="detail-item" v-if="selectedProduct.description">
                  <span class="detail-label">描述：</span>
                  <span class="detail-value">{{ selectedProduct.description }}</span>
                </div>
              </div>
            </el-card>
          </el-form-item>

          <!-- Quantity -->
          <el-form-item label="购买数量" prop="quantity">
            <el-input-number
              v-model="orderForm.quantity"
              :min="1"
              :max="999"
              @change="calculateTotal"
              style="width: 200px"
            />
            <span class="quantity-hint">请输入购买数量</span>
          </el-form-item>

          <!-- Courier Selection -->
          <el-form-item label="快递公司" prop="courierId">
            <el-select
              v-model="orderForm.courierId"
              placeholder="请选择快递公司"
              style="width: 100%"
            >
              <el-option
                v-for="courier in couriers"
                :key="courier.id"
                :label="courier.name"
                :value="courier.id"
                :disabled="courier.status !== 'active'"
              >
                <div class="courier-option">
                  <span>{{ courier.name }}</span>
                  <el-tag size="small" type="info" v-if="courier.code">
                    {{ courier.code }}
                  </el-tag>
                </div>
              </el-option>
            </el-select>
          </el-form-item>

          <!-- Tracking Number -->
          <el-form-item label="快递单号" prop="trackingNumber">
            <el-input
              v-model="orderForm.trackingNumber"
              placeholder="请输入快递单号"
              maxlength="50"
              show-word-limit
            >
              <template #prefix>
                <el-icon><Document /></el-icon>
              </template>
            </el-input>
            <div class="tracking-hint" v-if="selectedCourier">
              {{ selectedCourier.name }} 单号长度：{{ selectedCourier.tracking_length || '不限' }}位
            </div>
          </el-form-item>

          <!-- Notes -->
          <el-form-item label="备注信息" prop="notes">
            <el-input
              v-model="orderForm.notes"
              type="textarea"
              :rows="3"
              placeholder="请输入备注信息（选填）"
              maxlength="200"
              show-word-limit
            />
          </el-form-item>

          <!-- Total Amount -->
          <el-form-item label="订单总额">
            <div class="total-amount">
              <span class="amount-label">¥</span>
              <span class="amount-value">{{ totalAmount.toFixed(2) }}</span>
            </div>
          </el-form-item>

          <!-- Submit Button -->
          <el-form-item>
            <el-button
              type="primary"
              @click="submitOrder"
              :loading="isSubmitting"
              size="large"
              style="width: 200px"
            >
              <el-icon v-if="!isSubmitting"><Check /></el-icon>
              {{ isSubmitting ? '提交中...' : '提交订单' }}
            </el-button>
            <el-button @click="resetForm" size="large" :disabled="isSubmitting">
              重置
            </el-button>
          </el-form-item>
        </el-form>
      </el-card>
    </div>

    <!-- Recent Orders -->
    <div class="recent-orders-section" v-if="recentOrders.length > 0">
      <h2>最近订单</h2>
      <el-table :data="recentOrders" style="width: 100%">
        <el-table-column prop="productName" label="商品名称" />
        <el-table-column prop="quantity" label="数量" width="80" />
        <el-table-column prop="totalAmount" label="金额" width="120">
          <template #default="scope">
            ¥{{ scope.row.totalAmount }}
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="100">
          <template #default="scope">
            <el-tag :type="getStatusType(scope.row.status)">
              {{ getStatusText(scope.row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="createdAt" label="创建时间" width="180">
          <template #default="scope">
            {{ formatDate(scope.row.createdAt) }}
          </template>
        </el-table-column>
      </el-table>
    </div>
  </div>
</template>

<script>
import { ref, reactive, computed, onMounted } from 'vue'
import { useAuthStore } from '../../stores/auth'
import { ElMessage, ElMessageBox } from 'element-plus'
import { formatDate, formatDateTime } from '@/utils/time'
import { getApiUrl } from '@/utils/config'

export default {
  name: 'UserOrders',
  setup() {
    const authStore = useAuthStore()
    const orderFormRef = ref()

    // State
    const isSubmitting = ref(false)
    const products = ref([])
    const couriers = ref([])
    const recentOrders = ref([])

    const orderForm = reactive({
      productId: null,
      quantity: 1,
      courierId: null,
      trackingNumber: '',
      notes: ''
    })

    const orderRules = {
      productId: [
        { required: true, message: '请选择商品', trigger: 'change' }
      ],
      quantity: [
        { required: true, message: '请输入购买数量', trigger: 'blur' },
        { type: 'number', min: 1, message: '数量至少为1', trigger: 'blur' }
      ],
      courierId: [
        { required: true, message: '请选择快递公司', trigger: 'change' }
      ],
      trackingNumber: [
        { required: true, message: '请输入快递单号', trigger: 'blur' },
        { min: 5, max: 50, message: '快递单号长度在5-50个字符', trigger: 'blur' }
      ]
    }

    // Computed
    const selectedProduct = computed(() => {
      if (!orderForm.productId) return null
      return products.value.find(p => p.id === orderForm.productId)
    })

    const selectedCourier = computed(() => {
      if (!orderForm.courierId) return null
      return couriers.value.find(c => c.id === orderForm.courierId)
    })

    const totalAmount = computed(() => {
      if (!selectedProduct.value) return 0
      return selectedProduct.value.price * orderForm.quantity
    })

    // Methods
    const loadProducts = async () => {
      try {
        const response = await fetch(getApiUrl('/products'), {
          headers: {
            'Authorization': `Bearer ${authStore.token}`
          }
        })

        if (response.ok) {
          const data = await response.json()
          products.value = data.products || []
        }
      } catch (error) {
        console.error('Failed to load products:', error)
        ElMessage.error('加载商品列表失败')
      }
    }

    const loadCouriers = async () => {
      try {
        const response = await fetch(getApiUrl('/couriers'), {
          headers: {
            'Authorization': `Bearer ${authStore.token}`
          }
        })

        if (response.ok) {
          const data = await response.json()
          couriers.value = data.couriers || []
        }
      } catch (error) {
        console.error('Failed to load couriers:', error)
        ElMessage.error('加载快递公司列表失败')
      }
    }

    const loadRecentOrders = async () => {
      try {
        const response = await fetch(getApiUrl('/orders/my-orders?limit=5'), {
          headers: {
            'Authorization': `Bearer ${authStore.token}`
          }
        })

        if (response.ok) {
          const data = await response.json()
          recentOrders.value = data.orders || []
        }
      } catch (error) {
        console.error('Failed to load recent orders:', error)
      }
    }

    const onProductChange = () => {
      calculateTotal()
    }

    const calculateTotal = () => {
      // Trigger computed recalculation
    }

    const submitOrder = async () => {
      try {
        const valid = await orderFormRef.value.validate()
        if (!valid) return

        await ElMessageBox.confirm(
          `确认提交订单？订单总额：¥${totalAmount.value.toFixed(2)}`,
          '确认订单',
          {
            confirmButtonText: '确认',
            cancelButtonText: '取消',
            type: 'warning'
          }
        )

        isSubmitting.value = true

        const response = await fetch(getApiUrl('/orders'), {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authStore.token}`
          },
          body: JSON.stringify({
            product_id: orderForm.productId,
            quantity: orderForm.quantity,
            courier_id: orderForm.courierId,
            tracking_number: orderForm.trackingNumber,
            notes: orderForm.notes || ''
          })
        })

        if (!response.ok) {
          const error = await response.json()
          throw new Error(error.error || '提交订单失败')
        }

        const data = await response.json()
        ElMessage.success('订单提交成功！')

        // Reset form and reload recent orders
        resetForm()
        loadRecentOrders()

      } catch (error) {
        if (error.message !== 'cancel') {
          ElMessage.error(error.message || '提交订单失败，请稍后重试')
        }
      } finally {
        isSubmitting.value = false
      }
    }

    const resetForm = () => {
      orderFormRef.value?.resetFields()
      orderForm.productId = null
      orderForm.quantity = 1
      orderForm.courierId = null
      orderForm.trackingNumber = ''
      orderForm.notes = ''
    }

    const getStatusType = (status) => {
      const types = {
        'pending': 'warning',
        'completed': 'success',
        'cancelled': 'danger'
      }
      return types[status] || 'info'
    }

    const getStatusText = (status) => {
      const texts = {
        'pending': '待处理',
        'completed': '已完成',
        'cancelled': '已取消'
      }
      return texts[status] || status
    }


    onMounted(() => {
      loadProducts()
      loadCouriers()
      loadRecentOrders()
    })

    return {
      orderFormRef,
      orderForm,
      orderRules,
      isSubmitting,
      products,
      couriers,
      recentOrders,
      selectedProduct,
      selectedCourier,
      totalAmount,
      onProductChange,
      calculateTotal,
      submitOrder,
      resetForm,
      getStatusType,
      getStatusText,
      formatDate
    }
  }
}
</script>

<style scoped>
.user-orders {
  padding: 24px;
  background: #f5f7fa;
  min-height: calc(100vh - 60px);
}

/* Page Header */
.page-header {
  background: white;
  border-radius: 12px;
  padding: 24px;
  margin-bottom: 24px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
}

.header-content h1 {
  margin: 0 0 8px 0;
  font-size: 24px;
  font-weight: 600;
  color: #1a202c;
}

.header-content p {
  margin: 0;
  color: #718096;
  font-size: 14px;
}

/* Form Card */
.order-form-container {
  max-width: 800px;
  margin: 0 auto;
}

.form-card {
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  border-radius: 12px;
}

/* Product Option */
.product-option {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
}

.product-name {
  flex: 1;
}

.product-price {
  color: #f56565;
  font-weight: 500;
}

/* Product Info Card */
.product-info-card {
  background: #f8fafc;
  border: none;
  box-shadow: none;
}

.product-details {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.detail-item {
  display: flex;
  align-items: center;
}

.detail-label {
  color: #718096;
  min-width: 80px;
}

.detail-value {
  color: #1a202c;
  font-weight: 500;
}

.detail-value.price {
  color: #f56565;
  font-size: 18px;
  font-weight: 600;
}

/* Quantity */
.quantity-hint {
  margin-left: 12px;
  color: #718096;
  font-size: 13px;
}

/* Courier Option */
.courier-option {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
}

/* Tracking Hint */
.tracking-hint {
  margin-top: 8px;
  font-size: 12px;
  color: #718096;
}

/* Total Amount */
.total-amount {
  display: flex;
  align-items: baseline;
  font-size: 32px;
  font-weight: 700;
  color: #f56565;
}

.amount-label {
  font-size: 20px;
  margin-right: 4px;
}

/* Recent Orders Section */
.recent-orders-section {
  margin-top: 40px;
  background: white;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
}

.recent-orders-section h2 {
  margin: 0 0 20px 0;
  font-size: 20px;
  font-weight: 600;
  color: #1a202c;
}

/* Form Item Styling */
:deep(.el-form-item__label) {
  font-weight: 500;
  color: #4a5568;
}

/* Responsive */
@media (max-width: 768px) {
  .page-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 16px;
  }

  .order-form-container {
    max-width: 100%;
  }

  .total-amount {
    font-size: 24px;
  }
}
</style>
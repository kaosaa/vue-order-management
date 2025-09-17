<template>
  <div class="order-management responsive-container">
    <!-- Header -->
    <div class="page-header">
      <h2>订单管理</h2>
      <div class="header-actions responsive-search">
        <el-input
          v-model="searchKeyword"
          placeholder="搜索订单号、用户姓名"
          clearable
          class="search-input"
          @input="handleSearch"
        >
          <template #prefix>
            <el-icon><Search /></el-icon>
          </template>
        </el-input>

        <el-button @click="refreshData">
          <el-icon><Refresh /></el-icon>
          <span class="hide-on-mobile">刷新数据</span>
        </el-button>
      </div>
    </div>

    <!-- Statistics Cards -->
    <div class="responsive-stats">
      <el-card class="stat-card">
        <div class="stat-item">
            <div class="stat-icon total">
              <el-icon><Document /></el-icon>
            </div>
            <div class="stat-content">
              <h3>{{ orderStats.total }}</h3>
              <p>订单总数</p>
            </div>
          </div>
        </el-card>
      </el-col>
      
      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-item">
            <div class="stat-icon pending">
              <el-icon><Clock /></el-icon>
            </div>
            <div class="stat-content">
              <h3>{{ orderStats.pending }}</h3>
              <p>待处理</p>
            </div>
          </div>
        </el-card>
      </el-col>

      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-item">
            <div class="stat-icon processing">
              <el-icon><Money /></el-icon>
            </div>
            <div class="stat-content">
              <h3>{{ orderStats.processing }}</h3>
              <p>待结算</p>
            </div>
          </div>
        </el-card>
      </el-col>

      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-item">
            <div class="stat-icon completed">
              <el-icon><CircleCheck /></el-icon>
            </div>
            <div class="stat-content">
              <h3>{{ orderStats.completed }}</h3>
              <p>已完成</p>
            </div>
          </div>
        </el-card>
      </el-col>
      
      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-item">
            <div class="stat-icon cancelled">
              <el-icon><CircleClose /></el-icon>
            </div>
            <div class="stat-content">
              <h3>{{ orderStats.cancelled }}</h3>
              <p>已作废</p>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- Order Table -->
    <el-card>
      <template #header>
        <div class="card-header">
          <span>订单列表</span>
          <div class="header-tools">
            <el-select v-model="statusFilter" placeholder="筛选状态" clearable style="width: 120px; margin-right: 16px">
              <el-option label="全部" value="" />
              <el-option label="待处理" value="pending" />
              <el-option label="待结算" value="processing" />
              <el-option label="已完成" value="completed" />
              <el-option label="已作废" value="cancelled" />
            </el-select>
            
            <el-date-picker
              v-model="dateRange"
              type="daterange"
              range-separator="至"
              start-placeholder="开始日期"
              end-placeholder="结束日期"
              format="YYYY-MM-DD"
              value-format="YYYY-MM-DD"
              style="width: 240px"
              @change="handleDateChange"
            />
          </div>
        </div>
      </template>

      <div class="responsive-table">
        <el-table
          :data="filteredOrders"
          v-loading="loading"
          style="width: 100%"
          :default-sort="{ prop: 'createdAt', order: 'descending' }"
        >
        <el-table-column prop="id" label="订单号" width="100" sortable>
          <template #default="{ row }">
            <div style="font-family: monospace; font-weight: 500">
              #{{ row.id.toString().padStart(4, '0') }}
            </div>
          </template>
        </el-table-column>
        
        <el-table-column prop="userName" label="用户信息" min-width="150">
          <template #default="{ row }">
            <div style="display: flex; align-items: center">
              <el-avatar :size="32" style="margin-right: 8px">
                {{ row.user?.realName?.charAt(0) || 'U' }}
              </el-avatar>
              <div>
                <div style="font-weight: 500; color: #303133">{{ row.user?.realName || '未知用户' }}</div>
                <div style="font-size: 12px; color: #909399">{{ formatPhone(row.user?.phone) }}</div>
              </div>
            </div>
          </template>
        </el-table-column>
        
        <el-table-column prop="productName" label="商品信息" min-width="180">
          <template #default="{ row }">
            <div>
              <div style="font-weight: 500; color: #303133">{{ row.product?.name || '未知商品' }}</div>
              <div style="font-size: 12px; color: #909399">
                数量: {{ row.quantity }} | 单价: ¥{{ (row.product?.price || 0).toFixed(2) }}
              </div>
            </div>
          </template>
        </el-table-column>
        
        <el-table-column prop="totalAmount" label="总金额" width="120" sortable>
          <template #default="{ row }">
            <div style="font-family: monospace; font-weight: 500; color: #f56c6c">
              ¥{{ row.totalAmount.toFixed(2) }}
            </div>
          </template>
        </el-table-column>
        
        <el-table-column prop="courierInfo" label="快递信息" width="160">
          <template #default="{ row }">
            <div>
              <div style="font-weight: 500">{{ row.courier?.name || '未知快递' }}</div>
              <div style="font-size: 12px; color: #909399; font-family: monospace">
                {{ row.trackingNumber || '暂无单号' }}
              </div>
            </div>
          </template>
        </el-table-column>
        
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="getStatusTagType(row.status)">
              {{ getStatusLabel(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        
        <el-table-column prop="createdAt" label="下单时间" width="160" sortable>
          <template #default="{ row }">
            {{ formatDate(row.createdAt) }}
          </template>
        </el-table-column>
        
        <el-table-column prop="updatedAt" label="更新时间" width="160">
          <template #default="{ row }">
            {{ formatDate(row.updatedAt) }}
          </template>
        </el-table-column>
        
        <el-table-column label="操作" width="280" fixed="right">
          <template #default="{ row }">
            <div class="action-buttons">
              <!-- 查看详情按钮 - 所有状态都显示 -->
              <el-button
                size="small"
                type="info"
                plain
                @click="viewOrder(row)"
              >
                <el-icon><View /></el-icon>
                查看详情
              </el-button>

              <!-- 编辑按钮 - 仅待处理状态显示 -->
              <el-button
                size="small"
                type="primary"
                @click="editOrder(row)"
                v-if="row.status === 'pending'"
              >
                <el-icon><Edit /></el-icon>
                编辑
              </el-button>

              <!-- 更多操作下拉 - 仅非已完成状态显示 -->
              <el-dropdown
                @command="handleOrderAction"
                trigger="click"
                v-if="row.status !== 'completed'"
              >
                <el-button size="small" type="warning">
                  更多操作
                  <el-icon class="el-icon--right"><ArrowDown /></el-icon>
                </el-button>
                <template #dropdown>
                  <el-dropdown-menu>
                    <el-dropdown-item
                      :command="{ action: 'complete', order: row }"
                      v-if="row.status === 'pending'"
                    >
                      <el-icon><CircleCheck /></el-icon>
                      标记完成
                    </el-dropdown-item>
                    <el-dropdown-item
                      :command="{ action: 'cancel', order: row }"
                      v-if="row.status === 'pending'"
                    >
                      <el-icon><CircleClose /></el-icon>
                      取消订单
                    </el-dropdown-item>
                    <el-dropdown-item
                      :command="{ action: 'reopen', order: row }"
                      v-if="row.status === 'cancelled'"
                    >
                      <el-icon><RefreshLeft /></el-icon>
                      重新开启
                    </el-dropdown-item>
                  </el-dropdown-menu>
                </template>
              </el-dropdown>
            </div>
          </template>
        </el-table-column>
        </el-table>
      </div>

      <!-- Pagination -->
      <div style="margin-top: 20px; text-align: center">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :page-sizes="[10, 20, 50, 100]"
          :total="totalOrders"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </el-card>

    <!-- Order Detail Dialog -->
    <el-dialog
      v-model="detailDialogVisible"
      title="订单详情"
      width="600px"
    >
      <div v-if="selectedOrder" class="order-detail">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="订单号">
            <span style="font-family: monospace; font-weight: 500">
              #{{ selectedOrder.id.toString().padStart(4, '0') }}
            </span>
          </el-descriptions-item>
          <el-descriptions-item label="订单状态">
            <el-tag :type="getStatusTagType(selectedOrder.status)">
              {{ getStatusLabel(selectedOrder.status) }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="用户姓名">{{ selectedOrder.user?.realName }}</el-descriptions-item>
          <el-descriptions-item label="联系电话">{{ formatPhone(selectedOrder.user?.phone) }}</el-descriptions-item>
          <el-descriptions-item label="支付宝账户">{{ selectedOrder.user?.alipayAccount }}</el-descriptions-item>
          <el-descriptions-item label="商品名称">{{ selectedOrder.product?.name }}</el-descriptions-item>
          <el-descriptions-item label="商品单价">¥{{ (selectedOrder.product?.price || 0).toFixed(2) }}</el-descriptions-item>
          <el-descriptions-item label="购买数量">{{ selectedOrder.quantity }}</el-descriptions-item>
          <el-descriptions-item label="订单总额">
            <span style="font-weight: 500; color: #f56c6c">
              ¥{{ selectedOrder.totalAmount.toFixed(2) }}
            </span>
          </el-descriptions-item>
          <el-descriptions-item label="快递公司">{{ selectedOrder.courier?.name }}</el-descriptions-item>
          <el-descriptions-item label="快递单号" :span="2">
            <span style="font-family: monospace">{{ selectedOrder.trackingNumber || '暂未填写' }}</span>
          </el-descriptions-item>
          <el-descriptions-item label="下单时间">{{ formatDate(selectedOrder.createdAt) }}</el-descriptions-item>
          <el-descriptions-item label="更新时间">{{ formatDate(selectedOrder.updatedAt) }}</el-descriptions-item>
          <el-descriptions-item label="备注说明" :span="2">
            {{ selectedOrder.notes || '无' }}
          </el-descriptions-item>
        </el-descriptions>
      </div>
    </el-dialog>

    <!-- Edit Order Dialog -->
    <el-dialog
      v-model="editDialogVisible"
      title="编辑订单"
      width="500px"
      @close="closeEditDialog"
    >
      <el-form
        ref="editFormRef"
        :model="editForm"
        :rules="editRules"
        label-width="100px"
      >
        <el-form-item label="商品" prop="productId">
          <el-select v-model="editForm.productId" placeholder="选择商品" style="width: 100%">
            <el-option 
              v-for="product in availableProducts" 
              :key="product.id" 
              :label="product.name" 
              :value="product.id"
            >
              <span>{{ product.name }}</span>
              <span style="float: right; color: #8492a6; font-size: 13px">¥{{ product.price.toFixed(2) }}</span>
            </el-option>
          </el-select>
        </el-form-item>
        
        <el-form-item label="数量" prop="quantity">
          <el-input-number
            v-model="editForm.quantity"
            :min="1"
            :max="999"
            :step="1"
            style="width: 100%"
          />
        </el-form-item>
        
        <el-form-item label="快递公司" prop="courierId">
          <el-select v-model="editForm.courierId" placeholder="选择快递公司" style="width: 100%">
            <el-option 
              v-for="courier in availableCouriers" 
              :key="courier.id" 
              :label="courier.name" 
              :value="courier.id"
            />
          </el-select>
        </el-form-item>
        
        <el-form-item label="快递单号" prop="trackingNumber">
          <el-input
            v-model="editForm.trackingNumber"
            placeholder="请输入快递单号"
            maxlength="30"
            clearable
          />
        </el-form-item>

        <el-form-item label="订单状态" prop="status">
          <el-select v-model="editForm.status" placeholder="选择订单状态" style="width: 100%">
            <el-option label="待处理" value="pending" />
            <el-option label="待结算" value="processing" />
            <el-option label="已完成" value="completed" />
            <el-option label="已作废" value="cancelled" />
          </el-select>
          <div style="font-size: 12px; color: #909399; margin-top: 4px">
            正常流程：待处理 → 待结算 → 已完成
          </div>
        </el-form-item>

        <el-form-item label="备注说明">
          <el-input
            v-model="editForm.notes"
            type="textarea"
            placeholder="请输入备注说明（可选）"
            :rows="3"
            maxlength="200"
            show-word-limit
          />
        </el-form-item>
      </el-form>
      
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="closeEditDialog">取消</el-button>
          <el-button type="primary" @click="saveOrder" :loading="saving">
            保存
          </el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script>
import { ref, computed, onMounted, reactive } from 'vue'
import { useOrderStore } from '../../stores/order'
import { useProductStore } from '../../stores/product'
import { useAdminStore } from '../../stores/admin'
import { ElMessage, ElMessageBox } from 'element-plus'
import { formatDate, formatDateTime } from '@/utils/time'

export default {
  name: 'OrderManagement',
  setup() {
    const orderStore = useOrderStore()
    const productStore = useProductStore()
    const adminStore = useAdminStore()
    
    const loading = ref(false)
    const saving = ref(false)
    const searchKeyword = ref('')
    const statusFilter = ref('')
    const dateRange = ref([])
    const currentPage = ref(1)
    const pageSize = ref(20)
    const totalOrders = ref(0)
    
    const detailDialogVisible = ref(false)
    const editDialogVisible = ref(false)
    const selectedOrder = ref(null)
    const editFormRef = ref()
    
    const editForm = reactive({
      productId: '',
      quantity: 1,
      courierId: '',
      trackingNumber: '',
      notes: '',
      status: 'pending'
    })
    
    const editRules = {
      productId: [
        { required: true, message: '请选择商品', trigger: 'change' }
      ],
      quantity: [
        { required: true, message: '请输入数量', trigger: 'blur' },
        { type: 'number', min: 1, max: 999, message: '数量范围：1-999', trigger: 'blur' }
      ],
      courierId: [
        { required: true, message: '请选择快递公司', trigger: 'change' }
      ]
    }

    const orders = computed(() => orderStore.orders)
    const availableProducts = computed(() => productStore.products.filter(p => p.status === 'active'))
    const availableCouriers = computed(() => productStore.couriers.filter(c => c.status === 'active'))
    
    const orderStats = computed(() => {
      const total = orders.value.length
      const pending = orders.value.filter(o => o.status === 'pending').length
      const processing = orders.value.filter(o => o.status === 'processing').length
      const completed = orders.value.filter(o => o.status === 'completed').length
      const cancelled = orders.value.filter(o => o.status === 'cancelled').length

      return { total, pending, processing, completed, cancelled }
    })

    const filteredOrders = computed(() => {
      let filtered = orders.value.filter(order => {
        // 搜索过滤
        if (searchKeyword.value) {
          const keyword = searchKeyword.value.toLowerCase()
          const orderId = order.id.toString().padStart(4, '0')
          const userName = order.user?.realName?.toLowerCase() || ''
          const trackingNumber = order.trackingNumber?.toLowerCase() || ''
          
          if (!orderId.includes(keyword) && 
              !userName.includes(keyword) && 
              !trackingNumber.includes(keyword)) {
            return false
          }
        }
        
        // 状态过滤
        if (statusFilter.value && order.status !== statusFilter.value) {
          return false
        }
        
        // 日期过滤
        if (dateRange.value && dateRange.value.length === 2) {
          const orderDate = new Date(order.createdAt).toISOString().split('T')[0]
          if (orderDate < dateRange.value[0] || orderDate > dateRange.value[1]) {
            return false
          }
        }
        
        return true
      })
      
      totalOrders.value = filtered.length
      
      // 分页
      const start = (currentPage.value - 1) * pageSize.value
      const end = start + pageSize.value
      
      return filtered.slice(start, end)
    })

    const formatPhone = (phone) => {
      if (!phone) return ''
      return `${phone.slice(0, 3)} ${phone.slice(3, 7)} ${phone.slice(7)}`
    }

    const getStatusLabel = (status) => {
      const labels = {
        pending: '待处理',
        processing: '待结算',
        completed: '已完成',
        cancelled: '已作废'
      }
      return labels[status] || status
    }

    const getStatusTagType = (status) => {
      const types = {
        pending: 'warning',
        processing: 'info',
        completed: 'success',
        cancelled: 'danger'
      }
      return types[status] || ''
    }

    const handleSearch = () => {
      currentPage.value = 1
    }
    
    const handleDateChange = () => {
      currentPage.value = 1
    }
    
    const handleSizeChange = (size) => {
      pageSize.value = size
      currentPage.value = 1
    }
    
    const handleCurrentChange = (page) => {
      currentPage.value = page
    }

    const refreshData = async () => {
      try {
        loading.value = true
        await Promise.all([
          orderStore.fetchOrders(),
          productStore.fetchProducts(),
          productStore.fetchCouriers(),
          adminStore.fetchUsers()
        ])
        ElMessage.success('数据刷新成功')
      } catch (error) {
        ElMessage.error('刷新数据失败')
      } finally {
        loading.value = false
      }
    }

    const viewOrder = (order) => {
      selectedOrder.value = order
      detailDialogVisible.value = true
    }

    const editOrder = (order) => {
      selectedOrder.value = order
      editForm.productId = order.productId
      editForm.quantity = order.quantity
      editForm.courierId = order.courierId
      editForm.trackingNumber = order.trackingNumber || ''
      editForm.notes = order.notes || ''
      editForm.status = order.status || 'pending'
      editDialogVisible.value = true
    }

    const closeEditDialog = () => {
      editDialogVisible.value = false
      selectedOrder.value = null
      if (editFormRef.value) {
        editFormRef.value.resetFields()
      }
    }

    const saveOrder = async () => {
      try {
        const valid = await editFormRef.value.validate()
        if (!valid) return

        saving.value = true
        
        const selectedProduct = availableProducts.value.find(p => p.id === editForm.productId)
        const orderData = {
          productId: editForm.productId,
          quantity: editForm.quantity,
          courierId: editForm.courierId,
          trackingNumber: editForm.trackingNumber.trim(),
          notes: editForm.notes.trim(),
          status: editForm.status,
          totalAmount: selectedProduct ? selectedProduct.price * editForm.quantity : 0
        }
        
        await orderStore.updateOrder(selectedOrder.value.id, orderData)
        ElMessage.success('订单更新成功')
        closeEditDialog()
        await refreshData()
        
      } catch (error) {
        ElMessage.error('更新订单失败')
      } finally {
        saving.value = false
      }
    }

    const handleOrderAction = async ({ action, order }) => {
      try {
        let confirmText = ''
        let successText = ''
        
        switch (action) {
          case 'complete':
            confirmText = `确定要标记订单 #${order.id.toString().padStart(4, '0')} 为已完成吗？`
            successText = '订单已标记为完成'
            break
          case 'cancel':
            confirmText = `确定要取消订单 #${order.id.toString().padStart(4, '0')} 吗？`
            successText = '订单已取消'
            break
          case 'reopen':
            confirmText = `确定要重新开启订单 #${order.id.toString().padStart(4, '0')} 吗？`
            successText = '订单已重新开启'
            break
        }
        
        await ElMessageBox.confirm(confirmText, '确认操作', {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        })
        
        const statusMap = {
          complete: 'completed',
          cancel: 'cancelled',
          reopen: 'pending'
        }
        
        await orderStore.updateOrder(order.id, { status: statusMap[action] })
        ElMessage.success(successText)
        await refreshData()
        
      } catch (error) {
        if (error !== 'cancel') {
          ElMessage.error('操作失败')
        }
      }
    }

    onMounted(() => {
      refreshData()
    })

    return {
      loading,
      saving,
      searchKeyword,
      statusFilter,
      dateRange,
      currentPage,
      pageSize,
      totalOrders,
      orders,
      orderStats,
      filteredOrders,
      availableProducts,
      availableCouriers,
      detailDialogVisible,
      editDialogVisible,
      selectedOrder,
      editForm,
      editRules,
      editFormRef,
      formatDate,
      formatPhone,
      getStatusLabel,
      getStatusTagType,
      handleSearch,
      handleDateChange,
      handleSizeChange,
      handleCurrentChange,
      refreshData,
      viewOrder,
      editOrder,
      closeEditDialog,
      saveOrder,
      handleOrderAction
    }
  }
}
</script>

<style scoped>
.order-management {
  padding: 20px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.page-header h2 {
  margin: 0;
  color: #303133;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.stat-card {
  height: 100px;
  cursor: pointer;
  transition: transform 0.2s ease;
}

.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.stat-item {
  display: flex;
  align-items: center;
  height: 100%;
}

.stat-icon {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 16px;
  font-size: 20px;
  color: white;
}

.stat-icon.total {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.stat-icon.pending {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
}

.stat-icon.processing {
  background: linear-gradient(135deg, #a8edea 0%, #fed6e3 100%);
}

.stat-icon.completed {
  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
}

.stat-icon.cancelled {
  background: linear-gradient(135deg, #fa709a 0%, #fee140 100%);
}

.stat-content h3 {
  margin: 0 0 4px 0;
  font-size: 24px;
  font-weight: 600;
  color: #303133;
}

.stat-content p {
  margin: 0;
  color: #606266;
  font-size: 14px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-tools {
  display: flex;
  align-items: center;
  gap: 16px;
}

.order-detail {
  margin-top: 20px;
}

:deep(.el-table) {
  font-size: 14px;
}

:deep(.el-table .cell) {
  padding: 8px;
}

:deep(.el-avatar) {
  background: #409eff;
  font-size: 14px;
}

:deep(.el-descriptions-item__label) {
  width: 100px;
}

:deep(.el-input-number) {
  width: 100%;
}

:deep(.el-input-number .el-input__inner) {
  text-align: left;
}

/* 操作按钮布局优化 */
.action-buttons {
  display: flex;
  gap: 8px;
  align-items: center;
  flex-wrap: wrap;
}

.action-buttons .el-button {
  margin: 0;
  min-width: auto;
}

.action-buttons .el-button + .el-button {
  margin-left: 0;
}

/* 响应式处理：小屏幕时按钮换行 */
@media (max-width: 1400px) {
  .action-buttons {
    flex-direction: column;
    gap: 4px;
    align-items: stretch;
  }

  .action-buttons .el-button {
    width: 100%;
    justify-content: center;
  }
}

/* Mobile specific responsive styles */
@media (max-width: 768px) {
  .page-header {
    flex-direction: column;
    gap: 12px;
    align-items: stretch;
  }

  .page-header h2 {
    font-size: 20px;
    margin-bottom: 8px;
  }

  .header-actions {
    flex-direction: column;
    gap: 8px;
  }

  .search-input {
    width: 100%;
  }

  /* Adjust action buttons for mobile */
  .action-buttons {
    flex-direction: column;
    gap: 4px;
    align-items: stretch;
  }

  .action-buttons .el-button {
    font-size: 11px;
    padding: 4px 8px;
    width: 100%;
  }

  /* Mobile table optimizations */
  .stat-item {
    flex-direction: column;
    text-align: center;
    padding: 12px;
  }

  .stat-icon {
    margin-bottom: 8px;
    margin-right: 0;
  }

  .stat-content h3 {
    font-size: 18px;
    margin-bottom: 4px;
  }

  .stat-content p {
    font-size: 12px;
  }

  /* Hide less important columns on mobile */
  .el-table .el-table__cell:nth-child(6),
  .el-table .el-table__cell:nth-child(7) {
    display: none;
  }
}

@media (max-width: 480px) {
  .page-header h2 {
    font-size: 18px;
  }

  /* Hide even more columns on very small screens */
  .el-table .el-table__cell:nth-child(4),
  .el-table .el-table__cell:nth-child(5) {
    display: none;
  }
}
</style>
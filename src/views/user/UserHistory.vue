<template>
  <div class="user-history">
    <!-- Page Header -->
    <div class="page-header">
      <div class="header-content">
        <h1>订单历史</h1>
        <p>查看您的所有订单记录</p>
      </div>
      <div class="header-stats">
        <div class="stat-item">
          <div class="stat-value">{{ totalOrders }}</div>
          <div class="stat-label">总订单</div>
        </div>
        <div class="stat-item">
          <div class="stat-value">{{ completedOrders }}</div>
          <div class="stat-label">已完成</div>
        </div>
        <div class="stat-item">
          <div class="stat-value">{{ pendingOrders }}</div>
          <div class="stat-label">待处理</div>
        </div>
      </div>
    </div>

    <!-- Filters -->
    <div class="filters-section">
      <el-card class="filters-card">
        <el-row :gutter="20">
          <el-col :xs="24" :sm="12" :md="6">
            <el-select
              v-model="filters.status"
              placeholder="订单状态"
              clearable
              style="width: 100%"
            >
              <el-option label="全部状态" value="" />
              <el-option label="待处理" value="pending" />
              <el-option label="已完成" value="completed" />
              <el-option label="已取消" value="cancelled" />
            </el-select>
          </el-col>

          <el-col :xs="24" :sm="12" :md="6">
            <el-date-picker
              v-model="filters.dateRange"
              type="daterange"
              range-separator="至"
              start-placeholder="开始日期"
              end-placeholder="结束日期"
              style="width: 100%"
              value-format="YYYY-MM-DD"
            />
          </el-col>

          <el-col :xs="24" :sm="12" :md="6">
            <el-input
              v-model="filters.search"
              placeholder="搜索商品名称或单号"
              clearable
            >
              <template #prefix>
                <el-icon><Search /></el-icon>
              </template>
            </el-input>
          </el-col>

          <el-col :xs="24" :sm="12" :md="6">
            <el-button type="primary" @click="applyFilters">
              <el-icon><Filter /></el-icon>
              筛选
            </el-button>
            <el-button @click="resetFilters">重置</el-button>
            <el-button type="success" @click="exportOrders">
              <el-icon><Download /></el-icon>
              导出
            </el-button>
          </el-col>
        </el-row>
      </el-card>
    </div>

    <!-- Orders Table -->
    <div class="orders-table-section">
      <el-card class="table-card">
        <el-table
          :data="orders"
          v-loading="loading"
          stripe
          style="width: 100%"
          @sort-change="handleSortChange"
        >
          <el-table-column type="expand">
            <template #default="props">
              <div class="order-expand">
                <div class="expand-item">
                  <span class="expand-label">订单编号：</span>
                  <span class="expand-value">{{ props.row.id }}</span>
                </div>
                <div class="expand-item">
                  <span class="expand-label">商品描述：</span>
                  <span class="expand-value">{{ props.row.productDescription || '暂无描述' }}</span>
                </div>
                <div class="expand-item">
                  <span class="expand-label">快递公司：</span>
                  <span class="expand-value">{{ props.row.courierName }}</span>
                </div>
                <div class="expand-item">
                  <span class="expand-label">快递单号：</span>
                  <span class="expand-value">{{ props.row.trackingNumber }}</span>
                </div>
                <div class="expand-item">
                  <span class="expand-label">备注信息：</span>
                  <span class="expand-value">{{ props.row.notes || '无' }}</span>
                </div>
                <div class="expand-item">
                  <span class="expand-label">更新时间：</span>
                  <span class="expand-value">{{ formatDate(props.row.updatedAt) }}</span>
                </div>
              </div>
            </template>
          </el-table-column>

          <el-table-column
            prop="id"
            label="订单号"
            width="80"
            sortable="custom"
          />

          <el-table-column
            prop="productName"
            label="商品名称"
            min-width="150"
          >
            <template #default="scope">
              <div class="product-info">
                <div class="product-name">{{ scope.row.productName }}</div>
                <div class="product-price">¥{{ scope.row.productPrice }} × {{ scope.row.quantity }}</div>
              </div>
            </template>
          </el-table-column>

          <el-table-column
            prop="quantity"
            label="数量"
            width="80"
            align="center"
          />

          <el-table-column
            prop="totalAmount"
            label="总金额"
            width="120"
            sortable="custom"
          >
            <template #default="scope">
              <span class="order-amount">¥{{ scope.row.totalAmount }}</span>
            </template>
          </el-table-column>

          <el-table-column
            prop="status"
            label="状态"
            width="100"
            align="center"
          >
            <template #default="scope">
              <el-tag :type="getStatusType(scope.row.status)" size="small">
                {{ getStatusText(scope.row.status) }}
              </el-tag>
            </template>
          </el-table-column>

          <el-table-column
            prop="createdAt"
            label="创建时间"
            width="180"
            sortable="custom"
          >
            <template #default="scope">
              {{ formatDate(scope.row.createdAt) }}
            </template>
          </el-table-column>

          <el-table-column
            label="操作"
            width="150"
            fixed="right"
          >
            <template #default="scope">
              <el-button
                text
                type="primary"
                size="small"
                @click="viewOrderDetail(scope.row)"
              >
                详情
              </el-button>
              <el-button
                v-if="scope.row.status === 'pending'"
                text
                type="danger"
                size="small"
                @click="cancelOrder(scope.row)"
              >
                取消
              </el-button>
              <el-button
                text
                type="success"
                size="small"
                @click="copyTrackingNumber(scope.row)"
              >
                复制单号
              </el-button>
            </template>
          </el-table-column>
        </el-table>

        <!-- Pagination -->
        <div class="pagination-container">
          <el-pagination
            v-model:current-page="currentPage"
            v-model:page-size="pageSize"
            :page-sizes="[10, 20, 50, 100]"
            :total="totalCount"
            layout="total, sizes, prev, pager, next, jumper"
            @size-change="handleSizeChange"
            @current-change="handleCurrentChange"
          />
        </div>
      </el-card>
    </div>

    <!-- Order Detail Dialog -->
    <el-dialog
      v-model="detailDialogVisible"
      title="订单详情"
      width="600px"
    >
      <div v-if="selectedOrder" class="order-detail">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="订单编号">
            {{ selectedOrder.id }}
          </el-descriptions-item>
          <el-descriptions-item label="订单状态">
            <el-tag :type="getStatusType(selectedOrder.status)">
              {{ getStatusText(selectedOrder.status) }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="商品名称" :span="2">
            {{ selectedOrder.productName }}
          </el-descriptions-item>
          <el-descriptions-item label="单价">
            ¥{{ selectedOrder.productPrice }}
          </el-descriptions-item>
          <el-descriptions-item label="数量">
            {{ selectedOrder.quantity }}
          </el-descriptions-item>
          <el-descriptions-item label="订单总额" :span="2">
            <span class="detail-amount">¥{{ selectedOrder.totalAmount }}</span>
          </el-descriptions-item>
          <el-descriptions-item label="快递公司">
            {{ selectedOrder.courierName }}
          </el-descriptions-item>
          <el-descriptions-item label="快递单号">
            {{ selectedOrder.trackingNumber }}
          </el-descriptions-item>
          <el-descriptions-item label="创建时间">
            {{ formatDate(selectedOrder.createdAt) }}
          </el-descriptions-item>
          <el-descriptions-item label="更新时间">
            {{ formatDate(selectedOrder.updatedAt) }}
          </el-descriptions-item>
          <el-descriptions-item label="备注信息" :span="2">
            {{ selectedOrder.notes || '无' }}
          </el-descriptions-item>
        </el-descriptions>
      </div>
      <template #footer>
        <el-button @click="detailDialogVisible = false">关闭</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script>
import { ref, reactive, computed, onMounted } from 'vue'
import { useAuthStore } from '../../stores/auth'
import { ElMessage, ElMessageBox } from 'element-plus'
import * as XLSX from 'xlsx'
import { saveAs } from 'file-saver'
import { formatDate, formatDateTime } from '@/utils/time'
import { getApiUrl } from '@/utils/config'

export default {
  name: 'UserHistory',
  setup() {
    const authStore = useAuthStore()

    // State
    const loading = ref(false)
    const orders = ref([])
    const totalCount = ref(0)
    const currentPage = ref(1)
    const pageSize = ref(20)
    const sortField = ref('created_at')
    const sortOrder = ref('desc')
    const detailDialogVisible = ref(false)
    const selectedOrder = ref(null)

    const filters = reactive({
      status: '',
      dateRange: null,
      search: ''
    })

    // Computed
    const totalOrders = computed(() => totalCount.value)
    const completedOrders = computed(() =>
      orders.value.filter(o => o.status === 'completed').length
    )
    const pendingOrders = computed(() =>
      orders.value.filter(o => o.status === 'pending').length
    )

    // Methods
    const loadOrders = async () => {
      loading.value = true
      try {
        const params = new URLSearchParams({
          page: currentPage.value,
          limit: pageSize.value,
          sort: sortField.value,
          order: sortOrder.value
        })

        if (filters.status) {
          params.append('status', filters.status)
        }

        if (filters.search) {
          params.append('q', filters.search)
        }

        if (filters.dateRange && filters.dateRange.length === 2) {
          params.append('startDate', filters.dateRange[0])
          params.append('endDate', filters.dateRange[1])
        }

        const response = await fetch(getApiUrl(`/orders/my-orders?${params}`), {
          headers: {
            'Authorization': `Bearer ${authStore.token}`
          }
        })

        if (!response.ok) {
          throw new Error('Failed to load orders')
        }

        const data = await response.json()
        orders.value = data.orders || []
        totalCount.value = data.pagination?.total || 0

      } catch (error) {
        console.error('Failed to load orders:', error)
        ElMessage.error('加载订单历史失败')
      } finally {
        loading.value = false
      }
    }

    const applyFilters = () => {
      currentPage.value = 1
      loadOrders()
    }

    const resetFilters = () => {
      filters.status = ''
      filters.dateRange = null
      filters.search = ''
      currentPage.value = 1
      loadOrders()
    }

    const handleSortChange = ({ prop, order }) => {
      const fieldMap = {
        'id': 'id',
        'totalAmount': 'total_amount',
        'createdAt': 'created_at'
      }

      sortField.value = fieldMap[prop] || 'created_at'
      sortOrder.value = order === 'ascending' ? 'asc' : 'desc'
      loadOrders()
    }

    const handleSizeChange = (val) => {
      pageSize.value = val
      currentPage.value = 1
      loadOrders()
    }

    const handleCurrentChange = (val) => {
      currentPage.value = val
      loadOrders()
    }

    const viewOrderDetail = (order) => {
      selectedOrder.value = order
      detailDialogVisible.value = true
    }

    const cancelOrder = async (order) => {
      try {
        await ElMessageBox.confirm(
          '确定要取消这个订单吗？此操作不可恢复。',
          '取消订单',
          {
            confirmButtonText: '确定',
            cancelButtonText: '取消',
            type: 'warning'
          }
        )

        const response = await fetch(getApiUrl(`/orders/${order.id}/cancel`), {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${authStore.token}`
          }
        })

        if (!response.ok) {
          throw new Error('Failed to cancel order')
        }

        ElMessage.success('订单已取消')
        loadOrders()

      } catch (error) {
        if (error.message !== 'cancel') {
          ElMessage.error('取消订单失败')
        }
      }
    }

    const copyTrackingNumber = (order) => {
      if (!order.trackingNumber) {
        ElMessage.warning('没有快递单号')
        return
      }

      navigator.clipboard.writeText(order.trackingNumber).then(() => {
        ElMessage.success('快递单号已复制')
      }).catch(() => {
        ElMessage.error('复制失败')
      })
    }

    const exportOrders = () => {
      if (orders.value.length === 0) {
        ElMessage.warning('没有可导出的订单')
        return
      }

      const exportData = orders.value.map(order => ({
        '订单号': order.id,
        '商品名称': order.productName,
        '单价': order.productPrice,
        '数量': order.quantity,
        '总金额': order.totalAmount,
        '快递公司': order.courierName,
        '快递单号': order.trackingNumber,
        '状态': getStatusText(order.status),
        '备注': order.notes || '',
        '创建时间': formatDate(order.createdAt),
        '更新时间': formatDate(order.updatedAt)
      }))

      const ws = XLSX.utils.json_to_sheet(exportData)
      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, '订单历史')

      const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'binary' })
      const blob = new Blob([s2ab(wbout)], { type: 'application/octet-stream' })

      const fileName = `订单历史_${new Date().toLocaleDateString('zh-CN').replace(/\//g, '-')}.xlsx`
      saveAs(blob, fileName)

      ElMessage.success('导出成功')
    }

    const s2ab = (s) => {
      const buf = new ArrayBuffer(s.length)
      const view = new Uint8Array(buf)
      for (let i = 0; i < s.length; i++) view[i] = s.charCodeAt(i) & 0xFF
      return buf
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
      loadOrders()
    })

    return {
      loading,
      orders,
      totalCount,
      currentPage,
      pageSize,
      filters,
      detailDialogVisible,
      selectedOrder,
      totalOrders,
      completedOrders,
      pendingOrders,
      loadOrders,
      applyFilters,
      resetFilters,
      handleSortChange,
      handleSizeChange,
      handleCurrentChange,
      viewOrderDetail,
      cancelOrder,
      copyTrackingNumber,
      exportOrders,
      getStatusType,
      getStatusText,
      formatDate
    }
  }
}
</script>

<style scoped>
.user-history {
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

.header-stats {
  display: flex;
  gap: 32px;
}

.stat-item {
  text-align: center;
}

.stat-value {
  font-size: 28px;
  font-weight: 700;
  color: #1a202c;
  margin-bottom: 4px;
}

.stat-label {
  font-size: 13px;
  color: #718096;
}

/* Filters Section */
.filters-section {
  margin-bottom: 24px;
}

.filters-card {
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  border-radius: 12px;
}

/* Orders Table */
.orders-table-section {
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
}

.table-card {
  border-radius: 12px;
}

/* Product Info */
.product-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.product-name {
  font-weight: 500;
  color: #1a202c;
}

.product-price {
  font-size: 12px;
  color: #718096;
}

/* Order Amount */
.order-amount {
  font-weight: 600;
  color: #f56565;
  font-size: 16px;
}

/* Order Expand */
.order-expand {
  padding: 20px;
  background: #f8fafc;
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
}

.expand-item {
  display: flex;
  align-items: flex-start;
}

.expand-label {
  color: #718096;
  min-width: 80px;
  margin-right: 8px;
}

.expand-value {
  color: #1a202c;
  flex: 1;
}

/* Pagination */
.pagination-container {
  padding: 20px;
  display: flex;
  justify-content: flex-end;
}

/* Order Detail */
.detail-amount {
  font-size: 18px;
  font-weight: 600;
  color: #f56565;
}

/* Responsive */
@media (max-width: 768px) {
  .page-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 16px;
  }

  .header-stats {
    width: 100%;
    justify-content: space-between;
  }

  .order-expand {
    grid-template-columns: 1fr;
  }
}
</style>
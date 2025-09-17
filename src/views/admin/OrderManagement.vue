<template>
  <div class="order-management">
    <!-- Header -->
    <div class="page-header">
      <h2>订单管理</h2>
      <div class="header-actions">
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

        <el-button @click="refreshData" class="refresh-btn">
          <el-icon><Refresh /></el-icon>
          <span class="btn-text">刷新数据</span>
        </el-button>
      </div>
    </div>

    <!-- Statistics Cards -->
    <div class="stats-grid">
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
    </div>

    <!-- Order Table/Cards -->
    <el-card class="orders-container">
      <template #header>
        <div class="card-header">
          <span>订单列表</span>
          <div class="header-tools">
            <el-select
              v-model="statusFilter"
              placeholder="筛选状态"
              clearable
              class="status-filter"
            >
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
              class="date-picker"
              @change="handleDateChange"
            />
          </div>
        </div>
      </template>

      <!-- Desktop Table View -->
      <div class="desktop-view">
        <el-table
          :data="filteredOrders"
          v-loading="loading"
          style="width: 100%"
          :default-sort="{ prop: 'createdAt', order: 'descending' }"
          class="orders-table"
        >
          <el-table-column prop="id" label="订单号" width="100" sortable>
            <template #default="{ row }">
              <div class="order-id">
                #{{ row.id.toString().padStart(4, '0') }}
              </div>
            </template>
          </el-table-column>

          <el-table-column prop="userName" label="用户信息" min-width="150">
            <template #default="{ row }">
              <div class="user-info">
                <el-avatar :size="32" class="user-avatar">
                  {{ row.user?.realName?.charAt(0) || 'U' }}
                </el-avatar>
                <div class="user-details">
                  <div class="user-name">{{ row.user?.realName || '未知用户' }}</div>
                  <div class="user-phone">{{ formatPhone(row.user?.phone) }}</div>
                </div>
              </div>
            </template>
          </el-table-column>

          <el-table-column prop="productName" label="商品信息" min-width="180">
            <template #default="{ row }">
              <div class="product-info">
                <div class="product-name">{{ row.product?.name || '未知商品' }}</div>
                <div class="product-details">
                  数量: {{ row.quantity }} | 单价: ¥{{ (row.product?.price || 0).toFixed(2) }}
                </div>
              </div>
            </template>
          </el-table-column>

          <el-table-column prop="totalAmount" label="总金额" width="120" sortable>
            <template #default="{ row }">
              <div class="amount">
                ¥{{ row.totalAmount.toFixed(2) }}
              </div>
            </template>
          </el-table-column>

          <el-table-column prop="courierInfo" label="快递信息" width="160">
            <template #default="{ row }">
              <div class="courier-info">
                <div class="courier-name">{{ row.courier?.name || '未知快递' }}</div>
                <div class="tracking-number">
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

          <el-table-column label="操作" width="160">
            <template #default="{ row }">
              <div class="desktop-actions">
                <!-- 状态修改按钮 -->
                <el-dropdown @command="(command) => handleStatusChange(row, command)" trigger="click">
                  <el-button size="small" type="primary">
                    <el-icon><Edit /></el-icon>
                    状态
                    <el-icon class="el-icon--right"><ArrowDown /></el-icon>
                  </el-button>
                  <template #dropdown>
                    <el-dropdown-menu>
                      <el-dropdown-item
                        command="pending"
                        :disabled="row.status === 'pending'"
                      >
                        <el-icon><Clock /></el-icon>
                        待处理
                      </el-dropdown-item>
                      <el-dropdown-item
                        command="processing"
                        :disabled="row.status === 'processing'"
                      >
                        <el-icon><Money /></el-icon>
                        待结算
                      </el-dropdown-item>
                      <el-dropdown-item
                        command="completed"
                        :disabled="row.status === 'completed'"
                      >
                        <el-icon><CircleCheck /></el-icon>
                        已完成
                      </el-dropdown-item>
                      <el-dropdown-item
                        command="cancelled"
                        :disabled="row.status === 'cancelled'"
                        divided
                      >
                        <el-icon><CircleClose /></el-icon>
                        已作废
                      </el-dropdown-item>
                    </el-dropdown-menu>
                  </template>
                </el-dropdown>

                <!-- 更多操作按钮 -->
                <el-dropdown @command="(command) => handleMoreActions(row, command)" trigger="click">
                  <el-button size="small" type="info" plain>
                    <el-icon><MoreFilled /></el-icon>
                    更多
                  </el-button>
                  <template #dropdown>
                    <el-dropdown-menu>
                      <el-dropdown-item command="view">
                        <el-icon><View /></el-icon>
                        查看详情
                      </el-dropdown-item>
                      <el-dropdown-item command="edit">
                        <el-icon><Edit /></el-icon>
                        编辑订单
                      </el-dropdown-item>
                      <el-dropdown-item command="delete" divided>
                        <el-icon><Delete /></el-icon>
                        删除订单
                      </el-dropdown-item>
                    </el-dropdown-menu>
                  </template>
                </el-dropdown>
              </div>
            </template>
          </el-table-column>
        </el-table>
      </div>

      <!-- Mobile Card View -->
      <div class="mobile-view">
        <div v-if="loading" class="loading-state">
          <el-icon class="is-loading"><Loading /></el-icon>
          <div>加载中...</div>
        </div>

        <div v-else-if="filteredOrders.length === 0" class="empty-state">
          <el-icon><DocumentDelete /></el-icon>
          <div>暂无订单数据</div>
        </div>

        <div v-else class="mobile-orders">
          <div
            v-for="order in filteredOrders"
            :key="order.id"
            class="order-card"
          >
            <el-card shadow="hover">
              <!-- Card Header -->
              <div class="card-header-mobile">
                <div class="order-number">
                  #{{ order.id.toString().padStart(4, '0') }}
                </div>
                <el-tag :type="getStatusTagType(order.status)" size="default">
                  {{ getStatusLabel(order.status) }}
                </el-tag>
              </div>

              <!-- Card Body -->
              <div class="card-body">
                <!-- User Info Row -->
                <div class="info-row">
                  <div class="info-label">
                    <el-icon><User /></el-icon>
                    用户
                  </div>
                  <div class="info-value">
                    <div class="user-name">{{ order.user?.realName || '未知用户' }}</div>
                    <div class="user-phone">{{ formatPhone(order.user?.phone) }}</div>
                  </div>
                </div>

                <!-- Product Info Row -->
                <div class="info-row">
                  <div class="info-label">
                    <el-icon><Box /></el-icon>
                    商品
                  </div>
                  <div class="info-value">
                    <div class="product-name">{{ order.product?.name || '未知商品' }}</div>
                    <div class="product-details">
                      数量: {{ order.quantity }} × ¥{{ (order.product?.price || 0).toFixed(2) }}
                    </div>
                  </div>
                </div>

                <!-- Amount Row -->
                <div class="info-row highlight">
                  <div class="info-label">
                    <el-icon><Money /></el-icon>
                    总额
                  </div>
                  <div class="info-value">
                    <div class="total-amount">¥{{ order.totalAmount.toFixed(2) }}</div>
                  </div>
                </div>

                <!-- Courier Info Row -->
                <div class="info-row">
                  <div class="info-label">
                    <el-icon><Van /></el-icon>
                    快递
                  </div>
                  <div class="info-value">
                    <div class="courier-name">{{ order.courier?.name || '未知快递' }}</div>
                    <div class="tracking-number" v-if="order.trackingNumber">
                      {{ order.trackingNumber }}
                    </div>
                  </div>
                </div>

                <!-- Time Row -->
                <div class="info-row">
                  <div class="info-label">
                    <el-icon><Clock /></el-icon>
                    时间
                  </div>
                  <div class="info-value">
                    <div class="created-time">{{ formatDate(order.createdAt) }}</div>
                  </div>
                </div>
              </div>

              <!-- Card Actions -->
              <div class="card-actions">
                <!-- 状态修改 -->
                <el-dropdown
                  @command="(command) => handleStatusChange(order, command)"
                  trigger="click"
                  class="action-dropdown"
                >
                  <el-button type="primary" size="default" class="action-btn">
                    <el-icon><Edit /></el-icon>
                    修改状态
                    <el-icon class="el-icon--right"><ArrowDown /></el-icon>
                  </el-button>
                  <template #dropdown>
                    <el-dropdown-menu>
                      <el-dropdown-item
                        command="pending"
                        :disabled="order.status === 'pending'"
                      >
                        <el-icon><Clock /></el-icon>
                        待处理
                      </el-dropdown-item>
                      <el-dropdown-item
                        command="processing"
                        :disabled="order.status === 'processing'"
                      >
                        <el-icon><Money /></el-icon>
                        待结算
                      </el-dropdown-item>
                      <el-dropdown-item
                        command="completed"
                        :disabled="order.status === 'completed'"
                      >
                        <el-icon><CircleCheck /></el-icon>
                        已完成
                      </el-dropdown-item>
                      <el-dropdown-item
                        command="cancelled"
                        :disabled="order.status === 'cancelled'"
                        divided
                      >
                        <el-icon><CircleClose /></el-icon>
                        已作废
                      </el-dropdown-item>
                    </el-dropdown-menu>
                  </template>
                </el-dropdown>

                <!-- 更多操作 -->
                <el-dropdown
                  @command="(command) => handleMoreActions(order, command)"
                  trigger="click"
                  class="action-dropdown"
                >
                  <el-button type="default" size="default" class="action-btn">
                    <el-icon><MoreFilled /></el-icon>
                    更多操作
                    <el-icon class="el-icon--right"><ArrowDown /></el-icon>
                  </el-button>
                  <template #dropdown>
                    <el-dropdown-menu>
                      <el-dropdown-item command="view">
                        <el-icon><View /></el-icon>
                        查看详情
                      </el-dropdown-item>
                      <el-dropdown-item command="edit">
                        <el-icon><Edit /></el-icon>
                        编辑订单
                      </el-dropdown-item>
                      <el-dropdown-item command="delete" divided>
                        <el-icon><Delete /></el-icon>
                        删除订单
                      </el-dropdown-item>
                    </el-dropdown-menu>
                  </template>
                </el-dropdown>
              </div>
            </el-card>
          </div>
        </div>
      </div>

      <!-- Pagination -->
      <div class="pagination-wrapper">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :page-sizes="[10, 20, 50, 100]"
          :total="totalOrders"
          :layout="paginationLayout"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
          class="pagination"
        />
      </div>
    </el-card>

    <!-- Order Detail Dialog -->
    <el-dialog
      v-model="detailDialogVisible"
      title="订单详情"
      :width="dialogWidth"
      class="detail-dialog"
    >
      <div v-if="selectedOrder" class="order-detail">
        <el-descriptions :column="descriptionsColumn" border>
          <el-descriptions-item label="订单号">
            <span class="order-id">
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
            <span class="amount">
              ¥{{ selectedOrder.totalAmount.toFixed(2) }}
            </span>
          </el-descriptions-item>
          <el-descriptions-item label="快递公司">{{ selectedOrder.courier?.name }}</el-descriptions-item>
          <el-descriptions-item label="快递单号" :span="descriptionsColumn">
            <span class="tracking-number">{{ selectedOrder.trackingNumber || '暂未填写' }}</span>
          </el-descriptions-item>
          <el-descriptions-item label="下单时间">{{ formatDate(selectedOrder.createdAt) }}</el-descriptions-item>
          <el-descriptions-item label="更新时间">{{ formatDate(selectedOrder.updatedAt) }}</el-descriptions-item>
          <el-descriptions-item label="备注说明" :span="descriptionsColumn">
            {{ selectedOrder.notes || '无' }}
          </el-descriptions-item>
        </el-descriptions>
      </div>
    </el-dialog>

    <!-- Edit Order Dialog -->
    <el-dialog
      v-model="editDialogVisible"
      title="编辑订单"
      :width="dialogWidth"
      @close="closeEditDialog"
      class="edit-dialog"
    >
      <el-form
        ref="editFormRef"
        :model="editForm"
        :rules="editRules"
        label-width="100px"
        class="edit-form"
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
          <div class="form-tip">
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
        <div class="dialog-footer">
          <el-button @click="closeEditDialog">取消</el-button>
          <el-button type="primary" @click="saveOrder" :loading="saving">
            保存
          </el-button>
        </div>
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

    // Responsive computed properties
    const isMobile = computed(() => window.innerWidth <= 768)
    const dialogWidth = computed(() => isMobile.value ? '95%' : '600px')
    const descriptionsColumn = computed(() => isMobile.value ? 1 : 2)
    const paginationLayout = computed(() =>
      isMobile.value ? 'prev, pager, next' : 'total, sizes, prev, pager, next, jumper'
    )

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

    // 状态修改处理
    const handleStatusChange = async (order, newStatus) => {
      try {
        const statusLabels = {
          pending: '待处理',
          processing: '待结算',
          completed: '已完成',
          cancelled: '已作废'
        }

        const confirmText = `确定要将订单 #${order.id.toString().padStart(4, '0')} 状态修改为"${statusLabels[newStatus]}"吗？`

        await ElMessageBox.confirm(confirmText, '确认修改状态', {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        })

        // 调用更新接口
        await orderStore.updateOrder(order.id, { status: newStatus })
        ElMessage.success(`订单状态已修改为"${statusLabels[newStatus]}"`)
        await refreshData()

      } catch (error) {
        if (error !== 'cancel') {
          console.error('Status change error:', error)
          ElMessage.error('状态修改失败')
        }
      }
    }

    // 更多操作处理
    const handleMoreActions = async (order, action) => {
      try {
        switch (action) {
          case 'view':
            viewOrder(order)
            break
          case 'edit':
            editOrder(order)
            break
          case 'delete':
            await ElMessageBox.confirm(
              `确定要删除订单 #${order.id.toString().padStart(4, '0')} 吗？此操作不可恢复。`,
              '确认删除',
              {
                confirmButtonText: '确定',
                cancelButtonText: '取消',
                type: 'warning'
              }
            )

            await adminStore.deleteOrder(order.id)
            ElMessage.success('订单删除成功')
            await refreshData()
            break
        }
      } catch (error) {
        if (error !== 'cancel') {
          console.error('More action error:', error)
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
      dialogWidth,
      descriptionsColumn,
      paginationLayout,
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
      handleStatusChange,
      handleMoreActions
    }
  }
}
</script>

<style scoped>
/* Base Styles */
.order-management {
  padding: 20px;
  max-width: 100%;
  box-sizing: border-box;
}

/* Header */
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  flex-wrap: wrap;
  gap: 16px;
}

.page-header h2 {
  margin: 0;
  color: #303133;
  font-size: 24px;
  font-weight: 600;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.search-input {
  width: 280px;
  min-width: 200px;
}

.refresh-btn .btn-text {
  margin-left: 4px;
}

/* Statistics Grid */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
  margin-bottom: 24px;
}

.stat-card {
  height: 100px;
  cursor: pointer;
  transition: all 0.3s ease;
  border-radius: 8px;
}

.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
}

.stat-item {
  display: flex;
  align-items: center;
  height: 100%;
  padding: 16px;
}

.stat-icon {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 16px;
  font-size: 20px;
  color: white;
  flex-shrink: 0;
}

.stat-icon.total {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.stat-icon.pending {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
}

.stat-icon.processing {
  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
}

.stat-icon.completed {
  background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);
}

.stat-icon.cancelled {
  background: linear-gradient(135deg, #fa709a 0%, #fee140 100%);
}

.stat-content h3 {
  margin: 0 0 4px 0;
  font-size: 28px;
  font-weight: 700;
  color: #303133;
  line-height: 1;
}

.stat-content p {
  margin: 0;
  color: #606266;
  font-size: 14px;
  font-weight: 500;
}

/* Orders Container */
.orders-container {
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 16px;
}

.header-tools {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.status-filter {
  width: 120px;
}

.date-picker {
  width: 280px;
}

/* Desktop Table View */
.desktop-view {
  display: block;
}

.orders-table {
  font-size: 14px;
}

.orders-table :deep(.el-table__cell) {
  padding: 12px 8px;
}

.order-id {
  font-family: 'Consolas', 'Monaco', monospace;
  font-weight: 600;
  color: #409eff;
}

.user-info {
  display: flex;
  align-items: center;
}

.user-avatar {
  margin-right: 12px;
  background: #409eff;
  font-size: 14px;
  flex-shrink: 0;
}

.user-details {
  min-width: 0;
}

.user-name {
  font-weight: 500;
  color: #303133;
  margin-bottom: 2px;
}

.user-phone {
  font-size: 12px;
  color: #909399;
  font-family: 'Consolas', 'Monaco', monospace;
}

.product-info {
  min-width: 0;
}

.product-name {
  font-weight: 500;
  color: #303133;
  margin-bottom: 2px;
}

.product-details {
  font-size: 12px;
  color: #909399;
}

.amount {
  font-family: 'Consolas', 'Monaco', monospace;
  font-weight: 600;
  color: #f56c6c;
  font-size: 16px;
}

.courier-info {
  min-width: 0;
}

.courier-name {
  font-weight: 500;
  color: #303133;
  margin-bottom: 2px;
}

.tracking-number {
  font-size: 12px;
  color: #909399;
  font-family: 'Consolas', 'Monaco', monospace;
  word-break: break-all;
}

.desktop-actions {
  display: flex;
  gap: 8px;
  align-items: center;
  flex-wrap: wrap;
}

/* Mobile Card View */
.mobile-view {
  display: none;
}

.loading-state, .empty-state {
  text-align: center;
  padding: 60px 20px;
  color: #909399;
}

.loading-state .el-icon,
.empty-state .el-icon {
  font-size: 48px;
  margin-bottom: 16px;
  display: block;
}

.mobile-orders {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.order-card {
  width: 100%;
}

.order-card .el-card {
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  transition: all 0.3s ease;
}

.order-card .el-card:hover {
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.12);
}

.card-header-mobile {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid #f0f0f0;
}

.order-number {
  font-family: 'Consolas', 'Monaco', monospace;
  font-weight: 700;
  font-size: 18px;
  color: #409eff;
}

.card-body {
  margin-bottom: 16px;
}

.info-row {
  display: flex;
  align-items: flex-start;
  padding: 8px 0;
  min-height: 44px;
}

.info-row.highlight {
  background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
  margin: 8px -16px;
  padding: 12px 16px;
  border-radius: 8px;
}

.info-label {
  display: flex;
  align-items: center;
  min-width: 80px;
  color: #606266;
  font-weight: 500;
  font-size: 14px;
  flex-shrink: 0;
}

.info-label .el-icon {
  margin-right: 6px;
  font-size: 16px;
}

.info-value {
  flex: 1;
  min-width: 0;
}

.info-value > div:first-child {
  font-weight: 500;
  color: #303133;
  margin-bottom: 2px;
}

.info-value > div:last-child {
  font-size: 12px;
  color: #909399;
}

.total-amount {
  font-family: 'Consolas', 'Monaco', monospace;
  font-weight: 700;
  color: #f56c6c;
  font-size: 20px !important;
}

.card-actions {
  display: flex;
  gap: 12px;
  border-top: 1px solid #f0f0f0;
  padding-top: 16px;
}

.action-dropdown {
  flex: 1;
}

.action-btn {
  width: 100%;
  height: 44px;
  font-size: 14px;
  font-weight: 500;
  justify-content: center;
}

/* Pagination */
.pagination-wrapper {
  margin-top: 24px;
  display: flex;
  justify-content: center;
}

.pagination {
  background: white;
  padding: 16px;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

/* Dialog Styles */
.detail-dialog :deep(.el-dialog__body),
.edit-dialog :deep(.el-dialog__body) {
  padding: 20px;
}

.order-detail {
  margin-top: 0;
}

.edit-form :deep(.el-form-item__label) {
  font-weight: 500;
  color: #606266;
}

.form-tip {
  font-size: 12px;
  color: #909399;
  margin-top: 4px;
  line-height: 1.4;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

/* Responsive Breakpoints */
@media (max-width: 768px) {
  /* Mobile View Switching */
  .desktop-view {
    display: none;
  }

  .mobile-view {
    display: block;
  }

  /* Layout Adjustments */
  .order-management {
    padding: 16px;
  }

  .page-header {
    flex-direction: column;
    align-items: stretch;
    gap: 12px;
  }

  .page-header h2 {
    font-size: 20px;
    text-align: center;
  }

  .header-actions {
    flex-direction: column;
    gap: 8px;
  }

  .search-input {
    width: 100%;
  }

  .refresh-btn {
    width: 100%;
    justify-content: center;
  }

  /* Stats Grid */
  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;
    margin-bottom: 20px;
  }

  .stat-card {
    height: 80px;
  }

  .stat-item {
    flex-direction: column;
    text-align: center;
    padding: 12px;
  }

  .stat-icon {
    width: 32px;
    height: 32px;
    margin-right: 0;
    margin-bottom: 8px;
    font-size: 16px;
  }

  .stat-content h3 {
    font-size: 20px;
  }

  .stat-content p {
    font-size: 12px;
  }

  /* Card Header */
  .card-header {
    flex-direction: column;
    align-items: stretch;
    gap: 12px;
  }

  .header-tools {
    flex-direction: column;
    gap: 8px;
  }

  .status-filter,
  .date-picker {
    width: 100%;
  }

  /* Pagination */
  .pagination :deep(.el-pagination__sizes),
  .pagination :deep(.el-pagination__total),
  .pagination :deep(.el-pagination__jump) {
    display: none;
  }

  /* Dialog Adjustments */
  .detail-dialog :deep(.el-dialog),
  .edit-dialog :deep(.el-dialog) {
    margin: 5vh auto;
    max-height: 90vh;
    display: flex;
    flex-direction: column;
  }

  .detail-dialog :deep(.el-dialog__body),
  .edit-dialog :deep(.el-dialog__body) {
    flex: 1;
    overflow-y: auto;
    padding: 16px;
  }

  .edit-form :deep(.el-form-item__label) {
    width: 80px !important;
  }
}

@media (max-width: 480px) {
  .order-management {
    padding: 12px;
  }

  .stats-grid {
    grid-template-columns: 1fr;
  }

  .stat-card {
    height: 70px;
  }

  .stat-item {
    flex-direction: row;
    text-align: left;
    padding: 12px;
  }

  .stat-icon {
    width: 28px;
    height: 28px;
    margin-right: 12px;
    margin-bottom: 0;
    font-size: 14px;
  }

  .stat-content h3 {
    font-size: 18px;
  }

  .order-number {
    font-size: 16px;
  }

  .total-amount {
    font-size: 18px !important;
  }

  .card-actions {
    flex-direction: column;
    gap: 8px;
  }

  .action-btn {
    height: 40px;
  }
}

/* Utility Classes */
:deep(.el-table) {
  font-size: 14px;
}

:deep(.el-descriptions-item__label) {
  font-weight: 500;
  color: #606266;
}

:deep(.el-input-number) {
  width: 100%;
}

:deep(.el-input-number .el-input__inner) {
  text-align: left;
}

/* Hide text on mobile for specific buttons */
@media (max-width: 768px) {
  .refresh-btn .btn-text {
    display: none;
  }
}
</style>
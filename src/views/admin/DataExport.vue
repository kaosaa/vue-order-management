<template>
  <div class="data-export">
    <!-- Header -->
    <div class="page-header">
      <h2>数据导出</h2>
      <div class="header-info">
        <el-tag type="info" size="small">
          <el-icon><Calendar /></el-icon>
          <span class="header-time-text">{{ lastExportTime || '从未导出' }}</span>
        </el-tag>
      </div>
    </div>

    <!-- Quick Export Options -->
    <el-card class="export-card">
      <template #header>
        <div class="card-header">
          <h3>快速导出</h3>
          <el-icon><Document /></el-icon>
        </div>
      </template>

      <div class="quick-export-grid">
        <div class="option-item">
          <div class="option-header">
            <el-icon class="option-icon user"><User /></el-icon>
            <span>用户数据</span>
            <el-tag size="small" type="primary">{{ dataStats.users }} 条记录</el-tag>
          </div>
          <div class="option-actions">
            <el-button
              size="small"
              type="primary"
              @click="exportData('users')"
              :loading="exportLoading.users"
            >
              <el-icon><Download /></el-icon>
              导出用户
            </el-button>
          </div>
        </div>

        <div class="option-item">
          <div class="option-header">
            <el-icon class="option-icon order"><Document /></el-icon>
            <span>订单数据</span>
            <el-tag size="small" type="success">{{ dataStats.orders }} 条记录</el-tag>
          </div>
          <div class="option-actions">
            <el-button
              size="small"
              type="success"
              @click="exportData('orders')"
              :loading="exportLoading.orders"
            >
              <el-icon><Download /></el-icon>
              导出订单
            </el-button>
          </div>
        </div>

        <div class="option-item">
          <div class="option-header">
            <el-icon class="option-icon product"><Box /></el-icon>
            <span>商品数据</span>
            <el-tag size="small" type="warning">{{ dataStats.products }} 条记录</el-tag>
          </div>
          <div class="option-actions">
            <el-button
              size="small"
              type="warning"
              @click="exportData('products')"
              :loading="exportLoading.products"
            >
              <el-icon><Download /></el-icon>
              导出商品
            </el-button>
          </div>
        </div>

        <div class="option-item">
          <div class="option-header">
            <el-icon class="option-icon courier"><Truck /></el-icon>
            <span>快递数据</span>
            <el-tag size="small" type="info">{{ dataStats.couriers }} 条记录</el-tag>
          </div>
          <div class="option-actions">
            <el-button
              size="small"
              type="info"
              @click="exportData('couriers')"
              :loading="exportLoading.couriers"
            >
              <el-icon><Download /></el-icon>
              导出快递
            </el-button>
          </div>
        </div>
      </div>
    </el-card>
    
    <!-- Advanced Export Options -->
    <el-card style="margin-top: 20px">
      <template #header>
        <h3>高级导出选项</h3>
      </template>

      <el-row :gutter="20" class="advanced-content">
        <!-- 左侧：数据类型选择 -->
        <el-col :xs="24" :sm="24" :md="8" :lg="8" :xl="8">
          <div class="data-type-selection">
            <h4>选择数据类型</h4>
            <el-radio-group v-model="selectedDataType" @change="onDataTypeChange">
              <div class="data-type-options">
                <el-radio value="users" class="data-type-radio">
                  <div class="radio-content">
                    <el-icon class="type-icon user"><User /></el-icon>
                    <div class="type-info">
                      <span class="type-name">用户数据</span>
                      <span class="type-count">{{ dataStats.users }} 条记录</span>
                    </div>
                  </div>
                </el-radio>

                <el-radio value="orders" class="data-type-radio">
                  <div class="radio-content">
                    <el-icon class="type-icon order"><Document /></el-icon>
                    <div class="type-info">
                      <span class="type-name">订单数据</span>
                      <span class="type-count">{{ dataStats.orders }} 条记录</span>
                    </div>
                  </div>
                </el-radio>

                <el-radio value="products" class="data-type-radio">
                  <div class="radio-content">
                    <el-icon class="type-icon product"><Box /></el-icon>
                    <div class="type-info">
                      <span class="type-name">商品数据</span>
                      <span class="type-count">{{ dataStats.products }} 条记录</span>
                    </div>
                  </div>
                </el-radio>

                <el-radio value="couriers" class="data-type-radio">
                  <div class="radio-content">
                    <el-icon class="type-icon courier"><Truck /></el-icon>
                    <div class="type-info">
                      <span class="type-name">快递数据</span>
                      <span class="type-count">{{ dataStats.couriers }} 条记录</span>
                    </div>
                  </div>
                </el-radio>
              </div>
            </el-radio-group>
          </div>
        </el-col>

        <!-- 右侧：字段选择 -->
        <el-col :xs="24" :sm="24" :md="16" :lg="16" :xl="16">
          <div class="field-selection">
            <div class="field-header">
              <h4>选择导出字段</h4>
              <div class="field-actions" v-if="selectedDataType">
                <el-button size="default" @click="selectAllFields" type="primary" plain>全选</el-button>
                <el-button size="default" @click="clearAllFields" plain>清空</el-button>
                <el-button size="default" @click="selectDefaultFields" type="success" plain>默认选择</el-button>
              </div>
            </div>

            <div v-if="!selectedDataType" class="field-placeholder">
              <el-empty description="请先选择数据类型" :image-size="80" />
            </div>

            <div v-else class="field-checkboxes">
              <el-checkbox-group v-model="selectedFields">
                <div class="checkbox-grid">
                  <el-checkbox
                    v-for="field in availableFields"
                    :key="field.key"
                    :value="field.key"
                    class="field-checkbox"
                    size="large"
                  >
                    <div class="checkbox-content">
                      <span class="field-name">{{ field.label }}</span>
                      <span class="field-type">{{ field.type }}</span>
                    </div>
                  </el-checkbox>
                </div>
              </el-checkbox-group>
            </div>

            <div class="export-actions" v-if="selectedDataType && selectedFields.length > 0">
              <div class="export-filters">
                <div class="filter-row">
                  <label class="filter-label">时间筛选：</label>
                  <div class="filter-controls">
                    <el-date-picker
                      v-model="dateRange"
                      type="daterange"
                      range-separator="至"
                      start-placeholder="开始日期"
                      end-placeholder="结束日期"
                      format="YYYY-MM-DD"
                      value-format="YYYY-MM-DD"
                      size="default"
                      class="mobile-date-picker"
                      @change="onDateRangeChange"
                      :clearable="true"
                      :editable="false"
                    />

                    <el-button
                      size="small"
                      @click="clearDateRange"
                      v-if="dateRange && dateRange.length > 0"
                      class="mobile-clear-btn"
                    >
                      清除时间
                    </el-button>
                  </div>
                </div>

                <div class="filter-row" v-if="hasStatusField">
                  <label class="filter-label">状态筛选：</label>
                  <div class="filter-controls">
                    <el-select
                      v-model="statusFilter"
                      placeholder="选择状态"
                      clearable
                      size="default"
                      class="mobile-select"
                      :teleported="false"
                    >
                      <el-option
                        v-for="option in statusOptions"
                        :key="option.value"
                        :label="option.label"
                        :value="option.value"
                      />
                    </el-select>

                    <el-button
                      size="small"
                      @click="clearStatusFilter"
                      v-if="statusFilter"
                      class="mobile-clear-btn"
                    >
                      清除状态
                    </el-button>
                  </div>
                </div>
              </div>

              <div class="export-buttons">
                <el-button
                  type="primary"
                  @click="exportCustomData"
                  :loading="exportLoading.custom"
                  class="mobile-export-btn"
                  size="large"
                  :disabled="selectedFields.length === 0"
                >
                  <el-icon><Download /></el-icon>
                  导出选中字段
                </el-button>

                <div class="export-summary">
                  <el-tag type="info" size="small">已选择 {{ selectedFields.length }} 个字段</el-tag>
                  <el-tag type="success" size="small" v-if="filteredRecordCount !== null">
                    将导出 {{ filteredRecordCount }} 条记录
                  </el-tag>
                </div>
              </div>
            </div>
          </div>
        </el-col>
      </el-row>
    </el-card>

    <!-- Export History -->
    <el-card style="margin-top: 20px" class="history-card">
      <template #header>
        <div class="card-header">
          <h3>导出历史记录</h3>
          <el-button size="default" @click="refreshHistory" :loading="historyLoading">
            <el-icon><Refresh /></el-icon>
            <span class="refresh-text">刷新</span>
          </el-button>
        </div>
      </template>

      <!-- Desktop Table View -->
      <el-table
        :data="exportHistory"
        style="width: 100%"
        v-loading="historyLoading"
        class="desktop-table"
        v-show="!isMobile"
      >
        <el-table-column prop="type" label="导出类型" width="150">
          <template #default="{ row }">
            <el-tag :type="getExportTypeTagType(row.type)" size="small">
              {{ getExportTypeLabel(row.type) }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column prop="fileName" label="文件名" min-width="200" show-overflow-tooltip />

        <el-table-column prop="recordCount" label="记录数量" width="100">
          <template #default="{ row }">
            <span style="font-family: monospace">{{ row.recordCount }}</span>
          </template>
        </el-table-column>

        <el-table-column prop="fileSize" label="文件大小" width="100">
          <template #default="{ row }">
            <span style="font-family: monospace">{{ formatFileSize(row.fileSize) }}</span>
          </template>
        </el-table-column>

        <el-table-column prop="exportTime" label="导出时间" width="160">
          <template #default="{ row }">
            {{ formatDate(row.exportTime) }}
          </template>
        </el-table-column>

        <el-table-column prop="status" label="状态" width="80">
          <template #default="{ row }">
            <el-tag :type="row.status === 'success' ? 'success' : 'danger'" size="small">
              {{ row.status === 'success' ? '成功' : '失败' }}
            </el-tag>
          </template>
        </el-table-column>
      </el-table>

      <!-- Mobile Card View -->
      <div class="mobile-history" v-loading="historyLoading" v-show="isMobile">
        <div
          v-for="(item, index) in exportHistory"
          :key="index"
          class="history-card-item"
        >
          <div class="history-header">
            <el-tag :type="getExportTypeTagType(item.type)" size="small">
              {{ getExportTypeLabel(item.type) }}
            </el-tag>
            <el-tag :type="item.status === 'success' ? 'success' : 'danger'" size="small">
              {{ item.status === 'success' ? '成功' : '失败' }}
            </el-tag>
          </div>

          <div class="history-filename">
            {{ item.fileName }}
          </div>

          <div class="history-details">
            <div class="detail-item">
              <span class="detail-label">记录数量:</span>
              <span class="detail-value">{{ item.recordCount }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">文件大小:</span>
              <span class="detail-value">{{ formatFileSize(item.fileSize) }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">导出时间:</span>
              <span class="detail-value">{{ formatDate(item.exportTime) }}</span>
            </div>
          </div>
        </div>
      </div>

      <div class="pagination-wrapper">
        <el-pagination
          v-model:current-page="historyPage"
          :page-size="10"
          :total="exportHistory.length"
          :layout="paginationLayout"
          :small="isMobile"
          :background="true"
          :hide-on-single-page="false"
        />
      </div>
    </el-card>
  </div>
</template>

<script>
import { ref, reactive, onMounted, computed, onUnmounted } from 'vue'
import { useAdminStore } from '../../stores/admin'
import { useProductStore } from '../../stores/product'
import { useOrderStore } from '../../stores/order'
import { quickExport } from '../../utils/excel'
import { ElMessage } from 'element-plus'

export default {
  name: 'DataExport',
  setup() {
    const adminStore = useAdminStore()
    const productStore = useProductStore()
    const orderStore = useOrderStore()
    
    const historyLoading = ref(false)
    const historyPage = ref(1)
    const lastExportTime = ref('')
    const isMobile = ref(false)
    
    const exportLoading = reactive({
      users: false,
      orders: false,
      products: false,
      couriers: false,
      custom: false
    })
    
    const filterForm = reactive({
      dataType: '',
      dateRange: [],
      status: ''
    })

    const selectedDataType = ref('')
    const selectedFields = ref([])
    const dateRange = ref([])
    const statusFilter = ref('')
    const filteredRecordCount = ref(null)

    // 定义各数据类型的字段映射配置
    const fieldMappings = {
      users: [
        { key: 'id', label: '用户ID', type: '数字' },
        { key: 'realName', label: '真实姓名', type: '文本' },
        { key: 'phone', label: '手机号', type: '文本' },
        { key: 'alipayAccount', label: '支付宝账户', type: '文本' },
        { key: 'role', label: '角色', type: '枚举' },
        { key: 'status', label: '状态', type: '枚举' },
        { key: 'createdAt', label: '注册时间', type: '日期' },
        { key: 'updatedAt', label: '更新时间', type: '日期' },
        { key: 'lastLoginAt', label: '最后登录', type: '日期' }
      ],
      orders: [
        { key: 'id', label: '订单号', type: '数字' },
        { key: 'userId', label: '用户ID', type: '数字' },
        { key: 'userName', label: '用户姓名', type: '文本' },
        { key: 'userPhone', label: '用户手机', type: '文本' },
        { key: 'userAlipayAccount', label: '用户支付宝账户', type: '文本' },
        { key: 'productId', label: '商品ID', type: '数字' },
        { key: 'productName', label: '商品名称', type: '文本' },
        { key: 'quantity', label: '购买数量', type: '数字' },
        { key: 'unitPrice', label: '单价', type: '金额' },
        { key: 'totalAmount', label: '总金额', type: '金额' },
        { key: 'courierId', label: '快递公司ID', type: '数字' },
        { key: 'courierName', label: '快递公司', type: '文本' },
        { key: 'trackingNumber', label: '快递单号', type: '文本' },
        { key: 'status', label: '订单状态', type: '枚举' },
        { key: 'notes', label: '备注', type: '文本' },
        { key: 'createdAt', label: '下单时间', type: '日期' },
        { key: 'updatedAt', label: '更新时间', type: '日期' }
      ],
      products: [
        { key: 'id', label: '商品ID', type: '数字' },
        { key: 'name', label: '商品名称', type: '文本' },
        { key: 'description', label: '商品描述', type: '文本' },
        { key: 'price', label: '单价', type: '金额' },
        { key: 'category', label: '分类', type: '文本' },
        { key: 'status', label: '状态', type: '枚举' },
        { key: 'stock', label: '库存数量', type: '数字' },
        { key: 'soldCount', label: '已售数量', type: '数字' },
        { key: 'createdAt', label: '创建时间', type: '日期' },
        { key: 'updatedAt', label: '更新时间', type: '日期' }
      ],
      couriers: [
        { key: 'id', label: '快递公司ID', type: '数字' },
        { key: 'name', label: '公司名称', type: '文本' },
        { key: 'code', label: '公司代码', type: '文本' },
        { key: 'trackingNumberLength', label: '单号长度', type: '数字' },
        { key: 'trackingNumberPattern', label: '单号格式', type: '文本' },
        { key: 'status', label: '状态', type: '枚举' },
        { key: 'supportRegions', label: '支持区域', type: '文本' },
        { key: 'contactInfo', label: '联系方式', type: '文本' },
        { key: 'createdAt', label: '创建时间', type: '日期' },
        { key: 'updatedAt', label: '更新时间', type: '日期' }
      ]
    }

    // 默认字段选择配置
    const defaultFieldSelections = {
      users: ['id', 'realName', 'phone', 'role', 'status', 'createdAt'],
      orders: ['id', 'userName', 'userPhone', 'userAlipayAccount', 'productName', 'quantity', 'totalAmount', 'courierName', 'trackingNumber', 'status', 'createdAt'],
      products: ['id', 'name', 'price', 'category', 'status', 'stock', 'createdAt'],
      couriers: ['id', 'name', 'code', 'trackingNumberLength', 'status', 'createdAt']
    }
    
    const exportHistory = ref([
      {
        type: 'comprehensive',
        fileName: '系统数据综合报告_20240122143022.xlsx',
        recordCount: 156,
        fileSize: 45600,
        exportTime: '2024-01-22 14:30:22',
        status: 'success'
      },
      {
        type: 'users',
        fileName: '用户数据_20240122140500.xlsx',
        recordCount: 25,
        fileSize: 12800,
        exportTime: '2024-01-22 14:05:00',
        status: 'success'
      },
      {
        type: 'orders',
        fileName: '订单数据_20240122135000.xlsx',
        recordCount: 89,
        fileSize: 28400,
        exportTime: '2024-01-22 13:50:00',
        status: 'success'
      }
    ])

    const dataStats = computed(() => ({
      users: adminStore.users?.length || 0,
      orders: orderStore.orders?.length || 0,
      products: productStore.products?.length || 0,
      couriers: productStore.couriers?.length || 0
    }))

    // 当前选中数据类型的可用字段
    const availableFields = computed(() => {
      if (!selectedDataType.value) return []
      return fieldMappings[selectedDataType.value] || []
    })

    // 检查当前数据类型是否有状态字段
    const hasStatusField = computed(() => {
      if (!selectedDataType.value) return false
      return availableFields.value.some(field => field.key === 'status')
    })

    // 状态选项配置
    const statusOptions = computed(() => {
      if (!selectedDataType.value || !hasStatusField.value) return []

      switch (selectedDataType.value) {
        case 'users':
        case 'products':
        case 'couriers':
          return [
            { label: '启用', value: 'active' },
            { label: '禁用', value: 'inactive' }
          ]
        case 'orders':
          return [
            { label: '待处理', value: 'pending' },
            { label: '已完成', value: 'completed' },
            { label: '已取消', value: 'cancelled' }
          ]
        default:
          return []
      }
    })

    // 数据类型改变时的处理
    const onDataTypeChange = (dataType) => {
      selectedFields.value = []
      dateRange.value = []
      statusFilter.value = ''
      filteredRecordCount.value = null
      // 自动选择默认字段
      if (dataType && defaultFieldSelections[dataType]) {
        selectedFields.value = [...defaultFieldSelections[dataType]]
      }
      // 计算筛选后的记录数
      updateFilteredRecordCount()
    }

    // 时间范围改变处理
    const onDateRangeChange = () => {
      updateFilteredRecordCount()
    }

    // 清除时间筛选
    const clearDateRange = () => {
      dateRange.value = []
      updateFilteredRecordCount()
    }

    // 清除状态筛选
    const clearStatusFilter = () => {
      statusFilter.value = ''
      updateFilteredRecordCount()
    }

    // 更新筛选后的记录数
    const updateFilteredRecordCount = async () => {
      if (!selectedDataType.value) {
        filteredRecordCount.value = null
        return
      }

      try {
        let sourceData = []

        // 获取对应数据类型的原始数据
        switch (selectedDataType.value) {
          case 'users':
            await adminStore.fetchUsers()
            sourceData = adminStore.users
            break
          case 'orders':
            await orderStore.fetchOrders()
            sourceData = orderStore.orders
            break
          case 'products':
            await productStore.fetchProducts()
            sourceData = productStore.products
            break
          case 'couriers':
            await productStore.fetchCouriers()
            sourceData = productStore.couriers
            break
        }

        // 应用筛选条件
        const filteredData = applyFilters(sourceData)
        filteredRecordCount.value = filteredData.length

      } catch (error) {
        console.error('更新筛选记录数失败:', error)
        filteredRecordCount.value = null
      }
    }

    // 应用筛选条件
    const applyFilters = (data) => {
      if (!data || data.length === 0) return []

      return data.filter(item => {
        // 时间筛选
        if (dateRange.value && dateRange.value.length === 2) {
          const itemDate = new Date(item.createdAt || item.updatedAt)
          const startDate = new Date(dateRange.value[0])
          const endDate = new Date(dateRange.value[1])
          endDate.setHours(23, 59, 59, 999) // 包含结束日期的整天

          if (itemDate < startDate || itemDate > endDate) {
            return false
          }
        }

        // 状态筛选
        if (statusFilter.value && item.status !== statusFilter.value) {
          return false
        }

        return true
      })
    }

    // 字段选择相关方法
    const selectAllFields = () => {
      if (selectedDataType.value) {
        selectedFields.value = fieldMappings[selectedDataType.value].map(field => field.key)
      }
    }

    const clearAllFields = () => {
      selectedFields.value = []
    }

    const selectDefaultFields = () => {
      if (selectedDataType.value && defaultFieldSelections[selectedDataType.value]) {
        selectedFields.value = [...defaultFieldSelections[selectedDataType.value]]
      }
    }

    const exportData = async (type) => {
      try {
        exportLoading[type] = true
        
        let result = null
        
        switch (type) {
          case 'users':
            await adminStore.fetchUsers()
            result = await quickExport.users(adminStore.users)
            break
          case 'orders':
            await orderStore.fetchOrders()
            result = await quickExport.orders(orderStore.orders)
            break
          case 'products':
            await productStore.fetchProducts()
            result = await quickExport.products(productStore.products)
            break
          case 'couriers':
            await productStore.fetchCouriers()
            result = await quickExport.couriers(productStore.couriers)
            break
        }
        
        if (result) {
          ElMessage.success(`${getExportTypeLabel(type)}导出成功！`)
          addToHistory(type, result)
          updateLastExportTime()
        }
        
      } catch (error) {
        console.error(`Export ${type} error:`, error)
        ElMessage.error('导出失败，请重试')
      } finally {
        exportLoading[type] = false
      }
    }

    const exportCustomData = async () => {
      try {
        if (!selectedDataType.value) {
          ElMessage.warning('请选择数据类型')
          return
        }

        if (selectedFields.value.length === 0) {
          ElMessage.warning('请至少选择一个字段')
          return
        }

        exportLoading.custom = true

        let sourceData = []

        // 获取对应数据类型的原始数据
        switch (selectedDataType.value) {
          case 'users':
            await adminStore.fetchUsers()
            sourceData = adminStore.users
            break
          case 'orders':
            await orderStore.fetchOrders()
            sourceData = orderStore.orders
            break
          case 'products':
            await productStore.fetchProducts()
            sourceData = productStore.products
            break
          case 'couriers':
            await productStore.fetchCouriers()
            sourceData = productStore.couriers
            break
        }

        // 应用筛选条件
        const filteredSourceData = applyFilters(sourceData)

        if (filteredSourceData.length === 0) {
          ElMessage.warning('筛选条件下没有数据可导出')
          return
        }

        // 筛选字段并格式化数据
        const filteredData = filteredSourceData.map(item => {
          const filtered = {}
          selectedFields.value.forEach(fieldKey => {
            const fieldConfig = fieldMappings[selectedDataType.value].find(f => f.key === fieldKey)
            if (fieldConfig) {
              // 根据字段类型进行格式化
              let value = item[fieldKey]

              // 处理关联数据（如订单中的用户信息、商品信息等）
              if (selectedDataType.value === 'orders') {
                switch (fieldKey) {
                  case 'userName':
                    value = item.user?.realName || '未知用户'
                    break
                  case 'userPhone':
                    value = item.user?.phone || ''
                    break
                  case 'userAlipayAccount':
                    value = item.user?.alipayAccount || ''
                    break
                  case 'productName':
                    value = item.product?.name || '未知商品'
                    break
                  case 'unitPrice':
                    value = item.product?.price || 0
                    break
                  case 'courierName':
                    value = item.courier?.name || '未知快递'
                    break
                }
              }

              // 格式化不同类型的值
              if (fieldConfig.type === '日期' && value) {
                value = new Date(value).toLocaleString('zh-CN')
              } else if (fieldConfig.type === '金额' && typeof value === 'number') {
                value = `¥${value.toFixed(2)}`
              } else if (fieldConfig.type === '枚举') {
                // 可以在这里添加枚举值的中文映射
                if (fieldKey === 'status') {
                  const statusLabels = {
                    'active': '启用',
                    'inactive': '禁用',
                    'pending': '待处理',
                    'completed': '已完成',
                    'cancelled': '已取消'
                  }
                  value = statusLabels[value] || value
                } else if (fieldKey === 'role') {
                  const roleLabels = {
                    'admin': '管理员',
                    'user': '普通用户'
                  }
                  value = roleLabels[value] || value
                }
              }

              filtered[fieldConfig.label] = value || ''
            }
          })
          return filtered
        })

        // 生成文件名
        let filename = `${getExportTypeLabel(selectedDataType.value)}_自定义字段`

        // 添加时间范围到文件名
        if (dateRange.value && dateRange.value.length === 2) {
          filename += `_${dateRange.value[0]}_至_${dateRange.value[1]}`
        }

        // 添加状态筛选到文件名
        if (statusFilter.value) {
          const statusLabel = statusOptions.value.find(opt => opt.value === statusFilter.value)?.label
          if (statusLabel) {
            filename += `_${statusLabel}`
          }
        }

        // 调用导出函数
        const result = await quickExport.custom(filteredData, filename)

        if (result) {
          ElMessage.success(`成功导出 ${filteredData.length} 条记录！`)
          addToHistory('custom', result)
          updateLastExportTime()
        }

      } catch (error) {
        console.error('Custom export error:', error)
        ElMessage.error('自定义导出失败，请重试')
      } finally {
        exportLoading.custom = false
      }
    }

    const addToHistory = (type, result) => {
      const historyItem = {
        type,
        fileName: result.filename,
        recordCount: result.recordCount || result.totalRecords || 0,
        fileSize: Math.random() * 50000 + 10000, // 模拟文件大小
        exportTime: new Date().toLocaleString('zh-CN'),
        status: 'success'
      }
      
      exportHistory.value.unshift(historyItem)
    }

    const updateLastExportTime = () => {
      lastExportTime.value = new Date().toLocaleString('zh-CN')
    }

    const refreshHistory = async () => {
      historyLoading.value = true
      // 模拟刷新历史记录
      setTimeout(() => {
        historyLoading.value = false
        ElMessage.success('历史记录已刷新')
      }, 500)
    }

    const getExportTypeLabel = (type) => {
      const labels = {
        users: '用户数据',
        orders: '订单数据',
        products: '商品数据',
        couriers: '快递数据',
        comprehensive: '综合数据',
        custom: '自定义数据',
        filtered: '筛选数据'
      }
      return labels[type] || type
    }

    const getExportTypeTagType = (type) => {
      const tagTypes = {
        users: 'primary',
        orders: 'success',
        products: 'warning',
        couriers: 'info',
        comprehensive: 'danger',
        custom: '',
        filtered: ''
      }
      return tagTypes[type] || ''
    }

    const formatFileSize = (bytes) => {
      if (bytes === 0) return '0 B'
      const k = 1024
      const sizes = ['B', 'KB', 'MB', 'GB']
      const i = Math.floor(Math.log(bytes) / Math.log(k))
      return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
    }

    const formatDate = (dateStr) => {
      return dateStr
    }

    // 检测移动端
    const checkMobile = () => {
      isMobile.value = window.innerWidth <= 768
    }

    // 响应式分页布局
    const paginationLayout = computed(() => {
      return isMobile.value ? 'prev, pager, next' : 'prev, pager, next, sizes, jumper'
    })

    // 监听窗口大小变化
    const handleResize = () => {
      checkMobile()
    }

    onMounted(() => {
      // 初始化数据
      Promise.all([
        adminStore.fetchUsers(),
        orderStore.fetchOrders(),
        productStore.fetchProducts(),
        productStore.fetchCouriers()
      ]).catch(console.error)

      updateLastExportTime()
      checkMobile()
      window.addEventListener('resize', handleResize)
    })

    onUnmounted(() => {
      window.removeEventListener('resize', handleResize)
    })

    return {
      exportLoading,
      selectedDataType,
      selectedFields,
      dateRange,
      statusFilter,
      filteredRecordCount,
      availableFields,
      hasStatusField,
      statusOptions,
      exportHistory,
      historyLoading,
      historyPage,
      lastExportTime,
      dataStats,
      isMobile,
      paginationLayout,
      exportData,
      exportCustomData,
      onDataTypeChange,
      onDateRangeChange,
      clearDateRange,
      clearStatusFilter,
      updateFilteredRecordCount,
      selectAllFields,
      clearAllFields,
      selectDefaultFields,
      refreshHistory,
      getExportTypeLabel,
      getExportTypeTagType,
      formatFileSize,
      formatDate
    }
  }
}
</script>

<style scoped>
/* Mobile-first responsive design */
.data-export {
  padding: 12px;
  min-height: 100vh;
  overflow-x: hidden;
}

@media (min-width: 481px) {
  .data-export {
    padding: 16px;
  }
}

@media (min-width: 769px) {
  .data-export {
    padding: 20px;
  }
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 16px;
  gap: 12px;
}

@media (min-width: 769px) {
  .page-header {
    align-items: center;
    margin-bottom: 20px;
  }
}

.page-header h2 {
  margin: 0;
  color: #303133;
  font-size: 20px;
  line-height: 1.2;
}

@media (min-width: 769px) {
  .page-header h2 {
    font-size: 24px;
  }
}

.header-info {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

@media (min-width: 769px) {
  .header-info {
    gap: 16px;
  }
}

.header-time-text {
  display: none;
}

@media (min-width: 481px) {
  .header-time-text {
    display: inline;
  }
}

@media (min-width: 769px) {
  .header-time-text:before {
    content: '最后导出时间: ';
  }
}

.export-card {
  height: auto;
}

/* Quick Export Grid - Responsive */
.quick-export-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 12px;
}

@media (min-width: 481px) {
  .quick-export-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 16px;
  }
}

@media (min-width: 1200px) {
  .quick-export-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-header h3 {
  margin: 0;
  color: #303133;
  font-size: 16px;
}

@media (min-width: 769px) {
  .card-header h3 {
    font-size: 18px;
  }
}

.option-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  border: 1px solid #ebeef5;
  border-radius: 12px;
  transition: all 0.3s ease;
  min-height: 72px;
  touch-action: manipulation;
  -webkit-tap-highlight-color: transparent;
}

@media (min-width: 769px) {
  .option-item {
    padding: 16px;
    min-height: auto;
    border-radius: 8px;
  }
}

.option-item:hover {
  border-color: #409eff;
  box-shadow: 0 2px 8px rgba(64, 158, 255, 0.1);
}

.option-header {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
  min-width: 0;
}

@media (min-width: 769px) {
  .option-header {
    gap: 12px;
  }
}

.option-header span {
  font-size: 14px;
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

@media (min-width: 769px) {
  .option-header span {
    font-size: 16px;
  }
}

.option-actions {
  flex-shrink: 0;
  margin-left: 8px;
}

@media (min-width: 769px) {
  .option-actions {
    margin-left: 0;
  }
}

/* Touch-friendly buttons */
.option-actions .el-button {
  min-height: 48px;
  padding: 12px 16px;
  font-size: 14px;
  border-radius: 8px;
  touch-action: manipulation;
  -webkit-tap-highlight-color: transparent;
}

@media (min-width: 769px) {
  .option-actions .el-button {
    min-height: auto;
    padding: 8px 15px;
  }
}

.option-icon {
  font-size: 20px;
}

.option-icon.user {
  color: #409eff;
}

.option-icon.order {
  color: #67c23a;
}

.option-icon.product {
  color: #e6a23c;
}

.option-icon.courier {
  color: #909399;
}

/* Advanced Export - Responsive Layout */
.advanced-content {
  margin: 0 -8px;
}

@media (min-width: 769px) {
  .advanced-content {
    margin: 0 -10px;
  }
}

/* Data Type Selection - Mobile Optimized */
.data-type-selection {
  margin-bottom: 20px;
}

@media (min-width: 769px) {
  .data-type-selection {
    margin-bottom: 0;
  }
}

/* 数据类型选择样式 */
.data-type-selection h4 {
  margin: 0 0 16px 0;
  color: #303133;
  font-size: 16px;
}

.data-type-options {
  display: grid;
  grid-template-columns: 1fr;
  gap: 8px;
}

@media (min-width: 481px) {
  .data-type-options {
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;
  }
}

@media (min-width: 769px) {
  .data-type-options {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }
}

.data-type-radio {
  width: 100%;
  margin: 0;
  padding: 16px;
  border: 1px solid #ebeef5;
  border-radius: 12px;
  transition: all 0.3s ease;
  min-height: 56px;
  display: flex;
  align-items: center;
  touch-action: manipulation;
  -webkit-tap-highlight-color: transparent;
  cursor: pointer;
}

@media (min-width: 769px) {
  .data-type-radio {
    padding: 12px;
    min-height: auto;
    border-radius: 8px;
  }
}

.data-type-radio:hover {
  border-color: #409eff;
  background-color: #f5f7fa;
}

.data-type-radio.is-checked {
  border-color: #409eff;
  background-color: #ecf5ff;
}

.radio-content {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
}

.type-icon {
  font-size: 18px;
}

.type-icon.user {
  color: #409eff;
}

.type-icon.order {
  color: #67c23a;
}

.type-icon.product {
  color: #e6a23c;
}

.type-icon.courier {
  color: #909399;
}

.type-info {
  display: flex;
  flex-direction: column;
  flex: 1;
}

.type-name {
  font-weight: 500;
  color: #303133;
  font-size: 13px;
}

@media (min-width: 769px) {
  .type-name {
    font-size: 14px;
  }
}

.type-count {
  font-size: 11px;
  color: #909399;
  margin-top: 2px;
}

@media (min-width: 769px) {
  .type-count {
    font-size: 12px;
  }
}

/* 字段选择样式 */
.field-selection {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.field-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.field-header h4 {
  margin: 0;
  color: #303133;
  font-size: 16px;
}

.field-actions {
  display: flex;
  gap: 8px;
}

.field-placeholder {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 200px;
}

.field-checkboxes {
  flex: 1;
  margin-bottom: 16px;
}

.checkbox-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px;
  max-height: 300px;
  overflow-y: auto;
  padding: 8px;
  border: 1px solid #ebeef5;
  border-radius: 6px;
  background-color: #fafafa;
}

@media (max-width: 1400px) {
  .checkbox-grid {
    grid-template-columns: 1fr;
  }
}

.field-checkbox {
  margin: 0;
  padding: 12px;
  border-radius: 8px;
  transition: background-color 0.2s ease;
  min-height: 48px;
  display: flex;
  align-items: center;
  touch-action: manipulation;
  -webkit-tap-highlight-color: transparent;
  cursor: pointer;
}

.field-checkbox:hover {
  background-color: #f0f0f0;
}

@media (min-width: 769px) {
  .field-checkbox {
    padding: 8px;
    min-height: auto;
    border-radius: 4px;
  }
}

.checkbox-content {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.field-name {
  font-size: 14px;
  color: #303133;
  font-weight: 500;
}

.field-type {
  font-size: 11px;
  color: #909399;
}

.export-actions {
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin-top: auto;
  padding-top: 16px;
  border-top: 1px solid #ebeef5;
}

.export-filters {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 12px;
  background-color: #f8f9fa;
  border-radius: 6px;
  border: 1px solid #e9ecef;
}

.filter-row {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.filter-label {
  font-weight: 500;
  color: #303133;
  font-size: 14px;
  min-width: 80px;
  flex-shrink: 0;
}

.export-buttons {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.export-summary {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

@media (max-width: 1200px) {
  .export-buttons {
    flex-direction: column;
    align-items: stretch;
  }

  .export-summary {
    justify-content: center;
  }

  .filter-row {
    flex-direction: column;
    align-items: flex-start;
  }

  .filter-label {
    min-width: auto;
  }
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-header h3 {
  margin: 0;
  color: #303133;
}

.export-options {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.option-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  border: 1px solid #ebeef5;
  border-radius: 8px;
  transition: all 0.3s ease;
}

.option-item:hover {
  border-color: #409eff;
  box-shadow: 0 2px 8px rgba(64, 158, 255, 0.1);
}

.option-header {
  display: flex;
  align-items: center;
  gap: 12px;
}

.option-icon {
  font-size: 20px;
}

.option-icon.user {
  color: #409eff;
}

.option-icon.order {
  color: #67c23a;
}

.option-icon.product {
  color: #e6a23c;
}

.option-icon.courier {
  color: #909399;
}

.comprehensive-export {
  text-align: center;
}

.export-info {
  margin-bottom: 24px;
}

.export-info ul {
  text-align: left;
  color: #606266;
  padding-left: 20px;
}

.export-info li {
  margin: 8px 0;
  font-size: 14px;
}

.advanced-option {
  border: 1px solid #ebeef5;
  border-radius: 8px;
  padding: 20px;
}

.advanced-option h4 {
  margin: 0 0 16px 0;
  color: #303133;
  font-size: 16px;
}

.custom-fields {
  background: #f8f9fa;
  padding: 16px;
  border-radius: 6px;
}

/* Mobile History Cards */
.mobile-history {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.history-card-item {
  background: #fff;
  border: 1px solid #ebeef5;
  border-radius: 12px;
  padding: 16px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.04);
  transition: all 0.3s ease;
}

.history-card-item:active {
  transform: scale(0.98);
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.08);
}

.history-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  gap: 8px;
}

.history-filename {
  font-weight: 500;
  color: #303133;
  font-size: 14px;
  margin-bottom: 12px;
  word-break: break-all;
  line-height: 1.4;
}

.history-details {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.detail-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 13px;
}

.detail-label {
  color: #909399;
  font-weight: 500;
}

.detail-value {
  color: #303133;
  font-family: monospace;
}

/* Enhanced Filter Controls for Mobile */
.filter-controls {
  display: flex;
  flex-direction: column;
  gap: 8px;
  width: 100%;
}

@media (min-width: 481px) {
  .filter-controls {
    flex-direction: row;
    align-items: center;
  }
}

.mobile-date-picker {
  width: 100%;
}

@media (min-width: 481px) {
  .mobile-date-picker {
    width: auto;
    min-width: 280px;
  }
}

.mobile-select {
  width: 100%;
}

@media (min-width: 481px) {
  .mobile-select {
    width: auto;
    min-width: 160px;
  }
}

.mobile-clear-btn {
  width: 100%;
  min-height: 44px;
}

@media (min-width: 481px) {
  .mobile-clear-btn {
    width: auto;
    min-height: auto;
  }
}

.mobile-export-btn {
  width: 100%;
  min-height: 48px;
  border-radius: 8px;
  font-weight: 500;
  touch-action: manipulation;
  -webkit-tap-highlight-color: transparent;
}

@media (min-width: 769px) {
  .mobile-export-btn {
    width: auto;
    min-height: auto;
  }
}

/* Pagination Mobile Optimization */
.pagination-wrapper {
  margin-top: 20px;
  display: flex;
  justify-content: center;
}

/* Mobile Table Hide */
@media (max-width: 768px) {
  .desktop-table {
    display: none !important;
  }
}

@media (min-width: 769px) {
  .mobile-history {
    display: none !important;
  }
}

/* Touch Target Improvements */
:deep(.el-radio__input) {
  transform: scale(1.2);
}

:deep(.el-checkbox__input) {
  transform: scale(1.2);
}

@media (min-width: 769px) {
  :deep(.el-radio__input) {
    transform: scale(1);
  }

  :deep(.el-checkbox__input) {
    transform: scale(1);
  }
}

/* Button Group Mobile Spacing */
.field-actions .el-button {
  min-height: 44px;
  font-size: 13px;
  padding: 8px 12px;
}

@media (max-width: 480px) {
  .field-actions {
    flex-direction: column;
    gap: 8px;
  }

  .field-actions .el-button {
    width: 100%;
  }
}

/* Refresh Button Mobile */
.refresh-text {
  display: none;
}

@media (min-width: 481px) {
  .refresh-text {
    display: inline;
  }
}

/* Card Header Mobile Responsive */
.card-header .el-button {
  min-height: 44px;
  touch-action: manipulation;
  -webkit-tap-highlight-color: transparent;
}

@media (max-width: 480px) {
  .card-header {
    flex-direction: column;
    align-items: stretch;
    gap: 12px;
  }

  .card-header h3 {
    text-align: center;
  }
}

/* iOS Safari Touch Improvements */
:deep(.el-button) {
  -webkit-appearance: none;
  -webkit-tap-highlight-color: transparent;
  touch-action: manipulation;
}

:deep(.el-checkbox__inner) {
  border-radius: 6px;
}

:deep(.el-radio__inner) {
  border-radius: 50%;
}

/* Prevent zoom on iOS when focusing inputs */
:deep(.el-input__inner) {
  font-size: 16px;
}

:deep(.el-select .el-input__inner) {
  font-size: 16px;
}

:deep(.el-date-editor .el-input__inner) {
  font-size: 16px;
}

/* Better spacing for mobile dropdowns */
:deep(.el-select-dropdown) {
  margin-top: 8px;
}

:deep(.el-picker-panel) {
  margin-top: 8px;
}

/* Loading overlay mobile optimization */
:deep(.el-loading-mask) {
  border-radius: 12px;
}

/* Empty state mobile optimization */
:deep(.el-empty) {
  padding: 32px 16px;
}

:deep(.el-empty__description) {
  font-size: 14px;
  margin-top: 12px;
}

/* Card shadow enhancement for mobile */
@media (max-width: 768px) {
  :deep(.el-card) {
    border-radius: 12px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  }

  :deep(.el-card__header) {
    padding: 16px;
  }

  :deep(.el-card__body) {
    padding: 16px;
  }
}

/* Smooth scrolling */
.checkbox-grid {
  scroll-behavior: smooth;
  -webkit-overflow-scrolling: touch;
}

/* Focus indicators for accessibility */
:deep(.el-button:focus) {
  outline: 2px solid #409eff;
  outline-offset: 2px;
}

:deep(.el-checkbox__input:focus + .el-checkbox__inner) {
  border-color: #409eff;
  box-shadow: 0 0 0 2px rgba(64, 158, 255, 0.2);
}

:deep(.el-radio__input:focus + .el-radio__inner) {
  border-color: #409eff;
  box-shadow: 0 0 0 2px rgba(64, 158, 255, 0.2);
}

/* Swipe gesture hint for mobile cards */
@media (max-width: 768px) {
  .history-card-item::after {
    content: '';
    position: absolute;
    top: 50%;
    right: 12px;
    width: 4px;
    height: 24px;
    background: linear-gradient(to bottom, transparent, #ddd, transparent);
    border-radius: 2px;
    transform: translateY(-50%);
    opacity: 0.3;
  }

  .history-card-item {
    position: relative;
  }
}

:deep(.el-checkbox-group) {
  width: 100%;
}

:deep(.el-checkbox) {
  margin-right: 0;
  margin-bottom: 0;
}
</style>
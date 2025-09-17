<template>
  <div class="product-management">
    <!-- Header -->
    <div class="page-header">
      <h2>商品管理</h2>
      <div class="header-actions">
        <el-input
          v-model="searchKeyword"
          placeholder="搜索商品名称"
          clearable
          class="search-input"
          @input="handleSearch"
        >
          <template #prefix>
            <el-icon><Search /></el-icon>
          </template>
        </el-input>

        <el-button type="primary" @click="addProduct" class="add-btn">
          <el-icon><Plus /></el-icon>
          <span class="btn-text">添加商品</span>
        </el-button>

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
            <el-icon><Box /></el-icon>
          </div>
          <div class="stat-content">
            <h3>{{ productStats.total }}</h3>
            <p>商品总数</p>
          </div>
        </div>
      </el-card>

      <el-card class="stat-card">
        <div class="stat-item">
          <div class="stat-icon active">
            <el-icon><CircleCheck /></el-icon>
          </div>
          <div class="stat-content">
            <h3>{{ productStats.active }}</h3>
            <p>启用商品</p>
          </div>
        </div>
      </el-card>

      <el-card class="stat-card">
        <div class="stat-item">
          <div class="stat-icon inactive">
            <el-icon><CircleClose /></el-icon>
          </div>
          <div class="stat-content">
            <h3>{{ productStats.inactive }}</h3>
            <p>禁用商品</p>
          </div>
        </div>
      </el-card>
    </div>

    <!-- Product Table/Cards -->
    <el-card class="products-container">
      <template #header>
        <div class="card-header">
          <span>商品列表</span>
          <div class="header-tools">
            <el-select
              v-model="statusFilter"
              placeholder="筛选状态"
              clearable
              class="status-filter"
            >
              <el-option label="全部" value="" />
              <el-option label="启用" value="active" />
              <el-option label="禁用" value="inactive" />
            </el-select>
          </div>
        </div>
      </template>

      <!-- Desktop Table View -->
      <div class="desktop-view">
        <el-table
          :data="filteredProducts"
          v-loading="loading"
          style="width: 100%"
          :default-sort="{ prop: 'created_at', order: 'descending' }"
          class="products-table"
        >
          <el-table-column prop="id" label="ID" width="60" sortable />

          <el-table-column prop="name" label="商品名称" min-width="160">
            <template #default="{ row }">
              <div class="product-info">
                <div class="product-name">{{ row.name }}</div>
                <div class="product-details">
                  ID: {{ row.id }} | 价格: ¥{{ Number(row.price).toFixed(2) }}
                </div>
              </div>
            </template>
          </el-table-column>

          <el-table-column prop="price" label="价格" width="120" sortable>
            <template #default="{ row }">
              <div class="amount">
                ¥{{ Number(row.price).toFixed(2) }}
              </div>
            </template>
          </el-table-column>

          <el-table-column prop="description" label="商品描述" min-width="120">
            <template #default="{ row }">
              <span class="description">
                {{ row.description || '无描述' }}
              </span>
            </template>
          </el-table-column>

          <el-table-column prop="status" label="状态" width="80">
            <template #default="{ row }">
              <el-tag :type="row.status === 'active' ? 'success' : 'danger'">
                {{ row.status === 'active' ? '启用' : '禁用' }}
              </el-tag>
            </template>
          </el-table-column>

          <el-table-column prop="created_at" label="创建时间" width="160" sortable>
            <template #default="{ row }">
              {{ formatDate(row.created_at || row.createdAt) }}
            </template>
          </el-table-column>

          <el-table-column prop="updated_at" label="更新时间" width="160">
            <template #default="{ row }">
              {{ formatDate(row.updated_at || row.updatedAt) }}
            </template>
          </el-table-column>

          <el-table-column label="操作" width="200">
            <template #default="{ row }">
              <div class="desktop-actions">
                <el-button size="small" @click="editProduct(row)">
                  <el-icon><Edit /></el-icon>
                  编辑
                </el-button>

                <!-- 更多操作按钮 -->
                <el-dropdown @command="(command) => handleMoreActions(row, command)" trigger="click">
                  <el-button size="small" type="info" plain>
                    <el-icon><MoreFilled /></el-icon>
                    更多
                  </el-button>
                  <template #dropdown>
                    <el-dropdown-menu>
                      <el-dropdown-item
                        :command="row.status === 'active' ? 'disable' : 'enable'"
                      >
                        <el-icon v-if="row.status === 'active'"><Hide /></el-icon>
                        <el-icon v-else><View /></el-icon>
                        {{ row.status === 'active' ? '禁用商品' : '启用商品' }}
                      </el-dropdown-item>
                      <el-dropdown-item command="delete" divided>
                        <el-icon><Delete /></el-icon>
                        删除商品
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

        <div v-else-if="filteredProducts.length === 0" class="empty-state">
          <el-icon><DocumentDelete /></el-icon>
          <div>暂无商品数据</div>
        </div>

        <div v-else class="mobile-products">
          <div
            v-for="product in filteredProducts"
            :key="product.id"
            class="product-card"
          >
            <el-card shadow="hover">
              <!-- Card Header -->
              <div class="card-header-mobile">
                <div class="product-name-mobile">{{ product.name }}</div>
                <el-tag :type="product.status === 'active' ? 'success' : 'danger'" size="default">
                  {{ product.status === 'active' ? '启用' : '禁用' }}
                </el-tag>
              </div>

              <!-- Card Body -->
              <div class="card-body">
                <!-- Price Row -->
                <div class="info-row highlight">
                  <div class="info-label">
                    <el-icon><Money /></el-icon>
                    价格
                  </div>
                  <div class="info-value">
                    <div class="product-price">¥{{ Number(product.price).toFixed(2) }}</div>
                  </div>
                </div>

                <!-- Description Row -->
                <div class="info-row">
                  <div class="info-label">
                    <el-icon><Document /></el-icon>
                    描述
                  </div>
                  <div class="info-value">
                    <div class="product-description">{{ product.description || '无描述' }}</div>
                  </div>
                </div>

                <!-- ID Row -->
                <div class="info-row">
                  <div class="info-label">
                    <el-icon><Key /></el-icon>
                    ID
                  </div>
                  <div class="info-value">
                    <div class="product-id">#{{ product.id }}</div>
                  </div>
                </div>

                <!-- Time Row -->
                <div class="info-row">
                  <div class="info-label">
                    <el-icon><Clock /></el-icon>
                    时间
                  </div>
                  <div class="info-value">
                    <div class="created-time">{{ formatDate(product.created_at || product.createdAt) }}</div>
                  </div>
                </div>
              </div>

              <!-- Card Actions -->
              <div class="card-actions">
                <!-- 编辑 -->
                <el-button
                  type="primary"
                  size="default"
                  class="action-btn"
                  @click="editProduct(product)"
                >
                  <el-icon><Edit /></el-icon>
                  编辑商品
                </el-button>

                <!-- 更多操作 -->
                <el-dropdown
                  @command="(command) => handleMoreActions(product, command)"
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
                      <el-dropdown-item
                        :command="product.status === 'active' ? 'disable' : 'enable'"
                      >
                        <el-icon v-if="product.status === 'active'"><Hide /></el-icon>
                        <el-icon v-else><View /></el-icon>
                        {{ product.status === 'active' ? '禁用商品' : '启用商品' }}
                      </el-dropdown-item>
                      <el-dropdown-item command="delete" divided>
                        <el-icon><Delete /></el-icon>
                        删除商品
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
          :total="totalProducts"
          :layout="paginationLayout"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
          class="pagination"
        />
      </div>
    </el-card>

    <!-- Add/Edit Product Dialog -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogTitle"
      width="500px"
      @close="closeDialog"
    >
      <el-form
        ref="formRef"
        :model="editForm"
        :rules="formRules"
        label-width="80px"
      >
        <el-form-item label="商品名称" prop="name">
          <el-input
            v-model="editForm.name"
            placeholder="请输入商品名称"
            maxlength="100"
            clearable
            show-word-limit
          />
        </el-form-item>
        
        <el-form-item label="商品价格" prop="price">
          <el-input-number
            v-model="editForm.price"
            :min="0.01"
            :max="99999.99"
            :step="0.01"
            :precision="2"
            style="width: 100%"
          />
          <div style="font-size: 12px; color: #909399; margin-top: 4px">
            价格范围：0.01 - 99999.99 元
          </div>
        </el-form-item>
        
        <el-form-item label="状态" prop="status">
          <el-radio-group v-model="editForm.status">
            <el-radio label="active">启用</el-radio>
            <el-radio label="inactive">禁用</el-radio>
          </el-radio-group>
        </el-form-item>
        
        <el-form-item label="商品描述">
          <el-input
            v-model="editForm.description"
            type="textarea"
            placeholder="请输入商品描述（可选）"
            :rows="3"
            maxlength="500"
            show-word-limit
          />
        </el-form-item>
      </el-form>
      
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="closeDialog">取消</el-button>
          <el-button type="primary" @click="saveProduct" :loading="saving">
            {{ isEditing ? '保存' : '添加' }}
          </el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script>
import { ref, computed, onMounted, reactive } from 'vue'
import { useProductStore } from '../../stores/product'
import { ElMessage, ElMessageBox } from 'element-plus'
import { formatDate, formatDateTime } from '@/utils/time'

export default {
  name: 'ProductManagement',
  setup() {
    const productStore = useProductStore()
    
    const loading = ref(false)
    const saving = ref(false)
    const searchKeyword = ref('')
    const statusFilter = ref('')
    const currentPage = ref(1)
    const pageSize = ref(20)
    const totalProducts = ref(0)
    
    const dialogVisible = ref(false)
    const currentEditProduct = ref(null)
    const formRef = ref()

    // Responsive computed properties
    const isMobile = computed(() => window.innerWidth <= 768)
    const paginationLayout = computed(() =>
      isMobile.value ? 'prev, pager, next' : 'total, sizes, prev, pager, next, jumper'
    )
    
    const editForm = reactive({
      name: '',
      price: 0.01,
      status: 'active',
      description: ''
    })
    
    const formRules = {
      name: [
        { required: true, message: '请输入商品名称', trigger: 'blur' },
        { min: 1, max: 100, message: '商品名称长度在1到100个字符', trigger: 'blur' }
      ],
      price: [
        { required: true, message: '请输入商品价格', trigger: 'blur' },
        { type: 'number', min: 0.01, max: 99999.99, message: '价格范围：0.01-99999.99', trigger: 'blur' }
      ],
      status: [
        { required: true, message: '请选择状态', trigger: 'change' }
      ]
    }

    const products = computed(() => productStore.products)
    
    const productStats = computed(() => {
      const total = products.value.length
      const active = products.value.filter(p => p.status === 'active').length
      const inactive = total - active
      
      return { total, active, inactive }
    })
    
    const dialogTitle = computed(() => {
      return currentEditProduct.value ? '编辑商品' : '添加商品'
    })
    
    const isEditing = computed(() => !!currentEditProduct.value)

    const filteredProducts = computed(() => {
      let filtered = products.value.filter(product => {
        // 搜索过滤
        if (searchKeyword.value) {
          const keyword = searchKeyword.value.toLowerCase()
          if (!product.name.toLowerCase().includes(keyword)) {
            return false
          }
        }
        
        // 状态过滤
        if (statusFilter.value && product.status !== statusFilter.value) {
          return false
        }
        
        return true
      })
      
      totalProducts.value = filtered.length
      
      // 分页
      const start = (currentPage.value - 1) * pageSize.value
      const end = start + pageSize.value
      
      return filtered.slice(start, end)
    })
    

    const handleSearch = () => {
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
        await productStore.fetchProducts()
        ElMessage.success('数据刷新成功')
      } catch (error) {
        ElMessage.error('刷新数据失败')
      } finally {
        loading.value = false
      }
    }

    const addProduct = () => {
      currentEditProduct.value = null
      editForm.name = ''
      editForm.price = 0.01
      editForm.status = 'active'
      editForm.description = ''
      dialogVisible.value = true
    }

    const editProduct = (product) => {
      currentEditProduct.value = product
      editForm.name = product.name
      editForm.price = product.price
      editForm.status = product.status
      editForm.description = product.description || ''
      dialogVisible.value = true
    }

    const closeDialog = () => {
      dialogVisible.value = false
      currentEditProduct.value = null
      if (formRef.value) {
        formRef.value.resetFields()
      }
    }

    const saveProduct = async () => {
      try {
        const valid = await formRef.value.validate()
        if (!valid) return

        saving.value = true
        
        const productData = {
          name: editForm.name.trim(),
          price: editForm.price,
          status: editForm.status,
          description: editForm.description?.trim() || ''
        }
        
        if (isEditing.value) {
          await productStore.updateProduct(currentEditProduct.value.id, productData)
          ElMessage.success('商品更新成功')
        } else {
          await productStore.addProduct(productData)
          ElMessage.success('商品添加成功')
        }
        
        closeDialog()
        await refreshData()
        
      } catch (error) {
        ElMessage.error(isEditing.value ? '更新商品失败' : '添加商品失败')
      } finally {
        saving.value = false
      }
    }

    const toggleProductStatus = async (product) => {
      try {
        const action = product.status === 'active' ? '禁用' : '启用'
        
        await ElMessageBox.confirm(
          `确定要${action}商品"${product.name}"吗？`,
          '确认操作',
          {
            confirmButtonText: '确定',
            cancelButtonText: '取消',
            type: 'warning'
          }
        )
        
        await productStore.updateProduct(product.id, {
          status: product.status === 'active' ? 'inactive' : 'active'
        })
        
        ElMessage.success(`商品已${action}`)
        await refreshData()
        
      } catch (error) {
        if (error !== 'cancel') {
          ElMessage.error('操作失败')
        }
      }
    }

    const deleteProduct = async (product) => {
      try {
        await productStore.deleteProduct(product.id)
        ElMessage.success('商品删除成功')
        await refreshData()
      } catch (error) {
        ElMessage.error('删除商品失败')
      }
    }

    // 更多操作处理
    const handleMoreActions = async (product, action) => {
      try {
        switch (action) {
          case 'enable':
          case 'disable':
            await toggleProductStatus(product)
            break
          case 'delete':
            await ElMessageBox.confirm(
              `确定要删除商品"${product.name}"吗？此操作不可恢复。`,
              '确认删除',
              {
                confirmButtonText: '确定',
                cancelButtonText: '取消',
                type: 'warning'
              }
            )
            await deleteProduct(product)
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
      currentPage,
      pageSize,
      totalProducts,
      products,
      productStats,
      filteredProducts,
      dialogVisible,
      dialogTitle,
      isEditing,
      editForm,
      formRules,
      formRef,
      paginationLayout,
      formatDate,
      handleSearch,
      handleSizeChange,
      handleCurrentChange,
      refreshData,
      addProduct,
      editProduct,
      closeDialog,
      saveProduct,
      toggleProductStatus,
      deleteProduct,
      handleMoreActions
    }
  }
}
</script>

<style scoped>
/* Base Styles */
.product-management {
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

.add-btn .btn-text,
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

.stat-icon.active {
  background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);
}

.stat-icon.inactive {
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

/* Products Container */
.products-container {
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

/* Desktop Table View */
.desktop-view {
  display: block;
}

.products-table {
  font-size: 14px;
}

.products-table :deep(.el-table__cell) {
  padding: 12px 8px;
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

.description {
  color: #606266;
  font-size: 13px;
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

.mobile-products {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.product-card {
  width: 100%;
}

.product-card .el-card {
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  transition: all 0.3s ease;
}

.product-card .el-card:hover {
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

.product-name-mobile {
  font-weight: 700;
  font-size: 18px;
  color: #303133;
  flex: 1;
  margin-right: 12px;
  word-break: break-word;
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

.product-price {
  font-family: 'Consolas', 'Monaco', monospace;
  font-weight: 700;
  color: #f56c6c;
  font-size: 20px !important;
}

.product-description {
  color: #606266;
  line-height: 1.4;
}

.product-id {
  font-family: 'Consolas', 'Monaco', monospace;
  font-weight: 600;
  color: #409eff;
}

.created-time {
  color: #909399;
  font-size: 14px;
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
  .product-management {
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

  .add-btn,
  .refresh-btn {
    width: auto;
    min-width: 80px;
    padding: 8px 16px;
    font-size: 13px;
  }

  .add-btn .btn-text,
  .refresh-btn .btn-text {
    display: inline;
    margin-left: 4px;
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

  .status-filter {
    width: 100%;
  }

  /* Pagination */
  .pagination :deep(.el-pagination__sizes),
  .pagination :deep(.el-pagination__total),
  .pagination :deep(.el-pagination__jump) {
    display: none;
  }
}

@media (max-width: 480px) {
  .product-management {
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

  .product-name-mobile {
    font-size: 16px;
  }

  .product-price {
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

:deep(.el-table .cell) {
  padding: 12px 8px;
}

:deep(.el-input-number) {
  width: 100%;
}

:deep(.el-input-number .el-input__inner) {
  text-align: left;
}

/* Hide text on mobile for specific buttons */
@media (max-width: 768px) {
  .add-btn .btn-text,
  .refresh-btn .btn-text {
    display: inline;
    font-size: 12px;
  }

  .add-btn,
  .refresh-btn {
    min-width: 70px;
  }
}
</style>
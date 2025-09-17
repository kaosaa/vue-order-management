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
          style="width: 250px; margin-right: 16px"
          @input="handleSearch"
        >
          <template #prefix>
            <el-icon><Search /></el-icon>
          </template>
        </el-input>
        
        <el-button type="primary" @click="addProduct">
          <el-icon><Plus /></el-icon>
          添加商品
        </el-button>
        
        <el-button @click="refreshData">
          <el-icon><Refresh /></el-icon>
          刷新数据
        </el-button>
      </div>
    </div>

    <!-- Statistics Cards -->
    <el-row :gutter="20" style="margin-bottom: 20px">
      <el-col :span="8">
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
      </el-col>
      
      <el-col :span="8">
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
      </el-col>
      
      <el-col :span="8">
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
      </el-col>
    </el-row>

    <!-- Product Table -->
    <el-card>
      <template #header>
        <div class="card-header">
          <span>商品列表</span>
          <div class="header-tools">
            <el-select v-model="statusFilter" placeholder="筛选状态" clearable style="width: 120px">
              <el-option label="全部" value="" />
              <el-option label="启用" value="active" />
              <el-option label="禁用" value="inactive" />
            </el-select>
          </div>
        </div>
      </template>

      <el-table 
        :data="filteredProducts" 
        v-loading="loading"
        style="width: 100%"
        :default-sort="{ prop: 'created_at', order: 'descending' }"
      >
        <el-table-column prop="id" label="ID" width="60" sortable />
        
        <el-table-column prop="name" label="商品名称" min-width="160">
          <template #default="{ row }">
            <div>
              <div style="font-weight: 500; color: #303133; font-size: 14px">{{ row.name }}</div>
              <div style="font-size: 12px; color: #909399; margin-top: 2px">
                ID: {{ row.id }} | 价格: ¥{{ row.price }}
              </div>
            </div>
          </template>
        </el-table-column>

        <el-table-column prop="price" label="价格" width="120" sortable>
          <template #default="{ row }">
            <div style="font-family: monospace; font-weight: 500; color: #f56c6c">
              ¥{{ Number(row.price).toFixed(2) }}
            </div>
          </template>
        </el-table-column>

        <el-table-column prop="description" label="商品描述" min-width="120">
          <template #default="{ row }">
            <span style="color: #606266; font-size: 13px">
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
        
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button size="small" @click="editProduct(row)">
              <el-icon><Edit /></el-icon>
              编辑
            </el-button>
            
            <el-button 
              size="small" 
              :type="row.status === 'active' ? 'warning' : 'success'"
              @click="toggleProductStatus(row)"
            >
              <el-icon v-if="row.status === 'active'"><Hide /></el-icon>
              <el-icon v-else><View /></el-icon>
              {{ row.status === 'active' ? '禁用' : '启用' }}
            </el-button>
            
            <el-popconfirm
              title="确定要删除这个商品吗？"
              @confirm="deleteProduct(row)"
            >
              <template #reference>
                <el-button size="small" type="danger">
                  <el-icon><Delete /></el-icon>
                  删除
                </el-button>
              </template>
            </el-popconfirm>
          </template>
        </el-table-column>
      </el-table>

      <!-- Pagination -->
      <div style="margin-top: 20px; text-align: center">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :page-sizes="[10, 20, 50, 100]"
          :total="totalProducts"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
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
      deleteProduct
    }
  }
}
</script>

<style scoped>
.product-management {
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

.stat-icon.active {
  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
}

.stat-icon.inactive {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
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
}

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
</style>
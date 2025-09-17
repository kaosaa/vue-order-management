<template>
  <div class="courier-management">
    <!-- Header -->
    <div class="page-header">
      <h2>快递管理</h2>
      <div class="header-actions">
        <el-input
          v-model="searchKeyword"
          placeholder="搜索快递公司名称"
          clearable
          style="width: 250px; margin-right: 16px"
          @input="handleSearch"
        >
          <template #prefix>
            <el-icon><Search /></el-icon>
          </template>
        </el-input>
        
        <el-button type="primary" @click="addCourier">
          <el-icon><Plus /></el-icon>
          添加快递公司
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
              <el-icon><Truck /></el-icon>
            </div>
            <div class="stat-content">
              <h3>{{ courierStats.total }}</h3>
              <p>快递总数</p>
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
              <h3>{{ courierStats.active }}</h3>
              <p>启用快递</p>
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
              <h3>{{ courierStats.inactive }}</h3>
              <p>禁用快递</p>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- Courier Table/Cards -->
    <el-card class="couriers-container">
      <template #header>
        <div class="card-header">
          <span>快递公司列表</span>
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
          :data="filteredCouriers"
          v-loading="loading"
          style="width: 100%"
          :default-sort="{ prop: 'created_at', order: 'descending' }"
          class="couriers-table"
        >
          <el-table-column prop="id" label="ID" width="60" sortable />

          <el-table-column prop="name" label="快递公司" min-width="160">
            <template #default="{ row }">
              <div class="courier-info">
                <div class="courier-name">{{ row.name }}</div>
                <div class="courier-details">
                  代码: {{ row.code || '未设置' }} | 单号长度: {{ row.tracking_length || row.trackingLength }}位
                </div>
              </div>
            </template>
          </el-table-column>

          <el-table-column prop="code" label="快递代码" width="100">
            <template #default="{ row }">
              <el-tag v-if="row.code" size="small" type="primary">{{ row.code }}</el-tag>
              <span v-else class="no-data">未设置</span>
            </template>
          </el-table-column>

          <el-table-column prop="tracking_length" label="单号长度" width="100">
            <template #default="{ row }">
              <span class="tracking-length">
                {{ row.tracking_length || row.trackingLength }} 位
              </span>
            </template>
          </el-table-column>

          <el-table-column prop="tracking_pattern" label="单号格式" min-width="120">
            <template #default="{ row }">
              <code class="tracking-pattern">
                {{ row.tracking_pattern || row.trackingPattern || '未设置' }}
              </code>
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

          <el-table-column label="操作" width="200">
            <template #default="{ row }">
              <div class="desktop-actions">
                <el-button size="small" @click="editCourier(row)">
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
                        {{ row.status === 'active' ? '禁用' : '启用' }}
                      </el-dropdown-item>
                      <el-dropdown-item command="delete" divided>
                        <el-icon><Delete /></el-icon>
                        删除
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

        <div v-else-if="filteredCouriers.length === 0" class="empty-state">
          <el-icon><Truck /></el-icon>
          <div>暂无快递公司数据</div>
        </div>

        <div v-else class="mobile-couriers">
          <div
            v-for="courier in filteredCouriers"
            :key="courier.id"
            class="courier-card"
          >
            <el-card shadow="hover">
              <!-- Card Header -->
              <div class="card-header-mobile">
                <div class="courier-title">
                  {{ courier.name }}
                </div>
                <el-tag :type="courier.status === 'active' ? 'success' : 'danger'" size="default">
                  {{ courier.status === 'active' ? '启用' : '禁用' }}
                </el-tag>
              </div>

              <!-- Card Body -->
              <div class="card-body">
                <!-- Courier Code Row -->
                <div class="info-row">
                  <div class="info-label">
                    <el-icon><Promotion /></el-icon>
                    快递代码
                  </div>
                  <div class="info-value">
                    <div class="courier-code">
                      <el-tag v-if="courier.code" size="small" type="primary">{{ courier.code }}</el-tag>
                      <span v-else class="no-data">未设置</span>
                    </div>
                  </div>
                </div>

                <!-- Tracking Length Row -->
                <div class="info-row">
                  <div class="info-label">
                    <el-icon><Document /></el-icon>
                    单号长度
                  </div>
                  <div class="info-value">
                    <div class="tracking-length-mobile">
                      {{ courier.tracking_length || courier.trackingLength }} 位
                    </div>
                  </div>
                </div>

                <!-- Description Row -->
                <div v-if="courier.description" class="info-row">
                  <div class="info-label">
                    <el-icon><EditPen /></el-icon>
                    备注
                  </div>
                  <div class="info-value">
                    <div class="description">{{ courier.description }}</div>
                  </div>
                </div>

                <!-- Time Row -->
                <div class="info-row">
                  <div class="info-label">
                    <el-icon><Clock /></el-icon>
                    创建时间
                  </div>
                  <div class="info-value">
                    <div class="created-time">{{ formatDate(courier.created_at || courier.createdAt) }}</div>
                  </div>
                </div>
              </div>

              <!-- Card Actions -->
              <div class="card-actions">
                <!-- 编辑按钮 -->
                <el-button
                  type="primary"
                  size="default"
                  class="action-btn"
                  @click="editCourier(courier)"
                >
                  <el-icon><Edit /></el-icon>
                  编辑快递公司
                </el-button>

                <!-- 更多操作按钮 -->
                <el-dropdown
                  @command="(command) => handleMoreActions(courier, command)"
                  trigger="click"
                  class="action-dropdown"
                >
                  <el-button type="info" size="default" class="action-btn" plain>
                    <el-icon><MoreFilled /></el-icon>
                    更多操作
                    <el-icon class="el-icon--right"><ArrowDown /></el-icon>
                  </el-button>
                  <template #dropdown>
                    <el-dropdown-menu>
                      <el-dropdown-item
                        :command="courier.status === 'active' ? 'disable' : 'enable'"
                      >
                        <el-icon v-if="courier.status === 'active'"><Hide /></el-icon>
                        <el-icon v-else><View /></el-icon>
                        {{ courier.status === 'active' ? '禁用' : '启用' }}
                      </el-dropdown-item>
                      <el-dropdown-item command="delete" divided>
                        <el-icon><Delete /></el-icon>
                        删除快递公司
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
        <div class="pagination">
          <el-pagination
            v-model:current-page="currentPage"
            v-model:page-size="pageSize"
            :page-sizes="[10, 20, 50, 100]"
            :total="totalCouriers"
            :layout="paginationLayout"
            @size-change="handleSizeChange"
            @current-change="handleCurrentChange"
          />
        </div>
      </div>
    </el-card>

    <!-- Add/Edit Courier Dialog -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogTitle"
      :width="dialogWidth"
      class="courier-dialog"
      @close="closeDialog"
    >
      <el-form
        ref="formRef"
        :model="editForm"
        :rules="formRules"
        label-width="100px"
      >
        <el-form-item label="快递公司" prop="name">
          <el-input
            v-model="editForm.name"
            placeholder="请输入快递公司名称"
            maxlength="50"
            clearable
            show-word-limit
          />
        </el-form-item>
        
        <el-form-item label="快递代码" prop="code">
          <el-input
            v-model="editForm.code"
            placeholder="请输入快递代码（如SF, ZTO）"
            maxlength="10"
            clearable
            style="text-transform: uppercase"
            @input="handleCodeInput"
          />
          <div style="font-size: 12px; color: #909399; margin-top: 4px">
            用于系统识别的唯一代码，建议使用大写英文
          </div>
        </el-form-item>
        
        <el-form-item label="单号长度" prop="tracking_length">
          <el-input-number
            v-model="editForm.tracking_length"
            :min="8"
            :max="30"
            :step="1"
            style="width: 100%"
          />
          <div style="font-size: 12px; color: #909399; margin-top: 4px">
            快递单号的固定长度，用于验证单号格式
          </div>
        </el-form-item>
        
        <el-form-item label="状态" prop="status">
          <el-radio-group v-model="editForm.status">
            <el-radio label="active">启用</el-radio>
            <el-radio label="inactive">禁用</el-radio>
          </el-radio-group>
        </el-form-item>
        
        <el-form-item label="备注说明">
          <el-input
            v-model="editForm.description"
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
          <el-button @click="closeDialog">取消</el-button>
          <el-button type="primary" @click="saveCourier" :loading="saving">
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
  name: 'CourierManagement',
  setup() {
    const productStore = useProductStore()
    
    const loading = ref(false)
    const saving = ref(false)
    const searchKeyword = ref('')
    const statusFilter = ref('')
    const currentPage = ref(1)
    const pageSize = ref(20)
    const totalCouriers = ref(0)
    
    const dialogVisible = ref(false)
    const currentEditCourier = ref(null)
    const formRef = ref()
    
    const editForm = reactive({
      name: '',
      code: '',
      tracking_length: 12,
      status: 'active',
      description: ''
    })
    
    const formRules = {
      name: [
        { required: true, message: '请输入快递公司名称', trigger: 'blur' },
        { min: 2, max: 50, message: '快递公司名称长度在2到50个字符', trigger: 'blur' }
      ],
      code: [
        { required: true, message: '请输入快递代码', trigger: 'blur' },
        { min: 2, max: 10, message: '快递代码长度在2到10个字符', trigger: 'blur' },
        { 
          validator: (rule, value, callback) => {
            if (!/^[A-Z0-9]+$/.test(value)) {
              callback(new Error('快递代码只能包含大写字母和数字'))
            } else {
              callback()
            }
          }, 
          trigger: 'blur' 
        }
      ],
      tracking_length: [
        { required: true, message: '请输入单号长度', trigger: 'blur' },
        { type: 'number', min: 8, max: 30, message: '单号长度范围：8-30位', trigger: 'blur' }
      ],
      status: [
        { required: true, message: '请选择状态', trigger: 'change' }
      ]
    }

    const couriers = computed(() => productStore.couriers)

    // Responsive computed properties
    const isMobile = computed(() => window.innerWidth <= 768)
    const dialogWidth = computed(() => isMobile.value ? '95%' : '500px')
    const paginationLayout = computed(() =>
      isMobile.value ? 'prev, pager, next' : 'total, sizes, prev, pager, next, jumper'
    )

    const courierStats = computed(() => {
      const total = couriers.value.length
      const active = couriers.value.filter(c => c.status === 'active').length
      const inactive = total - active

      return { total, active, inactive }
    })

    const dialogTitle = computed(() => {
      return currentEditCourier.value ? '编辑快递公司' : '添加快递公司'
    })

    const isEditing = computed(() => !!currentEditCourier.value)

    const filteredCouriers = computed(() => {
      let filtered = couriers.value.filter(courier => {
        // 搜索过滤
        if (searchKeyword.value) {
          const keyword = searchKeyword.value.toLowerCase()
          if (!courier.name.toLowerCase().includes(keyword) && 
              !courier.code.toLowerCase().includes(keyword)) {
            return false
          }
        }
        
        // 状态过滤
        if (statusFilter.value && courier.status !== statusFilter.value) {
          return false
        }
        
        return true
      })
      
      totalCouriers.value = filtered.length
      
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

    const handleCodeInput = (value) => {
      editForm.code = value.toUpperCase()
    }

    const refreshData = async () => {
      try {
        loading.value = true
        await productStore.fetchCouriers()
        ElMessage.success('数据刷新成功')
      } catch (error) {
        ElMessage.error('刷新数据失败')
      } finally {
        loading.value = false
      }
    }

    const addCourier = () => {
      currentEditCourier.value = null
      editForm.name = ''
      editForm.code = ''
      editForm.tracking_length = 12
      editForm.status = 'active'
      editForm.description = ''
      dialogVisible.value = true
    }

    const editCourier = (courier) => {
      currentEditCourier.value = courier
      editForm.name = courier.name
      editForm.code = courier.code || ''
      editForm.tracking_length = courier.tracking_length || courier.trackingLength || 12
      editForm.status = courier.status
      editForm.description = courier.description || ''
      dialogVisible.value = true
    }

    const closeDialog = () => {
      dialogVisible.value = false
      currentEditCourier.value = null
      if (formRef.value) {
        formRef.value.resetFields()
      }
    }

    const saveCourier = async () => {
      try {
        const valid = await formRef.value.validate()
        if (!valid) return

        saving.value = true
        
        const courierData = {
          name: editForm.name.trim(),
          code: editForm.code.trim().toUpperCase() || null,
          tracking_length: editForm.tracking_length,
          status: editForm.status,
          description: editForm.description?.trim() || ''
        }
        
        if (isEditing.value) {
          await productStore.updateCourier(currentEditCourier.value.id, courierData)
          ElMessage.success('快递公司更新成功')
        } else {
          await productStore.addCourier(courierData)
          ElMessage.success('快递公司添加成功')
        }
        
        closeDialog()
        await refreshData()
        
      } catch (error) {
        ElMessage.error(isEditing.value ? '更新快递公司失败' : '添加快递公司失败')
      } finally {
        saving.value = false
      }
    }

    const toggleCourierStatus = async (courier) => {
      try {
        const action = courier.status === 'active' ? '禁用' : '启用'
        
        await ElMessageBox.confirm(
          `确定要${action}快递公司"${courier.name}"吗？`,
          '确认操作',
          {
            confirmButtonText: '确定',
            cancelButtonText: '取消',
            type: 'warning'
          }
        )
        
        await productStore.updateCourier(courier.id, {
          status: courier.status === 'active' ? 'inactive' : 'active'
        })
        
        ElMessage.success(`快递公司已${action}`)
        await refreshData()
        
      } catch (error) {
        if (error !== 'cancel') {
          ElMessage.error('操作失败')
        }
      }
    }

    const deleteCourier = async (courier) => {
      try {
        await ElMessageBox.confirm(
          `确定要删除快递公司"${courier.name}"吗？此操作不可恢复。`,
          '确认删除',
          {
            confirmButtonText: '确定',
            cancelButtonText: '取消',
            type: 'warning'
          }
        )

        await productStore.deleteCourier(courier.id)
        ElMessage.success('快递公司删除成功')
        await refreshData()
      } catch (error) {
        if (error !== 'cancel') {
          ElMessage.error('删除快递公司失败')
        }
      }
    }

    // 更多操作处理
    const handleMoreActions = async (courier, action) => {
      try {
        switch (action) {
          case 'enable':
          case 'disable':
            await toggleCourierStatus(courier)
            break
          case 'delete':
            await deleteCourier(courier)
            break
        }
      } catch (error) {
        console.error('More action error:', error)
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
      totalCouriers,
      couriers,
      courierStats,
      filteredCouriers,
      dialogVisible,
      dialogTitle,
      isEditing,
      editForm,
      formRules,
      formRef,
      dialogWidth,
      paginationLayout,
      formatDate,
      handleSearch,
      handleSizeChange,
      handleCurrentChange,
      handleCodeInput,
      refreshData,
      addCourier,
      editCourier,
      closeDialog,
      saveCourier,
      toggleCourierStatus,
      deleteCourier,
      handleMoreActions
    }
  }
}
</script>

<style scoped>
/* Base Styles */
.courier-management {
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

.stat-icon.active {
  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
}

.stat-icon.inactive {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
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

/* Couriers Container */
.couriers-container {
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

.couriers-table {
  font-size: 14px;
}

.couriers-table :deep(.el-table__cell) {
  padding: 12px 8px;
}

.courier-info {
  min-width: 0;
}

.courier-name {
  font-weight: 500;
  color: #303133;
  margin-bottom: 2px;
}

.courier-details {
  font-size: 12px;
  color: #909399;
}

.no-data {
  color: #c0c4cc;
  font-size: 12px;
}

.tracking-length {
  font-family: 'Consolas', 'Monaco', monospace;
  font-weight: 500;
  color: #409eff;
}

.tracking-pattern {
  background: #f5f7fa;
  padding: 2px 6px;
  border-radius: 3px;
  font-size: 11px;
  color: #606266;
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

.mobile-couriers {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.courier-card {
  width: 100%;
}

.courier-card .el-card {
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  transition: all 0.3s ease;
}

.courier-card .el-card:hover {
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

.courier-title {
  font-weight: 700;
  font-size: 18px;
  color: #303133;
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

.courier-code .el-tag {
  font-weight: 600;
}

.tracking-length-mobile {
  font-family: 'Consolas', 'Monaco', monospace;
  font-weight: 600;
  color: #409eff;
  font-size: 16px;
}

.description {
  color: #606266;
  font-size: 14px;
  line-height: 1.4;
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

/* Dialog Styles */
.courier-dialog :deep(.el-dialog__body) {
  padding: 20px;
}

:deep(.el-form-item__label) {
  font-weight: 500;
  color: #606266;
}

:deep(.el-input-number) {
  width: 100%;
}

:deep(.el-input-number .el-input__inner) {
  text-align: left;
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
  .courier-management {
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
    width: auto;
    min-width: 80px;
    padding: 8px 16px;
    font-size: 13px;
  }

  .refresh-btn .btn-text {
    display: inline;
    margin-left: 4px;
  }

  /* Stats Grid */
  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;
    margin-bottom: 20px;
    margin-top: 16px;
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
    justify-content: center;
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

  /* Dialog Adjustments */
  .courier-dialog :deep(.el-dialog) {
    margin: 5vh auto;
    max-height: 90vh;
    display: flex;
    flex-direction: column;
  }

  .courier-dialog :deep(.el-dialog__body) {
    flex: 1;
    overflow-y: auto;
    padding: 16px;
  }

  :deep(.el-form-item__label) {
    width: 80px !important;
  }
}

@media (max-width: 480px) {
  .courier-management {
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

  .stat-content p {
    font-size: 11px;
  }

  .courier-title {
    font-size: 16px;
  }

  .info-label {
    min-width: 70px;
    font-size: 13px;
  }

  .action-btn {
    height: 40px;
    font-size: 13px;
  }
}
</style>
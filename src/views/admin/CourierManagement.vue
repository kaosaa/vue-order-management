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

    <!-- Courier Table -->
    <el-card>
      <template #header>
        <div class="card-header">
          <span>快递公司列表</span>
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
        :data="filteredCouriers" 
        v-loading="loading"
        style="width: 100%"
        :default-sort="{ prop: 'created_at', order: 'descending' }"
      >
        <el-table-column prop="id" label="ID" width="60" sortable />
        
        <el-table-column prop="name" label="快递公司" min-width="160">
          <template #default="{ row }">
            <div>
              <div style="font-weight: 500; color: #303133; font-size: 14px">{{ row.name }}</div>
              <div style="font-size: 12px; color: #909399; margin-top: 2px">
                代码: {{ row.code || '未设置' }} | 单号长度: {{ row.tracking_length || row.trackingLength }}位
              </div>
            </div>
          </template>
        </el-table-column>

        <el-table-column prop="code" label="快递代码" width="100">
          <template #default="{ row }">
            <el-tag v-if="row.code" size="small" type="primary">{{ row.code }}</el-tag>
            <span v-else style="color: #c0c4cc; font-size: 12px">未设置</span>
          </template>
        </el-table-column>

        <el-table-column prop="tracking_length" label="单号长度" width="100">
          <template #default="{ row }">
            <span style="font-family: monospace; font-weight: 500; color: #409eff">
              {{ row.tracking_length || row.trackingLength }} 位
            </span>
          </template>
        </el-table-column>

        <el-table-column prop="tracking_pattern" label="单号格式" min-width="120">
          <template #default="{ row }">
            <code style="background: #f5f7fa; padding: 2px 6px; border-radius: 3px; font-size: 11px; color: #606266">
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

        <el-table-column prop="updated_at" label="更新时间" width="160">
          <template #default="{ row }">
            {{ formatDate(row.updated_at || row.updatedAt) }}
          </template>
        </el-table-column>
        
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button size="small" @click="editCourier(row)">
              <el-icon><Edit /></el-icon>
              编辑
            </el-button>
            
            <el-button 
              size="small" 
              :type="row.status === 'active' ? 'warning' : 'success'"
              @click="toggleCourierStatus(row)"
            >
              <el-icon v-if="row.status === 'active'"><Hide /></el-icon>
              <el-icon v-else><View /></el-icon>
              {{ row.status === 'active' ? '禁用' : '启用' }}
            </el-button>
            
            <el-popconfirm
              title="确定要删除这个快递公司吗？"
              @confirm="deleteCourier(row)"
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
          :total="totalCouriers"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </el-card>

    <!-- Add/Edit Courier Dialog -->
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
        await productStore.deleteCourier(courier.id)
        ElMessage.success('快递公司删除成功')
        await refreshData()
      } catch (error) {
        ElMessage.error('删除快递公司失败')
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
      deleteCourier
    }
  }
}
</script>

<style scoped>
.courier-management {
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
<template>
  <div class="user-management">
    <!-- Header -->
    <div class="page-header">
      <h2>用户管理</h2>
      <div class="header-actions">
        <el-input
          v-model="searchKeyword"
          :placeholder="isMobile ? '搜索用户...' : '搜索用户姓名、手机号、支付宝账户'"
          clearable
          :style="{ width: isMobile ? '200px' : '300px', marginRight: '16px' }"
          @input="handleSearch"
        >
          <template #prefix>
            <el-icon><Search /></el-icon>
          </template>
        </el-input>

        <el-button type="primary" @click="refreshData" :size="isMobile ? 'small' : 'default'">
          <el-icon><Refresh /></el-icon>
          <span v-if="!isMobile">刷新数据</span>
        </el-button>
      </div>
    </div>

    <!-- Statistics Cards -->
    <el-row :gutter="isMobile ? 12 : 20" style="margin-bottom: 20px">
      <el-col :xs="12" :sm="6" :span="6">
        <el-card class="stat-card">
          <div class="stat-item">
            <div class="stat-icon total">
              <el-icon><User /></el-icon>
            </div>
            <div class="stat-content">
              <h3>{{ userStats.total }}</h3>
              <p>总用户数</p>
            </div>
          </div>
        </el-card>
      </el-col>

      <el-col :xs="12" :sm="6" :span="6">
        <el-card class="stat-card">
          <div class="stat-item">
            <div class="stat-icon active">
              <el-icon><CircleCheck /></el-icon>
            </div>
            <div class="stat-content">
              <h3>{{ userStats.active }}</h3>
              <p>活跃用户</p>
            </div>
          </div>
        </el-card>
      </el-col>

      <el-col :xs="12" :sm="6" :span="6">
        <el-card class="stat-card">
          <div class="stat-item">
            <div class="stat-icon inactive">
              <el-icon><CircleClose /></el-icon>
            </div>
            <div class="stat-content">
              <h3>{{ userStats.inactive }}</h3>
              <p>禁用用户</p>
            </div>
          </div>
        </el-card>
      </el-col>

      <el-col :xs="12" :sm="6" :span="6">
        <el-card class="stat-card">
          <div class="stat-item">
            <div class="stat-icon admins">
              <el-icon><Star /></el-icon>
            </div>
            <div class="stat-content">
              <h3>{{ userStats.admins }}</h3>
              <p>管理员</p>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- User List -->
    <el-card>
      <template #header>
        <div class="card-header">
          <span>用户列表</span>
          <div class="header-tools">
            <el-select
              v-model="statusFilter"
              placeholder="筛选状态"
              clearable
              :style="{ width: isMobile ? '100px' : '120px', marginRight: '12px' }"
              :size="isMobile ? 'small' : 'default'"
            >
              <el-option label="全部" value="" />
              <el-option label="活跃" value="active" />
              <el-option label="禁用" value="inactive" />
            </el-select>

            <el-select
              v-model="roleFilter"
              placeholder="筛选角色"
              clearable
              :style="{ width: isMobile ? '100px' : '120px' }"
              :size="isMobile ? 'small' : 'default'"
            >
              <el-option label="全部" value="" />
              <el-option label="用户" value="user" />
              <el-option label="管理员" value="admin" />
            </el-select>
          </div>
        </div>
      </template>

      <!-- Desktop Table View -->
      <div v-if="!isMobile" class="desktop-view">
        <el-table
          :data="filteredUsers"
          v-loading="loading"
          style="width: 100%"
          :default-sort="{ prop: 'createdAt', order: 'descending' }"
        >
          <el-table-column prop="id" label="ID" width="60" sortable />

          <el-table-column prop="realName" label="真实姓名" width="120">
            <template #default="{ row }">
              <div style="display: flex; align-items: center">
                <el-avatar :size="32" style="margin-right: 8px">
                  {{ row.realName.charAt(0) }}
                </el-avatar>
                {{ row.realName }}
              </div>
            </template>
          </el-table-column>

          <el-table-column prop="phone" label="手机号" width="130">
            <template #default="{ row }">
              <div style="font-family: monospace">
                {{ formatPhone(row.phone) }}
              </div>
            </template>
          </el-table-column>

          <el-table-column prop="alipayAccount" label="支付宝账户" min-width="180">
            <template #default="{ row }">
              <div style="font-family: monospace; color: #606266">
                {{ maskAlipayAccount(row.alipayAccount) }}
              </div>
            </template>
          </el-table-column>

          <el-table-column prop="role" label="角色" width="80">
            <template #default="{ row }">
              <el-tag :type="row.role === 'admin' ? 'danger' : 'primary'">
                {{ row.role === 'admin' ? '管理员' : '用户' }}
              </el-tag>
            </template>
          </el-table-column>

          <el-table-column prop="status" label="状态" width="80">
            <template #default="{ row }">
              <el-tag :type="row.status === 'active' ? 'success' : 'danger'">
                {{ row.status === 'active' ? '启用' : '禁用' }}
              </el-tag>
            </template>
          </el-table-column>

          <el-table-column prop="createdAt" label="注册时间" width="160" sortable>
            <template #default="{ row }">
              {{ formatDate(row.createdAt) }}
            </template>
          </el-table-column>

          <el-table-column prop="lastLoginAt" label="最后登录" width="160">
            <template #default="{ row }">
              <span v-if="row.lastLoginAt">{{ formatDate(row.lastLoginAt) }}</span>
              <span v-else style="color: #909399">从未登录</span>
            </template>
          </el-table-column>

          <el-table-column label="操作" width="200">
            <template #default="{ row }">
              <el-button size="small" @click="editUser(row)">
                <el-icon><Edit /></el-icon>
                编辑
              </el-button>

              <el-button
                size="small"
                :type="row.status === 'active' ? 'warning' : 'success'"
                @click="toggleUserStatus(row)"
              >
                <el-icon v-if="row.status === 'active'"><Lock /></el-icon>
                <el-icon v-else><Unlock /></el-icon>
                {{ row.status === 'active' ? '禁用' : '启用' }}
              </el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>

      <!-- Mobile Card View -->
      <div v-else class="mobile-view" v-loading="loading">
        <div class="user-cards">
          <div
            v-for="user in filteredUsers"
            :key="user.id"
            class="user-card"
          >
            <!-- Card Header -->
            <div class="card-header-mobile">
              <div class="user-info">
                <el-avatar :size="40" class="user-avatar">
                  {{ user.realName.charAt(0) }}
                </el-avatar>
                <div class="user-details">
                  <h4 class="user-name">{{ user.realName }}</h4>
                  <div class="user-badges">
                    <el-tag
                      :type="user.role === 'admin' ? 'danger' : 'primary'"
                      size="small"
                    >
                      {{ user.role === 'admin' ? '管理员' : '用户' }}
                    </el-tag>
                    <el-tag
                      :type="user.status === 'active' ? 'success' : 'danger'"
                      size="small"
                    >
                      {{ user.status === 'active' ? '启用' : '禁用' }}
                    </el-tag>
                  </div>
                </div>
              </div>
              <div class="user-id">
                ID: {{ user.id }}
              </div>
            </div>

            <!-- Card Content -->
            <div class="card-content-mobile">
              <div class="info-row">
                <div class="info-label">联系方式</div>
                <div class="info-value">
                  <div class="contact-item">
                    <el-icon><Phone /></el-icon>
                    <span>{{ formatPhone(user.phone) }}</span>
                  </div>
                  <div class="contact-item">
                    <el-icon><Money /></el-icon>
                    <span>{{ maskAlipayAccount(user.alipayAccount) }}</span>
                  </div>
                </div>
              </div>

              <div class="info-row">
                <div class="info-label">注册时间</div>
                <div class="info-value">{{ formatDate(user.createdAt) }}</div>
              </div>

              <div class="info-row">
                <div class="info-label">最后登录</div>
                <div class="info-value">
                  <span v-if="user.lastLoginAt">{{ formatDate(user.lastLoginAt) }}</span>
                  <span v-else class="text-muted">从未登录</span>
                </div>
              </div>
            </div>

            <!-- Card Actions -->
            <div class="card-actions-mobile">
              <el-button
                type="primary"
                size="small"
                @click="editUser(user)"
                class="action-button"
              >
                <el-icon><Edit /></el-icon>
                编辑用户
              </el-button>

              <el-dropdown trigger="click" @command="(command) => handleActionCommand(command, user)">
                <el-button size="small" class="action-button">
                  更多操作
                  <el-icon><ArrowDown /></el-icon>
                </el-button>
                <template #dropdown>
                  <el-dropdown-menu>
                    <el-dropdown-item :command="user.status === 'active' ? 'disable' : 'enable'">
                      <el-icon v-if="user.status === 'active'"><Lock /></el-icon>
                      <el-icon v-else><Unlock /></el-icon>
                      {{ user.status === 'active' ? '禁用用户' : '启用用户' }}
                    </el-dropdown-item>
                    <el-dropdown-item command="editRole" v-if="canEditUserRole(user)">
                      <el-icon><User /></el-icon>
                      修改角色
                    </el-dropdown-item>
                  </el-dropdown-menu>
                </template>
              </el-dropdown>
            </div>
          </div>
        </div>
      </div>

      <!-- Pagination -->
      <div class="pagination-container">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :page-sizes="[10, 20, 50, 100]"
          :total="totalUsers"
          :layout="isMobile ? 'prev, pager, next' : 'total, sizes, prev, pager, next, jumper'"
          :small="isMobile"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </el-card>

    <!-- Edit User Dialog -->
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
        <el-form-item label="真实姓名" prop="realName">
          <el-input
            v-model="editForm.realName"
            placeholder="请输入真实姓名"
            maxlength="20"
            clearable
          />
        </el-form-item>
        
        <el-form-item label="手机号" prop="phone">
          <el-input
            v-model="editForm.phone"
            placeholder="请输入手机号"
            maxlength="11"
            disabled
            style="color: #909399"
          />
          <div style="font-size: 12px; color: #909399; margin-top: 4px">
            手机号不可修改
          </div>
        </el-form-item>
        
        <el-form-item label="支付宝账户" prop="alipayAccount">
          <el-input
            v-model="editForm.alipayAccount"
            placeholder="请输入支付宝账户"
            clearable
          />
        </el-form-item>
        
        <el-form-item label="用户角色" prop="role" v-if="canEditRole">
          <el-select v-model="editForm.role" placeholder="请选择角色" style="width: 100%">
            <el-option label="普通用户" value="user" />
            <el-option label="管理员" value="admin" />
          </el-select>
        </el-form-item>
        
        <el-form-item label="账户状态" prop="status">
          <el-select v-model="editForm.status" placeholder="请选择状态" style="width: 100%">
            <el-option label="启用" value="active" />
            <el-option label="禁用" value="inactive" />
          </el-select>
        </el-form-item>
      </el-form>
      
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="closeDialog">取消</el-button>
          <el-button type="primary" @click="saveUser" :loading="saving">
            保存
          </el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script>
import { ref, computed, onMounted, reactive, onUnmounted } from 'vue'
import { useAdminStore } from '../../stores/admin'
import { useAuthStore } from '../../stores/auth'
import { ElMessage, ElMessageBox } from 'element-plus'
import { formatDate, formatDateTime } from '@/utils/time'

export default {
  name: 'UserManagement',
  setup() {
    const adminStore = useAdminStore()
    const authStore = useAuthStore()

    const loading = ref(false)
    const saving = ref(false)
    const searchKeyword = ref('')
    const statusFilter = ref('')
    const roleFilter = ref('')
    const currentPage = ref(1)
    const pageSize = ref(20)
    const totalUsers = ref(0)
    const isMobile = ref(false)

    const dialogVisible = ref(false)
    const currentEditUser = ref(null)
    const formRef = ref()

    const editForm = reactive({
      realName: '',
      phone: '',
      alipayAccount: '',
      role: 'user',
      status: 'active'
    })
    
    const formRules = {
      realName: [
        { required: true, message: '请输入真实姓名', trigger: 'blur' },
        { min: 2, max: 20, message: '姓名长度在2到20个字符', trigger: 'blur' }
      ],
      alipayAccount: [
        { required: true, message: '请输入支付宝账户', trigger: 'blur' },
        { 
          validator: (rule, value, callback) => {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
            const phoneRegex = /^1[3-9]\d{9}$/
            
            if (!emailRegex.test(value) && !phoneRegex.test(value)) {
              callback(new Error('支付宝账户必须是邮箱或手机号格式'))
            } else {
              callback()
            }
          }, 
          trigger: 'blur' 
        }
      ],
      role: [
        { required: true, message: '请选择用户角色', trigger: 'change' }
      ],
      status: [
        { required: true, message: '请选择账户状态', trigger: 'change' }
      ]
    }

    const users = computed(() => adminStore.users)
    const userStats = computed(() => adminStore.userStats)
    
    const dialogTitle = computed(() => {
      return currentEditUser.value ? '编辑用户信息' : '新建用户'
    })
    
    const canEditRole = computed(() => {
      return currentEditUser.value && currentEditUser.value.id !== authStore.user?.id
    })

    const canEditUserRole = (user) => {
      return user.id !== authStore.user?.id
    }

    // Mobile detection
    const checkMobile = () => {
      isMobile.value = window.innerWidth <= 768
    }

    const handleResize = () => {
      checkMobile()
    }

    const filteredUsers = computed(() => {
      let filtered = users.value.filter(user => {
        // 搜索过滤
        if (searchKeyword.value) {
          const keyword = searchKeyword.value.toLowerCase()
          const matchName = user.realName.toLowerCase().includes(keyword)
          const matchPhone = user.phone.includes(keyword)
          const matchAlipay = user.alipayAccount.toLowerCase().includes(keyword)
          
          if (!matchName && !matchPhone && !matchAlipay) {
            return false
          }
        }
        
        // 状态过滤
        if (statusFilter.value && user.status !== statusFilter.value) {
          return false
        }
        
        // 角色过滤
        if (roleFilter.value && user.role !== roleFilter.value) {
          return false
        }
        
        return true
      })
      
      totalUsers.value = filtered.length
      
      // 分页
      const start = (currentPage.value - 1) * pageSize.value
      const end = start + pageSize.value
      
      return filtered.slice(start, end)
    })

    const formatPhone = (phone) => {
      if (!phone) return ''
      return `${phone.slice(0, 3)} ${phone.slice(3, 7)} ${phone.slice(7)}`
    }
    
    const maskAlipayAccount = (account) => {
      if (!account) return ''
      
      if (account.includes('@')) {
        // Email format
        const [localPart, domain] = account.split('@')
        if (localPart.length <= 2) return account
        return `${localPart.slice(0, 2)}***@${domain}`
      } else {
        // Phone format
        return `${account.slice(0, 3)}****${account.slice(-4)}`
      }
    }
    
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
        await adminStore.fetchUsers()
        ElMessage.success('数据刷新成功')
      } catch (error) {
        ElMessage.error('刷新数据失败')
      } finally {
        loading.value = false
      }
    }

    const editUser = (user) => {
      currentEditUser.value = user
      editForm.realName = user.realName
      editForm.phone = user.phone
      editForm.alipayAccount = user.alipayAccount
      editForm.role = user.role
      editForm.status = user.status
      dialogVisible.value = true
    }

    const closeDialog = () => {
      dialogVisible.value = false
      currentEditUser.value = null
      if (formRef.value) {
        formRef.value.resetFields()
      }
    }

    const saveUser = async () => {
      try {
        const valid = await formRef.value.validate()
        if (!valid) return

        saving.value = true
        
        await adminStore.updateUser(currentEditUser.value.id, {
          realName: editForm.realName,
          alipayAccount: editForm.alipayAccount,
          role: editForm.role,
          status: editForm.status
        })
        
        ElMessage.success('用户信息更新成功')
        closeDialog()
        await refreshData()
        
      } catch (error) {
        ElMessage.error('更新用户信息失败')
      } finally {
        saving.value = false
      }
    }

    const toggleUserStatus = async (user) => {
      try {
        const action = user.status === 'active' ? '禁用' : '启用'

        await ElMessageBox.confirm(
          `确定要${action}用户"${user.realName}"吗？`,
          '确认操作',
          {
            confirmButtonText: '确定',
            cancelButtonText: '取消',
            type: 'warning'
          }
        )

        await adminStore.toggleUserStatus(user.id)
        ElMessage.success(`用户已${action}`)
        await refreshData()

      } catch (error) {
        if (error !== 'cancel') {
          ElMessage.error('操作失败')
        }
      }
    }

    // Handle mobile dropdown actions
    const handleActionCommand = (command, user) => {
      switch (command) {
        case 'enable':
        case 'disable':
          toggleUserStatus(user)
          break
        case 'editRole':
          editUser(user)
          break
      }
    }

    onMounted(() => {
      checkMobile()
      window.addEventListener('resize', handleResize)
      refreshData()
    })

    onUnmounted(() => {
      window.removeEventListener('resize', handleResize)
    })

    return {
      loading,
      saving,
      searchKeyword,
      statusFilter,
      roleFilter,
      currentPage,
      pageSize,
      totalUsers,
      isMobile,
      users,
      userStats,
      filteredUsers,
      dialogVisible,
      dialogTitle,
      editForm,
      formRules,
      formRef,
      canEditRole,
      canEditUserRole,
      formatPhone,
      maskAlipayAccount,
      formatDate,
      handleSearch,
      handleSizeChange,
      handleCurrentChange,
      refreshData,
      editUser,
      closeDialog,
      saveUser,
      toggleUserStatus,
      handleActionCommand
    }
  }
}
</script>

<style scoped>
.user-management {
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
}

.stat-card {
  height: 100px;
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

.stat-icon.admins {
  background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);
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

.pagination-container {
  margin-top: 20px;
  text-align: center;
}

/* Desktop View */
.desktop-view {
  width: 100%;
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

/* Mobile View */
.mobile-view {
  width: 100%;
}

.user-cards {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.user-card {
  border: 1px solid #e4e7ed;
  border-radius: 8px;
  background: #fff;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  transition: all 0.3s ease;
}

.user-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  transform: translateY(-2px);
}

.card-header-mobile {
  padding: 16px;
  background: #f8f9fa;
  border-bottom: 1px solid #e4e7ed;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
}

.user-avatar {
  background: #409eff;
  font-size: 16px;
  font-weight: 600;
  color: white;
  flex-shrink: 0;
}

.user-details {
  flex: 1;
  min-width: 0;
}

.user-name {
  margin: 0 0 8px 0;
  font-size: 16px;
  font-weight: 600;
  color: #303133;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.user-badges {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

.user-id {
  font-size: 12px;
  color: #909399;
  font-family: monospace;
  background: #f0f0f0;
  padding: 4px 8px;
  border-radius: 4px;
  white-space: nowrap;
}

.card-content-mobile {
  padding: 16px;
}

.info-row {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 12px;
  gap: 12px;
}

.info-row:last-child {
  margin-bottom: 0;
}

.info-label {
  font-size: 14px;
  color: #606266;
  font-weight: 500;
  min-width: 80px;
  flex-shrink: 0;
}

.info-value {
  font-size: 14px;
  color: #303133;
  text-align: right;
  flex: 1;
  min-width: 0;
}

.contact-item {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 6px;
  margin-bottom: 4px;
  font-family: monospace;
}

.contact-item:last-child {
  margin-bottom: 0;
}

.contact-item .el-icon {
  font-size: 14px;
  color: #909399;
  flex-shrink: 0;
}

.text-muted {
  color: #909399;
}

.card-actions-mobile {
  padding: 12px 16px;
  background: #fafafa;
  border-top: 1px solid #e4e7ed;
  display: flex;
  gap: 8px;
}

.action-button {
  flex: 1;
  height: 36px;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  touch-action: manipulation;
  -webkit-tap-highlight-color: transparent;
}

.action-button .el-icon {
  font-size: 16px;
}

/* Responsive breakpoints */
@media (max-width: 768px) {
  .user-management {
    padding: 12px;
  }

  .page-header {
    flex-direction: column;
    align-items: stretch;
    gap: 12px;
  }

  .page-header h2 {
    font-size: 20px;
  }

  .header-actions {
    justify-content: space-between;
  }

  .stat-card {
    height: 80px;
  }

  .stat-icon {
    width: 40px;
    height: 40px;
    font-size: 18px;
    margin-right: 12px;
  }

  .stat-content h3 {
    font-size: 20px;
  }

  .stat-content p {
    font-size: 12px;
  }

  .card-header {
    flex-direction: column;
    align-items: stretch;
    gap: 12px;
  }

  .header-tools {
    justify-content: flex-end;
    gap: 8px;
  }
}

@media (max-width: 480px) {
  .user-management {
    padding: 8px;
  }

  .page-header h2 {
    font-size: 18px;
  }

  .stat-content h3 {
    font-size: 18px;
  }

  .user-card {
    border-radius: 6px;
  }

  .card-header-mobile {
    padding: 12px;
  }

  .user-name {
    font-size: 15px;
  }

  .card-content-mobile {
    padding: 12px;
  }

  .info-row {
    margin-bottom: 10px;
  }

  .info-label {
    font-size: 13px;
    min-width: 70px;
  }

  .info-value {
    font-size: 13px;
  }

  .card-actions-mobile {
    padding: 10px 12px;
    gap: 6px;
  }

  .action-button {
    height: 32px;
    font-size: 13px;
  }
}

/* Animation for card loading */
@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.user-card {
  animation: fadeInUp 0.3s ease forwards;
}

/* High contrast mode support */
@media (prefers-contrast: high) {
  .user-card {
    border-width: 2px;
  }

  .card-header-mobile {
    background: #e4e7ed;
  }
}

/* Reduced motion support */
@media (prefers-reduced-motion: reduce) {
  .user-card {
    animation: none;
    transition: none;
  }

  .user-card:hover {
    transform: none;
  }
}
</style>
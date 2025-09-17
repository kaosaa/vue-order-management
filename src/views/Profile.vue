<template>
  <div class="profile-page">
    <div class="page-header">
      <div class="header-content">
        <div class="header-info">
          <div class="avatar-section">
            <div class="avatar">
              <el-icon size="40"><UserFilled /></el-icon>
            </div>
            <div class="user-info">
              <h2>{{ user?.realName }}</h2>
              <div class="user-meta">
                <el-tag :type="user?.role === 'admin' ? 'danger' : 'primary'">
                  {{ user?.role === 'admin' ? '系统管理员' : '普通用户' }}
                </el-tag>
                <span class="join-time">加入于 {{ formatDate(user?.createdAt) }}</span>
              </div>
            </div>
          </div>
        </div>
        <div class="header-actions">
          <el-button type="primary" @click="toggleEdit">
            <el-icon><Edit /></el-icon>
            {{ isEditing ? '取消编辑' : '编辑资料' }}
          </el-button>
        </div>
      </div>
    </div>

    <!-- Profile Content -->
    <div class="profile-content">
      <el-row :gutter="24">
        <!-- Basic Information -->
        <el-col :span="16">
          <el-card class="info-card">
            <template #header>
              <div class="card-header">
                <h3>基本信息</h3>
                <el-icon v-if="!isEditing"><InfoFilled /></el-icon>
              </div>
            </template>

            <el-form
              :model="profileForm"
              :rules="profileRules"
              ref="profileFormRef"
              label-width="100px"
              label-position="left"
            >
              <el-form-item label="真实姓名" prop="realName">
                <el-input
                  v-model="profileForm.realName"
                  :readonly="!isEditing"
                  placeholder="请输入真实姓名"
                />
              </el-form-item>

              <el-form-item label="手机号码" prop="phone">
                <el-input
                  v-model="profileForm.phone"
                  readonly
                  placeholder="手机号码不可修改"
                >
                  <template #suffix>
                    <el-icon><Phone /></el-icon>
                  </template>
                </el-input>
              </el-form-item>

              <el-form-item label="支付宝账户" prop="alipayAccount">
                <el-input
                  v-model="profileForm.alipayAccount"
                  :readonly="!isEditing"
                  placeholder="请输入支付宝账户"
                >
                  <template #suffix>
                    <el-icon><Wallet /></el-icon>
                  </template>
                </el-input>
              </el-form-item>

              <el-form-item label="角色权限">
                <el-tag
                  :type="user?.role === 'admin' ? 'danger' : 'primary'"
                  size="large"
                >
                  {{ user?.role === 'admin' ? '系统管理员' : '普通用户' }}
                </el-tag>
              </el-form-item>

              <el-form-item label="账户状态">
                <el-tag
                  :type="user?.status === 'active' ? 'success' : 'danger'"
                  size="large"
                >
                  {{ user?.status === 'active' ? '正常' : '已禁用' }}
                </el-tag>
              </el-form-item>

              <el-form-item v-if="isEditing">
                <el-button type="primary" @click="saveProfile" :loading="isSaving">
                  <el-icon><Check /></el-icon>
                  保存修改
                </el-button>
                <el-button @click="cancelEdit">
                  <el-icon><Close /></el-icon>
                  取消
                </el-button>
              </el-form-item>
            </el-form>
          </el-card>
        </el-col>

        <!-- Account Security -->
        <el-col :span="8">
          <el-card class="security-card">
            <template #header>
              <div class="card-header">
                <h3>账户安全</h3>
                <el-icon><Lock /></el-icon>
              </div>
            </template>

            <div class="security-items">
              <div class="security-item">
                <div class="security-info">
                  <div class="security-title">登录密码</div>
                  <div class="security-desc">定期修改密码保护账户安全</div>
                </div>
                <el-button text type="primary" @click="showPasswordDialog = true">
                  修改
                </el-button>
              </div>

              <div class="security-item">
                <div class="security-info">
                  <div class="security-title">最后登录</div>
                  <div class="security-desc">{{ formatDateTime(user?.lastLoginAt) || '暂无记录' }}</div>
                </div>
              </div>

              <div class="security-item">
                <div class="security-info">
                  <div class="security-title">注册时间</div>
                  <div class="security-desc">{{ formatDateTime(user?.createdAt) }}</div>
                </div>
              </div>
            </div>
          </el-card>

          <!-- Recent Orders -->
          <el-card class="orders-card" style="margin-top: 20px">
            <template #header>
              <div class="card-header">
                <h3>最近订单</h3>
                <el-icon><Document /></el-icon>
              </div>
            </template>

            <div class="recent-orders">
              <el-empty v-if="!recentOrders || recentOrders.length === 0"
                       description="暂无订单记录"
                       :image-size="60" />
              <div v-else>
                <div v-for="order in recentOrders" :key="order.id" class="order-item">
                  <div class="order-info">
                    <div class="order-title">{{ order.productName }}</div>
                    <div class="order-meta">
                      <el-tag :type="getOrderStatusType(order.status)" size="small">
                        {{ getOrderStatusText(order.status) }}
                      </el-tag>
                      <span class="order-date">{{ formatDate(order.createdAt) }}</span>
                    </div>
                  </div>
                  <div class="order-amount">¥{{ order.totalAmount }}</div>
                </div>
                <div class="view-all-orders">
                  <el-button text type="primary" @click="goToOrders">
                    查看全部订单 <el-icon><ArrowRight /></el-icon>
                  </el-button>
                </div>
              </div>
            </div>
          </el-card>

        </el-col>
      </el-row>
    </div>

    <!-- Password Change Dialog -->
    <el-dialog
      v-model="showPasswordDialog"
      title="修改密码"
      width="500px"
      :before-close="handlePasswordDialogClose"
    >
      <el-form
        :model="passwordForm"
        :rules="passwordRules"
        ref="passwordFormRef"
        label-width="100px"
      >
        <el-form-item label="当前密码" prop="currentPassword">
          <el-input
            v-model="passwordForm.currentPassword"
            type="password"
            placeholder="请输入当前密码"
            show-password
          />
        </el-form-item>

        <el-form-item label="新密码" prop="newPassword">
          <el-input
            v-model="passwordForm.newPassword"
            type="password"
            placeholder="请输入新密码"
            show-password
          />
        </el-form-item>

        <el-form-item label="确认密码" prop="confirmPassword">
          <el-input
            v-model="passwordForm.confirmPassword"
            type="password"
            placeholder="请再次输入新密码"
            show-password
          />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="showPasswordDialog = false">取消</el-button>
        <el-button type="primary" @click="changePassword" :loading="isChangingPassword">
          确认修改
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script>
import { ref, reactive, computed, onMounted, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { ElMessage, ElMessageBox } from 'element-plus'
import { formatDate, formatDateTime } from '@/utils/time'
import { getApiUrl } from '@/utils/config'

export default {
  name: 'Profile',
  setup() {
    const router = useRouter()
    const authStore = useAuthStore()
    const profileFormRef = ref()
    const passwordFormRef = ref()

    // State
    const isEditing = ref(false)
    const isSaving = ref(false)
    const isChangingPassword = ref(false)
    const showPasswordDialog = ref(false)

    const profileForm = reactive({
      realName: '',
      phone: '',
      alipayAccount: ''
    })

    const passwordForm = reactive({
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    })

    const recentOrders = ref([])


    // Computed
    const user = computed(() => authStore.user)

    // Rules
    const profileRules = {
      realName: [
        { required: true, message: '请输入真实姓名', trigger: 'blur' },
        { min: 2, max: 20, message: '姓名长度在 2 到 20 个字符', trigger: 'blur' }
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
      ]
    }

    const passwordRules = {
      currentPassword: [
        { required: true, message: '请输入当前密码', trigger: 'blur' }
      ],
      newPassword: [
        { required: true, message: '请输入新密码', trigger: 'blur' },
        { min: 6, max: 32, message: '密码长度在 6 到 32 个字符', trigger: 'blur' }
      ],
      confirmPassword: [
        { required: true, message: '请再次输入新密码', trigger: 'blur' },
        {
          validator: (rule, value, callback) => {
            if (value !== passwordForm.newPassword) {
              callback(new Error('两次输入密码不一致'))
            } else {
              callback()
            }
          },
          trigger: 'blur'
        }
      ]
    }

    // Methods
    const initProfileForm = () => {
      if (user.value) {
        profileForm.realName = user.value.realName || ''
        profileForm.phone = user.value.phone || ''
        profileForm.alipayAccount = user.value.alipayAccount || ''
      }
    }

    const toggleEdit = () => {
      if (isEditing.value) {
        cancelEdit()
      } else {
        isEditing.value = true
        initProfileForm()
      }
    }

    const cancelEdit = () => {
      isEditing.value = false
      initProfileForm()
      nextTick(() => {
        profileFormRef.value?.clearValidate()
      })
    }

    const saveProfile = async () => {
      try {
        await profileFormRef.value.validate()
        isSaving.value = true

        await authStore.updateUserProfile({
          real_name: profileForm.realName,
          alipay_account: profileForm.alipayAccount
        })

        ElMessage.success('个人资料更新成功')
        isEditing.value = false
      } catch (error) {
        if (error.fields) {
          return // Form validation failed
        }
        ElMessage.error(error.message || '更新失败，请稍后重试')
      } finally {
        isSaving.value = false
      }
    }

    const changePassword = async () => {
      try {
        await passwordFormRef.value.validate()
        isChangingPassword.value = true

        await authStore.changePassword({
          password: passwordForm.currentPassword,
          new_password: passwordForm.newPassword,
          confirm_password: passwordForm.confirmPassword
        })

        ElMessage.success('密码修改成功')
        showPasswordDialog.value = false
        resetPasswordForm()
      } catch (error) {
        if (error.fields) {
          return // Form validation failed
        }
        ElMessage.error(error.message || '密码修改失败')
      } finally {
        isChangingPassword.value = false
      }
    }

    const resetPasswordForm = () => {
      passwordForm.currentPassword = ''
      passwordForm.newPassword = ''
      passwordForm.confirmPassword = ''
      nextTick(() => {
        passwordFormRef.value?.clearValidate()
      })
    }

    const handlePasswordDialogClose = (done) => {
      if (isChangingPassword.value) {
        return
      }
      resetPasswordForm()
      done()
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
        console.error('加载最近订单失败:', error)
      }
    }

    const getOrderStatusType = (status) => {
      const types = {
        'pending': 'warning',
        'completed': 'success',
        'cancelled': 'danger'
      }
      return types[status] || 'info'
    }

    const getOrderStatusText = (status) => {
      const texts = {
        'pending': '待处理',
        'completed': '已完成',
        'cancelled': '已取消'
      }
      return texts[status] || status
    }

    const goToOrders = () => {
      router.push('/user/orders')
    }


    onMounted(() => {
      initProfileForm()
      loadRecentOrders()
    })

    return {
      // State
      isEditing,
      isSaving,
      isChangingPassword,
      showPasswordDialog,
      profileForm,
      passwordForm,
      recentOrders,
      profileFormRef,
      passwordFormRef,

      // Computed
      user,

      // Rules
      profileRules,
      passwordRules,

      // Methods
      toggleEdit,
      cancelEdit,
      saveProfile,
      changePassword,
      resetPasswordForm,
      handlePasswordDialogClose,
      formatDate,
      formatDateTime,
      getOrderStatusType,
      getOrderStatusText,
      goToOrders
    }
  }
}
</script>

<style scoped>
.profile-page {
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
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.avatar-section {
  display: flex;
  align-items: center;
  gap: 16px;
}

.avatar {
  width: 80px;
  height: 80px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
}

.user-info h2 {
  margin: 0 0 8px 0;
  font-size: 24px;
  font-weight: 600;
  color: #1a202c;
}

.user-meta {
  display: flex;
  align-items: center;
  gap: 12px;
}

.join-time {
  color: #718096;
  font-size: 14px;
}

/* Profile Content */
.profile-content {
  margin-top: 24px;
}

.info-card, .security-card, .orders-card {
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  border-radius: 12px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-header h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #1a202c;
}

/* Security Items */
.security-items {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.security-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  background: #f8fafc;
  border-radius: 8px;
}

.security-title {
  font-weight: 500;
  color: #1a202c;
  margin-bottom: 4px;
}

.security-desc {
  font-size: 13px;
  color: #718096;
}

/* Recent Orders */
.recent-orders {
  display: flex;
  flex-direction: column;
}

.order-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px;
  margin-bottom: 8px;
  background: #f8fafc;
  border-radius: 8px;
  transition: background 0.2s;
}

.order-item:hover {
  background: #e2e8f0;
}

.order-info {
  flex: 1;
}

.order-title {
  font-weight: 500;
  color: #1a202c;
  margin-bottom: 4px;
}

.order-meta {
  display: flex;
  align-items: center;
  gap: 8px;
}

.order-date {
  font-size: 12px;
  color: #718096;
}

.order-amount {
  font-size: 16px;
  font-weight: 600;
  color: #1a202c;
}

.view-all-orders {
  text-align: center;
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid #e2e8f0;
}

/* Form Styles */
:deep(.el-form-item__label) {
  font-weight: 500;
  color: #4a5568;
}

:deep(.el-input.is-disabled .el-input__wrapper) {
  background-color: #f8fafc;
}

/* Responsive */
@media (max-width: 768px) {
  .header-content {
    flex-direction: column;
    gap: 16px;
    align-items: flex-start;
  }

  .avatar-section {
    flex-direction: column;
    text-align: center;
  }

}
</style>
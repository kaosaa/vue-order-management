<template>
  <div class="login-container">
    <el-card class="login-card">
      <template #header>
        <div class="card-header">
          <h1>报单系统登录</h1>
          <p>Order Submission System</p>
        </div>
      </template>
      
      <el-form
        ref="loginFormRef"
        :model="loginForm"
        :rules="loginRules"
        label-width="80px"
        label-position="left"
        @submit.prevent="handleLogin"
      >
        <el-form-item label="手机号" prop="phone">
          <el-input
            v-model="loginForm.phone"
            placeholder="请输入手机号"
            size="large"
            maxlength="11"
            clearable
          >
            <template #prefix>
              <el-icon><Phone /></el-icon>
            </template>
          </el-input>
        </el-form-item>
        
        <el-form-item label="密码" prop="password">
          <el-input
            v-model="loginForm.password"
            type="password"
            placeholder="请输入密码"
            size="large"
            show-password
            clearable
          >
            <template #prefix>
              <el-icon><Lock /></el-icon>
            </template>
          </el-input>
        </el-form-item>
        
        <el-form-item>
          <el-button
            type="primary"
            size="large"
            :loading="isLoading"
            @click="handleLogin"
            style="width: 100%"
          >
            <span v-if="!isLoading">登录</span>
            <span v-else>登录中...</span>
          </el-button>
        </el-form-item>
        
        <div class="form-footer">
          <el-link type="primary" @click="goToRegister">
            还没有账号？立即注册
          </el-link>
        </div>
      </el-form>
      
      <!-- Demo Accounts Info -->
      <el-alert
        title="演示账户信息"
        type="info"
        :closable="false"
        show-icon
        style="margin-top: 20px"
      >
        <div class="demo-accounts">
          <p><strong>管理员账户：</strong> 13800138000 / admin123</p>
          <p><strong>普通用户：</strong> 13900139000 / user123</p>
        </div>
      </el-alert>
    </el-card>
  </div>
</template>

<script>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { ElMessage } from 'element-plus'

export default {
  name: 'Login',
  setup() {
    const router = useRouter()
    const authStore = useAuthStore()
    const loginFormRef = ref()

    const loginForm = reactive({
      phone: '',
      password: ''
    })

    const phoneValidator = (rule, value, callback) => {
      const phoneRegex = /^1[3-9]\d{9}$/
      if (!value) {
        callback(new Error('请输入手机号'))
      } else if (!phoneRegex.test(value)) {
        callback(new Error('请输入正确的手机号格式'))
      } else {
        callback()
      }
    }

    const loginRules = reactive({
      phone: [
        { required: true, validator: phoneValidator, trigger: 'blur' }
      ],
      password: [
        { required: true, message: '请输入密码', trigger: 'blur' },
        { min: 6, message: '密码长度不能少于6位', trigger: 'blur' }
      ]
    })

    const isLoading = ref(false)

    const handleLogin = async () => {
      try {
        const valid = await loginFormRef.value.validate()
        if (!valid) return

        isLoading.value = true
        
        const result = await authStore.login({
          phone: loginForm.phone,
          password: loginForm.password
        })

        if (result.success) {
          ElMessage.success('登录成功')
          
          // Redirect based on user role
          if (result.user.role === 'admin') {
            router.push('/admin')
          } else {
            router.push('/dashboard')
          }
        }
      } catch (error) {
        ElMessage.error(error.message || '登录失败，请稍后重试')
      } finally {
        isLoading.value = false
      }
    }

    const goToRegister = () => {
      router.push('/register')
    }

    return {
      loginFormRef,
      loginForm,
      loginRules,
      isLoading,
      handleLogin,
      goToRegister
    }
  }
}
</script>

<style scoped>
.login-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 20px;
}

.login-card {
  width: 100%;
  max-width: 400px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  border-radius: 12px;
  overflow: hidden;
}

.card-header {
  text-align: center;
  color: #303133;
}

.card-header h1 {
  margin: 0 0 8px 0;
  font-size: 28px;
  font-weight: 600;
}

.card-header p {
  margin: 0;
  font-size: 14px;
  color: #909399;
}

.form-footer {
  text-align: center;
  margin-top: 16px;
}

.demo-accounts {
  font-size: 13px;
}

.demo-accounts p {
  margin: 4px 0;
}

:deep(.el-form-item) {
  margin-bottom: 20px;
}

:deep(.el-input__wrapper) {
  padding: 12px 15px;
}

:deep(.el-button) {
  padding: 12px 20px;
  font-size: 16px;
}
</style>
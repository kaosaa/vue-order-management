<template>
  <div class="register-container">
    <el-card class="register-card">
      <template #header>
        <div class="card-header">
          <h1>用户注册</h1>
          <p>Create New Account</p>
        </div>
      </template>
      
      <el-form
        ref="registerFormRef"
        :model="registerForm"
        :rules="registerRules"
        label-width="100px"
        label-position="left"
        @submit.prevent="handleRegister"
      >
        <el-form-item label="真实姓名" prop="realName">
          <el-input
            v-model="registerForm.realName"
            placeholder="请输入真实姓名"
            size="large"
            maxlength="20"
            clearable
          >
            <template #prefix>
              <el-icon><User /></el-icon>
            </template>
          </el-input>
        </el-form-item>
        
        <el-form-item label="手机号" prop="phone">
          <el-input
            v-model="registerForm.phone"
            placeholder="请输入手机号"
            size="large"
            maxlength="11"
            clearable
            @blur="validatePhoneNumber"
          >
            <template #prefix>
              <el-icon><Phone /></el-icon>
            </template>
            <template #suffix>
              <el-icon v-if="phoneValidationStatus === 'validating'" class="is-loading">
                <Loading />
              </el-icon>
              <el-icon v-else-if="phoneValidationStatus === 'valid'" style="color: #67c23a">
                <CircleCheck />
              </el-icon>
              <el-icon v-else-if="phoneValidationStatus === 'invalid'" style="color: #f56c6c">
                <CircleClose />
              </el-icon>
            </template>
          </el-input>
          <div v-if="phoneValidationMessage" 
               :class="['validation-message', phoneValidationStatus]">
            {{ phoneValidationMessage }}
          </div>
        </el-form-item>
        
        <el-form-item label="支付宝账户" prop="alipayAccount">
          <el-input
            v-model="registerForm.alipayAccount"
            placeholder="请输入支付宝账户（邮箱或手机号）"
            size="large"
            clearable
          >
            <template #prefix>
              <el-icon><Message /></el-icon>
            </template>
          </el-input>
        </el-form-item>
        
        <el-form-item label="密码" prop="password">
          <el-input
            v-model="registerForm.password"
            type="password"
            placeholder="请输入密码（至少6位）"
            size="large"
            show-password
            clearable
          >
            <template #prefix>
              <el-icon><Lock /></el-icon>
            </template>
          </el-input>
        </el-form-item>
        
        <el-form-item label="确认密码" prop="confirmPassword">
          <el-input
            v-model="registerForm.confirmPassword"
            type="password"
            placeholder="请再次输入密码"
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
          <el-checkbox v-model="agreeToTerms" size="large">
            我已阅读并同意《用户服务协议》和《隐私政策》
          </el-checkbox>
        </el-form-item>
        
        <el-form-item>
          <el-button
            type="primary"
            size="large"
            :loading="isLoading"
            :disabled="!agreeToTerms"
            @click="handleRegister"
            style="width: 100%"
          >
            <span v-if="!isLoading">注册</span>
            <span v-else>注册中...</span>
          </el-button>
        </el-form-item>
        
        <div class="form-footer">
          <el-link type="primary" @click="goToLogin">
            已有账号？立即登录
          </el-link>
        </div>
      </el-form>
    </el-card>
  </div>
</template>

<script>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { useAdminStore } from '../stores/admin'
import { ElMessage } from 'element-plus'

export default {
  name: 'Register',
  setup() {
    const router = useRouter()
    const authStore = useAuthStore()
    const adminStore = useAdminStore()
    const registerFormRef = ref()

    const registerForm = reactive({
      realName: '',
      phone: '',
      alipayAccount: '',
      password: '',
      confirmPassword: ''
    })

    const isLoading = ref(false)
    const agreeToTerms = ref(false)
    const phoneValidationStatus = ref('')
    const phoneValidationMessage = ref('')

    // Real-time phone validation
    const validatePhoneNumber = () => {
      const phone = registerForm.phone.trim()
      
      if (!phone) {
        phoneValidationStatus.value = ''
        phoneValidationMessage.value = ''
        return
      }

      phoneValidationStatus.value = 'validating'
      phoneValidationMessage.value = '验证中...'

      // 只做基础格式验证，重复检查交给表单验证器处理
      setTimeout(() => {
        const phoneRegex = /^1[3-9]\d{9}$/
        
        if (!phoneRegex.test(phone)) {
          phoneValidationStatus.value = 'invalid'
          phoneValidationMessage.value = '请输入正确的手机号格式'
          return
        }

        phoneValidationStatus.value = 'valid'
        phoneValidationMessage.value = '格式正确'
      }, 300)
    }

    // Form validation rules
    const phoneValidator = async (rule, value, callback) => {
      const phoneRegex = /^1[3-9]\d{9}$/
      if (!value) {
        callback(new Error('请输入手机号'))
      } else if (!phoneRegex.test(value)) {
        callback(new Error('请输入正确的手机号格式'))
      } else {
        try {
          const isDuplicate = await adminStore.checkDuplicatePhone(value)
          if (isDuplicate) {
            callback(new Error('该手机号已被注册'))
          } else {
            callback()
          }
        } catch (error) {
          console.error('Phone validation error in form:', error)
          callback(new Error('验证失败，请稍后重试'))
        }
      }
    }

    const alipayValidator = async (rule, value, callback) => {
      if (!value) {
        callback(new Error('请输入支付宝账户'))
      } else if (!adminStore.validateAlipayAccount(value)) {
        callback(new Error('请输入正确的支付宝账户（邮箱或手机号）'))
      } else {
        try {
          const isDuplicate = await adminStore.checkDuplicateAlipay(value)
          if (isDuplicate) {
            callback(new Error('该支付宝账户已被注册'))
          } else {
            callback()
          }
        } catch (error) {
          console.error('Alipay validation error in form:', error)
          callback(new Error('验证失败，请稍后重试'))
        }
      }
    }

    const confirmPasswordValidator = (rule, value, callback) => {
      if (!value) {
        callback(new Error('请确认密码'))
      } else if (value !== registerForm.password) {
        callback(new Error('两次输入的密码不一致'))
      } else {
        callback()
      }
    }

    const registerRules = reactive({
      realName: [
        { required: true, message: '请输入真实姓名', trigger: 'blur' },
        { min: 2, max: 20, message: '姓名长度在2到20个字符', trigger: 'blur' }
      ],
      phone: [
        { required: true, validator: phoneValidator, trigger: 'blur' }
      ],
      alipayAccount: [
        { required: true, validator: alipayValidator, trigger: 'blur' }
      ],
      password: [
        { required: true, message: '请输入密码', trigger: 'blur' },
        { min: 6, message: '密码长度不能少于6位', trigger: 'blur' }
      ],
      confirmPassword: [
        { required: true, validator: confirmPasswordValidator, trigger: 'blur' }
      ]
    })

    const handleRegister = async () => {
      try {
        // Skip validation when clicking register button to avoid duplicate API calls
        // Just check if form fields are filled
        if (!registerForm.realName || !registerForm.phone || !registerForm.alipayAccount ||
            !registerForm.password || !registerForm.confirmPassword) {
          ElMessage.warning('请填写所有必填项')
          return
        }

        if (registerForm.password !== registerForm.confirmPassword) {
          ElMessage.warning('两次输入的密码不一致')
          return
        }

        if (!agreeToTerms.value) {
          ElMessage.warning('请先同意用户服务协议和隐私政策')
          return
        }

        isLoading.value = true

        const result = await authStore.register({
          realName: registerForm.realName.trim(),
          phone: registerForm.phone.trim(),
          alipayAccount: registerForm.alipayAccount.trim(),
          password: registerForm.password
        })

        if (result.success) {
          ElMessage.success('注册成功，即将跳转到用户工作台')

          setTimeout(() => {
            router.push('/dashboard')
          }, 1500)
        }
      } catch (error) {
        ElMessage.error(error.message || '注册失败，请稍后重试')
      } finally {
        isLoading.value = false
      }
    }

    const goToLogin = () => {
      router.push('/login')
    }

    // Initialize admin store to have user data for validation
    adminStore.fetchUsers()

    return {
      registerFormRef,
      registerForm,
      registerRules,
      isLoading,
      agreeToTerms,
      phoneValidationStatus,
      phoneValidationMessage,
      handleRegister,
      goToLogin,
      validatePhoneNumber
    }
  }
}
</script>

<style scoped>
.register-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 20px;
}

.register-card {
  width: 100%;
  max-width: 450px;
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

.validation-message {
  font-size: 12px;
  margin-top: 4px;
  padding-left: 4px;
}

.validation-message.valid {
  color: #67c23a;
}

.validation-message.invalid {
  color: #f56c6c;
}

.validation-message.validating {
  color: #409eff;
}

.form-footer {
  text-align: center;
  margin-top: 16px;
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

:deep(.el-checkbox__label) {
  font-size: 13px;
  line-height: 1.4;
}

.is-loading {
  animation: rotating 2s linear infinite;
}

@keyframes rotating {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}
</style>
<template>
  <div class="navigation">
    <el-menu
      :default-active="currentRoute"
      mode="horizontal"
      :ellipsis="false"
      @select="handleSelect"
    >
      <!-- Logo/Brand -->
      <div class="brand">
        <h2>报单系统</h2>
      </div>
      
      <!-- User Navigation -->
      <template v-if="isAuthenticated && userRole === 'user'">
        <el-menu-item index="/dashboard">
          <el-icon><Odometer /></el-icon>
          工作台
        </el-menu-item>
        <el-menu-item index="/orders">
          <el-icon><DocumentAdd /></el-icon>
          创建订单
        </el-menu-item>
        <el-menu-item index="/history">
          <el-icon><Document /></el-icon>
          历史记录
        </el-menu-item>
      </template>
      
      <!-- Admin Navigation -->
      <template v-if="isAuthenticated && userRole === 'admin'">
        <el-menu-item index="/admin">
          <el-icon><Monitor /></el-icon>
          管理台
        </el-menu-item>
        <el-menu-item index="/admin/users">
          <el-icon><User /></el-icon>
          用户管理
        </el-menu-item>
        <el-menu-item index="/admin/products">
          <el-icon><Box /></el-icon>
          商品管理
        </el-menu-item>
        <el-menu-item index="/admin/couriers">
          <el-icon><Van /></el-icon>
          快递管理
        </el-menu-item>
        <el-menu-item index="/admin/orders">
          <el-icon><List /></el-icon>
          订单管理
        </el-menu-item>
        <el-menu-item index="/admin/export">
          <el-icon><Download /></el-icon>
          数据导出
        </el-menu-item>
      </template>

      <!-- User Info and Logout -->
      <div class="user-actions">
        <template v-if="isAuthenticated">
          <el-dropdown @command="handleCommand">
            <span class="el-dropdown-link">
              <el-icon><Avatar /></el-icon>
              {{ user?.realName || '用户' }}
              <el-icon class="el-icon--right"><ArrowDown /></el-icon>
            </span>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="profile">个人资料</el-dropdown-item>
                <el-dropdown-item command="logout" divided>退出登录</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </template>
      </div>
    </el-menu>
  </div>
</template>

<script>
import { computed, nextTick } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { ElMessage } from 'element-plus'

export default {
  name: 'Navigation',
  setup() {
    const router = useRouter()
    const route = useRoute()
    const authStore = useAuthStore()

    const currentRoute = computed(() => route.path)
    const isAuthenticated = computed(() => authStore.isAuthenticated)
    const user = computed(() => authStore.user)
    const userRole = computed(() => authStore.user?.role)

    const handleSelect = (key) => {
      if (key !== route.path) {
        router.push(key)
      }
    }

    const handleCommand = async (command) => {
      if (command === 'logout') {
        try {
          await authStore.logout()
          ElMessage.success('已退出登录')
          // Use nextTick to ensure the state is updated before navigation
          await nextTick()
          router.push('/login')
        } catch (error) {
          console.error('Logout error:', error)
          ElMessage.error('退出登录失败')
        }
      } else if (command === 'profile') {
        router.push('/profile')
      }
    }

    return {
      currentRoute,
      isAuthenticated,
      user,
      userRole,
      handleSelect,
      handleCommand
    }
  }
}
</script>

<style scoped>
.navigation {
  height: 60px;
}

.brand {
  display: flex;
  align-items: center;
  padding: 0 20px;
  color: #409eff;
}

.brand h2 {
  margin: 0;
  font-size: 20px;
}

.user-actions {
  margin-left: auto;
  padding: 0 20px;
  display: flex;
  align-items: center;
}

.el-dropdown-link {
  cursor: pointer;
  color: var(--el-text-color-regular);
  display: flex;
  align-items: center;
}

.el-dropdown-link:hover {
  color: var(--el-color-primary);
}

:deep(.el-menu) {
  border-bottom: none;
  height: 60px;
  display: flex;
  align-items: center;
}

:deep(.el-menu-item) {
  height: 60px;
  line-height: 60px;
  border-bottom: 2px solid transparent;
}

:deep(.el-menu-item.is-active) {
  border-bottom-color: var(--el-color-primary);
  color: var(--el-color-primary);
}
</style>
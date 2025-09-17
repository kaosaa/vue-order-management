<template>
  <div class="navigation">
    <!-- Desktop Navigation -->
    <el-menu
      v-if="!isMobile"
      :default-active="currentRoute"
      mode="horizontal"
      :ellipsis="false"
      @select="handleSelect"
      class="desktop-nav"
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

    <!-- Mobile Navigation -->
    <div v-if="isMobile" class="mobile-nav">
      <!-- Mobile Header -->
      <div class="mobile-header">
        <div class="brand">
          <h3>报单系统</h3>
        </div>
        <div class="mobile-actions">
          <!-- User Info -->
          <el-dropdown v-if="isAuthenticated" @command="handleCommand" trigger="click">
            <el-button type="text" class="user-btn">
              <el-icon><Avatar /></el-icon>
              {{ user?.realName || '用户' }}
            </el-button>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="profile">个人资料</el-dropdown-item>
                <el-dropdown-item command="logout" divided>退出登录</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>

          <!-- Menu Toggle -->
          <el-button
            v-if="isAuthenticated"
            type="text"
            @click="mobileMenuVisible = !mobileMenuVisible"
            class="menu-toggle"
          >
            <el-icon><Menu /></el-icon>
          </el-button>
        </div>
      </div>

      <!-- Mobile Menu Drawer -->
      <el-drawer
        v-model="mobileMenuVisible"
        title="菜单"
        direction="rtl"
        size="280px"
        :with-header="false"
      >
        <div class="mobile-menu">
          <!-- User Navigation -->
          <template v-if="isAuthenticated && userRole === 'user'">
            <div class="menu-section">
              <div class="menu-title">用户功能</div>
              <div
                class="menu-item"
                :class="{ active: currentRoute === '/dashboard' }"
                @click="navigateAndClose('/dashboard')"
              >
                <el-icon><Odometer /></el-icon>
                <span>工作台</span>
              </div>
              <div
                class="menu-item"
                :class="{ active: currentRoute === '/orders' }"
                @click="navigateAndClose('/orders')"
              >
                <el-icon><DocumentAdd /></el-icon>
                <span>创建订单</span>
              </div>
              <div
                class="menu-item"
                :class="{ active: currentRoute === '/history' }"
                @click="navigateAndClose('/history')"
              >
                <el-icon><Document /></el-icon>
                <span>历史记录</span>
              </div>
            </div>
          </template>

          <!-- Admin Navigation -->
          <template v-if="isAuthenticated && userRole === 'admin'">
            <div class="menu-section">
              <div class="menu-title">管理功能</div>
              <div
                class="menu-item"
                :class="{ active: currentRoute === '/admin' }"
                @click="navigateAndClose('/admin')"
              >
                <el-icon><Monitor /></el-icon>
                <span>管理台</span>
              </div>
              <div
                class="menu-item"
                :class="{ active: currentRoute === '/admin/users' }"
                @click="navigateAndClose('/admin/users')"
              >
                <el-icon><User /></el-icon>
                <span>用户管理</span>
              </div>
              <div
                class="menu-item"
                :class="{ active: currentRoute === '/admin/products' }"
                @click="navigateAndClose('/admin/products')"
              >
                <el-icon><Box /></el-icon>
                <span>商品管理</span>
              </div>
              <div
                class="menu-item"
                :class="{ active: currentRoute === '/admin/couriers' }"
                @click="navigateAndClose('/admin/couriers')"
              >
                <el-icon><Van /></el-icon>
                <span>快递管理</span>
              </div>
              <div
                class="menu-item"
                :class="{ active: currentRoute === '/admin/orders' }"
                @click="navigateAndClose('/admin/orders')"
              >
                <el-icon><List /></el-icon>
                <span>订单管理</span>
              </div>
              <div
                class="menu-item"
                :class="{ active: currentRoute === '/admin/export' }"
                @click="navigateAndClose('/admin/export')"
              >
                <el-icon><Download /></el-icon>
                <span>数据导出</span>
              </div>
            </div>
          </template>
        </div>
      </el-drawer>
    </div>
  </div>
</template>

<script>
import { computed, ref, onMounted, onUnmounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { ElMessage } from 'element-plus'

export default {
  name: 'Navigation',
  setup() {
    const router = useRouter()
    const route = useRoute()
    const authStore = useAuthStore()

    const mobileMenuVisible = ref(false)
    const isMobile = ref(false)

    const currentRoute = computed(() => route.path)
    const isAuthenticated = computed(() => authStore.isAuthenticated)
    const user = computed(() => authStore.user)
    const userRole = computed(() => authStore.user?.role)

    // Check if device is mobile
    const checkIsMobile = () => {
      isMobile.value = window.innerWidth <= 768
    }

    const handleSelect = (key) => {
      if (key !== route.path) {
        router.push(key)
      }
    }

    const navigateAndClose = (path) => {
      router.push(path)
      mobileMenuVisible.value = false
    }

    const handleCommand = (command) => {
      if (command === 'profile') {
        router.push('/profile')
      } else if (command === 'logout') {
        authStore.logout()
        ElMessage.success('已退出登录')
        router.push('/login')
      }
      mobileMenuVisible.value = false
    }

    onMounted(() => {
      checkIsMobile()
      window.addEventListener('resize', checkIsMobile)
    })

    onUnmounted(() => {
      window.removeEventListener('resize', checkIsMobile)
    })

    return {
      currentRoute,
      isAuthenticated,
      user,
      userRole,
      isMobile,
      mobileMenuVisible,
      handleSelect,
      navigateAndClose,
      handleCommand
    }
  }
}
</script>

<style scoped>
.navigation {
  position: sticky;
  top: 0;
  z-index: 1000;
  background: white;
  border-bottom: 1px solid #e4e7ed;
}

/* Desktop Navigation */
.desktop-nav {
  display: flex;
  align-items: center;
  padding: 0 20px;
}

.brand {
  margin-right: 40px;
}

.brand h2, .brand h3 {
  margin: 0;
  color: #409eff;
  font-weight: bold;
}

.user-actions {
  margin-left: auto;
  display: flex;
  align-items: center;
}

.el-dropdown-link {
  cursor: pointer;
  color: #409eff;
  display: flex;
  align-items: center;
  font-size: 14px;
}

.el-dropdown-link:hover {
  color: #66b1ff;
}

/* Mobile Navigation */
.mobile-nav {
  width: 100%;
}

.mobile-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background: white;
  border-bottom: 1px solid #e4e7ed;
  height: 56px;
}

.mobile-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.user-btn {
  font-size: 14px;
  padding: 8px 12px;
}

.menu-toggle {
  font-size: 18px;
  padding: 8px;
}

/* Mobile Menu Drawer */
.mobile-menu {
  padding: 16px 0;
}

.menu-section {
  margin-bottom: 24px;
}

.menu-title {
  font-size: 12px;
  color: #909399;
  font-weight: bold;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 8px;
  padding: 0 16px;
}

.menu-item {
  display: flex;
  align-items: center;
  padding: 12px 16px;
  cursor: pointer;
  transition: all 0.3s;
  font-size: 14px;
  color: #606266;
}

.menu-item:hover {
  background-color: #f5f7fa;
  color: #409eff;
}

.menu-item.active {
  background-color: #ecf5ff;
  color: #409eff;
  border-right: 2px solid #409eff;
}

.menu-item .el-icon {
  margin-right: 8px;
  font-size: 16px;
}

/* Responsive Design */
@media (max-width: 768px) {
  .desktop-nav {
    display: none;
  }

  .brand h3 {
    font-size: 18px;
  }
}

@media (min-width: 769px) {
  .mobile-nav {
    display: none;
  }
}

/* Element Plus Menu Override */
:deep(.el-menu--horizontal) {
  border-bottom: none;
}

:deep(.el-menu-item) {
  font-size: 14px;
  height: 56px;
  line-height: 56px;
}

:deep(.el-menu-item:hover) {
  background-color: #ecf5ff;
}

:deep(.el-menu-item.is-active) {
  border-bottom: 2px solid #409eff;
  color: #409eff;
}
</style>
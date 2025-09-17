<template>
  <div id="app">
    <el-container class="layout-container">
      <!-- Navigation Header -->
      <el-header v-if="showHeader" class="header">
        <Navigation />
      </el-header>
      
      <!-- Main Content Area -->
      <el-main class="main-content">
        <router-view v-slot="{ Component }">
          <transition name="fade" mode="out-in">
            <component :is="Component" />
          </transition>
        </router-view>
      </el-main>
    </el-container>
  </div>
</template>

<script>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useAuthStore } from './stores/auth'
import Navigation from './components/Navigation.vue'

export default {
  name: 'App',
  components: {
    Navigation
  },
  setup() {
    const route = useRoute()
    const authStore = useAuthStore()

    // Hide header on login/register pages
    const showHeader = computed(() => {
      return !['Login', 'Register'].includes(route.name)
    })

    // Initialize auth state from localStorage
    authStore.initializeAuth()

    return {
      showHeader
    }
  }
}
</script>

<style scoped>
.layout-container {
  height: 100vh;
}

.header {
  background: #ffffff;
  border-bottom: 1px solid #e4e7ed;
  padding: 0;
}

.main-content {
  background: #f5f7fa;
  padding: 20px;
}

/* Mobile responsiveness */
@media (max-width: 768px) {
  .main-content {
    padding: 12px;
  }

  .layout-container {
    height: 100vh;
    overflow-x: hidden;
  }
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: 'Helvetica Neue', Arial, sans-serif;
}

#app {
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

/* Global Mobile Adaptations */
@media (max-width: 768px) {
  /* Table responsiveness */
  .el-table {
    font-size: 12px;
  }

  .el-table .el-table__cell {
    padding: 8px 4px;
  }

  /* Form responsiveness */
  .el-form-item__label {
    font-size: 13px;
  }

  .el-input__inner {
    font-size: 14px;
  }

  /* Button responsiveness */
  .el-button {
    font-size: 13px;
    padding: 8px 12px;
  }

  .el-button--small {
    font-size: 12px;
    padding: 6px 10px;
  }

  /* Dialog responsiveness */
  .el-dialog {
    width: 95% !important;
    margin: 20px auto !important;
  }

  .el-dialog__header {
    padding: 15px 15px 10px;
  }

  .el-dialog__body {
    padding: 15px;
  }

  /* Card responsiveness */
  .el-card {
    margin-bottom: 12px;
  }

  .el-card__body {
    padding: 15px;
  }

  /* Descriptions responsiveness */
  .el-descriptions {
    font-size: 13px;
  }

  .el-descriptions__label {
    font-weight: 600;
    color: #606266;
    font-size: 12px;
  }

  .el-descriptions__content {
    font-size: 13px;
  }

  /* Pagination responsiveness */
  .el-pagination {
    justify-content: center;
    padding: 10px 0;
  }

  .el-pagination .el-pager li {
    min-width: 28px;
    height: 28px;
    line-height: 28px;
    font-size: 12px;
  }

  /* Form dialog responsiveness */
  .el-form--label-top .el-form-item__label {
    padding-bottom: 6px;
  }
}

/* Extra small screens */
@media (max-width: 480px) {
  .el-table {
    font-size: 11px;
  }

  .el-table .el-table__cell {
    padding: 6px 2px;
  }

  .el-button {
    font-size: 12px;
    padding: 6px 8px;
  }

  .el-dialog {
    width: 98% !important;
    margin: 10px auto !important;
  }

  .el-card__body {
    padding: 12px;
  }
}
</style>
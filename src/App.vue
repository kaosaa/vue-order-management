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
</style>
<template>
  <div class="user-dashboard">
    <el-row :gutter="20">
      <!-- Welcome Card -->
      <el-col :span="24">
        <el-card class="welcome-card">
          <h2>欢迎回来，{{ user?.realName }}！</h2>
          <p>今天是 {{ currentDate }}，祝您工作愉快！</p>
        </el-card>
      </el-col>
    </el-row>
    
    <el-row :gutter="20" style="margin-top: 20px">
      <!-- Statistics Cards -->
      <el-col :span="8">
        <el-card class="stat-card">
          <div class="stat-item">
            <div class="stat-icon pending">
              <el-icon><Clock /></el-icon>
            </div>
            <div class="stat-content">
              <h3>{{ orderStats.pending }}</h3>
              <p>待处理订单</p>
            </div>
          </div>
        </el-card>
      </el-col>
      
      <el-col :span="8">
        <el-card class="stat-card">
          <div class="stat-item">
            <div class="stat-icon completed">
              <el-icon><CircleCheck /></el-icon>
            </div>
            <div class="stat-content">
              <h3>{{ orderStats.completed }}</h3>
              <p>已完成订单</p>
            </div>
          </div>
        </el-card>
      </el-col>
      
      <el-col :span="8">
        <el-card class="stat-card">
          <div class="stat-item">
            <div class="stat-icon total">
              <el-icon><Document /></el-icon>
            </div>
            <div class="stat-content">
              <h3>{{ orderStats.total }}</h3>
              <p>总订单数</p>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>
    
    <!-- Quick Actions -->
    <el-row :gutter="20" style="margin-top: 20px">
      <el-col :span="24">
        <el-card>
          <template #header>
            <h3>快捷操作</h3>
          </template>
          
          <div class="quick-actions">
            <el-button type="primary" size="large" @click="goToOrders">
              <el-icon><DocumentAdd /></el-icon>
              创建新订单
            </el-button>
            
            <el-button type="success" size="large" @click="goToHistory">
              <el-icon><Document /></el-icon>
              查看历史记录
            </el-button>
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script>
import { computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../../stores/auth'
import { useOrderStore } from '../../stores/order'

export default {
  name: 'UserDashboard',
  setup() {
    const router = useRouter()
    const authStore = useAuthStore()
    const orderStore = useOrderStore()

    const user = computed(() => authStore.user)
    const orderStats = computed(() => orderStore.orderStats)
    const currentDate = computed(() => {
      return new Date().toLocaleDateString('zh-CN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        weekday: 'long'
      })
    })

    const goToOrders = () => {
      router.push('/orders')
    }

    const goToHistory = () => {
      router.push('/history')
    }

    onMounted(() => {
      orderStore.fetchOrders()
    })

    return {
      user,
      orderStats,
      currentDate,
      goToOrders,
      goToHistory
    }
  }
}
</script>

<style scoped>
.user-dashboard {
  padding: 20px;
}

.welcome-card {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
}

.welcome-card h2 {
  margin: 0 0 8px 0;
  font-size: 24px;
}

.welcome-card p {
  margin: 0;
  opacity: 0.9;
}

.stat-card {
  height: 120px;
}

.stat-item {
  display: flex;
  align-items: center;
  height: 100%;
}

.stat-icon {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 16px;
  font-size: 24px;
  color: white;
}

.stat-icon.pending {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
}

.stat-icon.completed {
  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
}

.stat-icon.total {
  background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);
}

.stat-content h3 {
  margin: 0;
  font-size: 28px;
  font-weight: 600;
  color: #303133;
}

.stat-content p {
  margin: 4px 0 0 0;
  color: #909399;
  font-size: 14px;
}

.quick-actions {
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
}

.quick-actions .el-button {
  padding: 16px 24px;
  font-size: 16px;
  border-radius: 8px;
}
</style>
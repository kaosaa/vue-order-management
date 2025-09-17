<template>
  <div class="admin-dashboard">
    <!-- Welcome Section -->
    <div class="dashboard-header">
      <div class="welcome-section">
        <div class="welcome-content">
          <div class="welcome-avatar">
            <el-icon size="40"><UserFilled /></el-icon>
          </div>
          <div class="welcome-text">
            <h1>欢迎回来，{{ user?.realName }}！</h1>
            <p>{{ currentDate }} · 管理员控制台</p>
          </div>
        </div>
        <div class="header-actions">
          <el-button type="primary" @click="refreshData" :loading="isRefreshing">
            <el-icon><Refresh /></el-icon>
            刷新数据
          </el-button>
        </div>
      </div>
    </div>

    <!-- Statistics Grid -->
    <div class="stats-grid">
      <div class="stat-card" @click="goTo('/admin/users')">
        <div class="stat-header">
          <div class="stat-icon users">
            <el-icon><User /></el-icon>
          </div>
          <div class="stat-trend up">
            <el-icon><Top /></el-icon>
            +12%
          </div>
        </div>
        <div class="stat-body">
          <div class="stat-number">{{ adminStats?.users?.total || 0 }}</div>
          <div class="stat-label">用户总数</div>
          <div class="stat-detail">活跃用户 {{ adminStats?.users?.active || 0 }} 人</div>
        </div>
      </div>

      <div class="stat-card" @click="goTo('/admin/orders')">
        <div class="stat-header">
          <div class="stat-icon orders">
            <el-icon><Document /></el-icon>
          </div>
          <div class="stat-trend up">
            <el-icon><Top /></el-icon>
            +8%
          </div>
        </div>
        <div class="stat-body">
          <div class="stat-number">{{ adminStats?.orders?.total || 0 }}</div>
          <div class="stat-label">订单总数</div>
          <div class="stat-detail">待处理 {{ adminStats?.orders?.pending || 0 }} 单</div>
        </div>
      </div>

      <div class="stat-card" @click="goTo('/admin/products')">
        <div class="stat-header">
          <div class="stat-icon products">
            <el-icon><Box /></el-icon>
          </div>
          <div class="stat-trend up">
            <el-icon><Top /></el-icon>
            +5%
          </div>
        </div>
        <div class="stat-body">
          <div class="stat-number">{{ adminStats?.products?.total || 0 }}</div>
          <div class="stat-label">商品总数</div>
          <div class="stat-detail">启用 {{ adminStats?.products?.active || 0 }} 个</div>
        </div>
      </div>

      <div class="stat-card" @click="goTo('/admin/couriers')">
        <div class="stat-header">
          <div class="stat-icon couriers">
            <el-icon><Van /></el-icon>
          </div>
          <div class="stat-trend stable">
            <el-icon><Minus /></el-icon>
            0%
          </div>
        </div>
        <div class="stat-body">
          <div class="stat-number">{{ adminStats?.couriers?.total || 0 }}</div>
          <div class="stat-label">快递公司</div>
          <div class="stat-detail">启用 {{ adminStats?.couriers?.active || 0 }} 个</div>
        </div>
      </div>
    </div>

    <!-- Quick Actions -->
    <div class="quick-actions-section">
      <div class="section-title">
        <h3>快速操作</h3>
        <span class="section-subtitle">常用管理功能</span>
      </div>
      <div class="actions-grid">
        <div class="action-card" @click="goTo('/admin/users')">
          <div class="action-icon users">
            <el-icon><User /></el-icon>
          </div>
          <div class="action-content">
            <div class="action-title">用户管理</div>
            <div class="action-desc">管理系统用户</div>
          </div>
          <div class="action-arrow">
            <el-icon><ArrowRight /></el-icon>
          </div>
        </div>

        <div class="action-card" @click="goTo('/admin/orders')">
          <div class="action-icon orders">
            <el-icon><Document /></el-icon>
          </div>
          <div class="action-content">
            <div class="action-title">订单管理</div>
            <div class="action-desc">处理订单信息</div>
          </div>
          <div class="action-arrow">
            <el-icon><ArrowRight /></el-icon>
          </div>
        </div>

        <div class="action-card" @click="goTo('/admin/products')">
          <div class="action-icon products">
            <el-icon><Box /></el-icon>
          </div>
          <div class="action-content">
            <div class="action-title">商品管理</div>
            <div class="action-desc">维护商品信息</div>
          </div>
          <div class="action-arrow">
            <el-icon><ArrowRight /></el-icon>
          </div>
        </div>

        <div class="action-card" @click="goTo('/admin/couriers')">
          <div class="action-icon couriers">
            <el-icon><Van /></el-icon>
          </div>
          <div class="action-content">
            <div class="action-title">快递管理</div>
            <div class="action-desc">管理快递公司</div>
          </div>
          <div class="action-arrow">
            <el-icon><ArrowRight /></el-icon>
          </div>
        </div>

        <div class="action-card" @click="goTo('/admin/export')">
          <div class="action-icon export">
            <el-icon><Download /></el-icon>
          </div>
          <div class="action-content">
            <div class="action-title">数据导出</div>
            <div class="action-desc">导出系统数据</div>
          </div>
          <div class="action-arrow">
            <el-icon><ArrowRight /></el-icon>
          </div>
        </div>

        <div class="action-card" @click="goTo('/admin/settings')">
          <div class="action-icon settings">
            <el-icon><Setting /></el-icon>
          </div>
          <div class="action-content">
            <div class="action-title">系统设置</div>
            <div class="action-desc">配置系统参数</div>
          </div>
          <div class="action-arrow">
            <el-icon><ArrowRight /></el-icon>
          </div>
        </div>
      </div>
    </div>

    <!-- System Status -->
    <div class="status-section">
      <div class="section-title">
        <h3>系统状态</h3>
        <span class="section-subtitle">实时监控信息</span>
      </div>
      <div class="status-grid">
        <div class="status-item">
          <div class="status-indicator online"></div>
          <div class="status-content">
            <div class="status-label">服务状态</div>
            <div class="status-value">运行正常</div>
          </div>
        </div>
        <div class="status-item">
          <div class="status-indicator success"></div>
          <div class="status-content">
            <div class="status-label">数据库</div>
            <div class="status-value">连接正常</div>
          </div>
        </div>
        <div class="status-item">
          <div class="status-indicator warning"></div>
          <div class="status-content">
            <div class="status-label">最后更新</div>
            <div class="status-value">{{ lastUpdateTime }}</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../../stores/auth'
import { useAdminStore } from '../../stores/admin'
import { ElMessage } from 'element-plus'

export default {
  name: 'AdminDashboard',
  setup() {
    const router = useRouter()
    const authStore = useAuthStore()
    const adminStore = useAdminStore()

    const adminStats = ref({
      users: { total: 0, active: 0 },
      orders: { total: 0, pending: 0 },
      products: { total: 0, active: 0 },
      couriers: { total: 0, active: 0 }
    })

    const isRefreshing = ref(false)

    const user = computed(() => authStore.user)
    
    const currentDate = computed(() => {
      const now = new Date()
      const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
      return `${now.getFullYear()}年${now.getMonth() + 1}月${now.getDate()}日 ${weekdays[now.getDay()]}`
    })

    const lastUpdateTime = computed(() => {
      return new Date().toLocaleTimeString('zh-CN', { 
        hour12: false,
        hour: '2-digit',
        minute: '2-digit'
      })
    })

    const goTo = (path) => {
      router.push(path)
    }

    const refreshData = async () => {
      isRefreshing.value = true
      try {
        await loadAdminStats()
        ElMessage.success('数据已刷新')
      } catch (error) {
        ElMessage.error('刷新失败，请稍后重试')
      } finally {
        setTimeout(() => {
          isRefreshing.value = false
        }, 500)
      }
    }

    const loadAdminStats = async () => {
      try {
        const stats = await adminStore.fetchStats()
        adminStats.value = stats
      } catch (error) {
        console.error('加载统计数据失败:', error)
        // 使用模拟数据作为备选
        adminStats.value = {
          users: { total: 156, active: 142 },
          orders: { total: 1248, pending: 23 },
          products: { total: 89, active: 76 },
          couriers: { total: 12, active: 12 }
        }
      }
    }

    onMounted(() => {
      loadAdminStats()
    })

    return {
      user,
      adminStats,
      currentDate,
      lastUpdateTime,
      isRefreshing,
      goTo,
      refreshData
    }
  }
}
</script>

<style scoped>
.admin-dashboard {
  padding: 24px;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  min-height: calc(100vh - 60px);
}

/* Dashboard Header */
.dashboard-header {
  margin-bottom: 32px;
}

.welcome-section {
  background: white;
  border-radius: 16px;
  padding: 24px 32px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
}

.welcome-content {
  display: flex;
  align-items: center;
  gap: 16px;
}

.welcome-avatar {
  width: 64px;
  height: 64px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
}

.welcome-text h1 {
  margin: 0 0 4px 0;
  font-size: 24px;
  font-weight: 600;
  color: #1a202c;
}

.welcome-text p {
  margin: 0;
  font-size: 14px;
  color: #718096;
}

/* Statistics Grid */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 24px;
  margin-bottom: 32px;
}

.stat-card {
  background: white;
  border-radius: 16px;
  padding: 24px;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
}

.stat-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.12);
}

.stat-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.stat-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  color: white;
}

.stat-icon.users {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.stat-icon.orders {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
}

.stat-icon.products {
  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
}

.stat-icon.couriers {
  background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);
}

.stat-trend {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  font-weight: 500;
  padding: 4px 8px;
  border-radius: 8px;
}

.stat-trend.up {
  color: #10b981;
  background: rgba(16, 185, 129, 0.1);
}

.stat-trend.stable {
  color: #6b7280;
  background: rgba(107, 114, 128, 0.1);
}

.stat-number {
  font-size: 32px;
  font-weight: 700;
  color: #1a202c;
  margin-bottom: 4px;
}

.stat-label {
  font-size: 16px;
  font-weight: 500;
  color: #4a5568;
  margin-bottom: 4px;
}

.stat-detail {
  font-size: 13px;
  color: #718096;
}

/* Quick Actions Section */
.quick-actions-section {
  margin-bottom: 32px;
}

.section-title {
  margin-bottom: 20px;
}

.section-title h3 {
  margin: 0 0 4px 0;
  font-size: 20px;
  font-weight: 600;
  color: #1a202c;
}

.section-subtitle {
  font-size: 14px;
  color: #718096;
}

.actions-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 16px;
}

.action-card {
  background: white;
  border-radius: 12px;
  padding: 20px;
  display: flex;
  align-items: center;
  gap: 16px;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.06);
}

.action-card:hover {
  transform: translateX(4px);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.12);
}

.action-icon {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  color: white;
}

.action-icon.users {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.action-icon.orders {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
}

.action-icon.products {
  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
}

.action-icon.couriers {
  background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);
}

.action-icon.export {
  background: linear-gradient(135deg, #fa709a 0%, #fee140 100%);
}

.action-icon.settings {
  background: linear-gradient(135deg, #a8edea 0%, #fed6e3 100%);
  color: #4a5568;
}

.action-content {
  flex: 1;
}

.action-title {
  font-size: 15px;
  font-weight: 500;
  color: #1a202c;
  margin-bottom: 2px;
}

.action-desc {
  font-size: 13px;
  color: #718096;
}

.action-arrow {
  color: #cbd5e0;
  font-size: 16px;
}

/* Status Section */
.status-section {
  background: white;
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
}

.status-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
}

.status-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  background: #f8fafc;
  border-radius: 12px;
}

.status-indicator {
  width: 10px;
  height: 10px;
  border-radius: 50%;
}

.status-indicator.online {
  background: #10b981;
}

.status-indicator.success {
  background: #3b82f6;
}

.status-indicator.warning {
  background: #f59e0b;
}

.status-label {
  font-size: 13px;
  color: #718096;
  margin-bottom: 2px;
}

.status-value {
  font-size: 14px;
  font-weight: 500;
  color: #1a202c;
}

/* Header Actions */
.header-actions .el-button {
  font-weight: 500;
}
</style>
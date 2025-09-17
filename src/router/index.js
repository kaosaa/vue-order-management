import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '../stores/auth'

// Import views
const Login = () => import('../views/Login.vue')
const Register = () => import('../views/Register.vue')
const Profile = () => import('../views/Profile.vue')
const UserDashboard = () => import('../views/user/UserDashboard.vue')
const UserOrders = () => import('../views/user/UserOrders.vue')
const UserHistory = () => import('../views/user/UserHistory.vue')
const AdminDashboard = () => import('../views/admin/AdminDashboard.vue')
const UserManagement = () => import('../views/admin/UserManagement.vue')
const ProductManagement = () => import('../views/admin/ProductManagement.vue')
const CourierManagement = () => import('../views/admin/CourierManagement.vue')
const OrderManagement = () => import('../views/admin/OrderManagement.vue')
const DataExport = () => import('../views/admin/DataExport.vue')

const routes = [
  {
    path: '/',
    redirect: '/login'
  },
  {
    path: '/login',
    name: 'Login',
    component: Login,
    meta: { requiresGuest: true }
  },
  {
    path: '/register',
    name: 'Register',
    component: Register,
    meta: { requiresGuest: true }
  },
  {
    path: '/profile',
    name: 'Profile',
    component: Profile,
    meta: { requiresAuth: true }
  },
  {
    path: '/dashboard',
    name: 'UserDashboard',
    component: UserDashboard,
    meta: { requiresAuth: true, role: 'user' }
  },
  {
    path: '/orders',
    name: 'UserOrders',
    component: UserOrders,
    meta: { requiresAuth: true, role: 'user' }
  },
  {
    path: '/history',
    name: 'UserHistory',
    component: UserHistory,
    meta: { requiresAuth: true, role: 'user' }
  },
  {
    path: '/admin',
    name: 'AdminDashboard',
    component: AdminDashboard,
    meta: { requiresAuth: true, role: 'admin' }
  },
  {
    path: '/admin/users',
    name: 'UserManagement',
    component: UserManagement,
    meta: { requiresAuth: true, role: 'admin' }
  },
  {
    path: '/admin/products',
    name: 'ProductManagement',
    component: ProductManagement,
    meta: { requiresAuth: true, role: 'admin' }
  },
  {
    path: '/admin/couriers',
    name: 'CourierManagement',
    component: CourierManagement,
    meta: { requiresAuth: true, role: 'admin' }
  },
  {
    path: '/admin/orders',
    name: 'OrderManagement',
    component: OrderManagement,
    meta: { requiresAuth: true, role: 'admin' }
  },
  {
    path: '/admin/export',
    name: 'DataExport',
    component: DataExport,
    meta: { requiresAuth: true, role: 'admin' }
  },
  {
    path: '/:pathMatch(.*)*',
    redirect: '/login'
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// Navigation guards
router.beforeEach((to, from, next) => {
  const authStore = useAuthStore()
  const isAuthenticated = authStore.isAuthenticated
  const userRole = authStore.user?.role

  // Check if route requires guest (login/register pages)
  if (to.meta.requiresGuest && isAuthenticated) {
    if (userRole === 'admin') {
      next('/admin')
    } else {
      next('/dashboard')
    }
    return
  }

  // Check if route requires authentication
  if (to.meta.requiresAuth && !isAuthenticated) {
    next('/login')
    return
  }

  // Check role-based access
  if (to.meta.role && to.meta.role !== userRole) {
    if (userRole === 'admin') {
      next('/admin')
    } else {
      next('/dashboard')
    }
    return
  }

  next()
})

export default router
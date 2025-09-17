require('dotenv').config()
const express = require('express')
const cors = require('cors')
const helmet = require('helmet')
const morgan = require('morgan')
const rateLimit = require('express-rate-limit')
const path = require('path')

const database = require('./database')
const { migrate } = require('./migrate')
const { seedDatabase } = require('./seed')

// Import routes
const authRoutes = require('./routes/auth')
const userRoutes = require('./routes/users')
const productRoutes = require('./routes/products')
const courierRoutes = require('./routes/couriers')
const orderRoutes = require('./routes/orders')
const adminRoutes = require('./routes/admin')

const app = express()
const PORT = process.env.PORT || 3001

// Security middleware
app.use(helmet({
  contentSecurityPolicy: false, // Disable for development
  crossOriginEmbedderPolicy: false
}))

// CORS configuration
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}))

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200, // Limit each IP to 200 requests per windowMs (increased from 100)
  message: {
    error: '请求过于频繁，请稍后再试'
  },
  standardHeaders: true,
  legacyHeaders: false
})
app.use('/api/', limiter)

// Stricter rate limiting for auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // Limit each IP to 20 requests per windowMs (increased from 5)
  message: {
    error: '登录尝试过于频繁，请稍后再试'
  },
  skipSuccessfulRequests: true, // Don't count successful requests
  standardHeaders: true,
  legacyHeaders: false
})

// Separate rate limiting for check-duplicate endpoint
const checkDuplicateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 30, // Allow 30 checks per minute
  message: {
    error: '验证请求过于频繁，请稍后再试'
  },
  standardHeaders: true,
  legacyHeaders: false
})

// Logging
if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('dev'))
} else {
  app.use(morgan('combined'))
}

// Body parsing middleware
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

// Static files
app.use('/uploads', express.static(path.join(__dirname, '../uploads')))

// API routes
// Apply different limiters for different auth endpoints
app.use('/api/auth/check-duplicate', checkDuplicateLimiter, authRoutes)
app.use('/api/auth', authLimiter, authRoutes)
app.use('/api/users', userRoutes)
app.use('/api/products', productRoutes)
app.use('/api/couriers', courierRoutes)
app.use('/api/orders', orderRoutes)
app.use('/api/admin', adminRoutes)

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    message: '报单系统后端运行正常',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  })
})

// System stats endpoint
app.get('/api/stats', async (req, res) => {
  try {
    const [userCount, orderCount, productCount, courierCount] = await Promise.all([
      database.get('SELECT COUNT(*) as count FROM users'),
      database.get('SELECT COUNT(*) as count FROM orders'),
      database.get('SELECT COUNT(*) as count FROM products WHERE status = "active"'),
      database.get('SELECT COUNT(*) as count FROM couriers WHERE status = "active"')
    ])

    res.json({
      users: userCount.count,
      orders: orderCount.count,
      products: productCount.count,
      couriers: courierCount.count,
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Error fetching system stats:', error)
    res.status(500).json({ error: '获取系统统计失败' })
  }
})

// 404 handler
app.use('/api/*', (req, res) => {
  res.status(404).json({
    error: '接口不存在',
    path: req.path,
    method: req.method
  })
})

// Global error handler
app.use((error, req, res, next) => {
  console.error('Global error handler:', error)

  // Handle specific error types
  if (error.name === 'ValidationError') {
    return res.status(400).json({
      error: '数据验证失败',
      details: error.details || error.message
    })
  }

  if (error.name === 'JsonWebTokenError') {
    return res.status(401).json({
      error: '无效的访问令牌'
    })
  }

  if (error.name === 'TokenExpiredError') {
    return res.status(401).json({
      error: '访问令牌已过期'
    })
  }

  if (error.code === 'SQLITE_CONSTRAINT') {
    return res.status(409).json({
      error: '数据冲突，请检查输入信息'
    })
  }

  // Default server error
  res.status(500).json({
    error: process.env.NODE_ENV === 'production' 
      ? '服务器内部错误' 
      : error.message,
    ...(process.env.NODE_ENV !== 'production' && { stack: error.stack })
  })
})

// Initialize database and start server
async function startServer() {
  try {
    console.log('🚀 启动报单系统后端服务器...')
    
    // Run migrations (uses its own database connection)
    await migrate()
    
    // Seed database if empty (uses its own database connection)
    await seedDatabase()
    
    // Connect to database for server use
    await database.connect()
    
    // Start server
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`✅ 服务器运行在 http://localhost:${PORT}`)
      console.log(`📊 API文档: http://localhost:${PORT}/api/health`)
      console.log(`🎯 数据库: SQLite (database.sqlite)`)
    })
    
  } catch (error) {
    console.error('❌ 服务器启动失败:', error.message)
    process.exit(1)
  }
}

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🛑 接收到退出信号，正在关闭服务器...')
  try {
    await database.close()
    console.log('✅ 数据库连接已关闭')
    process.exit(0)
  } catch (error) {
    console.error('❌ 关闭过程中出错:', error.message)
    process.exit(1)
  }
})

process.on('SIGTERM', async () => {
  console.log('\n🛑 接收到终止信号，正在关闭服务器...')
  try {
    await database.close()
    console.log('✅ 数据库连接已关闭')
    process.exit(0)
  } catch (error) {
    console.error('❌ 关闭过程中出错:', error.message)
    process.exit(1)
  }
})

// Start the server
startServer()

module.exports = app
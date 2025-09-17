const jwt = require('jsonwebtoken')
const database = require('../database')

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production'

// Generate JWT token
const generateToken = (user) => {
  const payload = {
    id: user.id,
    phone: user.phone,
    role: user.role,
    status: user.status
  }
  
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: '24h',
    issuer: 'vue-order-system',
    audience: 'vue-order-system-users'
  })
}

// Verify JWT token
const verifyToken = (token) => {
  try {
    return jwt.verify(token, JWT_SECRET, {
      issuer: 'vue-order-system',
      audience: 'vue-order-system-users'
    })
  } catch (error) {
    throw new Error('Invalid token')
  }
}

// Authentication middleware
const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization
    
    if (!authHeader) {
      return res.status(401).json({ error: '未提供访问令牌' })
    }
    
    const token = authHeader.startsWith('Bearer ') 
      ? authHeader.slice(7) 
      : authHeader
    
    if (!token) {
      return res.status(401).json({ error: '访问令牌格式错误' })
    }
    
    // Verify token
    const decoded = verifyToken(token)
    
    // Get fresh user data from database
    const user = await database.get(
      'SELECT id, real_name, phone, alipay_account, role, status, created_at, last_login_at FROM users WHERE id = ? AND status = "active"',
      [decoded.id]
    )
    
    if (!user) {
      return res.status(401).json({ error: '用户不存在或已被禁用' })
    }
    
    // Attach user to request object
    req.user = user
    req.token = token
    
    next()
  } catch (error) {
    console.error('Authentication error:', error.message)
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: '无效的访问令牌' })
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: '访问令牌已过期' })
    }
    
    return res.status(401).json({ error: '身份验证失败' })
  }
}

// Authorization middleware for admin only
const requireAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ error: '未授权访问' })
  }
  
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: '需要管理员权限' })
  }
  
  next()
}

// Authorization middleware for user only
const requireUser = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ error: '未授权访问' })
  }
  
  if (req.user.role !== 'user') {
    return res.status(403).json({ error: '仅限普通用户访问' })
  }
  
  next()
}

// Check if user can access resource (own resource or admin)
const canAccessResource = (resourceUserId) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: '未授权访问' })
    }
    
    // Admin can access any resource
    if (req.user.role === 'admin') {
      return next()
    }
    
    // User can only access their own resources
    const targetUserId = req.params[resourceUserId] || req.body[resourceUserId]
    
    if (parseInt(targetUserId) !== req.user.id) {
      return res.status(403).json({ error: '无权访问此资源' })
    }
    
    next()
  }
}

// Optional authentication (for public endpoints that can benefit from user context)
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization
    
    if (authHeader) {
      const token = authHeader.startsWith('Bearer ') 
        ? authHeader.slice(7) 
        : authHeader
        
      if (token) {
        const decoded = verifyToken(token)
        const user = await database.get(
          'SELECT id, real_name, phone, alipay_account, role, status, created_at, last_login_at FROM users WHERE id = ? AND status = "active"',
          [decoded.id]
        )
        
        if (user) {
          req.user = user
          req.token = token
        }
      }
    }
    
    next()
  } catch (error) {
    // For optional auth, we don't throw errors, just continue without user
    next()
  }
}

module.exports = {
  generateToken,
  verifyToken,
  authenticate,
  requireAdmin,
  requireUser,
  canAccessResource,
  optionalAuth
}
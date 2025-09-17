const express = require('express')
const database = require('../database')
const { authenticate, requireAdmin } = require('../middleware/auth')
const validationRules = require('../middleware/validation')

const router = express.Router()

// Get all users (Admin only)
router.get('/', authenticate, requireAdmin, validationRules.validatePagination, async (req, res) => {
  try {
    const { page = 1, limit = 50, sort = 'created_at', order = 'desc' } = req.query
    const offset = (page - 1) * limit
    
    const users = await database.all(
      `SELECT id, real_name, phone, alipay_account, role, status, created_at, last_login_at
       FROM users
       ORDER BY ${sort} ${order.toUpperCase()}
       LIMIT ? OFFSET ?`,
      [parseInt(limit), parseInt(offset)]
    )
    
    const totalCount = await database.get('SELECT COUNT(*) as count FROM users')
    
    res.json({
      users: users.map(user => ({
        id: user.id,
        realName: user.real_name,
        phone: user.phone,
        alipayAccount: user.alipay_account,
        role: user.role,
        status: user.status,
        createdAt: user.created_at,
        lastLoginAt: user.last_login_at
      })),
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: totalCount.count,
        pages: Math.ceil(totalCount.count / limit)
      }
    })
    
  } catch (error) {
    console.error('Get users error:', error)
    res.status(500).json({ error: '获取用户列表失败' })
  }
})

module.exports = router
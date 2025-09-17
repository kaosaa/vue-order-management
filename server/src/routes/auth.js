const express = require('express')
const bcrypt = require('bcryptjs')
const { body } = require('express-validator')
const database = require('../database')
const { generateToken, authenticate } = require('../middleware/auth')
const validationRules = require('../middleware/validation')

const router = express.Router()

// Check for duplicate phone/alipay account (public endpoint for registration)
router.get('/check-duplicate', async (req, res) => {
  try {
    const { phone, alipayAccount, excludeUserId } = req.query
    
    if (!phone && !alipayAccount) {
      return res.status(400).json({ 
        error: 'Phone or alipayAccount parameter is required' 
      })
    }
    
    let query = ''
    let params = []
    
    if (phone) {
      query = 'SELECT COUNT(*) as count FROM users WHERE phone = ?'
      params.push(phone)
      
      if (excludeUserId) {
        query += ' AND id != ?'
        params.push(excludeUserId)
      }
    } else if (alipayAccount) {
      query = 'SELECT COUNT(*) as count FROM users WHERE alipay_account = ?'
      params.push(alipayAccount)
      
      if (excludeUserId) {
        query += ' AND id != ?'
        params.push(excludeUserId)
      }
    }
    
    const result = await database.get(query, params)
    const duplicate = result.count > 0
    
    res.json({ 
      duplicate,
      field: phone ? 'phone' : 'alipayAccount',
      value: phone || alipayAccount 
    })
    
  } catch (error) {
    console.error('Check duplicate error:', error)
    res.status(500).json({ error: '检查重复信息失败' })
  }
})

// User registration
router.post('/register', validationRules.register, async (req, res) => {
  try {
    const { real_name, phone, alipay_account, password } = req.body
    
    // Check if phone already exists
    const existingPhone = await database.get(
      'SELECT id FROM users WHERE phone = ?',
      [phone]
    )
    
    if (existingPhone) {
      return res.status(409).json({ error: '该手机号已被注册' })
    }
    
    // Check if alipay account already exists
    const existingAlipay = await database.get(
      'SELECT id FROM users WHERE alipay_account = ?',
      [alipay_account]
    )
    
    if (existingAlipay) {
      return res.status(409).json({ error: '该支付宝账户已被注册' })
    }
    
    // Hash password
    const passwordHash = await bcrypt.hash(password, 12)
    
    // Create user
    const result = await database.run(
      `INSERT INTO users (real_name, phone, alipay_account, password_hash, role, status)
       VALUES (?, ?, ?, ?, 'user', 'active')`,
      [real_name, phone, alipay_account, passwordHash]
    )
    
    // Get created user
    const user = await database.get(
      'SELECT id, real_name, phone, alipay_account, role, status, created_at FROM users WHERE id = ?',
      [result.id]
    )
    
    // Generate token
    const token = generateToken(user)
    
    res.status(201).json({
      message: '注册成功',
      user: {
        id: user.id,
        realName: user.real_name,
        phone: user.phone,
        alipayAccount: user.alipay_account,
        role: user.role,
        status: user.status,
        createdAt: user.created_at
      },
      token
    })
    
  } catch (error) {
    console.error('Registration error:', error)
    res.status(500).json({ error: '注册失败，请稍后重试' })
  }
})

// User login
router.post('/login', validationRules.login, async (req, res) => {
  try {
    const { phone, password } = req.body
    
    // Find user by phone
    const user = await database.get(
      'SELECT id, real_name, phone, alipay_account, password_hash, role, status, created_at, last_login_at FROM users WHERE phone = ?',
      [phone]
    )
    
    if (!user) {
      return res.status(401).json({ error: '手机号或密码错误' })
    }
    
    // Check if user is active
    if (user.status !== 'active') {
      return res.status(401).json({ error: '账户已被禁用，请联系管理员' })
    }
    
    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password_hash)
    
    if (!isValidPassword) {
      return res.status(401).json({ error: '手机号或密码错误' })
    }
    
    // Update last login time
    await database.run(
      'UPDATE users SET last_login_at = CURRENT_TIMESTAMP WHERE id = ?',
      [user.id]
    )
    
    // Generate token
    const token = generateToken(user)
    
    res.json({
      message: '登录成功',
      user: {
        id: user.id,
        realName: user.real_name,
        phone: user.phone,
        alipayAccount: user.alipay_account,
        role: user.role,
        status: user.status,
        createdAt: user.created_at,
        lastLoginAt: new Date().toISOString()
      },
      token
    })
    
  } catch (error) {
    console.error('Login error:', error)
    res.status(500).json({ error: '登录失败，请稍后重试' })
  }
})

// Get current user profile
router.get('/profile', authenticate, async (req, res) => {
  try {
    const user = await database.get(
      'SELECT id, real_name, phone, alipay_account, role, status, created_at, last_login_at FROM users WHERE id = ?',
      [req.user.id]
    )
    
    if (!user) {
      return res.status(404).json({ error: '用户不存在' })
    }
    
    res.json({
      user: {
        id: user.id,
        realName: user.real_name,
        phone: user.phone,
        alipayAccount: user.alipay_account,
        role: user.role,
        status: user.status,
        createdAt: user.created_at,
        lastLoginAt: user.last_login_at
      }
    })
    
  } catch (error) {
    console.error('Get profile error:', error)
    res.status(500).json({ error: '获取用户信息失败' })
  }
})

// Update user profile
router.put('/profile', authenticate, validationRules.updateProfile, async (req, res) => {
  try {
    const { real_name, alipay_account } = req.body
    const updateFields = []
    const updateValues = []
    
    if (real_name) {
      updateFields.push('real_name = ?')
      updateValues.push(real_name)
    }
    
    if (alipay_account) {
      // Check if alipay account already exists for other users
      const existingAlipay = await database.get(
        'SELECT id FROM users WHERE alipay_account = ? AND id != ?',
        [alipay_account, req.user.id]
      )
      
      if (existingAlipay) {
        return res.status(409).json({ error: '该支付宝账户已被其他用户使用' })
      }
      
      updateFields.push('alipay_account = ?')
      updateValues.push(alipay_account)
    }
    
    if (updateFields.length === 0) {
      return res.status(400).json({ error: '没有提供要更新的字段' })
    }
    
    // Add WHERE clause parameters
    updateValues.push(req.user.id)
    
    // Update user
    await database.run(
      `UPDATE users SET ${updateFields.join(', ')} WHERE id = ?`,
      updateValues
    )
    
    // Get updated user
    const updatedUser = await database.get(
      'SELECT id, real_name, phone, alipay_account, role, status, created_at, last_login_at FROM users WHERE id = ?',
      [req.user.id]
    )
    
    res.json({
      message: '资料更新成功',
      user: {
        id: updatedUser.id,
        realName: updatedUser.real_name,
        phone: updatedUser.phone,
        alipayAccount: updatedUser.alipay_account,
        role: updatedUser.role,
        status: updatedUser.status,
        createdAt: updatedUser.created_at,
        lastLoginAt: updatedUser.last_login_at
      }
    })
    
  } catch (error) {
    console.error('Update profile error:', error)
    res.status(500).json({ error: '更新资料失败' })
  }
})

// Change password
router.put('/password', authenticate, [
  body('password')
    .not().isEmpty()
    .withMessage('当前密码不能为空'),
  body('new_password')
    .isLength({ min: 6, max: 32 })
    .withMessage('新密码长度必须在6-32位之间'),
  body('confirm_password')
    .custom((value, { req }) => {
      if (value !== req.body.new_password) {
        throw new Error('确认密码与新密码不匹配')
      }
      return true
    }),
  (req, res, next) => {
    const errors = require('express-validator').validationResult(req)
    if (!errors.isEmpty()) {
      const errorMessages = errors.array().map(error => ({
        field: error.path,
        message: error.msg,
        value: error.value
      }))
      return res.status(400).json({
        error: '数据验证失败',
        details: errorMessages
      })
    }
    next()
  }
], async (req, res) => {
  try {
    const { password, new_password } = req.body
    
    // Get user with password hash
    const user = await database.get(
      'SELECT id, password_hash FROM users WHERE id = ?',
      [req.user.id]
    )
    
    // Verify current password
    const isValidPassword = await bcrypt.compare(password, user.password_hash)
    
    if (!isValidPassword) {
      return res.status(401).json({ error: '当前密码错误' })
    }
    
    // Hash new password
    const newPasswordHash = await bcrypt.hash(new_password, 12)
    
    // Update password
    await database.run(
      'UPDATE users SET password_hash = ? WHERE id = ?',
      [newPasswordHash, req.user.id]
    )
    
    res.json({ message: '密码修改成功' })
    
  } catch (error) {
    console.error('Change password error:', error)
    res.status(500).json({ error: '修改密码失败' })
  }
})

// Verify token
router.get('/verify', authenticate, (req, res) => {
  res.json({
    message: '令牌验证成功',
    user: {
      id: req.user.id,
      realName: req.user.real_name,
      phone: req.user.phone,
      alipayAccount: req.user.alipay_account,
      role: req.user.role,
      status: req.user.status,
      createdAt: req.user.created_at,
      lastLoginAt: req.user.last_login_at
    }
  })
})

// Logout (client-side token removal, server doesn't maintain token state)
router.post('/logout', authenticate, (req, res) => {
  res.json({ message: '退出登录成功' })
})

module.exports = router
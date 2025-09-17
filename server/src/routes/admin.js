const express = require('express')
const database = require('../database')
const { authenticate, requireAdmin } = require('../middleware/auth')
const validationRules = require('../middleware/validation')

const router = express.Router()

// Admin dashboard stats
router.get('/stats', authenticate, requireAdmin, async (req, res) => {
  try {
    const [userStats, orderStats, productStats, courierStats] = await Promise.all([
      database.all(
        `SELECT status, COUNT(*) as count FROM users GROUP BY status`
      ),
      database.all(
        `SELECT status, COUNT(*) as count FROM orders GROUP BY status`
      ),
      database.get(
        `SELECT COUNT(*) as total, 
                COUNT(CASE WHEN status = 'active' THEN 1 END) as active 
         FROM products`
      ),
      database.get(
        `SELECT COUNT(*) as total,
                COUNT(CASE WHEN status = 'active' THEN 1 END) as active
         FROM couriers`
      )
    ])
    
    // Format user stats
    const users = { total: 0, active: 0, inactive: 0 }
    userStats.forEach(stat => {
      users.total += stat.count
      users[stat.status] = stat.count
    })
    
    // Format order stats  
    const orders = { total: 0, pending: 0, completed: 0, cancelled: 0 }
    orderStats.forEach(stat => {
      orders.total += stat.count
      orders[stat.status] = stat.count
    })
    
    res.json({
      users,
      orders,
      products: {
        total: productStats.total || 0,
        active: productStats.active || 0
      },
      couriers: {
        total: courierStats.total || 0,
        active: courierStats.active || 0
      },
      timestamp: new Date().toISOString()
    })
    
  } catch (error) {
    console.error('Get admin stats error:', error)
    res.status(500).json({ error: '获取统计信息失败' })
  }
})

// ============ USER MANAGEMENT ============

// Get all users
router.get('/users', authenticate, requireAdmin, validationRules.validatePagination, async (req, res) => {
  try {
    const { page = 1, limit = 10, sort = 'id', order = 'asc', q = '' } = req.query

    const offset = (page - 1) * limit
    let query = `SELECT id, real_name, phone, alipay_account, role, status, created_at, last_login_at FROM users`
    let countQuery = `SELECT COUNT(*) as total FROM users`
    const params = []

    if (q) {
      query += ` WHERE real_name LIKE ? OR phone LIKE ? OR alipay_account LIKE ?`
      countQuery += ` WHERE real_name LIKE ? OR phone LIKE ? OR alipay_account LIKE ?`
      const searchTerm = `%${q}%`
      params.push(searchTerm, searchTerm, searchTerm)
    }

    query += ` ORDER BY ${sort} ${order} LIMIT ? OFFSET ?`
    params.push(parseInt(limit), parseInt(offset))

    const [users, totalResult] = await Promise.all([
      database.all(query, params),
      database.get(countQuery, q ? [`%${q}%`, `%${q}%`, `%${q}%`] : [])
    ])

    const formattedUsers = users.map(user => ({
      id: user.id,
      realName: user.real_name,
      phone: user.phone,
      alipayAccount: user.alipay_account,
      role: user.role,
      status: user.status,
      createdAt: user.created_at,
      lastLoginAt: user.last_login_at
    }))

    res.json({
      users: formattedUsers,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: totalResult.total,
        totalPages: Math.ceil(totalResult.total / limit)
      }
    })

  } catch (error) {
    console.error('Get users error:', error)
    res.status(500).json({ error: '获取用户列表失败' })
  }
})

// Update user
router.put('/users/:id', authenticate, requireAdmin, validationRules.validateId, async (req, res) => {
  try {
    const { id } = req.params
    const { real_name, alipay_account, status, role } = req.body

    const updateFields = []
    const updateValues = []

    if (real_name) {
      updateFields.push('real_name = ?')
      updateValues.push(real_name)
    }

    if (alipay_account) {
      // Check if alipay account exists for other users
      const existingAlipay = await database.get(
        'SELECT id FROM users WHERE alipay_account = ? AND id != ?',
        [alipay_account, id]
      )

      if (existingAlipay) {
        return res.status(409).json({ error: '该支付宝账户已被其他用户使用' })
      }

      updateFields.push('alipay_account = ?')
      updateValues.push(alipay_account)
    }

    if (status && ['active', 'inactive'].includes(status)) {
      updateFields.push('status = ?')
      updateValues.push(status)
    }

    if (role && ['user', 'admin'].includes(role)) {
      updateFields.push('role = ?')
      updateValues.push(role)
    }

    if (updateFields.length === 0) {
      return res.status(400).json({ error: '没有有效的更新字段' })
    }

    updateValues.push(id)

    await database.run(
      `UPDATE users SET ${updateFields.join(', ')} WHERE id = ?`,
      updateValues
    )

    const updatedUser = await database.get(
      'SELECT id, real_name, phone, alipay_account, role, status, created_at, last_login_at FROM users WHERE id = ?',
      [id]
    )

    if (!updatedUser) {
      return res.status(404).json({ error: '用户不存在' })
    }

    res.json({
      message: '用户信息更新成功',
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
    console.error('Update user error:', error)
    res.status(500).json({ error: '更新用户信息失败' })
  }
})

// ============ PRODUCT MANAGEMENT ============

// Get all products
router.get('/products', authenticate, requireAdmin, validationRules.validatePagination, async (req, res) => {
  try {
    const { page = 1, limit = 10, sort = 'id', order = 'desc', q = '' } = req.query

    const offset = (page - 1) * limit
    let query = `SELECT * FROM products`
    let countQuery = `SELECT COUNT(*) as total FROM products`
    const params = []

    if (q) {
      query += ` WHERE name LIKE ? OR description LIKE ?`
      countQuery += ` WHERE name LIKE ? OR description LIKE ?`
      const searchTerm = `%${q}%`
      params.push(searchTerm, searchTerm)
    }

    query += ` ORDER BY ${sort} ${order} LIMIT ? OFFSET ?`
    params.push(parseInt(limit), parseInt(offset))

    const [products, totalResult] = await Promise.all([
      database.all(query, params),
      database.get(countQuery, q ? [`%${q}%`, `%${q}%`] : [])
    ])

    res.json({
      products,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: totalResult.total,
        totalPages: Math.ceil(totalResult.total / limit)
      }
    })

  } catch (error) {
    console.error('Get products error:', error)
    res.status(500).json({ error: '获取商品列表失败' })
  }
})

// Create product
router.post('/products', authenticate, requireAdmin, validationRules.createProduct, async (req, res) => {
  try {
    const { name, description, price, image_url } = req.body

    const result = await database.run(
      `INSERT INTO products (name, description, price, image_url, status) 
       VALUES (?, ?, ?, ?, 'active')`,
      [name, description || '', price, image_url || '']
    )

    const product = await database.get(
      'SELECT * FROM products WHERE id = ?',
      [result.id]
    )

    res.status(201).json({
      message: '商品创建成功',
      product
    })

  } catch (error) {
    console.error('Create product error:', error)
    res.status(500).json({ error: '创建商品失败' })
  }
})

// Update product
router.put('/products/:id', authenticate, requireAdmin, validationRules.validateId, validationRules.updateProduct, async (req, res) => {
  try {
    const { id } = req.params
    const { name, description, price, image_url, status } = req.body

    const updateFields = []
    const updateValues = []

    if (name) {
      updateFields.push('name = ?')
      updateValues.push(name)
    }

    if (description !== undefined) {
      updateFields.push('description = ?')
      updateValues.push(description)
    }

    if (price) {
      updateFields.push('price = ?')
      updateValues.push(price)
    }

    if (image_url !== undefined) {
      updateFields.push('image_url = ?')
      updateValues.push(image_url)
    }

    if (status) {
      updateFields.push('status = ?')
      updateValues.push(status)
    }

    if (updateFields.length === 0) {
      return res.status(400).json({ error: '没有有效的更新字段' })
    }

    updateValues.push(id)

    await database.run(
      `UPDATE products SET ${updateFields.join(', ')} WHERE id = ?`,
      updateValues
    )

    const updatedProduct = await database.get(
      'SELECT * FROM products WHERE id = ?',
      [id]
    )

    if (!updatedProduct) {
      return res.status(404).json({ error: '商品不存在' })
    }

    res.json({
      message: '商品更新成功',
      product: updatedProduct
    })

  } catch (error) {
    console.error('Update product error:', error)
    res.status(500).json({ error: '更新商品失败' })
  }
})

// Delete product
router.delete('/products/:id', authenticate, requireAdmin, validationRules.validateId, async (req, res) => {
  try {
    const { id } = req.params

    const product = await database.get('SELECT * FROM products WHERE id = ?', [id])
    if (!product) {
      return res.status(404).json({ error: '商品不存在' })
    }

    await database.run('DELETE FROM products WHERE id = ?', [id])

    res.json({ message: '商品删除成功' })

  } catch (error) {
    console.error('Delete product error:', error)
    res.status(500).json({ error: '删除商品失败' })
  }
})

// ============ COURIER MANAGEMENT ============

// Get all couriers
router.get('/couriers', authenticate, requireAdmin, validationRules.validatePagination, async (req, res) => {
  try {
    const { page = 1, limit = 10, sort = 'id', order = 'asc', q = '' } = req.query

    const offset = (page - 1) * limit
    let query = `SELECT * FROM couriers`
    let countQuery = `SELECT COUNT(*) as total FROM couriers`
    const params = []

    if (q) {
      query += ` WHERE name LIKE ?`
      countQuery += ` WHERE name LIKE ?`
      const searchTerm = `%${q}%`
      params.push(searchTerm)
    }

    query += ` ORDER BY ${sort} ${order} LIMIT ? OFFSET ?`
    params.push(parseInt(limit), parseInt(offset))

    const [couriers, totalResult] = await Promise.all([
      database.all(query, params),
      database.get(countQuery, q ? [`%${q}%`] : [])
    ])

    res.json({
      couriers,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: totalResult.total,
        totalPages: Math.ceil(totalResult.total / limit)
      }
    })

  } catch (error) {
    console.error('Get couriers error:', error)
    res.status(500).json({ error: '获取快递公司列表失败' })
  }
})

// Create courier
router.post('/couriers', authenticate, requireAdmin, validationRules.createCourier, async (req, res) => {
  try {
    const { name, tracking_length, tracking_pattern, code } = req.body

    const result = await database.run(
      `INSERT INTO couriers (name, tracking_length, tracking_pattern, code, status) 
       VALUES (?, ?, ?, ?, 'active')`,
      [name, tracking_length, tracking_pattern || '', code || '']
    )

    const courier = await database.get(
      'SELECT * FROM couriers WHERE id = ?',
      [result.id]
    )

    res.status(201).json({
      message: '快递公司创建成功',
      courier
    })

  } catch (error) {
    console.error('Create courier error:', error)
    res.status(500).json({ error: '创建快递公司失败' })
  }
})

// Update courier
router.put('/couriers/:id', authenticate, requireAdmin, validationRules.validateId, validationRules.updateCourier, async (req, res) => {
  try {
    const { id } = req.params
    const { name, tracking_length, tracking_pattern, code, status } = req.body

    const updateFields = []
    const updateValues = []

    if (name) {
      updateFields.push('name = ?')
      updateValues.push(name)
    }

    if (tracking_length) {
      updateFields.push('tracking_length = ?')
      updateValues.push(tracking_length)
    }

    if (tracking_pattern !== undefined) {
      updateFields.push('tracking_pattern = ?')
      updateValues.push(tracking_pattern)
    }

    if (code !== undefined) {
      updateFields.push('code = ?')
      updateValues.push(code)
    }

    if (status) {
      updateFields.push('status = ?')
      updateValues.push(status)
    }

    if (updateFields.length === 0) {
      return res.status(400).json({ error: '没有有效的更新字段' })
    }

    updateValues.push(id)

    await database.run(
      `UPDATE couriers SET ${updateFields.join(', ')} WHERE id = ?`,
      updateValues
    )

    const updatedCourier = await database.get(
      'SELECT * FROM couriers WHERE id = ?',
      [id]
    )

    if (!updatedCourier) {
      return res.status(404).json({ error: '快递公司不存在' })
    }

    res.json({
      message: '快递公司更新成功',
      courier: updatedCourier
    })

  } catch (error) {
    console.error('Update courier error:', error)
    res.status(500).json({ error: '更新快递公司失败' })
  }
})

// Delete courier
router.delete('/couriers/:id', authenticate, requireAdmin, validationRules.validateId, async (req, res) => {
  try {
    const { id } = req.params

    const courier = await database.get('SELECT * FROM couriers WHERE id = ?', [id])
    if (!courier) {
      return res.status(404).json({ error: '快递公司不存在' })
    }

    await database.run('DELETE FROM couriers WHERE id = ?', [id])

    res.json({ message: '快递公司删除成功' })

  } catch (error) {
    console.error('Delete courier error:', error)
    res.status(500).json({ error: '删除快递公司失败' })
  }
})

// ============ ORDER MANAGEMENT ============

// Get all orders (admin view)
router.get('/orders', authenticate, requireAdmin, validationRules.validatePagination, async (req, res) => {
  try {
    const { page = 1, limit = 10, sort = 'created_at', order = 'desc', status = '', q = '' } = req.query

    const offset = (page - 1) * limit
    let query = `
      SELECT o.*,
             u.real_name as user_name, u.phone as user_phone, u.alipay_account as user_alipay,
             p.name as product_name, p.price as product_price,
             c.name as courier_name
      FROM orders o
      LEFT JOIN users u ON o.user_id = u.id
      LEFT JOIN products p ON o.product_id = p.id
      LEFT JOIN couriers c ON o.courier_id = c.id
    `
    let countQuery = `SELECT COUNT(*) as total FROM orders o`
    const params = []
    const conditions = []

    if (status) {
      conditions.push('o.status = ?')
      params.push(status)
    }

    if (q) {
      conditions.push('(u.real_name LIKE ? OR u.phone LIKE ? OR o.tracking_number LIKE ? OR p.name LIKE ?)')
      const searchTerm = `%${q}%`
      params.push(searchTerm, searchTerm, searchTerm, searchTerm)
    }

    if (conditions.length > 0) {
      const whereClause = ` WHERE ${conditions.join(' AND ')}`
      query += whereClause
      countQuery += whereClause.replace('o.status', 'status').replace(/u\./g, '').replace(/p\./g, '').replace(/o\./g, '')
    }

    query += ` ORDER BY o.${sort} ${order} LIMIT ? OFFSET ?`
    params.push(parseInt(limit), parseInt(offset))

    const [orders, totalResult] = await Promise.all([
      database.all(query, params),
      database.get(countQuery, params.slice(0, -2))
    ])

    const formattedOrders = orders.map(order => ({
      id: order.id,
      userId: order.user_id,
      productId: order.product_id,
      courierId: order.courier_id,
      quantity: order.quantity,
      totalAmount: order.total_amount,
      trackingNumber: order.tracking_number,
      status: order.status,
      notes: order.notes,
      createdAt: order.created_at,
      updatedAt: order.updated_at,
      user: {
        realName: order.user_name,
        phone: order.user_phone,
        alipayAccount: order.user_alipay
      },
      product: {
        name: order.product_name,
        price: order.product_price
      },
      courier: {
        name: order.courier_name
      }
    }))

    res.json({
      orders: formattedOrders,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: totalResult.total,
        totalPages: Math.ceil(totalResult.total / limit)
      }
    })

  } catch (error) {
    console.error('Get admin orders error:', error)
    res.status(500).json({ error: '获取订单列表失败' })
  }
})

// Update order status (admin)
router.put('/orders/:id', authenticate, requireAdmin, validationRules.validateId, validationRules.updateOrder, async (req, res) => {
  try {
    const { id } = req.params
    const { status, quantity, tracking_number, notes } = req.body

    const updateFields = []
    const updateValues = []

    if (status && ['pending', 'processing', 'completed', 'cancelled'].includes(status)) {
      updateFields.push('status = ?')
      updateValues.push(status)
    }

    if (quantity) {
      updateFields.push('quantity = ?')
      updateValues.push(quantity)
    }

    if (tracking_number) {
      updateFields.push('tracking_number = ?')
      updateValues.push(tracking_number)
    }

    if (notes !== undefined) {
      updateFields.push('notes = ?')
      updateValues.push(notes)
    }

    if (updateFields.length === 0) {
      return res.status(400).json({ error: '没有有效的更新字段' })
    }

    updateValues.push(id)

    await database.run(
      `UPDATE orders SET ${updateFields.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
      updateValues
    )

    // Get updated order with related data
    const updatedOrder = await database.get(`
      SELECT o.*, 
             u.real_name as user_name, u.phone as user_phone,
             p.name as product_name, p.price as product_price,
             c.name as courier_name
      FROM orders o
      LEFT JOIN users u ON o.user_id = u.id
      LEFT JOIN products p ON o.product_id = p.id
      LEFT JOIN couriers c ON o.courier_id = c.id
      WHERE o.id = ?
    `, [id])

    if (!updatedOrder) {
      return res.status(404).json({ error: '订单不存在' })
    }

    const formattedOrder = {
      id: updatedOrder.id,
      userId: updatedOrder.user_id,
      productId: updatedOrder.product_id,
      courierId: updatedOrder.courier_id,
      quantity: updatedOrder.quantity,
      totalAmount: updatedOrder.total_amount,
      trackingNumber: updatedOrder.tracking_number,
      status: updatedOrder.status,
      notes: updatedOrder.notes,
      createdAt: updatedOrder.created_at,
      updatedAt: updatedOrder.updated_at,
      user: {
        realName: updatedOrder.user_name,
        phone: updatedOrder.user_phone
      },
      product: {
        name: updatedOrder.product_name,
        price: updatedOrder.product_price
      },
      courier: {
        name: updatedOrder.courier_name
      }
    }

    res.json({
      message: '订单更新成功',
      order: formattedOrder
    })

  } catch (error) {
    console.error('Update order error:', error)
    res.status(500).json({ error: '更新订单失败' })
  }
})

// Delete order (admin only)
router.delete('/orders/:id', authenticate, requireAdmin, validationRules.validateId, async (req, res) => {
  try {
    const { id } = req.params

    const order = await database.get('SELECT * FROM orders WHERE id = ?', [id])
    if (!order) {
      return res.status(404).json({ error: '订单不存在' })
    }

    await database.run('DELETE FROM orders WHERE id = ?', [id])

    res.json({ message: '订单删除成功' })

  } catch (error) {
    console.error('Delete order error:', error)
    res.status(500).json({ error: '删除订单失败' })
  }
})

module.exports = router
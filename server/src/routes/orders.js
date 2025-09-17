const express = require('express')
const database = require('../database')
const { authenticate, requireAdmin } = require('../middleware/auth')
const validationRules = require('../middleware/validation')

const router = express.Router()

// Get user's own orders (for regular users)
router.get('/my-orders', authenticate, validationRules.validatePagination, async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      sort = 'created_at',
      order = 'desc',
      status = '',
      q = '',
      startDate = '',
      endDate = ''
    } = req.query

    const offset = (page - 1) * limit

    // Build WHERE clause
    const conditions = ['o.user_id = ?']
    const params = [req.user.id]

    if (status) {
      conditions.push('o.status = ?')
      params.push(status)
    }

    if (q) {
      conditions.push('(p.name LIKE ? OR o.tracking_number LIKE ?)')
      const searchTerm = `%${q}%`
      params.push(searchTerm, searchTerm)
    }

    if (startDate && endDate) {
      conditions.push('DATE(o.created_at) BETWEEN ? AND ?')
      params.push(startDate, endDate)
    }

    const whereClause = 'WHERE ' + conditions.join(' AND ')

    // Get orders with related data
    const orders = await database.all(
      `SELECT o.id, o.user_id, o.product_id, o.courier_id,
              o.quantity, o.total_amount, o.tracking_number,
              o.status, o.notes, o.created_at, o.updated_at,
              p.name as product_name, p.price as product_price,
              p.description as product_description,
              c.name as courier_name
       FROM orders o
       LEFT JOIN products p ON o.product_id = p.id
       LEFT JOIN couriers c ON o.courier_id = c.id
       ${whereClause}
       ORDER BY o.${sort} ${order.toUpperCase()}
       LIMIT ? OFFSET ?`,
      [...params, parseInt(limit), parseInt(offset)]
    )

    // Get total count for pagination
    const totalCount = await database.get(
      `SELECT COUNT(*) as count FROM orders o
       LEFT JOIN products p ON o.product_id = p.id
       ${whereClause}`,
      params
    )

    res.json({
      orders: orders.map(order => ({
        id: order.id,
        userId: order.user_id,
        productId: order.product_id,
        courierId: order.courier_id,
        productName: order.product_name,
        productPrice: parseFloat(order.product_price),
        productDescription: order.product_description,
        courierName: order.courier_name,
        quantity: order.quantity,
        totalAmount: parseFloat(order.total_amount),
        trackingNumber: order.tracking_number,
        status: order.status,
        notes: order.notes,
        createdAt: order.created_at,
        updatedAt: order.updated_at
      })),
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: totalCount.count,
        totalPages: Math.ceil(totalCount.count / limit)
      }
    })

  } catch (error) {
    console.error('Get user orders error:', error)
    res.status(500).json({ error: '获取订单列表失败' })
  }
})

// Create a new order
router.post('/', authenticate, validationRules.createOrder, async (req, res) => {
  try {
    const { product_id, quantity, courier_id, tracking_number, notes } = req.body
    const userId = req.user.id

    // Get product details to calculate price
    const product = await database.get(
      'SELECT * FROM products WHERE id = ? AND status = ?',
      [product_id, 'active']
    )

    if (!product) {
      return res.status(404).json({ error: '商品不存在或已下架' })
    }

    // Get courier to validate
    const courier = await database.get(
      'SELECT * FROM couriers WHERE id = ? AND status = ?',
      [courier_id, 'active']
    )

    if (!courier) {
      return res.status(404).json({ error: '快递公司不存在或已停用' })
    }

    // Validate tracking number length if specified
    if (courier.tracking_length && tracking_number.length !== courier.tracking_length) {
      return res.status(400).json({
        error: `${courier.name}的快递单号长度必须为${courier.tracking_length}位`
      })
    }

    // Check if tracking number already exists
    const existingOrder = await database.get(
      'SELECT id, user_id FROM orders WHERE tracking_number = ?',
      [tracking_number]
    )

    if (existingOrder) {
      // Check if it's the same user
      if (existingOrder.user_id === userId) {
        return res.status(409).json({
          error: '您已经使用过这个快递单号，请勿重复提交'
        })
      } else {
        return res.status(409).json({
          error: '该快递单号已被使用，请检查输入是否正确'
        })
      }
    }

    // Calculate total amount
    const totalAmount = product.price * quantity

    // Create order
    const result = await database.run(
      `INSERT INTO orders (user_id, product_id, courier_id, quantity, price,
                          total_amount, tracking_number, status, notes, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'pending', ?, CURRENT_TIMESTAMP)`,
      [userId, product_id, courier_id, quantity, product.price, totalAmount, tracking_number, notes || '']
    )

    // Get the created order with details
    const order = await database.get(
      `SELECT o.*,
              p.name as product_name, p.price as product_price,
              c.name as courier_name
       FROM orders o
       LEFT JOIN products p ON o.product_id = p.id
       LEFT JOIN couriers c ON o.courier_id = c.id
       WHERE o.id = ?`,
      [result.id]
    )

    res.status(201).json({
      message: '订单创建成功',
      order: {
        id: order.id,
        userId: order.user_id,
        productId: order.product_id,
        courierId: order.courier_id,
        productName: order.product_name,
        productPrice: parseFloat(order.product_price),
        courierName: order.courier_name,
        quantity: order.quantity,
        totalAmount: parseFloat(order.total_amount),
        trackingNumber: order.tracking_number,
        status: order.status,
        notes: order.notes,
        createdAt: order.created_at,
        updatedAt: order.updated_at
      }
    })

  } catch (error) {
    console.error('Create order error:', error)
    res.status(500).json({ error: '创建订单失败' })
  }
})

// Get single order details
router.get('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params

    const order = await database.get(
      `SELECT o.*,
              p.name as product_name, p.price as product_price,
              p.description as product_description,
              c.name as courier_name,
              u.real_name as user_name, u.phone as user_phone
       FROM orders o
       LEFT JOIN products p ON o.product_id = p.id
       LEFT JOIN couriers c ON o.courier_id = c.id
       LEFT JOIN users u ON o.user_id = u.id
       WHERE o.id = ?`,
      [id]
    )

    if (!order) {
      return res.status(404).json({ error: '订单不存在' })
    }

    // Check if user has permission to view this order
    if (req.user.role !== 'admin' && order.user_id !== req.user.id) {
      return res.status(403).json({ error: '无权查看此订单' })
    }

    res.json({
      order: {
        id: order.id,
        userId: order.user_id,
        userName: order.user_name,
        userPhone: order.user_phone,
        productId: order.product_id,
        productName: order.product_name,
        productPrice: parseFloat(order.product_price),
        productDescription: order.product_description,
        courierId: order.courier_id,
        courierName: order.courier_name,
        quantity: order.quantity,
        totalAmount: parseFloat(order.total_amount),
        trackingNumber: order.tracking_number,
        status: order.status,
        notes: order.notes,
        createdAt: order.created_at,
        updatedAt: order.updated_at
      }
    })

  } catch (error) {
    console.error('Get order detail error:', error)
    res.status(500).json({ error: '获取订单详情失败' })
  }
})

// Cancel order (user can only cancel their own pending orders)
router.put('/:id/cancel', authenticate, async (req, res) => {
  try {
    const { id } = req.params

    // Get order details
    const order = await database.get(
      'SELECT * FROM orders WHERE id = ?',
      [id]
    )

    if (!order) {
      return res.status(404).json({ error: '订单不存在' })
    }

    // Check if user has permission to cancel this order
    if (req.user.role !== 'admin' && order.user_id !== req.user.id) {
      return res.status(403).json({ error: '无权取消此订单' })
    }

    // Check if order can be cancelled
    if (order.status !== 'pending') {
      return res.status(400).json({ error: '只能取消待处理的订单' })
    }

    // Cancel the order
    await database.run(
      `UPDATE orders
       SET status = 'cancelled',
           updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [id]
    )

    // Get updated order
    const updatedOrder = await database.get(
      `SELECT o.*,
              p.name as product_name, p.price as product_price,
              c.name as courier_name
       FROM orders o
       LEFT JOIN products p ON o.product_id = p.id
       LEFT JOIN couriers c ON o.courier_id = c.id
       WHERE o.id = ?`,
      [id]
    )

    res.json({
      message: '订单已取消',
      order: {
        id: updatedOrder.id,
        userId: updatedOrder.user_id,
        productName: updatedOrder.product_name,
        courierName: updatedOrder.courier_name,
        quantity: updatedOrder.quantity,
        totalAmount: parseFloat(updatedOrder.total_amount),
        trackingNumber: updatedOrder.tracking_number,
        status: updatedOrder.status,
        notes: updatedOrder.notes,
        createdAt: updatedOrder.created_at,
        updatedAt: updatedOrder.updated_at
      }
    })

  } catch (error) {
    console.error('Cancel order error:', error)
    res.status(500).json({ error: '取消订单失败' })
  }
})

// Update order (admin only)
router.put('/:id', authenticate, requireAdmin, validationRules.updateOrder, async (req, res) => {
  try {
    const { id } = req.params
    const { status, tracking_number, notes } = req.body

    const order = await database.get('SELECT * FROM orders WHERE id = ?', [id])

    if (!order) {
      return res.status(404).json({ error: '订单不存在' })
    }

    const updateFields = []
    const updateValues = []

    if (status) {
      updateFields.push('status = ?')
      updateValues.push(status)
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
      return res.status(400).json({ error: '没有要更新的字段' })
    }

    updateValues.push(id)

    await database.run(
      `UPDATE orders
       SET ${updateFields.join(', ')}, updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      updateValues
    )

    const updatedOrder = await database.get(
      `SELECT o.*,
              p.name as product_name, p.price as product_price,
              c.name as courier_name
       FROM orders o
       LEFT JOIN products p ON o.product_id = p.id
       LEFT JOIN couriers c ON o.courier_id = c.id
       WHERE o.id = ?`,
      [id]
    )

    res.json({
      message: '订单更新成功',
      order: {
        id: updatedOrder.id,
        userId: updatedOrder.user_id,
        productName: updatedOrder.product_name,
        courierName: updatedOrder.courier_name,
        quantity: updatedOrder.quantity,
        totalAmount: parseFloat(updatedOrder.total_amount),
        trackingNumber: updatedOrder.tracking_number,
        status: updatedOrder.status,
        notes: updatedOrder.notes,
        createdAt: updatedOrder.created_at,
        updatedAt: updatedOrder.updated_at
      }
    })

  } catch (error) {
    console.error('Update order error:', error)
    res.status(500).json({ error: '更新订单失败' })
  }
})

// Delete order (admin only)
router.delete('/:id', authenticate, requireAdmin, async (req, res) => {
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
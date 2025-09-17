const express = require('express')
const database = require('../database')
const { authenticate, requireAdmin } = require('../middleware/auth')
const validationRules = require('../middleware/validation')

const router = express.Router()

// Get all products (public for active products, admin for all)
router.get('/', validationRules.validatePagination, async (req, res) => {
  try {
    const { page = 1, limit = 50, sort = 'id', order = 'asc' } = req.query
    const offset = (page - 1) * limit

    // Check if user is authenticated by looking for authorization header
    const authHeader = req.headers.authorization
    const isAuthenticated = authHeader && authHeader.startsWith('Bearer ')

    let whereClause = ''
    let params = []

    // Non-admin users can only see active products
    // If not authenticated or not admin, only show active products
    if (!isAuthenticated) {
      whereClause = 'WHERE status = "active"'
    }
    
    const products = await database.all(
      `SELECT id, name, description, price, status, created_at, updated_at
       FROM products ${whereClause}
       ORDER BY ${sort} ${order.toUpperCase()}
       LIMIT ? OFFSET ?`,
      [...params, parseInt(limit), parseInt(offset)]
    )
    
    const totalCount = await database.get(
      `SELECT COUNT(*) as count FROM products ${whereClause}`,
      params
    )
    
    res.json({
      products: products.map(product => ({
        id: product.id,
        name: product.name,
        description: product.description,
        price: parseFloat(product.price),
        status: product.status,
        createdAt: product.created_at,
        updatedAt: product.updated_at
      })),
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: totalCount.count,
        pages: Math.ceil(totalCount.count / limit)
      }
    })
    
  } catch (error) {
    console.error('Get products error:', error)
    res.status(500).json({ error: '获取商品列表失败' })
  }
})

// Get active products only
router.get('/active', async (req, res) => {
  try {
    const products = await database.all(
      'SELECT id, name, description, price FROM products WHERE status = "active" ORDER BY name'
    )

    res.json({
      products: products.map(product => ({
        id: product.id,
        name: product.name,
        description: product.description,
        price: parseFloat(product.price)
      }))
    })
    
  } catch (error) {
    console.error('Get active products error:', error)
    res.status(500).json({ error: '获取商品列表失败' })
  }
})

// Get product by ID
router.get('/:id', validationRules.validateId, async (req, res) => {
  try {
    const { id } = req.params
    
    const product = await database.get(
      'SELECT id, name, price, status, created_at, updated_at FROM products WHERE id = ?',
      [id]
    )
    
    if (!product) {
      return res.status(404).json({ error: '商品不存在' })
    }
    
    // Non-admin users can only see active products
    if ((!req.user || req.user.role !== 'admin') && product.status !== 'active') {
      return res.status(404).json({ error: '商品不存在' })
    }
    
    res.json({
      product: {
        id: product.id,
        name: product.name,
        price: parseFloat(product.price),
        status: product.status,
        createdAt: product.created_at,
        updatedAt: product.updated_at
      }
    })
    
  } catch (error) {
    console.error('Get product error:', error)
    res.status(500).json({ error: '获取商品信息失败' })
  }
})

// Create product (Admin only)
router.post('/', authenticate, requireAdmin, validationRules.createProduct, async (req, res) => {
  try {
    const { name, price } = req.body
    
    // Check if product name already exists
    const existingProduct = await database.get(
      'SELECT id FROM products WHERE name = ?',
      [name]
    )
    
    if (existingProduct) {
      return res.status(409).json({ error: '商品名称已存在' })
    }
    
    const result = await database.run(
      'INSERT INTO products (name, price, status) VALUES (?, ?, "active")',
      [name, price]
    )
    
    const product = await database.get(
      'SELECT id, name, price, status, created_at, updated_at FROM products WHERE id = ?',
      [result.id]
    )
    
    res.status(201).json({
      message: '商品创建成功',
      product: {
        id: product.id,
        name: product.name,
        price: parseFloat(product.price),
        status: product.status,
        createdAt: product.created_at,
        updatedAt: product.updated_at
      }
    })
    
  } catch (error) {
    console.error('Create product error:', error)
    res.status(500).json({ error: '创建商品失败' })
  }
})

// Update product (Admin only)
router.put('/:id', authenticate, requireAdmin, validationRules.validateId, validationRules.updateProduct, async (req, res) => {
  try {
    const { id } = req.params
    const { name, price, status } = req.body
    
    const product = await database.get(
      'SELECT id FROM products WHERE id = ?',
      [id]
    )
    
    if (!product) {
      return res.status(404).json({ error: '商品不存在' })
    }
    
    // Check if name conflicts with other products
    if (name) {
      const existingProduct = await database.get(
        'SELECT id FROM products WHERE name = ? AND id != ?',
        [name, id]
      )
      
      if (existingProduct) {
        return res.status(409).json({ error: '商品名称已存在' })
      }
    }
    
    const updateFields = []
    const updateValues = []
    
    if (name) {
      updateFields.push('name = ?')
      updateValues.push(name)
    }
    
    if (price !== undefined) {
      updateFields.push('price = ?')
      updateValues.push(price)
    }
    
    if (status) {
      updateFields.push('status = ?')
      updateValues.push(status)
    }
    
    if (updateFields.length === 0) {
      return res.status(400).json({ error: '没有提供要更新的字段' })
    }
    
    updateValues.push(id)
    
    await database.run(
      `UPDATE products SET ${updateFields.join(', ')} WHERE id = ?`,
      updateValues
    )
    
    const updatedProduct = await database.get(
      'SELECT id, name, price, status, created_at, updated_at FROM products WHERE id = ?',
      [id]
    )
    
    res.json({
      message: '商品更新成功',
      product: {
        id: updatedProduct.id,
        name: updatedProduct.name,
        price: parseFloat(updatedProduct.price),
        status: updatedProduct.status,
        createdAt: updatedProduct.created_at,
        updatedAt: updatedProduct.updated_at
      }
    })
    
  } catch (error) {
    console.error('Update product error:', error)
    res.status(500).json({ error: '更新商品失败' })
  }
})

// Toggle product status (Admin only)
router.patch('/:id/toggle-status', authenticate, requireAdmin, validationRules.validateId, async (req, res) => {
  try {
    const { id } = req.params
    
    const product = await database.get(
      'SELECT id, status FROM products WHERE id = ?',
      [id]
    )
    
    if (!product) {
      return res.status(404).json({ error: '商品不存在' })
    }
    
    const newStatus = product.status === 'active' ? 'inactive' : 'active'
    
    await database.run(
      'UPDATE products SET status = ? WHERE id = ?',
      [newStatus, id]
    )
    
    const updatedProduct = await database.get(
      'SELECT id, name, price, status, created_at, updated_at FROM products WHERE id = ?',
      [id]
    )
    
    res.json({
      message: `商品已${newStatus === 'active' ? '启用' : '禁用'}`,
      product: {
        id: updatedProduct.id,
        name: updatedProduct.name,
        price: parseFloat(updatedProduct.price),
        status: updatedProduct.status,
        createdAt: updatedProduct.created_at,
        updatedAt: updatedProduct.updated_at
      }
    })
    
  } catch (error) {
    console.error('Toggle product status error:', error)
    res.status(500).json({ error: '切换商品状态失败' })
  }
})

// Delete product (Admin only)
router.delete('/:id', authenticate, requireAdmin, validationRules.validateId, async (req, res) => {
  try {
    const { id } = req.params
    
    const product = await database.get(
      'SELECT id FROM products WHERE id = ?',
      [id]
    )
    
    if (!product) {
      return res.status(404).json({ error: '商品不存在' })
    }
    
    // Check if product is used in any orders
    const orderCount = await database.get(
      'SELECT COUNT(*) as count FROM orders WHERE product_id = ?',
      [id]
    )
    
    if (orderCount.count > 0) {
      return res.status(409).json({ error: '该商品已被使用，无法删除' })
    }
    
    await database.run('DELETE FROM products WHERE id = ?', [id])
    
    res.json({ message: '商品删除成功' })
    
  } catch (error) {
    console.error('Delete product error:', error)
    res.status(500).json({ error: '删除商品失败' })
  }
})

module.exports = router
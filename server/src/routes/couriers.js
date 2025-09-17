const express = require('express')
const database = require('../database')
const { authenticate, requireAdmin } = require('../middleware/auth')
const validationRules = require('../middleware/validation')

const router = express.Router()

// Get all couriers
router.get('/', async (req, res) => {
  try {
    // Check if user is authenticated by looking for authorization header
    const authHeader = req.headers.authorization
    const isAuthenticated = authHeader && authHeader.startsWith('Bearer ')

    let whereClause = ''
    // Non-admin users can only see active couriers
    if (!isAuthenticated) {
      whereClause = 'WHERE status = "active"'
    }
    
    const couriers = await database.all(
      `SELECT id, name, code, tracking_length, tracking_pattern, status, created_at, updated_at
       FROM couriers ${whereClause} ORDER BY name`
    )

    res.json({
      couriers: couriers.map(courier => ({
        id: courier.id,
        name: courier.name,
        code: courier.code,
        tracking_length: courier.tracking_length,
        tracking_pattern: courier.tracking_pattern,
        status: courier.status,
        createdAt: courier.created_at,
        updatedAt: courier.updated_at
      }))
    })
    
  } catch (error) {
    console.error('Get couriers error:', error)
    res.status(500).json({ error: '获取快递公司列表失败' })
  }
})

// Get active couriers only
router.get('/active', async (req, res) => {
  try {
    const couriers = await database.all(
      'SELECT id, name, code, tracking_length FROM couriers WHERE status = "active" ORDER BY name'
    )

    res.json({
      couriers: couriers.map(courier => ({
        id: courier.id,
        name: courier.name,
        code: courier.code,
        tracking_length: courier.tracking_length
      }))
    })
    
  } catch (error) {
    console.error('Get active couriers error:', error)
    res.status(500).json({ error: '获取快递公司列表失败' })
  }
})

module.exports = router
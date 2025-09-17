const bcrypt = require('bcryptjs')
const database = require('./database')

// Seed data for initial setup
const seedData = {
  users: [
    {
      real_name: '系统管理员',
      phone: '13800138000',
      alipay_account: 'admin@alipay.com',
      password: 'admin123',
      role: 'admin',
      status: 'active'
    },
    {
      real_name: '测试用户',
      phone: '13900139000',
      alipay_account: 'test@alipay.com',
      password: 'user123',
      role: 'user',
      status: 'active'
    },
    {
      real_name: '张三',
      phone: '13700137000',
      alipay_account: 'zhangsan@alipay.com',
      password: 'user123',
      role: 'user',
      status: 'active'
    },
    {
      real_name: '李四',
      phone: '13600136000',
      alipay_account: 'lisi@alipay.com',
      password: 'user123',
      role: 'user',
      status: 'inactive'
    }
  ],
  
  products: [
    { name: '服装类商品', price: 15.00, status: 'active' },
    { name: '电子产品', price: 25.00, status: 'active' },
    { name: '家居用品', price: 12.00, status: 'active' },
    { name: '食品饮料', price: 8.00, status: 'active' },
    { name: '美妆个护', price: 18.00, status: 'active' }
  ],
  
  couriers: [
    { name: '顺丰速递', tracking_length: 12, tracking_pattern: '^SF\\d{10}$', status: 'active' },
    { name: '圆通速递', tracking_length: 10, tracking_pattern: '^\\d{10}$', status: 'active' },
    { name: '申通快递', tracking_length: 12, tracking_pattern: '^\\d{12}$', status: 'active' },
    { name: '中通快递', tracking_length: 12, tracking_pattern: '^\\d{12}$', status: 'active' },
    { name: '韵达快递', tracking_length: 13, tracking_pattern: '^\\d{13}$', status: 'active' },
    { name: '百世汇通', tracking_length: 11, tracking_pattern: '^\\d{11}$', status: 'active' },
    { name: '京东物流', tracking_length: 15, tracking_pattern: '^JD\\d{13}$', status: 'active' },
    { name: '邮政EMS', tracking_length: 13, tracking_pattern: '^E[A-Z]\\d{9}[A-Z]{2}$', status: 'active' }
  ]
}

async function seedDatabase() {
  try {
    console.log('Starting database seeding...')
    
    // Connect to database
    await database.connect()
    
    // Check if data already exists
    const existingUsers = await database.all('SELECT COUNT(*) as count FROM users')
    if (existingUsers[0].count > 0) {
      console.log('Database already contains data. Skipping seed.')
      return
    }
    
    await database.beginTransaction()
    
    try {
      // Seed users
      console.log('Seeding users...')
      for (const user of seedData.users) {
        const passwordHash = await bcrypt.hash(user.password, 12)
        
        await database.run(`
          INSERT INTO users (real_name, phone, alipay_account, password_hash, role, status)
          VALUES (?, ?, ?, ?, ?, ?)
        `, [
          user.real_name,
          user.phone,
          user.alipay_account,
          passwordHash,
          user.role,
          user.status
        ])
      }
      console.log(`✅ Seeded ${seedData.users.length} users`)
      
      // Seed products
      console.log('Seeding products...')
      for (const product of seedData.products) {
        await database.run(`
          INSERT INTO products (name, price, status)
          VALUES (?, ?, ?)
        `, [product.name, product.price, product.status])
      }
      console.log(`✅ Seeded ${seedData.products.length} products`)
      
      // Seed couriers
      console.log('Seeding couriers...')
      for (const courier of seedData.couriers) {
        await database.run(`
          INSERT INTO couriers (name, tracking_length, tracking_pattern, status)
          VALUES (?, ?, ?, ?)
        `, [courier.name, courier.tracking_length, courier.tracking_pattern, courier.status])
      }
      console.log(`✅ Seeded ${seedData.couriers.length} couriers`)
      
      // Create sample orders
      console.log('Creating sample orders...')
      const sampleOrders = [
        {
          user_id: 2, // 测试用户
          product_id: 1, // 服装类商品
          courier_id: 1, // 顺丰速递
          quantity: 2,
          price: 15.00,
          total_amount: 30.00,
          tracking_number: 'SF1234567890',
          status: 'completed'
        },
        {
          user_id: 2, // 测试用户
          product_id: 2, // 电子产品
          courier_id: 2, // 圆通速递
          quantity: 1,
          price: 25.00,
          total_amount: 25.00,
          tracking_number: '9876543210',
          status: 'pending'
        },
        {
          user_id: 3, // 张三
          product_id: 3, // 家居用品
          courier_id: 3, // 申通快递
          quantity: 3,
          price: 12.00,
          total_amount: 36.00,
          tracking_number: '123456789012',
          status: 'completed'
        }
      ]
      
      for (const order of sampleOrders) {
        await database.run(`
          INSERT INTO orders (user_id, product_id, courier_id, quantity, price, total_amount, tracking_number, status, created_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now', '-' || abs(random() % 30) || ' days'))
        `, [
          order.user_id,
          order.product_id,
          order.courier_id,
          order.quantity,
          order.price,
          order.total_amount,
          order.tracking_number,
          order.status
        ])
      }
      console.log(`✅ Created ${sampleOrders.length} sample orders`)
      
      await database.commit()
      console.log('✅ Database seeding completed successfully')
      
    } catch (error) {
      await database.rollback()
      throw error
    }
    
  } catch (error) {
    console.error('❌ Database seeding failed:', error.message)
    process.exit(1)
  } finally {
    await database.close()
  }
}

// Run seeding if this file is executed directly
if (require.main === module) {
  seedDatabase()
}

module.exports = { seedDatabase, seedData }
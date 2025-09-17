const database = require('./database')

// Database schema migration
const migrations = [
  {
    version: 1,
    description: 'Create initial tables',
    sql: `
      -- Users table
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        real_name VARCHAR(50) NOT NULL,
        phone VARCHAR(11) UNIQUE NOT NULL,
        alipay_account VARCHAR(100) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        role VARCHAR(20) DEFAULT 'user' CHECK(role IN ('user', 'admin')),
        status VARCHAR(20) DEFAULT 'active' CHECK(status IN ('active', 'inactive')),
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        last_login_at DATETIME
      );

      -- Products table
      CREATE TABLE IF NOT EXISTS products (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name VARCHAR(100) NOT NULL,
        price DECIMAL(10,2) NOT NULL,
        status VARCHAR(20) DEFAULT 'active' CHECK(status IN ('active', 'inactive')),
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      -- Couriers table
      CREATE TABLE IF NOT EXISTS couriers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name VARCHAR(50) NOT NULL,
        tracking_length INTEGER NOT NULL,
        tracking_pattern VARCHAR(100),
        status VARCHAR(20) DEFAULT 'active' CHECK(status IN ('active', 'inactive')),
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      -- Orders table
      CREATE TABLE IF NOT EXISTS orders (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        product_id INTEGER NOT NULL,
        courier_id INTEGER NOT NULL,
        quantity INTEGER NOT NULL DEFAULT 1,
        price DECIMAL(10,2) NOT NULL,
        total_amount DECIMAL(10,2) NOT NULL,
        tracking_number VARCHAR(50) NOT NULL,
        status VARCHAR(20) DEFAULT 'pending' CHECK(status IN ('pending', 'completed', 'cancelled')),
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
        FOREIGN KEY (product_id) REFERENCES products (id) ON DELETE RESTRICT,
        FOREIGN KEY (courier_id) REFERENCES couriers (id) ON DELETE RESTRICT
      );

      -- Admin logs table
      CREATE TABLE IF NOT EXISTS admin_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        admin_id INTEGER NOT NULL,
        action VARCHAR(50) NOT NULL,
        target_type VARCHAR(50),
        target_id INTEGER,
        details TEXT,
        ip_address VARCHAR(45),
        user_agent TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (admin_id) REFERENCES users (id) ON DELETE CASCADE
      );

      -- Create indexes for better performance
      CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone);
      CREATE INDEX IF NOT EXISTS idx_users_alipay ON users(alipay_account);
      CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);
      CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
      CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
      CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at);
      CREATE INDEX IF NOT EXISTS idx_admin_logs_admin_id ON admin_logs(admin_id);
      CREATE INDEX IF NOT EXISTS idx_admin_logs_created_at ON admin_logs(created_at);

      -- Create triggers for updated_at timestamps
      CREATE TRIGGER IF NOT EXISTS trigger_users_updated_at
        AFTER UPDATE ON users
        FOR EACH ROW
        WHEN NEW.updated_at = OLD.updated_at
      BEGIN
        UPDATE users SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
      END;

      CREATE TRIGGER IF NOT EXISTS trigger_products_updated_at
        AFTER UPDATE ON products
        FOR EACH ROW
        WHEN NEW.updated_at = OLD.updated_at
      BEGIN
        UPDATE products SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
      END;

      CREATE TRIGGER IF NOT EXISTS trigger_couriers_updated_at
        AFTER UPDATE ON couriers
        FOR EACH ROW
        WHEN NEW.updated_at = OLD.updated_at
      BEGIN
        UPDATE couriers SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
      END;

      CREATE TRIGGER IF NOT EXISTS trigger_orders_updated_at
        AFTER UPDATE ON orders
        FOR EACH ROW
        WHEN NEW.updated_at = OLD.updated_at
      BEGIN
        UPDATE orders SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
      END;
    `
  },
  {
    version: 2,
    description: 'Add missing columns to tables',
    sql: `
      -- Add description column to products table if not exists
      ALTER TABLE products ADD COLUMN description TEXT;

      -- Add code column to couriers table if not exists
      ALTER TABLE couriers ADD COLUMN code VARCHAR(20);

      -- Add notes column to orders table if not exists
      ALTER TABLE orders ADD COLUMN notes TEXT;
    `
  },
  {
    version: 3,
    description: 'Add unique constraint to tracking_number',
    sql: `
      -- Create unique index on tracking_number to prevent duplicates
      CREATE UNIQUE INDEX IF NOT EXISTS idx_orders_tracking_number ON orders(tracking_number);
    `
  }
]

async function migrate() {
  try {
    console.log('Starting database migration...')
    
    // Connect to database
    await database.connect()
    
    // Get current database version
    const currentVersion = await database.getVersion()
    console.log(`Current database version: ${currentVersion}`)
    
    // Run migrations
    for (const migration of migrations) {
      if (migration.version > currentVersion) {
        console.log(`Running migration ${migration.version}: ${migration.description}`)
        
        await database.beginTransaction()
        
        try {
          await database.exec(migration.sql)
          await database.setVersion(migration.version)
          await database.commit()
          
          console.log(`✅ Migration ${migration.version} completed successfully`)
        } catch (error) {
          await database.rollback()
          throw error
        }
      }
    }
    
    const finalVersion = await database.getVersion()
    console.log(`✅ Database migration completed. Final version: ${finalVersion}`)
    
  } catch (error) {
    console.error('❌ Database migration failed:', error.message)
    process.exit(1)
  } finally {
    await database.close()
  }
}

// Run migration if this file is executed directly
if (require.main === module) {
  migrate()
}

module.exports = { migrate, migrations }
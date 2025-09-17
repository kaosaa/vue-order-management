const sqlite3 = require('sqlite3').verbose()
const path = require('path')
const fs = require('fs')

// Database file path
const DB_PATH = path.join(__dirname, '..', 'database.sqlite')

// Ensure database directory exists
const dbDir = path.dirname(DB_PATH)
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true })
}

class Database {
  constructor() {
    this.db = null
  }

  // Connect to database
  connect() {
    return new Promise((resolve, reject) => {
      this.db = new sqlite3.Database(DB_PATH, (err) => {
        if (err) {
          console.error('Error connecting to SQLite database:', err.message)
          reject(err)
        } else {
          console.log('Connected to SQLite database')
          // Enable foreign keys
          this.db.run('PRAGMA foreign_keys = ON')
          resolve()
        }
      })
    })
  }

  // Close database connection
  close() {
    return new Promise((resolve, reject) => {
      if (this.db) {
        this.db.close((err) => {
          if (err) {
            console.error('Error closing database:', err.message)
            reject(err)
          } else {
            console.log('Database connection closed')
            resolve()
          }
        })
      } else {
        resolve()
      }
    })
  }

  // Execute a query with parameters
  run(sql, params = []) {
    return new Promise((resolve, reject) => {
      this.db.run(sql, params, function(err) {
        if (err) {
          console.error('Database run error:', err.message)
          reject(err)
        } else {
          resolve({ 
            id: this.lastID, 
            changes: this.changes 
          })
        }
      })
    })
  }

  // Get single row
  get(sql, params = []) {
    return new Promise((resolve, reject) => {
      this.db.get(sql, params, (err, row) => {
        if (err) {
          console.error('Database get error:', err.message)
          reject(err)
        } else {
          resolve(row)
        }
      })
    })
  }

  // Get all rows
  all(sql, params = []) {
    return new Promise((resolve, reject) => {
      this.db.all(sql, params, (err, rows) => {
        if (err) {
          console.error('Database all error:', err.message)
          reject(err)
        } else {
          resolve(rows)
        }
      })
    })
  }

  // Execute multiple statements (for migrations)
  exec(sql) {
    return new Promise((resolve, reject) => {
      this.db.exec(sql, (err) => {
        if (err) {
          console.error('Database exec error:', err.message)
          reject(err)
        } else {
          resolve()
        }
      })
    })
  }

  // Begin transaction
  beginTransaction() {
    return this.run('BEGIN TRANSACTION')
  }

  // Commit transaction
  commit() {
    return this.run('COMMIT')
  }

  // Rollback transaction
  rollback() {
    return this.run('ROLLBACK')
  }

  // Check if table exists
  async tableExists(tableName) {
    const result = await this.get(
      "SELECT name FROM sqlite_master WHERE type='table' AND name=?",
      [tableName]
    )
    return !!result
  }

  // Get database version
  async getVersion() {
    try {
      const result = await this.get('PRAGMA user_version')
      return result.user_version || 0
    } catch (error) {
      return 0
    }
  }

  // Set database version
  setVersion(version) {
    return this.run(`PRAGMA user_version = ${version}`)
  }
}

// Create singleton instance
const database = new Database()

module.exports = database
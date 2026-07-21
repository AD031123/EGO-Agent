/**
 * MySQL Database Connection Pool
 * 提供 MySQL 数据库连接池和通用查询方法
 *
 * 数据库连接配置请编辑 config.js 文件。
 */
const mysql = require('mysql2/promise')
const dbConfig = require('./config.db')

let pool = null

/**
 * 获取数据库连接池（单例）
 */
function getPool() {
  if (pool) return pool

  const config = {
    host: dbConfig.host,
    port: dbConfig.port,
    user: dbConfig.user,
    password: dbConfig.password,
    database: dbConfig.database,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    charset: 'utf8mb4',
  }

  pool = mysql.createPool(config)
  return pool
}

/**
 * 执行查询（自动获取/释放连接）
 * @param {string} sql  - SQL 语句
 * @param {Array}  params - 参数数组
 * @returns {Promise<[rows, fields]>}
 */
async function query(sql, params = []) {
  const p = getPool()
  return p.execute(sql, params)
}

/**
 * 测试数据库连接
 */
async function testConnection() {
  try {
    const p = getPool()
    const [rows] = await p.execute('SELECT 1 AS ok')
    console.log('  ✓ MySQL connected:', dbConfig.database)
    return true
  } catch (e) {
    console.warn('  ✗ MySQL connection failed:', e.message)
    return false
  }
}

module.exports = {
  getPool,
  query,
  testConnection,
}

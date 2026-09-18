const mysql = require('mysql2/promise');
const fs = require('fs');
const config = require('./env');

let sslConfig = undefined;

if (config.TIDB_ENABLE_SSL) {
  sslConfig = {
    minVersion: 'TLSv1.2',
    rejectUnauthorized: true
  };

  if (config.TIDB_CA_PATH) {
    try {
      if (fs.existsSync(config.TIDB_CA_PATH)) {
        sslConfig.ca = fs.readFileSync(config.TIDB_CA_PATH);
      }
    } catch (err) {
      console.warn('Warning: Could not read custom CA certificate file:', err.message);
    }
  }
}

const pool = mysql.createPool({
  host: config.TIDB_HOST,
  port: config.TIDB_PORT,
  user: config.TIDB_USER,
  password: config.TIDB_PASSWORD,
  database: config.TIDB_DATABASE,
  waitForConnections: true,
  connectionLimit: config.DB_CONNECTION_LIMIT,
  queueLimit: 0,
  charset: 'utf8mb4',
  ssl: sslConfig
});

module.exports = pool;

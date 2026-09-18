const dotenv = require('dotenv');

dotenv.config();

const config = {
  PORT: process.env.PORT || 5000,
  NODE_ENV: process.env.NODE_ENV || 'development',
  FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:5500',

  // TiDB Cloud / MySQL Configuration
  TIDB_HOST: process.env.TIDB_HOST || '',
  TIDB_PORT: parseInt(process.env.TIDB_PORT, 10) || 4000,
  TIDB_USER: process.env.TIDB_USER || '',
  TIDB_PASSWORD: process.env.TIDB_PASSWORD || '',
  TIDB_DATABASE: process.env.TIDB_DATABASE || 'careerpilot',
  TIDB_ENABLE_SSL: process.env.TIDB_ENABLE_SSL !== 'false', // Default true unless explicitly 'false'
  TIDB_CA_PATH: process.env.TIDB_CA_PATH || '',
  DB_CONNECTION_LIMIT: parseInt(process.env.DB_CONNECTION_LIMIT, 10) || 10
};

module.exports = config;

const dotenv = require('dotenv');

dotenv.config();

const parseCorsOrigins = (raw) => {
  if (!raw) return [];
  return raw.split(',').map((origin) => origin.trim()).filter(Boolean);
};

const config = {
  PORT: parseInt(process.env.PORT, 10) || 5000,
  NODE_ENV: process.env.NODE_ENV || 'development',
  FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:5500',
  CORS_ALLOWED_ORIGINS: parseCorsOrigins(process.env.CORS_ALLOWED_ORIGINS),

  // TiDB Cloud / MySQL Configuration
  TIDB_HOST: process.env.TIDB_HOST || '',
  TIDB_PORT: parseInt(process.env.TIDB_PORT, 10) || 4000,
  TIDB_USER: process.env.TIDB_USER || '',
  TIDB_PASSWORD: process.env.TIDB_PASSWORD || '',
  TIDB_DATABASE: process.env.TIDB_DATABASE || 'careerpilot',
  TIDB_ENABLE_SSL: process.env.TIDB_ENABLE_SSL !== 'false',
  TIDB_CA_PATH: process.env.TIDB_CA_PATH || '',
  DB_CONNECTION_LIMIT: parseInt(process.env.DB_CONNECTION_LIMIT, 10) || 10,

  // Session & Auth Configuration
  SESSION_SECRET: process.env.SESSION_SECRET || 'careerpilot-default-secret-dev-only-change-in-prod',
  SESSION_COOKIE_NAME: process.env.SESSION_COOKIE_NAME || 'careerpilot.sid',
  SESSION_MAX_AGE_MS: parseInt(process.env.SESSION_MAX_AGE_MS, 10) || 86400000, // 24 hours
  SECURE_COOKIE: process.env.SECURE_COOKIE ? process.env.SECURE_COOKIE === 'true' : process.env.NODE_ENV === 'production',

  // AI Microservice Configuration
  AI_SERVICE_URL: process.env.AI_SERVICE_URL || 'http://localhost:8001',
  AI_SERVICE_SECRET: process.env.AI_SERVICE_SECRET || 'placeholder_secret_key_change_in_production',
  AI_SERVICE_TIMEOUT_MS: parseInt(process.env.AI_SERVICE_TIMEOUT_MS, 10) || 5000
};

// Strict validation when running in production
if (config.NODE_ENV === 'production') {
  const DEFAULT_DEV_SECRET = 'careerpilot-default-secret-dev-only-change-in-prod';
  const DEFAULT_AI_SECRET = 'placeholder_secret_key_change_in_production';

  if (!process.env.SESSION_SECRET || config.SESSION_SECRET === DEFAULT_DEV_SECRET) {
    throw new Error('[FATAL CONFIG ERROR] Insecure SESSION_SECRET used in production environment.');
  }

  if (!process.env.AI_SERVICE_SECRET || config.AI_SERVICE_SECRET === DEFAULT_AI_SECRET) {
    throw new Error('[FATAL CONFIG ERROR] Insecure AI_SERVICE_SECRET used in production environment.');
  }
}

module.exports = config;


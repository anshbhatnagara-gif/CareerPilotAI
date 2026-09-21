const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const session = require('express-session');
const config = require('./config/env');
const pool = require('./config/db');
const routes = require('./routes');

const app = express();

// Trust reverse proxy if running behind Nginx or Cloud load balancer
app.set('trust proxy', 1);

// Security middleware
app.use(helmet());

// Allowed origins for CORS with credentials support
const allowedOrigins = [
  config.FRONTEND_URL,
  ...(config.CORS_ALLOWED_ORIGINS || []),
  'http://localhost:5500',
  'http://127.0.0.1:5500',
  'http://localhost:5501',
  'http://127.0.0.1:5501'
].filter(Boolean);

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps, curl, server-to-server)
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    // In development mode, allow any http://localhost:* or http://127.0.0.1:* origin
    if (config.NODE_ENV === 'development' && /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) {
      return callback(null, true);
    }

    return callback(new Error('CORS policy violation: origin not allowed'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Configure session store based on environment (MySQLStore when DB host is provided, MemoryStore fallback for local dev/testing)
let sessionStore;
if (config.TIDB_HOST && config.TIDB_HOST.trim() !== '') {
  const MySQLStore = require('express-mysql-session')(session);
  sessionStore = new MySQLStore(
    {
      createDatabaseTable: true,
      schema: {
        tableName: 'sessions',
        columnNames: {
          session_id: 'session_id',
          expires: 'expires',
          data: 'data'
        }
      }
    },
    pool
  );
}

// Session middleware configuration
app.use(session({
  key: config.SESSION_COOKIE_NAME,
  secret: config.SESSION_SECRET,
  store: sessionStore, // undefined defaults to MemoryStore
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: config.SECURE_COOKIE,
    sameSite: 'lax',
    maxAge: config.SESSION_MAX_AGE_MS
  }
}));

// Global rate limiting: max 100 requests per 15-minute window
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many requests, please try again later.'
  }
});
app.use(limiter);

// JSON body parser with 1MB limit
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// Mount API routes
app.use('/api', routes);

// 404 Handler for unknown routes
app.use((req, res, next) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

// Centralized error handling middleware
app.use((err, req, res, next) => {
  if (config.NODE_ENV === 'development') {
    console.error('Unhandled Server Error:', err);
  }

  // Handle JSON parsing errors specifically
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({
      success: false,
      message: 'Invalid JSON payload'
    });
  }

  res.status(err.status || 500).json({
    success: false,
    message: 'Internal server error'
  });
});

module.exports = app;

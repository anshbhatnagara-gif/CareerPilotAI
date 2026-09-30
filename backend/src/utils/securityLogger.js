/**
 * CAREERPILOT AI — SECURITY MONITORING & DETECTION LOGGER
 * 
 * Production-safe structured security event logger.
 * Enforces sanitization against log injection and redacts PII/email parameters.
 * Explicitly excludes passwords, hashes, session cookies, API keys, and secret tokens.
 */

const CATEGORIES = {
  AUTH_LOGIN_FAILED: 'AUTH_LOGIN_FAILED',
  AUTH_LOGIN_SUCCESS: 'AUTH_LOGIN_SUCCESS',
  AUTH_REGISTER: 'AUTH_REGISTER',
  AUTH_LOGOUT: 'AUTH_LOGOUT',
  AUTH_UNAUTHORIZED: 'AUTH_UNAUTHORIZED',
  AUTH_RATE_LIMITED: 'AUTH_RATE_LIMITED',
  AI_RATE_LIMITED: 'AI_RATE_LIMITED',
  AI_SERVICE_AUTH_FAILURE: 'AI_SERVICE_AUTH_FAILURE',
  HEALTH_API_FAILURE: 'HEALTH_API_FAILURE',
  HEALTH_DATABASE_FAILURE: 'HEALTH_DATABASE_FAILURE',
  HEALTH_AI_FAILURE: 'HEALTH_AI_FAILURE',
  INVALID_REQUEST: 'INVALID_REQUEST',
  SERVER_ERROR: 'SERVER_ERROR'
};

const LEVELS = {
  INFO: 'INFO',
  WARN: 'WARN',
  ERROR: 'ERROR'
};

/**
 * Sanitizes user-controlled string inputs against Log Injection (CRLF injection)
 */
function sanitize(val) {
  if (val === undefined || val === null) return '';
  const str = String(val);
  return str.replace(/[\r\n\0]/g, '').trim().substring(0, 200);
}

/**
 * Redacts email addresses for privacy (e.g. "user@example.com" -> "u***r@example.com")
 */
function redactEmail(email) {
  if (!email || typeof email !== 'string') return '';
  const clean = sanitize(email);
  const parts = clean.split('@');
  if (parts.length !== 2) return '[invalid_email]';
  const name = parts[0];
  const domain = parts[1];

  if (name.length <= 2) {
    return `${name[0]}***@${domain}`;
  }
  return `${name[0]}***${name[name.length - 1]}@${domain}`;
}

/**
 * Emits a structured security event to server logs
 */
function logEvent(category, level, req, meta = {}) {
  const timestamp = new Date().toISOString();
  const environment = process.env.NODE_ENV || 'development';
  const method = req ? sanitize(req.method) : 'N/A';
  const path = req ? sanitize(req.originalUrl || req.url) : 'N/A';
  const ip = req ? sanitize(req.ip || req.socket?.remoteAddress || 'unknown') : 'unknown';
  const userId = (req && req.user && req.user.id) || (req && req.session && req.session.userId) || meta.userId || 'anonymous';

  const safeMeta = {};
  if (meta.email) safeMeta.email = redactEmail(meta.email);
  if (meta.reason) safeMeta.reason = sanitize(meta.reason);
  if (meta.statusCode) safeMeta.statusCode = meta.statusCode;
  if (meta.error) safeMeta.error = sanitize(meta.error);

  const eventPayload = {
    category,
    level,
    timestamp,
    environment,
    method,
    path,
    ip,
    userId,
    meta: safeMeta
  };

  const formattedLog = `[SECURITY][${level}][${category}] ${timestamp} | IP: ${ip} | Path: ${method} ${path} | User: ${userId} | ${JSON.stringify(safeMeta)}`;

  if (level === LEVELS.ERROR) {
    console.error(formattedLog);
  } else if (level === LEVELS.WARN) {
    console.warn(formattedLog);
  } else {
    console.log(formattedLog);
  }

  return eventPayload;
}

const securityLogger = {
  CATEGORIES,
  LEVELS,
  logEvent,
  sanitize,
  redactEmail,

  logLoginSuccess(req, userId, email) {
    return logEvent(CATEGORIES.AUTH_LOGIN_SUCCESS, LEVELS.INFO, req, { userId, email, statusCode: 200 });
  },

  logLoginFailed(req, email, reason) {
    return logEvent(CATEGORIES.AUTH_LOGIN_FAILED, LEVELS.WARN, req, { email, reason, statusCode: 401 });
  },

  logRegister(req, userId, email) {
    return logEvent(CATEGORIES.AUTH_REGISTER, LEVELS.INFO, req, { userId, email, statusCode: 201 });
  },

  logLogout(req, userId) {
    return logEvent(CATEGORIES.AUTH_LOGOUT, LEVELS.INFO, req, { userId, statusCode: 200 });
  },

  logUnauthorized(req, reason) {
    return logEvent(CATEGORIES.AUTH_UNAUTHORIZED, LEVELS.WARN, req, { reason, statusCode: 401 });
  },

  logAuthRateLimited(req) {
    return logEvent(CATEGORIES.AUTH_RATE_LIMITED, LEVELS.WARN, req, { statusCode: 429, reason: 'Authentication rate limit exceeded' });
  },

  logAIRateLimited(req) {
    return logEvent(CATEGORIES.AI_RATE_LIMITED, LEVELS.WARN, req, { statusCode: 429, reason: 'AI rate limit exceeded' });
  },

  logAIServiceAuthFailure(req, errorMsg) {
    return logEvent(CATEGORIES.AI_SERVICE_AUTH_FAILURE, LEVELS.WARN, req, { statusCode: 503, error: errorMsg });
  },

  logHealthAPIFailure(req, errorMsg) {
    return logEvent(CATEGORIES.HEALTH_API_FAILURE, LEVELS.ERROR, req, { statusCode: 503, error: errorMsg });
  },

  logHealthDatabaseFailure(req, errorMsg) {
    return logEvent(CATEGORIES.HEALTH_DATABASE_FAILURE, LEVELS.WARN, req, { statusCode: 503, error: errorMsg });
  },

  logHealthAIFailure(req, errorMsg) {
    return logEvent(CATEGORIES.HEALTH_AI_FAILURE, LEVELS.WARN, req, { statusCode: 503, error: errorMsg });
  },

  logInvalidRequest(req, reason) {
    return logEvent(CATEGORIES.INVALID_REQUEST, LEVELS.WARN, req, { statusCode: 400, reason });
  },

  logServerError(req, err) {
    return logEvent(CATEGORIES.SERVER_ERROR, LEVELS.ERROR, req, { statusCode: 500, error: err ? err.message : 'Internal Server Error' });
  }
};

module.exports = securityLogger;

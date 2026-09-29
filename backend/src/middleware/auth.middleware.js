const AuthService = require('../services/auth.service');
const securityLogger = require('../utils/securityLogger');

/**
 * Authentication Middleware: Ensures route is accessed by an authenticated user with valid session
 */
async function requireAuth(req, res, next) {
  try {
    if (!req.session || !req.session.userId) {
      securityLogger.logUnauthorized(req, 'Missing active session');
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    // Attach safe user context if available in session, or fetch fresh copy
    if (req.session.user) {
      req.user = AuthService.toSafeUser(req.session.user);
    } else {
      let dbUser;
      try {
        dbUser = await AuthService.findUserById(req.session.userId);
      } catch (dbErr) {
        return res.status(503).json({
          success: false,
          message: 'Authentication service temporarily unavailable'
        });
      }

      if (!dbUser || dbUser.status !== 'ACTIVE') {
        req.session.destroy(() => {});
        return res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
      }
      req.user = AuthService.toSafeUser(dbUser);
      req.session.user = req.user;
    }

    next();
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Internal authentication error'
    });
  }
}

module.exports = {
  requireAuth
};

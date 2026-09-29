const { validationResult } = require('express-validator');
const AuthService = require('../services/auth.service');
const config = require('../config/env');
const securityLogger = require('../utils/securityLogger');

const AuthController = {
  /**
   * POST /api/auth/register
   * Register a new user account
   */
  async register(req, res, next) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        securityLogger.logInvalidRequest(req, 'Registration payload validation failed');
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array().map(e => ({ field: e.path, message: e.msg }))
        });
      }

      const { fullName, email, password } = req.body;

      // Check for existing account with same email
      let existingUser;
      try {
        existingUser = await AuthService.findUserByEmail(email);
      } catch (dbError) {
        securityLogger.logEvent(securityLogger.CATEGORIES.AUTH_REGISTER, securityLogger.LEVELS.ERROR, req, {
          email,
          reason: 'Database error during registration check'
        });
        return res.status(503).json({
          success: false,
          message: 'Registration service temporarily unavailable. Please try again later.'
        });
      }

      if (existingUser) {
        securityLogger.logEvent(securityLogger.CATEGORIES.AUTH_REGISTER, securityLogger.LEVELS.WARN, req, {
          email,
          reason: 'Duplicate registration attempt'
        });
        return res.status(409).json({
          success: false,
          message: 'An account with this email address already exists.'
        });
      }

      // Create new user record
      let newUser;
      try {
        newUser = await AuthService.createUser({ fullName, email, password });
      } catch (dbError) {
        securityLogger.logEvent(securityLogger.CATEGORIES.AUTH_REGISTER, securityLogger.LEVELS.ERROR, req, {
          email,
          reason: 'Database error during user creation'
        });
        return res.status(503).json({
          success: false,
          message: 'Registration service temporarily unavailable. Please try again later.'
        });
      }

      const safeUser = AuthService.toSafeUser(newUser);

      // Regenerate session to prevent session fixation attacks
      req.session.regenerate((err) => {
        if (err) return next(err);

        req.session.userId = safeUser.id;
        req.session.user = safeUser;

        securityLogger.logRegister(req, safeUser.id, safeUser.email);

        return res.status(201).json({
          success: true,
          message: 'Registration successful',
          user: safeUser
        });
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * POST /api/auth/login
   * Verify credentials and establish authenticated session
   */
  async login(req, res, next) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        securityLogger.logInvalidRequest(req, 'Login payload validation failed');
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array().map(e => ({ field: e.path, message: e.msg }))
        });
      }

      const { email, password } = req.body;

      // Generic authentication failure message to avoid account enumeration
      const genericFailMessage = 'Invalid email or password.';

      let user;
      try {
        user = await AuthService.findUserByEmail(email);
      } catch (dbError) {
        securityLogger.logEvent(securityLogger.CATEGORIES.AUTH_LOGIN, securityLogger.LEVELS.ERROR, req, {
          email,
          reason: 'Database error during authentication'
        });
        return res.status(503).json({
          success: false,
          message: 'Authentication service temporarily unavailable. Please try again later.'
        });
      }

      if (!user || user.status !== 'ACTIVE') {
        securityLogger.logLoginFailed(req, email, 'User not found or inactive');
        return res.status(401).json({
          success: false,
          message: genericFailMessage
        });
      }

      let isPasswordValid = false;
      try {
        isPasswordValid = await AuthService.verifyPassword(password, user.password_hash);
      } catch (pwError) {
        return res.status(500).json({
          success: false,
          message: 'Authentication processing error'
        });
      }

      if (!isPasswordValid) {
        securityLogger.logLoginFailed(req, email, 'Invalid password');
        return res.status(401).json({
          success: false,
          message: genericFailMessage
        });
      }

      const safeUser = AuthService.toSafeUser(user);

      // Regenerate session to prevent session fixation attacks
      req.session.regenerate(async (err) => {
        if (err) return next(err);

        req.session.userId = safeUser.id;
        req.session.user = safeUser;

        await AuthService.updateLastLogin(safeUser.id).catch(() => {});

        securityLogger.logLoginSuccess(req, safeUser.id, safeUser.email);

        return res.status(200).json({
          success: true,
          message: 'Login successful',
          user: safeUser
        });
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * POST /api/auth/logout
   * Destroy server session and clear authentication cookie
   */
  async logout(req, res, next) {
    try {
      const currentUserId = req.session ? req.session.userId : null;
      req.session.destroy((err) => {
        res.clearCookie(config.SESSION_COOKIE_NAME, {
          httpOnly: true,
          secure: config.SECURE_COOKIE,
          sameSite: 'lax'
        });
        if (currentUserId) {
          securityLogger.logLogout(req, currentUserId);
        }
        return res.status(200).json({
          success: true,
          message: 'Logout successful'
        });
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * GET /api/auth/me
   * Retrieve active authenticated user details
   */
  async me(req, res) {
    return res.status(200).json({
      success: true,
      user: req.user
    });
  },

  /**
   * GET /api/auth/protected-test
   * Protected development test route
   */
  async protectedTest(req, res) {
    return res.status(200).json({
      success: true,
      message: 'Protected route access granted',
      user: req.user
    });
  }
};

module.exports = AuthController;

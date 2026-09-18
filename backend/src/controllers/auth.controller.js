const { validationResult } = require('express-validator');
const AuthService = require('../services/auth.service');
const config = require('../config/env');

const AuthController = {
  /**
   * POST /api/auth/register
   * Register a new user account
   */
  async register(req, res, next) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array().map(e => ({ field: e.path, message: e.msg }))
        });
      }

      const { fullName, email, password } = req.body;

      // Check for existing account with same email
      const existingUser = await AuthService.findUserByEmail(email);
      if (existingUser) {
        return res.status(409).json({
          success: false,
          message: 'An account with this email address already exists.'
        });
      }

      // Create new user record
      const newUser = await AuthService.createUser({ fullName, email, password });
      const safeUser = AuthService.toSafeUser(newUser);

      // Establish authenticated session
      req.session.userId = safeUser.id;
      req.session.user = safeUser;

      return res.status(201).json({
        success: true,
        message: 'Registration successful',
        user: safeUser
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
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array().map(e => ({ field: e.path, message: e.msg }))
        });
      }

      const { email, password } = req.body;

      // Generic authentication failure message to avoid account enumeration
      const genericFailMessage = 'Invalid email or password.';

      const user = await AuthService.findUserByEmail(email);
      if (!user || user.status !== 'ACTIVE') {
        return res.status(401).json({
          success: false,
          message: genericFailMessage
        });
      }

      const isPasswordValid = await AuthService.verifyPassword(password, user.password_hash);
      if (!isPasswordValid) {
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
      req.session.destroy((err) => {
        res.clearCookie(config.SESSION_COOKIE_NAME);
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

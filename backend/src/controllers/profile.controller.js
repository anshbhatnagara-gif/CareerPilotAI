const { validationResult } = require('express-validator');
const ProfileService = require('../services/profile.service');

const ProfileController = {
  /**
   * GET /api/profile
   * Fetch authenticated user's profile
   */
  async getProfile(req, res, next) {
    try {
      const userId = req.user.id;
      const profile = await ProfileService.getProfile(userId);

      if (!profile) {
        return res.status(404).json({
          success: false,
          message: 'Profile not found'
        });
      }

      return res.status(200).json({
        success: true,
        profile
      });
    } catch (error) {
      if (req.app.get('env') === 'development') {
        console.error('getProfile Error:', error);
      }
      return res.status(500).json({
        success: false,
        message: 'Failed to load profile'
      });
    }
  },

  /**
   * PUT /api/profile
   * Update authenticated user's profile
   */
  async updateProfile(req, res, next) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array().map(e => ({ field: e.path, message: e.msg }))
        });
      }

      const userId = req.user.id;
      const updatedProfile = await ProfileService.updateProfile(userId, req.body);

      return res.status(200).json({
        success: true,
        message: 'Profile saved successfully',
        profile: updatedProfile
      });
    } catch (error) {
      if (req.app.get('env') === 'development') {
        console.error('updateProfile Error:', error);
      }
      return res.status(500).json({
        success: false,
        message: 'Failed to save profile'
      });
    }
  }
};

module.exports = ProfileController;

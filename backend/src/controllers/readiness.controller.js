const ReadinessService = require('../services/readiness.service');

const ReadinessController = {
  /**
   * GET /api/readiness
   * Generate or fetch deterministic career readiness and skill gap report
   */
  async getReadiness(req, res, next) {
    try {
      const userId = req.user.id;
      const result = await ReadinessService.getReadiness(userId);

      if (result && result.incompleteProfile) {
        return res.status(400).json({
          success: false,
          message: 'Complete your career profile before generating readiness.'
        });
      }

      if (result && result.missingTargetCareer) {
        return res.status(400).json({
          success: false,
          message: 'Set a target career before generating readiness.'
        });
      }

      return res.status(200).json({
        success: true,
        readiness: result
      });
    } catch (error) {
      if (req.app.get('env') === 'development') {
        console.error('getReadiness Error:', error);
      }
      return res.status(500).json({
        success: false,
        message: 'Failed to generate readiness'
      });
    }
  }
};

module.exports = ReadinessController;

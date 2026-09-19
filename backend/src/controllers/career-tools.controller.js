const CareerToolsService = require('../services/career-tools.service');

const CareerToolsController = {
  /**
   * GET /api/career-tools/evidence
   * Retrieves manual portfolio evidence list for the authenticated user
   */
  async getEvidence(req, res, next) {
    try {
      const userId = req.user.id;
      const evidence = await CareerToolsService.getEvidence(userId);

      res.status(200).json({
        success: true,
        count: evidence.length,
        data: evidence
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * POST /api/career-tools/evidence
   * Saves or updates manual portfolio evidence with URL validation
   */
  async saveEvidence(req, res, next) {
    try {
      const userId = req.user.id;
      const payload = req.body;

      const result = await CareerToolsService.saveEvidence(userId, payload);
      res.status(200).json({
        success: true,
        message: 'Portfolio evidence saved successfully',
        data: result
      });
    } catch (error) {
      if (
        error.message && (
          error.message.includes('Malformed') ||
          error.message.includes('Project title is required') ||
          error.message.includes('cannot exceed 200 characters') ||
          error.message.includes('Evidence data is required')
        )
      ) {
        return res.status(400).json({
          success: false,
          message: error.message
        });
      }
      next(error);
    }
  },

  /**
   * GET /api/career-tools/passport
   * Dynamically aggregates profile, readiness, roadmap/projects, latest interview score, and evidence
   */
  async getPassport(req, res, next) {
    try {
      const userId = req.user.id;
      const passport = await CareerToolsService.getPassport(userId);

      res.status(200).json({
        success: true,
        data: passport
      });
    } catch (error) {
      next(error);
    }
  }
};

module.exports = CareerToolsController;

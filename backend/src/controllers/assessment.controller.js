const AssessmentService = require('../services/assessment.service');

const AssessmentController = {
  /**
   * GET /api/assessment
   * Generate or fetch deterministic career assessment report
   */
  async getAssessment(req, res, next) {
    try {
      const userId = req.user.id;
      const result = await AssessmentService.getAssessment(userId);

      if (result && result.incompleteProfile) {
        return res.status(400).json({
          success: false,
          message: 'Complete your career profile before generating assessment.'
        });
      }

      return res.status(200).json({
        success: true,
        assessment: result
      });
    } catch (error) {
      if (req.app.get('env') === 'development') {
        console.error('getAssessment Error:', error);
      }
      return res.status(500).json({
        success: false,
        message: 'Failed to generate assessment'
      });
    }
  }
};

module.exports = AssessmentController;

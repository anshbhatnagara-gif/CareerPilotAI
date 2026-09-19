const InterviewService = require('../services/interview.service');

const InterviewController = {
  /**
   * GET /api/interview/questions
   * Selects personalized interview questions based on mode (QUICK: 5, STANDARD: 10, DEEP: 15)
   */
  async getQuestions(req, res, next) {
    try {
      const userId = req.user.id;
      const mode = (req.query.mode || 'QUICK').toUpperCase();

      const result = await InterviewService.getQuestions(userId, mode);
      res.status(200).json({
        success: true,
        data: result
      });
    } catch (error) {
      if (error.message && error.message.includes('Invalid interview mode')) {
        return res.status(400).json({
          success: false,
          message: error.message
        });
      }
      next(error);
    }
  },

  /**
   * POST /api/interview/evaluate
   * Evaluates submitted interview answers and persists session + responses atomically
   */
  async evaluateSession(req, res, next) {
    try {
      const userId = req.user.id;
      const payload = req.body;

      const result = await InterviewService.evaluateSession(userId, payload);
      res.status(200).json({
        success: true,
        message: 'Interview session evaluated and persisted successfully',
        data: result
      });
    } catch (error) {
      if (
        error.message && (
          error.message.includes('Invalid interview mode') ||
          error.message.includes('Answers array') ||
          error.message.includes('Duplicate question ID') ||
          error.message.includes('must be at least 15 characters') ||
          error.message.includes('not found in career bank')
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
   * GET /api/interview/history
   * Retrieves user's past interview session history ordered by most recent first
   */
  async getHistory(req, res, next) {
    try {
      const userId = req.user.id;
      const history = await InterviewService.getHistory(userId);

      res.status(200).json({
        success: true,
        count: history.length,
        data: history
      });
    } catch (error) {
      next(error);
    }
  }
};

module.exports = InterviewController;

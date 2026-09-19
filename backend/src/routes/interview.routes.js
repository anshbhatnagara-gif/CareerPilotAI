const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth.middleware');
const InterviewController = require('../controllers/interview.controller');

// All interview routes require authentication
router.use(requireAuth);

/**
 * GET /api/interview/questions
 * Selects personalized interview questions for mode (QUICK: 5, STANDARD: 10, DEEP: 15)
 */
router.get('/questions', InterviewController.getQuestions);

/**
 * POST /api/interview/evaluate
 * Evaluates session answers, scores multi-dimensionally, and persists session + responses
 */
router.post('/evaluate', InterviewController.evaluateSession);

/**
 * GET /api/interview/history
 * Returns historical scored interview sessions for the authenticated user
 */
router.get('/history', InterviewController.getHistory);

module.exports = router;

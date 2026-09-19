const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth.middleware');
const CareerToolsController = require('../controllers/career-tools.controller');

// All career tools routes require authentication
router.use(requireAuth);

/**
 * GET /api/career-tools/evidence
 * Retrieves manual portfolio evidence list for the authenticated user
 */
router.get('/evidence', CareerToolsController.getEvidence);

/**
 * POST /api/career-tools/evidence
 * Saves/updates manual portfolio evidence with URL validation
 */
router.post('/evidence', CareerToolsController.saveEvidence);

/**
 * GET /api/career-tools/passport
 * Dynamically aggregates career profile, readiness, projects, interview score, and evidence
 */
router.get('/passport', CareerToolsController.getPassport);

module.exports = router;

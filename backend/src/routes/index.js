const express = require('express');
const router = express.Router();

/**
 * GET /api/health
 * Health check endpoint for monitoring API service availability
 */
router.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'CareerPilot API is running',
    service: 'careerpilot-backend'
  });
});

module.exports = router;

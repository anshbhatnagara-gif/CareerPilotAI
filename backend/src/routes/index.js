const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const authRoutes = require('./auth.routes');
const profileRoutes = require('./profile.routes');
const assessmentRoutes = require('./assessment.routes');
const readinessRoutes = require('./readiness.routes');

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

/**
 * GET /api/health/db
 * Database health check endpoint
 */
router.get('/health/db', async (req, res) => {
  try {
    await pool.query('SELECT 1');
    res.status(200).json({
      success: true,
      message: 'Database connection is healthy',
      database: 'connected'
    });
  } catch (error) {
    res.status(503).json({
      success: false,
      message: 'Database connection is unavailable',
      database: 'disconnected'
    });
  }
});

const roadmapRoutes = require('./roadmap.routes');
const projectsRoutes = require('./projects.routes');

// Mount routes
router.use('/auth', authRoutes);
router.use('/profile', profileRoutes);
router.use('/assessment', assessmentRoutes);
router.use('/readiness', readinessRoutes);
router.use('/roadmap', roadmapRoutes);
router.use('/projects', projectsRoutes);

module.exports = router;

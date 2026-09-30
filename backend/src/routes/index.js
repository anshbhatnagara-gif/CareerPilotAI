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

const securityLogger = require('../utils/securityLogger');
const config = require('../config/env');
const aiClient = require('../services/aiClient');

/**
 * GET /api/health/db
 * Database health check endpoint
 */
router.get('/health/db', async (req, res) => {
  try {
    if (!config.TIDB_HOST || config.TIDB_HOST.trim() === '') {
      if (config.NODE_ENV === 'production') {
        securityLogger.logHealthDatabaseFailure(req, 'Database is not configured in production');
        return res.status(503).json({
          success: false,
          message: 'Database is not configured in production',
          database: 'unconfigured'
        });
      }
      return res.status(200).json({
        success: true,
        message: 'Database is running in local development memory mode',
        database: 'mock'
      });
    }

    await pool.query('SELECT 1');
    res.status(200).json({
      success: true,
      message: 'Database connection is healthy',
      database: 'connected'
    });
  } catch (error) {
    securityLogger.logHealthDatabaseFailure(req, 'Database connection is unavailable');
    res.status(503).json({
      success: false,
      message: 'Database connection is unavailable',
      database: 'disconnected'
    });
  }
});

/**
 * GET /api/health/ai
 * Python FastAPI AI service health check endpoint
 */
router.get('/health/ai', async (req, res) => {
  const result = await aiClient.checkHealth();
  if (result.success) {
    res.status(200).json({
      success: true,
      message: 'AI microservice connection is healthy',
      aiService: 'connected',
      details: result.data
    });
  } else {
    securityLogger.logHealthAIFailure(req, result.error || 'AI microservice is unavailable');
    res.status(503).json({
      success: false,
      message: 'AI microservice is unavailable',
      aiService: 'disconnected',
      error: result.error
    });
  }
});

/**
 * GET /api/health/full
 * Unified production health monitoring status for API, Database, and AI service
 */
router.get('/health/full', async (req, res) => {
  let dbHealthy = false;
  let dbStatus = 'disconnected';

  try {
    if (!config.TIDB_HOST || config.TIDB_HOST.trim() === '') {
      if (config.NODE_ENV === 'production') {
        dbHealthy = false;
        dbStatus = 'unconfigured';
      } else {
        dbHealthy = true;
        dbStatus = 'mock';
      }
    } else {
      await pool.query('SELECT 1');
      dbHealthy = true;
      dbStatus = 'healthy';
    }
  } catch (err) {
    dbHealthy = false;
    dbStatus = 'disconnected';
    securityLogger.logHealthDatabaseFailure(req, 'Database query failed in full health check');
  }

  const aiResult = await aiClient.checkHealth();
  const aiHealthy = aiResult.success;
  const aiStatus = aiHealthy ? 'healthy' : 'disconnected';
  if (!aiHealthy) {
    securityLogger.logHealthAIFailure(req, aiResult.error || 'AI microservice unreachable in full health check');
  }

  const overallHealthy = dbHealthy && aiHealthy;

  const payload = {
    success: overallHealthy,
    status: overallHealthy ? 'healthy' : 'degraded',
    service: 'careerpilot-api',
    timestamp: new Date().toISOString(),
    services: {
      api: 'healthy',
      database: dbStatus,
      ai: aiStatus
    }
  };

  return res.status(overallHealthy ? 200 : 503).json(payload);
});

const roadmapRoutes = require('./roadmap.routes');
const projectsRoutes = require('./projects.routes');
const interviewRoutes = require('./interview.routes');
const careerToolsRoutes = require('./career-tools.routes');
const aiRoutes = require('./ai.routes');

// Mount routes
router.use('/auth', authRoutes);
router.use('/profile', profileRoutes);
router.use('/assessment', assessmentRoutes);
router.use('/readiness', readinessRoutes);
router.use('/roadmap', roadmapRoutes);
router.use('/projects', projectsRoutes);
router.use('/interview', interviewRoutes);
router.use('/career-tools', careerToolsRoutes);
router.use('/ai', aiRoutes);

module.exports = router;



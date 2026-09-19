const express = require('express');
const ReadinessController = require('../controllers/readiness.controller');
const { requireAuth } = require('../middleware/auth.middleware');

const router = express.Router();

router.use(requireAuth);
router.get('/', ReadinessController.getReadiness);

module.exports = router;

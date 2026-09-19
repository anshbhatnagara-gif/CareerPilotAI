const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth.middleware');
const { getRoadmap } = require('../controllers/roadmap.controller');

router.get('/', requireAuth, getRoadmap);

module.exports = router;

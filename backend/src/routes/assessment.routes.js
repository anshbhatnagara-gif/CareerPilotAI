const express = require('express');
const AssessmentController = require('../controllers/assessment.controller');
const { requireAuth } = require('../middleware/auth.middleware');

const router = express.Router();

router.use(requireAuth);
router.get('/', AssessmentController.getAssessment);

module.exports = router;

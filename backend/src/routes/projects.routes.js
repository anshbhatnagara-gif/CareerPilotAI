const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth.middleware');
const { getProjects, updateProjectStatus } = require('../controllers/projects.controller');

router.get('/', requireAuth, getProjects);
router.patch('/:id', requireAuth, updateProjectStatus);

module.exports = router;

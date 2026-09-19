const express = require('express');
const { body } = require('express-validator');
const ProfileController = require('../controllers/profile.controller');
const { requireAuth } = require('../middleware/auth.middleware');

const router = express.Router();

// Apply requireAuth middleware to all profile routes
router.use(requireAuth);

// Validation rules for PUT /api/profile
const profileUpdateValidation = [
  body('personal.location')
    .optional({ checkFalsy: true })
    .isString().withMessage('Location must be a text value.')
    .isLength({ max: 160 }).withMessage('Location cannot exceed 160 characters.'),
  
  body('education.college')
    .optional({ checkFalsy: true })
    .isString().withMessage('College name must be a text value.')
    .isLength({ max: 200 }).withMessage('College name cannot exceed 200 characters.'),
  
  body('education.degree')
    .optional({ checkFalsy: true })
    .isString().withMessage('Degree must be a text value.')
    .isLength({ max: 100 }).withMessage('Degree cannot exceed 100 characters.'),
  
  body('education.branch')
    .optional({ checkFalsy: true })
    .isString().withMessage('Branch must be a text value.')
    .isLength({ max: 160 }).withMessage('Branch cannot exceed 160 characters.'),
  
  body('education.currentYear')
    .optional({ checkFalsy: true })
    .isString().withMessage('Current year must be a text value.')
    .isLength({ max: 50 }).withMessage('Current year cannot exceed 50 characters.'),
  
  body('education.graduationYear')
    .optional({ checkFalsy: true })
    .custom((val) => {
      const year = parseInt(val, 10);
      if (isNaN(year) || year < 1950 || year > 2100) {
        throw new Error('Graduation year must be a valid year between 1950 and 2100.');
      }
      return true;
    }),
  
  body('skills')
    .optional()
    .isArray().withMessage('Skills must be an array of strings.'),
  
  body('interests')
    .optional()
    .isArray().withMessage('Interests must be an array of strings.'),
  
  body('careerGoal.targetCareer')
    .optional({ checkFalsy: true })
    .isString().withMessage('Target career must be a text value.')
    .isLength({ max: 120 }).withMessage('Target career cannot exceed 120 characters.'),
  
  body('careerGoal.experienceLevel')
    .optional({ checkFalsy: true })
    .isIn(['Beginner', 'Intermediate', 'Advanced']).withMessage('Experience level must be Beginner, Intermediate, or Advanced.'),
  
  body('careerGoal.goal')
    .optional({ checkFalsy: true })
    .isString().withMessage('Career goal must be a text value.')
    .isLength({ max: 1000 }).withMessage('Career goal cannot exceed 1000 characters.')
];

// Routes
router.get('/', ProfileController.getProfile);
router.put('/', profileUpdateValidation, ProfileController.updateProfile);

module.exports = router;

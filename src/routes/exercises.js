const express = require('express');
const router = express.Router();
const exerciseController = require('../controllers/exerciseController');
const { optionalAuth, verifyToken } = require('../middleware/auth');
const { submitExerciseValidation, uuidParamValidation } = require('../middleware/validation');
const { submissionLimiter } = require('../middleware/rateLimiter');

// Get exercises (public with optional auth for progress)
router.get('/', optionalAuth, exerciseController.getAllExercises);
router.get('/:exerciseId', optionalAuth, uuidParamValidation('exerciseId'), exerciseController.getExerciseById);
router.get('/:exerciseId/questions', uuidParamValidation('exerciseId'), exerciseController.getExerciseQuestions);

// Submit exercise (requires auth)
router.post('/:exerciseId/submit', verifyToken, submissionLimiter, submitExerciseValidation, exerciseController.submitExerciseAttempt);

// User's exercise history
router.get('/attempts/history', verifyToken, exerciseController.getUserAttempts);

module.exports = router;

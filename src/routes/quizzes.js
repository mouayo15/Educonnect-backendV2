const express = require('express');
const router = express.Router();
const quizController = require('../controllers/quizController');
const { optionalAuth, verifyToken } = require('../middleware/auth');
const { submitQuizValidation, integerParamValidation } = require('../middleware/validation');
const { submissionLimiter } = require('../middleware/rateLimiter');

// Get quizzes (public with optional auth for progress)
router.get('/', optionalAuth, quizController.getAllQuizzes);
router.get('/:quizId', optionalAuth, integerParamValidation('quizId'), quizController.getQuizById);
router.get('/:quizId/questions', integerParamValidation('quizId'), quizController.getQuizQuestions);

// Submit quiz (requires auth)
router.post('/:quizId/submit', verifyToken, integerParamValidation('quizId'), submissionLimiter, submitQuizValidation, quizController.submitQuizAttempt);

// User's quiz history
router.get('/attempts/history', verifyToken, quizController.getUserAttempts);

// Quiz leaderboard
router.get('/:quizId/leaderboard', optionalAuth, integerParamValidation('quizId'), quizController.getQuizLeaderboard);

module.exports = router;

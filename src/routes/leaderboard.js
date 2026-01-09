const express = require('express');
const router = express.Router();
const leaderboardController = require('../controllers/leaderboardController');
const { optionalAuth, verifyToken, requireAdmin } = require('../middleware/auth');
const { paginationValidation, integerParamValidation } = require('../middleware/validation');

// Global leaderboard
router.get('/global', optionalAuth, paginationValidation, leaderboardController.getGlobalLeaderboard);

// Subject leaderboard
router.get('/subject/:subjectId', optionalAuth, integerParamValidation('subjectId'), leaderboardController.getSubjectLeaderboard);

// Weekly leaderboard
router.get('/weekly', optionalAuth, leaderboardController.getWeeklyLeaderboard);

// Streak leaderboard
router.get('/streak', optionalAuth, leaderboardController.getStreakLeaderboard);

// Update cache (admin only)
router.post('/cache/update', verifyToken, requireAdmin, leaderboardController.updateLeaderboardCache);

module.exports = router;

const express = require('express');
const router = express.Router();

// Import all route modules
const authRoutes = require('./auth');
const userRoutes = require('./users');
const courseRoutes = require('./courses');
const quizRoutes = require('./quizzes');
const exerciseRoutes = require('./exercises');
const leaderboardRoutes = require('./leaderboard');

// Mount routes
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/courses', courseRoutes);
router.use('/quizzes', quizRoutes);
router.use('/exercises', exerciseRoutes);
router.use('/leaderboard', leaderboardRoutes);

// Health check
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'EduConnect API is running',
    timestamp: new Date().toISOString()
  });
});

module.exports = router;

const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { verifyToken } = require('../middleware/auth');
const { updateProfileValidation, paginationValidation } = require('../middleware/validation');

// All user routes require authentication
router.use(verifyToken);

// User profile
router.get('/profile', userController.getProfile);
router.patch('/profile', updateProfileValidation, userController.updateProfile);

// User stats and progress
router.get('/stats', userController.getStats);
router.get('/achievements', userController.getAchievements);
router.get('/activity', paginationValidation, userController.getActivity);

// Public user profile
router.get('/:userId', userController.getUserById);

module.exports = router;

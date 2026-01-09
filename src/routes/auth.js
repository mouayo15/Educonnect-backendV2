const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authLimiter } = require('../middleware/rateLimiter');
const { 
  registerValidation, 
  loginValidation, 
  refreshTokenValidation,
  changePasswordValidation 
} = require('../middleware/validation');
const { verifyToken } = require('../middleware/auth');

// Public routes
router.post('/register', authLimiter, registerValidation, authController.register);
router.post('/login', authLimiter, loginValidation, authController.login);
router.post('/refresh', refreshTokenValidation, authController.refreshToken);

// Protected routes
router.get('/me', verifyToken, authController.getCurrentUser);
router.post('/logout', verifyToken, authController.logout);
router.post('/change-password', verifyToken, changePasswordValidation, authController.changePassword);

module.exports = router;

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { query, transaction } = require('../config/database');
const { AppError, catchAsync } = require('../middleware/errorHandler');
const { updateStreak } = require('../services/userService');

/**
 * Generate JWT tokens
 */
const generateTokens = (userId) => {
  const accessToken = jwt.sign(
    { userId, timestamp: Date.now() },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '15m' }
  );

  const refreshToken = jwt.sign(
    { userId, timestamp: Date.now(), nonce: crypto.randomBytes(16).toString('hex') },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d' }
  );

  return { accessToken, refreshToken };
};

/**
 * Register new user
 */
exports.register = catchAsync(async (req, res) => {
  const { username, email, password, avatar } = req.body;

  // Check if user exists
  const existingUser = await query(
    'SELECT id FROM users WHERE email = $1 OR username = $2',
    [email, username]
  );

  if (existingUser.rows.length > 0) {
    throw new AppError('User already exists with this email or username', 400);
  }

  // Hash password
  const passwordHash = await bcrypt.hash(password, 12);

  // Create user
  const result = await query(
    `INSERT INTO users (username, email, password_hash, avatar, last_login_date)
     VALUES ($1, $2, $3, $4, CURRENT_DATE)
     RETURNING id, username, email, avatar, xp, level, streak, created_at`,
    [username, email, passwordHash, avatar || '👤']
  );

  const user = result.rows[0];

  // Generate tokens
  const { accessToken, refreshToken } = generateTokens(user.id);

  // Store refresh token
  const tokenExpiry = new Date();
  tokenExpiry.setDate(tokenExpiry.getDate() + 7); // 7 days

  await query(
    'INSERT INTO refresh_tokens (user_id, token, expires_at) VALUES ($1, $2, $3)',
    [user.id, refreshToken, tokenExpiry]
  );

  // Award first login achievement
  const achievementResult = await query(
    'SELECT id FROM achievements WHERE key = $1',
    ['first_login']
  );

  if (achievementResult.rows.length > 0) {
    await query(
      'INSERT INTO user_achievements (user_id, achievement_id) VALUES ($1, $2)',
      [user.id, achievementResult.rows[0].id]
    );
  }

  res.status(201).json({
    success: true,
    data: {
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        avatar: user.avatar,
        xp: user.xp,
        level: user.level,
        streak: user.streak
      },
      accessToken,
      refreshToken
    }
  });
});

/**
 * Login user
 */
exports.login = catchAsync(async (req, res) => {
  const { email, password } = req.body;

  // Get user
  const result = await query(
    `SELECT id, username, email, password_hash, avatar, xp, level, streak, 
            is_verified, locked_until, failed_login_attempts
     FROM users WHERE email = $1`,
    [email]
  );

  if (result.rows.length === 0) {
    throw new AppError('Invalid email or password', 401);
  }

  const user = result.rows[0];

  // Check if account is locked
  if (user.locked_until && new Date(user.locked_until) > new Date()) {
    throw new AppError(
      `Account is locked until ${user.locked_until}. Too many failed login attempts.`,
      403
    );
  }

  // Verify password
  const isPasswordValid = await bcrypt.compare(password, user.password_hash);

  if (!isPasswordValid) {
    // Increment failed attempts
    const failedAttempts = user.failed_login_attempts + 1;
    let lockedUntil = null;

    // Lock account after 5 failed attempts
    if (failedAttempts >= 5) {
      lockedUntil = new Date();
      lockedUntil.setMinutes(lockedUntil.getMinutes() + 15); // Lock for 15 minutes
    }

    await query(
      'UPDATE users SET failed_login_attempts = $1, locked_until = $2 WHERE id = $3',
      [failedAttempts, lockedUntil, user.id]
    );

    throw new AppError('Invalid email or password', 401);
  }

  // Reset failed attempts on successful login
  await query(
    'UPDATE users SET failed_login_attempts = 0, locked_until = NULL WHERE id = $1',
    [user.id]
  );

  // Update streak
  const streakResult = await updateStreak(user.id);

  // Generate tokens
  const { accessToken, refreshToken } = generateTokens(user.id);

  // Store refresh token
  const tokenExpiry = new Date();
  tokenExpiry.setDate(tokenExpiry.getDate() + 7);

  await query(
    'INSERT INTO refresh_tokens (user_id, token, expires_at) VALUES ($1, $2, $3)',
    [user.id, refreshToken, tokenExpiry]
  );

  res.json({
    success: true,
    data: {
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        avatar: user.avatar,
        xp: user.xp,
        level: user.level,
        streak: streakResult.streak
      },
      accessToken,
      refreshToken,
      streakIncreased: streakResult.streakIncreased
    }
  });
});

/**
 * Refresh access token
 */
exports.refreshToken = catchAsync(async (req, res) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    return res.status(401).json({
      success: false,
      error: 'Refresh token required'
    });
  }

  try {
    // Verify refresh token
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);

    // Check if token exists in database
    const result = await query(
      'SELECT user_id FROM refresh_tokens WHERE token = $1 AND expires_at > NOW()',
      [refreshToken]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({
        success: false,
        error: 'Invalid or expired refresh token'
      });
    }

    // Generate new access token
    const accessToken = jwt.sign(
      { userId: decoded.userId },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '15m' }
    );

    res.json({
      success: true,
      data: { accessToken }
    });
  } catch (error) {
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        error: 'Invalid or expired refresh token'
      });
    }
    throw error;
  }
});

/**
 * Logout user
 */
exports.logout = catchAsync(async (req, res) => {
  const { refreshToken } = req.body;

  if (refreshToken) {
    // Delete refresh token from database
    await query('DELETE FROM refresh_tokens WHERE token = $1', [refreshToken]);
  }

  res.json({
    success: true,
    message: 'Logged out successfully'
  });
});

/**
 * Change password
 */
exports.changePassword = catchAsync(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const userId = req.user.id;

  // Get current password hash
  const result = await query(
    'SELECT password_hash FROM users WHERE id = $1',
    [userId]
  );

  if (result.rows.length === 0) {
    throw new AppError('User not found', 404);
  }

  // Verify current password
  const isPasswordValid = await bcrypt.compare(
    currentPassword,
    result.rows[0].password_hash
  );

  if (!isPasswordValid) {
    throw new AppError('Current password is incorrect', 401);
  }

  // Hash new password
  const newPasswordHash = await bcrypt.hash(newPassword, 12);

  // Update password
  await query(
    'UPDATE users SET password_hash = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
    [newPasswordHash, userId]
  );

  res.json({
    success: true,
    message: 'Password changed successfully'
  });
});

/**
 * Get current authenticated user
 */
exports.getCurrentUser = catchAsync(async (req, res) => {
  const userId = req.user.id;

  // Get user with stats
  const result = await query(
    `SELECT 
      u.id,
      u.uuid,
      u.username,
      u.email,
      u.avatar,
      u.xp,
      u.level,
      u.streak,
      u.last_login_date,
      u.math_progress,
      u.french_progress,
      u.science_progress,
      u.history_progress,
      u.total_study_time,
      u.created_at,
      CASE 
        WHEN u.level >= 10 THEN 'diamond'
        WHEN u.level >= 7 THEN 'gold'
        WHEN u.level >= 4 THEN 'silver'
        ELSE 'bronze'
      END AS league,
      (u.xp % 100) AS current_level_xp,
      100 AS xp_needed_for_next_level
    FROM users u
    WHERE u.id = $1`,
    [userId]
  );

  if (result.rows.length === 0) {
    throw new AppError('User not found', 404);
  }

  res.json({
    success: true,
    data: result.rows[0]
  });
});

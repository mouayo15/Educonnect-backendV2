const { query } = require('../config/database');
const { AppError, catchAsync } = require('../middleware/errorHandler');
const { getUserStats } = require('../services/userService');

/**
 * Get current user profile
 */
exports.getProfile = catchAsync(async (req, res) => {
  const userId = req.user.id;

  const result = await query(
    `SELECT id, username, email, avatar, xp, level, streak,
            math_progress, french_progress, science_progress, history_progress,
            last_login_date, created_at
     FROM users WHERE id = $1`,
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

/**
 * Update user profile
 */
exports.updateProfile = catchAsync(async (req, res) => {
  const userId = req.user.id;
  const { username, avatar } = req.body;

  // Check if username is already taken
  if (username) {
    const existing = await query(
      'SELECT id FROM users WHERE username = $1 AND id != $2',
      [username, userId]
    );

    if (existing.rows.length > 0) {
      throw new AppError('Username already taken', 400);
    }
  }

  // Build update query dynamically
  const updates = [];
  const values = [];
  let paramCount = 1;

  if (username) {
    updates.push(`username = $${paramCount}`);
    values.push(username);
    paramCount++;
  }

  if (avatar) {
    updates.push(`avatar = $${paramCount}`);
    values.push(avatar);
    paramCount++;
  }

  if (updates.length === 0) {
    throw new AppError('No fields to update', 400);
  }

  updates.push('updated_at = CURRENT_TIMESTAMP');
  values.push(userId);

  const result = await query(
    `UPDATE users SET ${updates.join(', ')} 
     WHERE id = $${paramCount}
     RETURNING id, username, email, avatar, xp, level, streak`,
    values
  );

  res.json({
    success: true,
    data: result.rows[0]
  });
});

/**
 * Get user stats
 */
exports.getStats = catchAsync(async (req, res) => {
  const userId = req.user.id;

  const stats = await getUserStats(userId);

  res.json({
    success: true,
    data: stats
  });
});

/**
 * Get user achievements
 */
exports.getAchievements = catchAsync(async (req, res) => {
  const userId = req.user.id;

  const result = await query(
    `SELECT a.*, ua.earned_at
     FROM achievements a
     LEFT JOIN user_achievements ua ON a.id = ua.achievement_id AND ua.user_id = $1
     ORDER BY 
       CASE WHEN ua.earned_at IS NULL THEN 1 ELSE 0 END,
       ua.earned_at DESC,
       a.created_at ASC`,
    [userId]
  );

  const unlocked = result.rows.filter(a => a.earned_at !== null);
  const locked = result.rows.filter(a => a.earned_at === null);

  res.json({
    success: true,
    data: {
      unlocked,
      locked,
      total: result.rows.length,
      unlockedCount: unlocked.length
    }
  });
});

/**
 * Get user activity history
 */
exports.getActivity = catchAsync(async (req, res) => {
  const userId = req.user.id;
  const { limit = 20, offset = 0 } = req.query;

  const result = await query(
    `SELECT * FROM activity_history 
     WHERE user_id = $1 
     ORDER BY created_at DESC 
     LIMIT $2 OFFSET $3`,
    [userId, limit, offset]
  );

  const countResult = await query(
    'SELECT COUNT(*) FROM activity_history WHERE user_id = $1',
    [userId]
  );

  res.json({
    success: true,
    data: {
      activities: result.rows,
      total: parseInt(countResult.rows[0].count),
      limit: parseInt(limit),
      offset: parseInt(offset)
    }
  });
});

/**
 * Get user by ID (public profile)
 */
exports.getUserById = catchAsync(async (req, res) => {
  const { userId } = req.params;

  const result = await query(
    `SELECT id, username, avatar, level, streak, created_at
     FROM users WHERE id = $1`,
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

const { query } = require('../config/database');
const { AppError, catchAsync } = require('../middleware/errorHandler');
const { getUserStats } = require('../services/userService');
const logger = require('../utils/logger');

/**
 * Get current user profile
 */
exports.getProfile = catchAsync(async (req, res) => {
  const userId = req.user.id;
  logger.info(`📄 Fetching user profile for ID ${userId}`);

  const result = await query(
    `SELECT id, username, email, avatar, xp, level, streak,
            math_progress, french_progress, science_progress, history_progress,
            last_login_date, created_at
     FROM users WHERE id = $1`,
    [userId]
  );

  if (result.rows.length === 0) {
    logger.error(`❌ User profile not found: ID ${userId}`);
    throw new AppError('User not found', 404);
  }

  logger.info(`✅ User profile retrieved: ${result.rows[0].username}`);

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
  logger.info(`✏️ User profile update request: ID ${userId}`);

  // Check if username is already taken
  if (username) {
    const existing = await query(
      'SELECT id FROM users WHERE username = $1 AND id != $2',
      [username, userId]
    );

    if (existing.rows.length > 0) {
      logger.warn(`⚠️ Username already taken: ${username}`);
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
    logger.warn(`⚠️ No fields to update for user ${userId}`);
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

  logger.info(`✅ User profile updated successfully: ID ${userId}`);

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
  logger.info(`📊 Fetching user stats for ID ${userId}`);

  const stats = await getUserStats(userId);
  
  logger.info(`✅ User stats retrieved: ID ${userId}`);

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
  logger.info(`🏆 Fetching achievements for user ID ${userId}`);

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

  logger.info(`✅ Achievements retrieved for user ${userId}: ${unlocked.length} unlocked, ${locked.length} locked`);

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
  logger.info(`📋 Fetching activity history for user ${userId} (limit: ${limit}, offset: ${offset})`);

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

  logger.info(`✅ Activity history retrieved for user ${userId}: ${result.rows.length} records`);

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

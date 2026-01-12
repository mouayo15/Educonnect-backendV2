const { query } = require('../config/database');
const { catchAsync, AppError } = require('../middleware/errorHandler');
const logger = require('../utils/logger');

/**
 * Get global leaderboard
 */
exports.getGlobalLeaderboard = catchAsync(async (req, res) => {
  const { limit = 50, offset = 0 } = req.query;
  const userId = req.user?.id;
  logger.info(`🏆 Fetching global leaderboard (limit: ${limit}, offset: ${offset})`);

  const result = await query(
    `SELECT * FROM global_leaderboard
     ORDER BY rank ASC
     LIMIT $1 OFFSET $2`,
    [limit, offset]
  );

  // Get total count
  const countResult = await query(
    'SELECT COUNT(*) FROM users'
  );

  // Get current user's rank if authenticated
  let userRank = null;
  if (userId) {
    const rankResult = await query(
      'SELECT rank FROM global_leaderboard WHERE id = $1',
      [userId]
    );
    if (rankResult.rows.length > 0) {
      userRank = rankResult.rows[0].rank;
    }
  }

  logger.info(`✅ Global leaderboard retrieved: ${result.rows.length} users (User rank: ${userRank || 'N/A'})`);

  res.json({
    success: true,
    data: {
      leaderboard: result.rows,
      total: parseInt(countResult.rows[0].count),
      limit: parseInt(limit),
      offset: parseInt(offset),
      userRank
    }
  });
});

/**
 * Get leaderboard by subject
 */
exports.getSubjectLeaderboard = catchAsync(async (req, res) => {
  const { subjectId } = req.params;
  const { limit = 50 } = req.query;
  const userId = req.user?.id;
  logger.info(`🏆 Fetching subject leaderboard for subject ID ${subjectId} (limit: ${limit})`);

  // Verify subject exists and get its key
  const subjectResult = await query(
    'SELECT id, name, key FROM subjects WHERE id = $1',
    [subjectId]
  );

  if (subjectResult.rows.length === 0) {
    logger.warn(`⚠️ Subject not found: ID ${subjectId}`);
    throw new AppError('Subject not found', 404);
  }

  const subject = subjectResult.rows[0];
  const progressColumn = `${subject.key}_progress`;

  // Get subject-specific rankings based on progress
  const result = await query(
    `SELECT 
       u.id, u.username, u.avatar, u.level, u.xp,
       u.${progressColumn} as subject_progress,
       ROW_NUMBER() OVER (ORDER BY u.${progressColumn} DESC, u.xp DESC) as rank
     FROM users u
     WHERE u.${progressColumn} > 0
     ORDER BY rank ASC
     LIMIT $1`,
    [limit]
  );

  // Get current user's rank if authenticated
  let userRank = null;
  if (userId) {
    const rankResult = await query(
      `SELECT rank FROM (
         SELECT 
           u.id,
           ROW_NUMBER() OVER (ORDER BY u.${progressColumn} DESC, u.xp DESC) as rank
         FROM users u
         WHERE u.${progressColumn} > 0
       ) ranked
       WHERE id = $1`,
      [userId]
    );
    if (rankResult.rows.length > 0) {
      userRank = rankResult.rows[0].rank;
    }
  }

  logger.info(`✅ Subject leaderboard retrieved: ${result.rows.length} users in ${subject.name}`);

  res.json({
    success: true,
    data: {
      subject: {
        id: subject.id,
        name: subject.name
      },
      leaderboard: result.rows,
      userRank
    }
  });
});

/**
 * Get weekly leaderboard
 */
exports.getWeeklyLeaderboard = catchAsync(async (req, res) => {
  const { limit = 50 } = req.query;
  const userId = req.user?.id;

  // Get activity from last 7 days
  const result = await query(
    `SELECT 
       u.id, u.username, u.avatar, u.level,
       SUM(ah.xp_earned) as weekly_xp,
       COUNT(ah.id) as weekly_activities,
       ROW_NUMBER() OVER (ORDER BY SUM(ah.xp_earned) DESC) as rank
     FROM users u
     JOIN activity_history ah ON u.id = ah.user_id
     WHERE ah.created_at >= NOW() - INTERVAL '7 days'
     GROUP BY u.id, u.username, u.avatar, u.level
     ORDER BY weekly_xp DESC
     LIMIT $1`,
    [limit]
  );

  // Get current user's rank
  let userRank = null;
  if (userId) {
    const rankResult = await query(
      `SELECT rank FROM (
         SELECT 
           u.id,
           ROW_NUMBER() OVER (ORDER BY SUM(ah.xp_earned) DESC) as rank
         FROM users u
         JOIN activity_history ah ON u.id = ah.user_id
         WHERE ah.created_at >= NOW() - INTERVAL '7 days'
         GROUP BY u.id
       ) ranked
       WHERE id = $1`,
      [userId]
    );
    if (rankResult.rows.length > 0) {
      userRank = rankResult.rows[0].rank;
    }
  }

  res.json({
    success: true,
    data: {
      leaderboard: result.rows,
      period: 'Last 7 days',
      userRank
    }
  });
});

/**
 * Get streak leaderboard
 */
exports.getStreakLeaderboard = catchAsync(async (req, res) => {
  const { limit = 50 } = req.query;
  const userId = req.user?.id;

  const result = await query(
    `SELECT 
       u.id, u.username, u.avatar, u.level, u.streak,
       ROW_NUMBER() OVER (ORDER BY u.streak DESC, u.xp DESC) as rank
     FROM users u
     WHERE u.streak > 0
     ORDER BY u.streak DESC, u.xp DESC
     LIMIT $1`,
    [limit]
  );

  // Get current user's rank
  let userRank = null;
  if (userId) {
    const rankResult = await query(
      `SELECT rank FROM (
         SELECT 
           id,
           ROW_NUMBER() OVER (ORDER BY streak DESC, xp DESC) as rank
         FROM users
         WHERE streak > 0
       ) ranked
       WHERE id = $1`,
      [userId]
    );
    if (rankResult.rows.length > 0) {
      userRank = rankResult.rows[0].rank;
    }
  }

  res.json({
    success: true,
    data: {
      leaderboard: result.rows,
      type: 'Streak',
      userRank
    }
  });
});

/**
 * Update leaderboard cache (admin only, or scheduled job)
 */
exports.updateLeaderboardCache = catchAsync(async (req, res) => {
  // Clear existing cache
  await query('DELETE FROM leaderboard_cache');

  // Rebuild cache
  await query(`
    INSERT INTO leaderboard_cache (user_id, rank, xp, level, league)
    SELECT 
      id,
      ROW_NUMBER() OVER (ORDER BY xp DESC, level DESC) as rank,
      xp,
      level,
      CASE 
        WHEN level >= 15 THEN 'Diamond'
        WHEN level >= 10 THEN 'Gold'
        WHEN level >= 5 THEN 'Silver'
        ELSE 'Bronze'
      END as league
    FROM users
  `);

  res.json({
    success: true,
    message: 'Leaderboard cache updated successfully'
  });
});

const { query, transaction } = require('../config/database');
const { AppError } = require('../middleware/errorHandler');

/**
 * Calculate XP needed for next level
 */
const getXpForLevel = (level) => {
  return level * 100; // Each level requires 100 XP
};

/**
 * Get current league based on level
 */
const getLeague = (level) => {
  if (level >= 15) return 'Diamond';
  if (level >= 10) return 'Gold';
  if (level >= 5) return 'Silver';
  return 'Bronze';
};

/**
 * Add XP to user and handle level ups
 */
const addXp = async (userId, xpAmount) => {
  return await transaction(async (client) => {
    // Get current user stats
    const userResult = await client.query(
      'SELECT xp, level FROM users WHERE id = $1',
      [userId]
    );

    if (userResult.rows.length === 0) {
      throw new AppError('User not found', 404);
    }

    const currentXp = userResult.rows[0].xp;
    const currentLevel = userResult.rows[0].level;
    let newXp = currentXp + xpAmount;
    let newLevel = currentLevel;
    let leveledUp = false;

    // Check for level ups
    while (newXp >= getXpForLevel(newLevel + 1)) {
      newXp -= getXpForLevel(newLevel + 1);
      newLevel++;
      leveledUp = true;
    }

    // Update user
    await client.query(
      'UPDATE users SET xp = $1, level = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $3',
      [newXp, newLevel, userId]
    );

    // Check for level achievements
    if (leveledUp) {
      await checkLevelAchievements(userId, newLevel, client);
    }

    return {
      xpAdded: xpAmount,
      newXp,
      newLevel,
      leveledUp,
      levelsGained: newLevel - currentLevel,
      xpToNextLevel: getXpForLevel(newLevel + 1),
      league: getLeague(newLevel)
    };
  });
};

/**
 * Update streak for user
 */
const updateStreak = async (userId) => {
  return await transaction(async (client) => {
    const result = await client.query(
      'SELECT streak, last_login_date FROM users WHERE id = $1',
      [userId]
    );

    if (result.rows.length === 0) {
      throw new AppError('User not found', 404);
    }

    const { streak, last_login_date } = result.rows[0];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let newStreak = streak;
    let streakIncreased = false;

    if (!last_login_date) {
      // First login
      newStreak = 1;
      streakIncreased = true;
    } else {
      const lastLogin = new Date(last_login_date);
      lastLogin.setHours(0, 0, 0, 0);
      const daysDiff = Math.floor((today - lastLogin) / (1000 * 60 * 60 * 24));

      if (daysDiff === 1) {
        // Consecutive day
        newStreak++;
        streakIncreased = true;
      } else if (daysDiff > 1) {
        // Streak broken
        newStreak = 1;
      }
      // If daysDiff === 0, same day, no change
    }

    // Update user
    await client.query(
      'UPDATE users SET streak = $1, last_login_date = CURRENT_DATE WHERE id = $2',
      [newStreak, userId]
    );

    // Check for streak achievements
    if (streakIncreased) {
      await checkStreakAchievements(userId, newStreak, client);
    }

    return {
      streak: newStreak,
      streakIncreased
    };
  });
};

/**
 * Update subject progress
 */
const updateSubjectProgress = async (userId, subjectId, progressDelta) => {
  const result = await query(
    `INSERT INTO users (id) VALUES ($1)
     ON CONFLICT (id) DO UPDATE 
     SET progress = jsonb_set(
       COALESCE(users.progress, '{}'::jsonb),
       ARRAY[$2::text],
       to_jsonb(COALESCE((users.progress->>$2)::int, 0) + $3)
     )
     WHERE users.id = $1
     RETURNING (progress->>$2)::int as subject_progress`,
    [userId, subjectId, progressDelta]
  );

  return result.rows[0];
};

/**
 * Check and award level achievements
 */
const checkLevelAchievements = async (userId, level, client) => {
  const levelAchievements = {
    5: 'level_5',
    10: 'level_10'
  };

  const achievementKey = levelAchievements[level];
  if (!achievementKey) return;

  // Check if achievement exists and user doesn't have it
  const achievementResult = await client.query(
    'SELECT id FROM achievements WHERE key = $1',
    [achievementKey]
  );

  if (achievementResult.rows.length === 0) return;

  const achievementId = achievementResult.rows[0].id;

  // Check if user already has this achievement
  const hasAchievement = await client.query(
    'SELECT id FROM user_achievements WHERE user_id = $1 AND achievement_id = $2',
    [userId, achievementId]
  );

  if (hasAchievement.rows.length > 0) return;

  // Award achievement
  await client.query(
    'INSERT INTO user_achievements (user_id, achievement_id) VALUES ($1, $2)',
    [userId, achievementId]
  );

  // Add activity
  const achievement = await client.query(
    'SELECT title, xp_bonus FROM achievements WHERE id = $1',
    [achievementId]
  );

  await client.query(
    `INSERT INTO activity_history (user_id, activity_type, activity_title, xp_earned, metadata)
     VALUES ($1, 'achievement', $2, $3, $4)`,
    [userId, achievement.rows[0].title, achievement.rows[0].xp_bonus, JSON.stringify({ achievement_id: achievementId })]
  );
};

/**
 * Check and award streak achievements
 */
const checkStreakAchievements = async (userId, streak, client) => {
  const streakAchievements = {
    3: 'streak_3',
    7: 'streak_7',
    30: 'streak_30'
  };

  const achievementKey = streakAchievements[streak];
  if (!achievementKey) return;

  const achievementResult = await client.query(
    'SELECT id FROM achievements WHERE key = $1',
    [achievementKey]
  );

  if (achievementResult.rows.length === 0) return;

  const achievementId = achievementResult.rows[0].id;

  const hasAchievement = await client.query(
    'SELECT id FROM user_achievements WHERE user_id = $1 AND achievement_id = $2',
    [userId, achievementId]
  );

  if (hasAchievement.rows.length > 0) return;

  await client.query(
    'INSERT INTO user_achievements (user_id, achievement_id) VALUES ($1, $2)',
    [userId, achievementId]
  );

  const achievement = await client.query(
    'SELECT title, xp_bonus FROM achievements WHERE id = $1',
    [achievementId]
  );

  await client.query(
    `INSERT INTO activity_history (user_id, activity_type, activity_title, xp_earned, metadata)
     VALUES ($1, 'achievement', $2, $3, $4)`,
    [userId, achievement.rows[0].title, achievement.rows[0].xp_bonus, JSON.stringify({ achievement_id: achievementId })]
  );
};

/**
 * Get user stats
 */
const getUserStats = async (userId) => {
  const result = await query(
    'SELECT * FROM user_stats WHERE id = $1',
    [userId]
  );

  if (result.rows.length === 0) {
    throw new AppError('User not found', 404);
  }

  return result.rows[0];
};

module.exports = {
  addXp,
  updateStreak,
  updateSubjectProgress,
  getUserStats,
  getXpForLevel,
  getLeague
};

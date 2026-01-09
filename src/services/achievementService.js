const { query } = require('../config/database');

/**
 * Check and unlock achievements for a user based on their activities
 * @param {number} userId - User ID
 * @returns {Array} - Array of newly unlocked achievements
 */
async function checkAndUnlockAchievements(userId) {
  const newAchievements = [];

  try {
    // Get user stats
    const statsResult = await query(
      `SELECT 
        u.id,
        u.xp,
        u.level,
        u.streak,
        COUNT(DISTINCT lc.id) AS lessons_completed,
        COUNT(DISTINCT qa.id) AS quizzes_completed,
        COUNT(DISTINCT ea.id) AS exercises_completed,
        COUNT(DISTINCT CASE WHEN qa.percentage = 100 THEN qa.id END) AS perfect_quizzes,
        COUNT(DISTINCT ua.id) AS achievements_earned
      FROM users u
      LEFT JOIN lesson_completions lc ON u.id = lc.user_id
      LEFT JOIN quiz_attempts qa ON u.id = qa.user_id
      LEFT JOIN exercise_attempts ea ON u.id = ea.user_id
      LEFT JOIN user_achievements ua ON u.id = ua.user_id
      WHERE u.id = $1
      GROUP BY u.id`,
      [userId]
    );

    if (statsResult.rows.length === 0) {
      return newAchievements;
    }

    const stats = statsResult.rows[0];

    // Get all achievements that the user hasn't earned yet
    const achievementsResult = await query(
      `SELECT a.*
      FROM achievements a
      WHERE a.is_active = true
        AND a.id NOT IN (
          SELECT achievement_id 
          FROM user_achievements 
          WHERE user_id = $1
        )`,
      [userId]
    );

    const availableAchievements = achievementsResult.rows;

    // Check each achievement's requirements
    for (const achievement of availableAchievements) {
      let unlocked = false;

      switch (achievement.requirement_type) {
        case 'lesson_count':
          unlocked = stats.lessons_completed >= achievement.requirement_value;
          break;

        case 'quiz_count':
          unlocked = stats.quizzes_completed >= achievement.requirement_value;
          break;

        case 'exercise_count':
          unlocked = stats.exercises_completed >= achievement.requirement_value;
          break;

        case 'perfect_quiz':
          unlocked = stats.perfect_quizzes >= achievement.requirement_value;
          break;

        case 'streak':
          unlocked = stats.streak >= achievement.requirement_value;
          break;

        case 'xp':
          unlocked = stats.xp >= achievement.requirement_value;
          break;

        case 'level':
          unlocked = stats.level >= achievement.requirement_value;
          break;

        case 'first_login':
          // This is unlocked during registration
          unlocked = true;
          break;

        case 'first_lesson':
          unlocked = stats.lessons_completed >= 1;
          break;

        case 'first_quiz':
          unlocked = stats.quizzes_completed >= 1;
          break;

        case 'first_exercise':
          unlocked = stats.exercises_completed >= 1;
          break;

        default:
          // Unknown requirement type, skip
          unlocked = false;
      }

      if (unlocked) {
        // Unlock the achievement
        await query(
          `INSERT INTO user_achievements (user_id, achievement_id)
          VALUES ($1, $2)
          ON CONFLICT (user_id, achievement_id) DO NOTHING
          RETURNING id`,
          [userId, achievement.id]
        );

        // Add XP bonus
        if (achievement.xp_bonus > 0) {
          await query(
            `UPDATE users 
            SET xp = xp + $1,
                level = FLOOR((xp + $1) / 100) + 1,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = $2`,
            [achievement.xp_bonus, userId]
          );
        }

        // Log activity
        await query(
          `INSERT INTO activity_history (user_id, activity_type, activity_title, xp_earned, metadata)
          VALUES ($1, $2, $3, $4, $5)`,
          [
            userId,
            'achievement',
            achievement.title,
            achievement.xp_bonus,
            JSON.stringify({ achievement_id: achievement.id, key: achievement.key })
          ]
        );

        newAchievements.push({
          id: achievement.id,
          key: achievement.key,
          title: achievement.title,
          description: achievement.description,
          icon: achievement.icon,
          category: achievement.category,
          xp_bonus: achievement.xp_bonus,
          rarity: achievement.rarity
        });
      }
    }

    return newAchievements;
  } catch (error) {
    console.error('Error checking achievements:', error);
    return newAchievements;
  }
}

/**
 * Unlock a specific achievement for a user
 * @param {number} userId - User ID
 * @param {string} achievementKey - Achievement key
 * @returns {Object|null} - Unlocked achievement or null
 */
async function unlockAchievement(userId, achievementKey) {
  try {
    // Get achievement
    const achievementResult = await query(
      'SELECT * FROM achievements WHERE key = $1 AND is_active = true',
      [achievementKey]
    );

    if (achievementResult.rows.length === 0) {
      return null;
    }

    const achievement = achievementResult.rows[0];

    // Check if already unlocked
    const existingResult = await query(
      'SELECT id FROM user_achievements WHERE user_id = $1 AND achievement_id = $2',
      [userId, achievement.id]
    );

    if (existingResult.rows.length > 0) {
      return null; // Already unlocked
    }

    // Unlock the achievement
    await query(
      'INSERT INTO user_achievements (user_id, achievement_id) VALUES ($1, $2)',
      [userId, achievement.id]
    );

    // Add XP bonus
    if (achievement.xp_bonus > 0) {
      await query(
        `UPDATE users 
        SET xp = xp + $1,
            level = FLOOR((xp + $1) / 100) + 1,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = $2`,
        [achievement.xp_bonus, userId]
      );
    }

    // Log activity
    await query(
      `INSERT INTO activity_history (user_id, activity_type, activity_title, xp_earned, metadata)
      VALUES ($1, $2, $3, $4, $5)`,
      [
        userId,
        'achievement',
        achievement.title,
        achievement.xp_bonus,
        JSON.stringify({ achievement_id: achievement.id, key: achievement.key })
      ]
    );

    return {
      id: achievement.id,
      key: achievement.key,
      title: achievement.title,
      description: achievement.description,
      icon: achievement.icon,
      category: achievement.category,
      xp_bonus: achievement.xp_bonus,
      rarity: achievement.rarity
    };
  } catch (error) {
    console.error('Error unlocking achievement:', error);
    return null;
  }
}

module.exports = {
  checkAndUnlockAchievements,
  unlockAchievement
};

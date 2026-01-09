const { query } = require('../config/database');

class Achievement {
  /**
   * Find all achievements
   */
  static async findAll() {
    const result = await query(
      'SELECT * FROM achievements ORDER BY created_at ASC'
    );
    return result.rows;
  }

  /**
   * Find achievement by ID
   */
  static async findById(id) {
    const result = await query(
      'SELECT * FROM achievements WHERE id = $1',
      [id]
    );
    return result.rows[0];
  }

  /**
   * Find achievement by key
   */
  static async findByKey(key) {
    const result = await query(
      'SELECT * FROM achievements WHERE key = $1',
      [key]
    );
    return result.rows[0];
  }

  /**
   * Get user's unlocked achievements
   */
  static async getUserUnlocked(userId) {
    const result = await query(
      `SELECT a.*, ua.unlocked_at
       FROM achievements a
       JOIN user_achievements ua ON a.id = ua.achievement_id
       WHERE ua.user_id = $1
       ORDER BY ua.unlocked_at DESC`,
      [userId]
    );
    return result.rows;
  }

  /**
   * Get all achievements with user unlock status
   */
  static async getAllWithUserStatus(userId) {
    const result = await query(
      `SELECT a.*, ua.unlocked_at
       FROM achievements a
       LEFT JOIN user_achievements ua ON a.id = ua.achievement_id AND ua.user_id = $1
       ORDER BY 
         CASE WHEN ua.unlocked_at IS NULL THEN 1 ELSE 0 END,
         ua.unlocked_at DESC,
         a.created_at ASC`,
      [userId]
    );
    return result.rows;
  }

  /**
   * Check if user has achievement
   */
  static async userHasAchievement(userId, achievementId) {
    const result = await query(
      'SELECT id FROM user_achievements WHERE user_id = $1 AND achievement_id = $2',
      [userId, achievementId]
    );
    return result.rows.length > 0;
  }

  /**
   * Award achievement to user
   */
  static async awardToUser(userId, achievementId) {
    const result = await query(
      'INSERT INTO user_achievements (user_id, achievement_id) VALUES ($1, $2) RETURNING *',
      [userId, achievementId]
    );
    return result.rows[0];
  }

  /**
   * Get user's achievement count
   */
  static async getUserAchievementCount(userId) {
    const result = await query(
      'SELECT COUNT(*) as count FROM user_achievements WHERE user_id = $1',
      [userId]
    );
    return parseInt(result.rows[0].count);
  }

  /**
   * Get achievements by category
   */
  static async findByCategory(category) {
    const result = await query(
      'SELECT * FROM achievements WHERE category = $1 ORDER BY requirement_value ASC',
      [category]
    );
    return result.rows;
  }
}

module.exports = Achievement;

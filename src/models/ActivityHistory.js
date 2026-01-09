const { query } = require('../config/database');

class ActivityHistory {
  /**
   * Create activity entry
   */
  static async create({ userId, activityType, activityTitle, xpEarned, metadata = {} }) {
    const result = await query(
      `INSERT INTO activity_history (user_id, activity_type, activity_title, xp_earned, metadata)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [userId, activityType, activityTitle, xpEarned, JSON.stringify(metadata)]
    );
    return result.rows[0];
  }

  /**
   * Get user's activity history
   */
  static async getUserHistory(userId, limit = 20, offset = 0) {
    const result = await query(
      `SELECT * FROM activity_history 
       WHERE user_id = $1 
       ORDER BY created_at DESC 
       LIMIT $2 OFFSET $3`,
      [userId, limit, offset]
    );
    return result.rows;
  }

  /**
   * Get user's total activity count
   */
  static async getUserActivityCount(userId) {
    const result = await query(
      'SELECT COUNT(*) as count FROM activity_history WHERE user_id = $1',
      [userId]
    );
    return parseInt(result.rows[0].count);
  }

  /**
   * Get user's weekly XP
   */
  static async getUserWeeklyXp(userId) {
    const result = await query(
      `SELECT SUM(xp_earned) as weekly_xp
       FROM activity_history
       WHERE user_id = $1 AND created_at >= NOW() - INTERVAL '7 days'`,
      [userId]
    );
    return parseInt(result.rows[0].weekly_xp) || 0;
  }

  /**
   * Get recent activities by type
   */
  static async getByType(userId, activityType, limit = 10) {
    const result = await query(
      `SELECT * FROM activity_history 
       WHERE user_id = $1 AND activity_type = $2
       ORDER BY created_at DESC 
       LIMIT $3`,
      [userId, activityType, limit]
    );
    return result.rows;
  }
}

module.exports = ActivityHistory;

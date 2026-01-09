const { query } = require('../config/database');

class Leaderboard {
  /**
   * Get global leaderboard
   */
  static async getGlobal(limit = 50, offset = 0) {
    const result = await query(
      `SELECT * FROM global_leaderboard
       ORDER BY rank ASC
       LIMIT $1 OFFSET $2`,
      [limit, offset]
    );
    return result.rows;
  }

  /**
   * Get user's global rank
   */
  static async getUserGlobalRank(userId) {
    const result = await query(
      'SELECT rank FROM global_leaderboard WHERE user_id = $1',
      [userId]
    );
    return result.rows[0]?.rank || null;
  }

  /**
   * Get weekly leaderboard
   */
  static async getWeekly(limit = 50) {
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
    return result.rows;
  }

  /**
   * Get user's weekly rank
   */
  static async getUserWeeklyRank(userId) {
    const result = await query(
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
    return result.rows[0]?.rank || null;
  }

  /**
   * Get streak leaderboard
   */
  static async getStreak(limit = 50) {
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
    return result.rows;
  }

  /**
   * Get user's streak rank
   */
  static async getUserStreakRank(userId) {
    const result = await query(
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
    return result.rows[0]?.rank || null;
  }

  /**
   * Get subject leaderboard
   */
  static async getBySubject(subjectId, limit = 50) {
    const result = await query(
      `SELECT 
         u.id, u.username, u.avatar, u.level, u.xp,
         (u.progress->>$1)::int as subject_progress,
         ROW_NUMBER() OVER (ORDER BY (u.progress->>$1)::int DESC, u.xp DESC) as rank
       FROM users u
       WHERE (u.progress->>$1)::int > 0
       ORDER BY rank ASC
       LIMIT $2`,
      [subjectId, limit]
    );
    return result.rows;
  }

  /**
   * Get user's subject rank
   */
  static async getUserSubjectRank(userId, subjectId) {
    const result = await query(
      `SELECT rank FROM (
         SELECT 
           u.id,
           ROW_NUMBER() OVER (ORDER BY (u.progress->>$1)::int DESC, u.xp DESC) as rank
         FROM users u
         WHERE (u.progress->>$1)::int > 0
       ) ranked
       WHERE id = $2`,
      [subjectId, userId]
    );
    return result.rows[0]?.rank || null;
  }

  /**
   * Update leaderboard cache
   */
  static async updateCache() {
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
  }

  /**
   * Get total users count
   */
  static async getTotalUsersCount() {
    const result = await query('SELECT COUNT(*) as count FROM users');
    return parseInt(result.rows[0].count);
  }
}

module.exports = Leaderboard;

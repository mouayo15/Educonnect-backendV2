const { query } = require('../config/database');

class User {
  /**
   * Find user by ID
   */
  static async findById(id) {
    const result = await query(
      'SELECT * FROM users WHERE id = $1',
      [id]
    );
    return result.rows[0];
  }

  /**
   * Find user by email
   */
  static async findByEmail(email) {
    const result = await query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );
    return result.rows[0];
  }

  /**
   * Find user by username
   */
  static async findByUsername(username) {
    const result = await query(
      'SELECT * FROM users WHERE username = $1',
      [username]
    );
    return result.rows[0];
  }

  /**
   * Create new user
   */
  static async create({ username, email, passwordHash, avatar = '👤' }) {
    const result = await query(
      `INSERT INTO users (username, email, password_hash, avatar, last_login_date)
       VALUES ($1, $2, $3, $4, CURRENT_DATE)
       RETURNING id, username, email, avatar, xp, level, streak, created_at`,
      [username, email, passwordHash, avatar]
    );
    return result.rows[0];
  }

  /**
   * Update user
   */
  static async update(id, fields) {
    const keys = Object.keys(fields);
    const values = Object.values(fields);
    const setClause = keys.map((key, index) => `${key} = $${index + 1}`).join(', ');

    const result = await query(
      `UPDATE users SET ${setClause}, updated_at = CURRENT_TIMESTAMP 
       WHERE id = $${keys.length + 1}
       RETURNING id, username, email, avatar, xp, level, streak`,
      [...values, id]
    );
    return result.rows[0];
  }

  /**
   * Update XP and level
   */
  static async updateXpAndLevel(id, xp, level) {
    const result = await query(
      'UPDATE users SET xp = $1, level = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $3',
      [xp, level, id]
    );
    return result.rows[0];
  }

  /**
   * Update streak
   */
  static async updateStreak(id, streak, lastLoginDate) {
    const result = await query(
      'UPDATE users SET streak = $1, last_login_date = $2 WHERE id = $3 RETURNING streak',
      [streak, lastLoginDate, id]
    );
    return result.rows[0];
  }

  /**
   * Update subject progress
   */
  static async updateProgress(id, subjectId, progress) {
    const result = await query(
      `UPDATE users 
       SET progress = jsonb_set(
         COALESCE(progress, '{}'::jsonb),
         ARRAY[$2::text],
         to_jsonb($3)
       )
       WHERE id = $1
       RETURNING (progress->>$2)::int as subject_progress`,
      [id, subjectId, progress]
    );
    return result.rows[0];
  }

  /**
   * Increment failed login attempts
   */
  static async incrementFailedAttempts(id) {
    await query(
      'UPDATE users SET failed_login_attempts = failed_login_attempts + 1 WHERE id = $1',
      [id]
    );
  }

  /**
   * Lock account
   */
  static async lockAccount(id, lockUntil) {
    await query(
      'UPDATE users SET locked_until = $1 WHERE id = $2',
      [lockUntil, id]
    );
  }

  /**
   * Reset failed attempts
   */
  static async resetFailedAttempts(id) {
    await query(
      'UPDATE users SET failed_login_attempts = 0, locked_until = NULL WHERE id = $1',
      [id]
    );
  }

  /**
   * Get user stats
   */
  static async getStats(id) {
    const result = await query(
      'SELECT * FROM user_stats WHERE user_id = $1',
      [id]
    );
    return result.rows[0];
  }

  /**
   * Check if username exists
   */
  static async usernameExists(username, excludeUserId = null) {
    const params = [username];
    let queryText = 'SELECT id FROM users WHERE username = $1';
    
    if (excludeUserId) {
      queryText += ' AND id != $2';
      params.push(excludeUserId);
    }

    const result = await query(queryText, params);
    return result.rows.length > 0;
  }

  /**
   * Check if email exists
   */
  static async emailExists(email, excludeUserId = null) {
    const params = [email];
    let queryText = 'SELECT id FROM users WHERE email = $1';
    
    if (excludeUserId) {
      queryText += ' AND id != $2';
      params.push(excludeUserId);
    }

    const result = await query(queryText, params);
    return result.rows.length > 0;
  }
}

module.exports = User;

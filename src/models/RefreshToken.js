const { query } = require('../config/database');

class RefreshToken {
  /**
   * Create refresh token
   */
  static async create(userId, token, expiresAt) {
    const result = await query(
      'INSERT INTO refresh_tokens (user_id, token, expires_at) VALUES ($1, $2, $3) RETURNING *',
      [userId, token, expiresAt]
    );
    return result.rows[0];
  }

  /**
   * Find valid token
   */
  static async findValid(token) {
    const result = await query(
      'SELECT * FROM refresh_tokens WHERE token = $1 AND expires_at > NOW()',
      [token]
    );
    return result.rows[0];
  }

  /**
   * Delete token
   */
  static async delete(token) {
    await query(
      'DELETE FROM refresh_tokens WHERE token = $1',
      [token]
    );
  }

  /**
   * Delete user's tokens
   */
  static async deleteUserTokens(userId) {
    await query(
      'DELETE FROM refresh_tokens WHERE user_id = $1',
      [userId]
    );
  }

  /**
   * Delete expired tokens
   */
  static async deleteExpired() {
    const result = await query(
      'DELETE FROM refresh_tokens WHERE expires_at < NOW() RETURNING *'
    );
    return result.rows.length;
  }
}

module.exports = RefreshToken;

const { query } = require('../config/database');

class Lesson {
  /**
   * Find lesson by ID
   */
  static async findById(id) {
    const result = await query(
      `SELECT l.*, 
              c.title as chapter_title,
              s.name as subject_name
       FROM lessons l
       JOIN chapters c ON l.chapter_id = c.id
       JOIN subjects s ON c.subject_id = s.id
       WHERE l.id = $1`,
      [id]
    );
    return result.rows[0];
  }

  /**
   * Find lessons by chapter
   */
  static async findByChapter(chapterId) {
    const result = await query(
      `SELECT * FROM lessons
       WHERE chapter_id = $1
       ORDER BY order_index ASC`,
      [chapterId]
    );
    return result.rows;
  }

  /**
   * Check if user has completed lesson
   */
  static async isCompletedByUser(lessonId, userId) {
    const result = await query(
      'SELECT id FROM lesson_completions WHERE user_id = $1 AND lesson_id = $2',
      [userId, lessonId]
    );
    return result.rows.length > 0;
  }

  /**
   * Get user's lesson completion
   */
  static async getUserCompletion(lessonId, userId) {
    const result = await query(
      'SELECT * FROM lesson_completions WHERE user_id = $1 AND lesson_id = $2',
      [userId, lessonId]
    );
    return result.rows[0];
  }

  /**
   * Mark lesson as completed
   */
  static async markCompleted(lessonId, userId, timeSpent) {
    const result = await query(
      'INSERT INTO lesson_completions (user_id, lesson_id, time_spent) VALUES ($1, $2, $3) RETURNING *',
      [userId, lessonId, timeSpent]
    );
    return result.rows[0];
  }

  /**
   * Get user's total completed lessons count
   */
  static async getUserCompletedCount(userId) {
    const result = await query(
      'SELECT COUNT(*) as count FROM lesson_completions WHERE user_id = $1',
      [userId]
    );
    return parseInt(result.rows[0].count);
  }

  /**
   * Get lessons with user completion status
   */
  static async findByChapterWithCompletion(chapterId, userId) {
    const result = await query(
      `SELECT l.*, lc.completed_at, lc.time_spent
       FROM lessons l
       LEFT JOIN lesson_completions lc ON l.id = lc.lesson_id AND lc.user_id = $2
       WHERE l.chapter_id = $1
       ORDER BY l.order_index ASC`,
      [chapterId, userId]
    );
    return result.rows;
  }
}

module.exports = Lesson;

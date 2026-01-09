const { query } = require('../config/database');

class Exercise {
  /**
   * Find all exercises
   */
  static async findAll(filters = {}) {
    let queryText = `
      SELECT e.*, s.name as subject_name, s.emoji as subject_emoji,
             (SELECT COUNT(*) FROM exercise_questions WHERE exercise_id = e.id) as question_count
      FROM exercises e
      JOIN subjects s ON e.subject_id = s.id
      WHERE 1=1
    `;
    const params = [];
    let paramCount = 1;

    if (filters.subjectId) {
      queryText += ` AND e.subject_id = $${paramCount}`;
      params.push(filters.subjectId);
      paramCount++;
    }

    if (filters.difficulty) {
      queryText += ` AND e.difficulty = $${paramCount}`;
      params.push(filters.difficulty);
      paramCount++;
    }

    queryText += ' ORDER BY e.created_at DESC';

    const result = await query(queryText, params);
    return result.rows;
  }

  /**
   * Find exercise by ID
   */
  static async findById(id) {
    const result = await query(
      `SELECT e.*, s.name as subject_name, s.emoji as subject_emoji,
              (SELECT COUNT(*) FROM exercise_questions WHERE exercise_id = e.id) as question_count
       FROM exercises e
       JOIN subjects s ON e.subject_id = s.id
       WHERE e.id = $1`,
      [id]
    );
    return result.rows[0];
  }

  /**
   * Get exercise questions
   */
  static async getQuestions(exerciseId) {
    const result = await query(
      `SELECT id, question_text, emoji, option_a, option_b, option_c, option_d, order_index
       FROM exercise_questions
       WHERE exercise_id = $1
       ORDER BY order_index ASC`,
      [exerciseId]
    );
    return result.rows;
  }

  /**
   * Get exercise questions with correct answers
   */
  static async getQuestionsWithAnswers(exerciseId) {
    const result = await query(
      `SELECT id, question_text, emoji, option_a, option_b, option_c, option_d, 
              correct_option, explanation, order_index
       FROM exercise_questions
       WHERE exercise_id = $1
       ORDER BY order_index ASC`,
      [exerciseId]
    );
    return result.rows;
  }

  /**
   * Get correct answers only
   */
  static async getCorrectAnswers(exerciseId) {
    const result = await query(
      'SELECT correct_option FROM exercise_questions WHERE exercise_id = $1 ORDER BY order_index ASC',
      [exerciseId]
    );
    return result.rows.map(row => row.correct_option);
  }

  /**
   * Create exercise attempt
   */
  static async createAttempt({ userId, exerciseId, score, totalQuestions, percentage, xpEarned, timeSpent, answers }) {
    const result = await query(
      `INSERT INTO exercise_attempts 
       (user_id, exercise_id, score, total_questions, percentage, xp_earned, time_spent, answers)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING id, created_at`,
      [userId, exerciseId, score, totalQuestions, percentage, xpEarned, timeSpent, JSON.stringify(answers)]
    );
    return result.rows[0];
  }

  /**
   * Get user's exercise attempts
   */
  static async getUserAttempts(userId, exerciseId = null) {
    let queryText = `
      SELECT ea.*, e.title, e.difficulty, e.description
      FROM exercise_attempts ea
      JOIN exercises e ON ea.exercise_id = e.id
      WHERE ea.user_id = $1
    `;
    
    const params = [userId];

    if (exerciseId) {
      queryText += ' AND ea.exercise_id = $2';
      params.push(exerciseId);
    }

    queryText += ' ORDER BY ea.created_at DESC';

    const result = await query(queryText, params);
    return result.rows;
  }

  /**
   * Get user's attempt count for exercise
   */
  static async getUserAttemptCount(userId, exerciseId) {
    const result = await query(
      'SELECT COUNT(*) as count FROM exercise_attempts WHERE user_id = $1 AND exercise_id = $2',
      [userId, exerciseId]
    );
    return parseInt(result.rows[0].count);
  }

  /**
   * Get user's best score for exercise
   */
  static async getUserBestScore(userId, exerciseId) {
    const result = await query(
      `SELECT MAX(percentage) as best_percentage, MAX(score) as best_score
       FROM exercise_attempts 
       WHERE user_id = $1 AND exercise_id = $2`,
      [userId, exerciseId]
    );
    return result.rows[0];
  }

  /**
   * Get user's total exercise completions
   */
  static async getUserTotalCompletions(userId) {
    const result = await query(
      'SELECT COUNT(*) as count FROM exercise_attempts WHERE user_id = $1',
      [userId]
    );
    return parseInt(result.rows[0].count);
  }
}

module.exports = Exercise;

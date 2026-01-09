const { query } = require('../config/database');

class Quiz {
  /**
   * Find all quizzes
   */
  static async findAll(filters = {}) {
    let queryText = `
      SELECT q.*, s.name as subject_name, s.emoji as subject_emoji,
             (SELECT COUNT(*) FROM quiz_questions WHERE quiz_id = q.id) as question_count
      FROM quizzes q
      JOIN subjects s ON q.subject_id = s.id
      WHERE 1=1
    `;
    const params = [];
    let paramCount = 1;

    if (filters.subjectId) {
      queryText += ` AND q.subject_id = $${paramCount}`;
      params.push(filters.subjectId);
      paramCount++;
    }

    if (filters.difficulty) {
      queryText += ` AND q.difficulty = $${paramCount}`;
      params.push(filters.difficulty);
      paramCount++;
    }

    queryText += ' ORDER BY q.created_at DESC';

    const result = await query(queryText, params);
    return result.rows;
  }

  /**
   * Find quiz by ID
   */
  static async findById(id) {
    const result = await query(
      `SELECT q.*, s.name as subject_name, s.emoji as subject_emoji,
              (SELECT COUNT(*) FROM quiz_questions WHERE quiz_id = q.id) as question_count
       FROM quizzes q
       JOIN subjects s ON q.subject_id = s.id
       WHERE q.id = $1`,
      [id]
    );
    return result.rows[0];
  }

  /**
   * Get quiz questions
   */
  static async getQuestions(quizId) {
    const result = await query(
      `SELECT id, question_text, option_a, option_b, option_c, option_d, order_index
       FROM quiz_questions
       WHERE quiz_id = $1
       ORDER BY order_index ASC`,
      [quizId]
    );
    return result.rows;
  }

  /**
   * Get quiz questions with correct answers
   */
  static async getQuestionsWithAnswers(quizId) {
    const result = await query(
      `SELECT id, question_text, option_a, option_b, option_c, option_d, 
              correct_option, explanation, order_index
       FROM quiz_questions
       WHERE quiz_id = $1
       ORDER BY order_index ASC`,
      [quizId]
    );
    return result.rows;
  }

  /**
   * Get correct answers only
   */
  static async getCorrectAnswers(quizId) {
    const result = await query(
      'SELECT correct_option FROM quiz_questions WHERE quiz_id = $1 ORDER BY order_index ASC',
      [quizId]
    );
    return result.rows.map(row => row.correct_option);
  }

  /**
   * Create quiz attempt
   */
  static async createAttempt({ userId, quizId, score, totalQuestions, percentage, xpEarned, timeSpent, isFirstAttempt, answers }) {
    const result = await query(
      `INSERT INTO quiz_attempts 
       (user_id, quiz_id, score, total_questions, percentage, xp_earned, time_spent, is_first_attempt, answers)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING id, created_at`,
      [userId, quizId, score, totalQuestions, percentage, xpEarned, timeSpent, isFirstAttempt, JSON.stringify(answers)]
    );
    return result.rows[0];
  }

  /**
   * Check if user has attempted quiz before
   */
  static async hasUserAttempted(userId, quizId) {
    const result = await query(
      'SELECT COUNT(*) as count FROM quiz_attempts WHERE user_id = $1 AND quiz_id = $2',
      [userId, quizId]
    );
    return parseInt(result.rows[0].count) > 0;
  }

  /**
   * Get user's quiz attempts
   */
  static async getUserAttempts(userId, quizId = null) {
    let queryText = `
      SELECT qa.*, q.title, q.difficulty, q.emoji
      FROM quiz_attempts qa
      JOIN quizzes q ON qa.quiz_id = q.id
      WHERE qa.user_id = $1
    `;
    
    const params = [userId];

    if (quizId) {
      queryText += ' AND qa.quiz_id = $2';
      params.push(quizId);
    }

    queryText += ' ORDER BY qa.created_at DESC';

    const result = await query(queryText, params);
    return result.rows;
  }

  /**
   * Get quiz leaderboard
   */
  static async getLeaderboard(quizId, limit = 10) {
    const result = await query(
      `SELECT 
         u.id, u.username, u.avatar, u.level,
         qa.score, qa.total_questions, qa.percentage, qa.time_spent, qa.created_at
       FROM quiz_attempts qa
       JOIN users u ON qa.user_id = u.id
       WHERE qa.quiz_id = $1
       ORDER BY qa.percentage DESC, qa.time_spent ASC
       LIMIT $2`,
      [quizId, limit]
    );
    return result.rows;
  }

  /**
   * Get user's attempt count for quiz
   */
  static async getUserAttemptCount(userId, quizId) {
    const result = await query(
      'SELECT COUNT(*) as count FROM quiz_attempts WHERE user_id = $1 AND quiz_id = $2',
      [userId, quizId]
    );
    return parseInt(result.rows[0].count);
  }

  /**
   * Get user's best score for quiz
   */
  static async getUserBestScore(userId, quizId) {
    const result = await query(
      `SELECT MAX(percentage) as best_percentage, MAX(score) as best_score
       FROM quiz_attempts 
       WHERE user_id = $1 AND quiz_id = $2`,
      [userId, quizId]
    );
    return result.rows[0];
  }
}

module.exports = Quiz;

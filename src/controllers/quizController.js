const { query } = require('../config/database');
const { AppError, catchAsync } = require('../middleware/errorHandler');
const { submitQuiz, getUserQuizHistory } = require('../services/quizService');
const logger = require('../utils/logger');

/**
 * Get all quizzes
 */
exports.getAllQuizzes = catchAsync(async (req, res) => {
  const { subjectId, difficulty } = req.query;
  const userId = req.user?.id;
  logger.info(`📋 Fetching all quizzes (subjectId: ${subjectId || 'all'}, difficulty: ${difficulty || 'all'})`);

  let queryText = `
    SELECT q.*, s.name as subject_name, s.emoji as subject_emoji,
           (SELECT COUNT(*) FROM quiz_questions WHERE quiz_id = q.id) as question_count
           ${userId ? `, (SELECT COUNT(*) FROM quiz_attempts WHERE quiz_id = q.id AND user_id = $${userId ? 2 : 1}) as attempt_count` : ''}
    FROM quizzes q
    JOIN subjects s ON q.subject_id = s.id
    WHERE 1=1
  `;

  const params = [];
  let paramCount = 1;

  if (subjectId) {
    params.push(subjectId);
    queryText += ` AND q.subject_id = $${paramCount}`;
    paramCount++;
  }

  if (userId) {
    params.push(userId);
  }

  if (difficulty) {
    params.push(difficulty);
    queryText += ` AND q.difficulty = $${paramCount}`;
    paramCount++;
  }

  queryText += ' ORDER BY q.created_at DESC';

  const result = await query(queryText, params);

  logger.info(`✅ Quizzes retrieved: ${result.rows.length} quizzes found`);

  res.json({
    success: true,
    data: result.rows
  });
});

/**
 * Get quiz by ID
 */
exports.getQuizById = catchAsync(async (req, res) => {
  const { quizId } = req.params;
  const userId = req.user?.id;
  logger.info(`❓ Fetching quiz ID ${quizId}`);

  let queryText = `
    SELECT q.*, s.name as subject_name, s.emoji as subject_emoji,
           (SELECT COUNT(*) FROM quiz_questions WHERE quiz_id = q.id) as question_count
           ${userId ? `, (SELECT COUNT(*) FROM quiz_attempts WHERE quiz_id = q.id AND user_id = $2) as attempt_count` : ''}
    FROM quizzes q
    JOIN subjects s ON q.subject_id = s.id
    WHERE q.id = $1
  `;

  const params = userId ? [quizId, userId] : [quizId];
  const result = await query(queryText, params);

  if (result.rows.length === 0) {
    logger.warn(`⚠️ Quiz not found: ID ${quizId}`);
    throw new AppError('Quiz not found', 404);
  }

  logger.info(`✅ Quiz retrieved: ${result.rows[0].title}`);

  res.json({
    success: true,
    data: result.rows[0]
  });
});

/**
 * Get quiz questions (without correct answers for non-authenticated users)
 */
exports.getQuizQuestions = catchAsync(async (req, res) => {
  const { quizId } = req.params;

  // Verify quiz exists
  const quizResult = await query(
    'SELECT id FROM quizzes WHERE id = $1',
    [quizId]
  );

  if (quizResult.rows.length === 0) {
    throw new AppError('Quiz not found', 404);
  }

  // Get questions without correct answers
  const result = await query(
    `SELECT id, question_text, option_a, option_b, option_c, option_d, order_index
     FROM quiz_questions
     WHERE quiz_id = $1
     ORDER BY order_index ASC`,
    [quizId]
  );

  res.json({
    success: true,
    data: result.rows
  });
});

/**
 * Submit quiz attempt
 */
exports.submitQuizAttempt = catchAsync(async (req, res) => {
  const { quizId } = req.params;
  const { answers, timeSpent } = req.body;
  const userId = req.user.id;

  const result = await submitQuiz(userId, quizId, answers, timeSpent);

  res.json({
    success: true,
    message: result.isFirstAttempt ? 'Quiz completed!' : 'Quiz completed (no XP - already completed before)',
    data: result
  });
});

/**
 * Get user's quiz attempts
 */
exports.getUserAttempts = catchAsync(async (req, res) => {
  const userId = req.user.id;
  const { quizId } = req.query;

  const attempts = await getUserQuizHistory(userId, quizId);

  res.json({
    success: true,
    data: attempts
  });
});

/**
 * Get quiz leaderboard
 */
exports.getQuizLeaderboard = catchAsync(async (req, res) => {
  const { quizId } = req.params;
  const { limit = 10 } = req.query;

  // Verify quiz exists
  const quizResult = await query(
    'SELECT id, title FROM quizzes WHERE id = $1',
    [quizId]
  );

  if (quizResult.rows.length === 0) {
    throw new AppError('Quiz not found', 404);
  }

  // Get top scores
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

  res.json({
    success: true,
    data: {
      quiz: quizResult.rows[0],
      leaderboard: result.rows
    }
  });
});

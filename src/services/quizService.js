const { query, transaction } = require('../config/database');
const { AppError } = require('../middleware/errorHandler');
const { addXp } = require('./userService');

/**
 * Check if this is the first attempt for a quiz
 */
const isFirstAttempt = async (userId, quizId) => {
  const result = await query(
    'SELECT COUNT(*) as count FROM quiz_attempts WHERE user_id = $1 AND quiz_id = $2',
    [userId, quizId]
  );

  return parseInt(result.rows[0].count) === 0;
};

/**
 * Calculate score from answers
 */
const calculateScore = (userAnswers, correctAnswers) => {
  let correct = 0;
  for (let i = 0; i < userAnswers.length; i++) {
    if (userAnswers[i] === correctAnswers[i]) {
      correct++;
    }
  }
  return correct;
};

/**
 * Get quiz questions with correct answers
 */
const getQuizQuestions = async (quizId) => {
  const result = await query(
    `SELECT id, question_text, option_a, option_b, option_c, option_d, 
            correct_option, explanation, order_index
     FROM quiz_questions
     WHERE quiz_id = $1
     ORDER BY order_index ASC`,
    [quizId]
  );

  return result.rows;
};

/**
 * Submit quiz attempt
 */
const submitQuiz = async (userId, quizId, answers, timeSpent) => {
  return await transaction(async (client) => {
    // Get quiz details
    const quizResult = await client.query(
      'SELECT title, subject_id, xp_base_reward, difficulty FROM quizzes WHERE id = $1',
      [quizId]
    );

    if (quizResult.rows.length === 0) {
      throw new AppError('Quiz not found', 404);
    }

    const quiz = quizResult.rows[0];

    // Get questions
    const questions = await client.query(
      'SELECT correct_option FROM quiz_questions WHERE quiz_id = $1 ORDER BY order_index ASC',
      [quizId]
    );

    const correctAnswers = questions.rows.map(q => q.correct_option);
    const score = calculateScore(answers, correctAnswers);
    const percentage = (score / correctAnswers.length) * 100;

    // Check if first attempt
    const firstAttemptResult = await client.query(
      'SELECT COUNT(*) as count FROM quiz_attempts WHERE user_id = $1 AND quiz_id = $2',
      [userId, quizId]
    );

    const isFirst = parseInt(firstAttemptResult.rows[0].count) === 0;

    // Calculate XP (only award on first attempt)
    let xpEarned = 0;
    if (isFirst) {
      // Base XP + bonus for percentage
      xpEarned = quiz.xp_base_reward + Math.floor((percentage / 100) * quiz.xp_base_reward);
      
      // Bonus for perfect score
      if (percentage === 100) {
        xpEarned += 10;
      }
    }

    // Insert quiz attempt
    const attemptResult = await client.query(
      `INSERT INTO quiz_attempts 
       (user_id, quiz_id, score, total_questions, xp_earned, time_spent, is_first_attempt, answers)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING id, completed_at`,
      [userId, quizId, score, correctAnswers.length, xpEarned, timeSpent, isFirst, JSON.stringify(answers)]
    );

    // Add XP if first attempt
    let xpResult = null;
    let newAchievements = [];
    if (isFirst && xpEarned > 0) {
      xpResult = await addXp(userId, xpEarned);

      // Add activity history
      await client.query(
        `INSERT INTO activity_history (user_id, activity_type, activity_title, xp_earned, metadata)
         VALUES ($1, 'quiz', $2, $3, $4)`,
        [userId, quiz.title, xpEarned, JSON.stringify({ 
          quiz_id: quizId, 
          score, 
          total: correctAnswers.length,
          percentage
        })]
      );

      // Check for quiz achievements
      newAchievements = await checkQuizAchievements(userId, quizId, score, correctAnswers.length, percentage, client);
    }

    return {
      attemptId: attemptResult.rows[0].id,
      score,
      totalQuestions: correctAnswers.length,
      percentage: Math.round(percentage),
      xpEarned,
      isFirstAttempt: isFirst,
      correctAnswers,
      timeSpent,
      xpResult,
      achievements: newAchievements
    };
  });
};

/**
 * Check and award quiz-related achievements
 */
const checkQuizAchievements = async (userId, quizId, score, total, percentage, client) => {
  // Import achievement service
  const { checkAndUnlockAchievements } = require('./achievementService');
  
  // Check all achievements after quiz completion
  // This will check for first_quiz, quiz_master, perfect_score, etc.
  const newAchievements = await checkAndUnlockAchievements(userId);
  
  return newAchievements;
};

/**
 * Get user's quiz history
 */
const getUserQuizHistory = async (userId, quizId = null) => {
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

  queryText += ' ORDER BY qa.completed_at DESC';

  const result = await query(queryText, params);
  return result.rows;
};

module.exports = {
  isFirstAttempt,
  calculateScore,
  getQuizQuestions,
  submitQuiz,
  getUserQuizHistory
};

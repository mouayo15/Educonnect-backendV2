const { query, transaction } = require('../config/database');
const { AppError, catchAsync } = require('../middleware/errorHandler');
const { addXp } = require('../services/userService');

/**
 * Get all exercises
 */
exports.getAllExercises = catchAsync(async (req, res) => {
  const { subjectId, difficulty } = req.query;
  const userId = req.user?.id;

  let queryText = `
    SELECT e.*, s.name as subject_name, s.emoji as subject_emoji,
           (SELECT COUNT(*) FROM exercise_questions WHERE exercise_id = e.id) as question_count
           ${userId ? `, (SELECT COUNT(*) FROM exercise_attempts WHERE exercise_id = e.id AND user_id = $${userId ? 2 : 1}) as attempt_count` : ''}
    FROM exercises e
    JOIN subjects s ON e.subject_id = s.id
    WHERE 1=1
  `;

  const params = [];
  let paramCount = 1;

  if (subjectId) {
    params.push(subjectId);
    queryText += ` AND e.subject_id = $${paramCount}`;
    paramCount++;
  }

  if (userId) {
    params.push(userId);
  }

  if (difficulty) {
    params.push(difficulty);
    queryText += ` AND e.difficulty = $${paramCount}`;
    paramCount++;
  }

  queryText += ' ORDER BY e.created_at DESC';

  const result = await query(queryText, params);

  res.json({
    success: true,
    data: result.rows
  });
});

/**
 * Get exercise by ID
 */
exports.getExerciseById = catchAsync(async (req, res) => {
  const { exerciseId } = req.params;
  const userId = req.user?.id;

  let queryText = `
    SELECT e.*, s.name as subject_name, s.emoji as subject_emoji,
           (SELECT COUNT(*) FROM exercise_questions WHERE exercise_id = e.id) as question_count
           ${userId ? `, (SELECT COUNT(*) FROM exercise_attempts WHERE exercise_id = e.id AND user_id = $2) as attempt_count` : ''}
    FROM exercises e
    JOIN subjects s ON e.subject_id = s.id
    WHERE e.id = $1
  `;

  const params = userId ? [exerciseId, userId] : [exerciseId];
  const result = await query(queryText, params);

  if (result.rows.length === 0) {
    throw new AppError('Exercise not found', 404);
  }

  res.json({
    success: true,
    data: result.rows[0]
  });
});

/**
 * Get exercise questions
 */
exports.getExerciseQuestions = catchAsync(async (req, res) => {
  const { exerciseId } = req.params;

  // Verify exercise exists
  const exerciseResult = await query(
    'SELECT id FROM exercises WHERE id = $1',
    [exerciseId]
  );

  if (exerciseResult.rows.length === 0) {
    throw new AppError('Exercise not found', 404);
  }

  // Get questions without correct answers
  const result = await query(
    `SELECT id, question_text, emoji, option_a, option_b, option_c, option_d, order_index
     FROM exercise_questions
     WHERE exercise_id = $1
     ORDER BY order_index ASC`,
    [exerciseId]
  );

  res.json({
    success: true,
    data: result.rows
  });
});

/**
 * Submit exercise attempt
 */
exports.submitExerciseAttempt = catchAsync(async (req, res) => {
  const { exerciseId } = req.params;
  const { answers, timeSpent } = req.body;
  const userId = req.user.id;

  const result = await transaction(async (client) => {
    // Get exercise details
    const exerciseResult = await client.query(
      'SELECT title, subject_id, xp_reward, difficulty FROM exercises WHERE id = $1',
      [exerciseId]
    );

    if (exerciseResult.rows.length === 0) {
      throw new AppError('Exercise not found', 404);
    }

    const exercise = exerciseResult.rows[0];

    // Get questions
    const questions = await client.query(
      'SELECT correct_option FROM exercise_questions WHERE exercise_id = $1 ORDER BY order_index ASC',
      [exerciseId]
    );

    const correctAnswers = questions.rows.map(q => q.correct_option);
    
    // Calculate score
    let score = 0;
    for (let i = 0; i < answers.length; i++) {
      if (answers[i] === correctAnswers[i]) {
        score++;
      }
    }

    const percentage = (score / correctAnswers.length) * 100;

    // Always award XP for exercises (can be repeated for practice)
    const xpEarned = Math.floor((score / correctAnswers.length) * exercise.xp_reward);

    // Insert exercise attempt
    const attemptResult = await client.query(
      `INSERT INTO exercise_attempts 
       (user_id, exercise_id, score, total_questions, percentage, xp_earned, time_spent, answers)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING id, created_at`,
      [userId, exerciseId, score, correctAnswers.length, percentage, xpEarned, timeSpent, JSON.stringify(answers)]
    );

    // Add XP
    const xpResult = await addXp(userId, xpEarned);

    // Add activity history
    await client.query(
      `INSERT INTO activity_history (user_id, activity_type, activity_title, xp_earned, metadata)
       VALUES ($1, 'exercise', $2, $3, $4)`,
      [userId, exercise.title, xpEarned, JSON.stringify({ 
        exercise_id: exerciseId, 
        score, 
        total: correctAnswers.length,
        percentage
      })]
    );

    // Check and unlock achievements
    const { checkAndUnlockAchievements } = require('../services/achievementService');
    const newAchievements = await checkAndUnlockAchievements(userId);

    return {
      attemptId: attemptResult.rows[0].id,
      score,
      totalQuestions: correctAnswers.length,
      percentage: Math.round(percentage),
      xpEarned,
      correctAnswers,
      timeSpent,
      xpResult,
      achievements: newAchievements
    };
  });

  res.json({
    success: true,
    message: 'Exercise completed!',
    data: result
  });
});

/**
 * Get user's exercise attempts
 */
exports.getUserAttempts = catchAsync(async (req, res) => {
  const userId = req.user.id;
  const { exerciseId } = req.query;

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

  res.json({
    success: true,
    data: result.rows
  });
});

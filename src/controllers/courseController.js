const { query } = require('../config/database');
const { AppError, catchAsync } = require('../middleware/errorHandler');

/**
 * Get all subjects
 */
exports.getAllSubjects = catchAsync(async (req, res) => {
  const result = await query(
    `SELECT * FROM subjects ORDER BY order_index ASC`
  );

  res.json({
    success: true,
    data: result.rows
  });
});

/**
 * Get subject by ID
 */
exports.getSubjectById = catchAsync(async (req, res) => {
  const { subjectId } = req.params;

  const result = await query(
    'SELECT * FROM subjects WHERE id = $1',
    [subjectId]
  );

  if (result.rows.length === 0) {
    throw new AppError('Subject not found', 404);
  }

  res.json({
    success: true,
    data: result.rows[0]
  });
});

/**
 * Get chapters by subject
 */
exports.getChaptersBySubject = catchAsync(async (req, res) => {
  const { subjectId } = req.params;

  // Verify subject exists
  const subjectResult = await query(
    'SELECT id FROM subjects WHERE id = $1',
    [subjectId]
  );

  if (subjectResult.rows.length === 0) {
    throw new AppError('Subject not found', 404);
  }

  const result = await query(
    `SELECT c.*, 
            (SELECT COUNT(*) FROM lessons WHERE chapter_id = c.id) as lesson_count
     FROM chapters c
     WHERE c.subject_id = $1
     ORDER BY c.order_index ASC`,
    [subjectId]
  );

  res.json({
    success: true,
    data: result.rows
  });
});

/**
 * Get chapter by ID
 */
exports.getChapterById = catchAsync(async (req, res) => {
  const { chapterId } = req.params;

  const result = await query(
    `SELECT c.*,
            s.name as subject_name,
            (SELECT COUNT(*) FROM lessons WHERE chapter_id = c.id) as lesson_count
     FROM chapters c
     JOIN subjects s ON c.subject_id = s.id
     WHERE c.id = $1`,
    [chapterId]
  );

  if (result.rows.length === 0) {
    throw new AppError('Chapter not found', 404);
  }

  res.json({
    success: true,
    data: result.rows[0]
  });
});

/**
 * Get lessons by chapter
 */
exports.getLessonsByChapter = catchAsync(async (req, res) => {
  const { chapterId } = req.params;
  const userId = req.user?.id;

  // Verify chapter exists
  const chapterResult = await query(
    'SELECT id FROM chapters WHERE id = $1',
    [chapterId]
  );

  if (chapterResult.rows.length === 0) {
    throw new AppError('Chapter not found', 404);
  }

  let queryText = `
    SELECT l.*
    ${userId ? ', lc.completed_at, lc.time_spent' : ''}
    FROM lessons l
    ${userId ? 'LEFT JOIN lesson_completions lc ON l.id = lc.lesson_id AND lc.user_id = $2' : ''}
    WHERE l.chapter_id = $1
    ORDER BY l.order_index ASC
  `;

  const params = userId ? [chapterId, userId] : [chapterId];
  const result = await query(queryText, params);

  res.json({
    success: true,
    data: result.rows
  });
});

/**
 * Get lesson by ID
 */
exports.getLessonById = catchAsync(async (req, res) => {
  const { lessonId } = req.params;
  const userId = req.user?.id;

  let queryText = `
    SELECT l.*, 
           c.title as chapter_title,
           s.name as subject_name
           ${userId ? ', lc.completed_at, lc.time_spent' : ''}
    FROM lessons l
    JOIN chapters c ON l.chapter_id = c.id
    JOIN subjects s ON c.subject_id = s.id
    ${userId ? 'LEFT JOIN lesson_completions lc ON l.id = lc.lesson_id AND lc.user_id = $2' : ''}
    WHERE l.id = $1
  `;

  const params = userId ? [lessonId, userId] : [lessonId];
  const result = await query(queryText, params);

  if (result.rows.length === 0) {
    throw new AppError('Lesson not found', 404);
  }

  res.json({
    success: true,
    data: result.rows[0]
  });
});

/**
 * Complete a lesson
 */
exports.completeLesson = catchAsync(async (req, res) => {
  const { lessonId } = req.params;
  const { timeSpent } = req.body;
  const userId = req.user.id;

  // Check if lesson exists
  const lessonResult = await query(
    'SELECT id, title, xp_reward FROM lessons WHERE id = $1',
    [lessonId]
  );

  if (lessonResult.rows.length === 0) {
    throw new AppError('Lesson not found', 404);
  }

  const lesson = lessonResult.rows[0];

  // Check if already completed
  const completionCheck = await query(
    'SELECT id FROM lesson_completions WHERE user_id = $1 AND lesson_id = $2',
    [userId, lessonId]
  );

  if (completionCheck.rows.length > 0) {
    return res.json({
      success: true,
      message: 'Lesson already completed',
      xpEarned: 0
    });
  }

  // Mark as completed
  await query(
    'INSERT INTO lesson_completions (user_id, lesson_id, time_spent) VALUES ($1, $2, $3)',
    [userId, lessonId, timeSpent]
  );

  // Award XP
  const { addXp } = require('../services/userService');
  const xpResult = await addXp(userId, lesson.xp_reward);

  // Add activity
  await query(
    `INSERT INTO activity_history (user_id, activity_type, activity_title, xp_earned, metadata)
     VALUES ($1, 'lesson', $2, $3, $4)`,
    [userId, lesson.title, lesson.xp_reward, JSON.stringify({ lesson_id: lessonId })]
  );

  // Check and unlock achievements
  const { checkAndUnlockAchievements } = require('../services/achievementService');
  const newAchievements = await checkAndUnlockAchievements(userId);

  res.json({
    success: true,
    message: 'Lesson completed successfully',
    xpEarned: lesson.xp_reward,
    xpResult,
    achievements: newAchievements
  });
});

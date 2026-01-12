const express = require('express');
const router = express.Router();
const courseController = require('../controllers/courseController');
const { optionalAuth, verifyToken } = require('../middleware/auth');
const { integerParamValidation, completeLessonValidation } = require('../middleware/validation');

// Subjects (public)
router.get('/subjects', optionalAuth, courseController.getAllSubjects);
router.get('/subjects/:subjectId', optionalAuth, integerParamValidation('subjectId'), courseController.getSubjectById);

// Chapters (public)
router.get('/subjects/:subjectId/chapters', optionalAuth, integerParamValidation('subjectId'), courseController.getChaptersBySubject);
router.get('/chapters/:chapterId', optionalAuth, integerParamValidation('chapterId'), courseController.getChapterById);

// Lessons (public to view, auth to complete)
router.get('/chapters/:chapterId/lessons', optionalAuth, integerParamValidation('chapterId'), courseController.getLessonsByChapter);
router.get('/lessons/:lessonId', optionalAuth, integerParamValidation('lessonId'), courseController.getLessonById);
router.post('/lessons/:lessonId/complete', verifyToken, integerParamValidation('lessonId'), completeLessonValidation, courseController.completeLesson);

module.exports = router;

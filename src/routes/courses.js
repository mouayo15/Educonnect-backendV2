const express = require('express');
const router = express.Router();
const courseController = require('../controllers/courseController');
const { optionalAuth, verifyToken } = require('../middleware/auth');
const { uuidParamValidation, completeLessonValidation } = require('../middleware/validation');

// Subjects (public)
router.get('/subjects', optionalAuth, courseController.getAllSubjects);
router.get('/subjects/:subjectId', optionalAuth, uuidParamValidation('subjectId'), courseController.getSubjectById);

// Chapters (public)
router.get('/subjects/:subjectId/chapters', optionalAuth, uuidParamValidation('subjectId'), courseController.getChaptersBySubject);
router.get('/chapters/:chapterId', optionalAuth, uuidParamValidation('chapterId'), courseController.getChapterById);

// Lessons (public to view, auth to complete)
router.get('/chapters/:chapterId/lessons', optionalAuth, uuidParamValidation('chapterId'), courseController.getLessonsByChapter);
router.get('/lessons/:lessonId', optionalAuth, uuidParamValidation('lessonId'), courseController.getLessonById);
router.post('/lessons/:lessonId/complete', verifyToken, completeLessonValidation, courseController.completeLesson);

module.exports = router;

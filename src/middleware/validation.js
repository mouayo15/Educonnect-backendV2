const { body, param, query, validationResult } = require('express-validator');

/**
 * Middleware to check validation results
 */
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array().map(err => ({
        field: err.path,
        message: err.msg
      }))
    });
  }
  next();
};

/**
 * AUTH VALIDATIONS
 */
const registerValidation = [
  body('username')
    .trim()
    .isLength({ min: 3, max: 30 })
    .withMessage('Username must be between 3 and 30 characters')
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('Username can only contain letters, numbers, and underscores'),
  
  body('email')
    .trim()
    .isEmail()
    .withMessage('Invalid email address')
    .normalizeEmail(),
  
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number'),
  
  body('avatar')
    .optional()
    .isString()
    .withMessage('Avatar must be a string'),
  
  validate
];

const loginValidation = [
  body('email')
    .trim()
    .isEmail()
    .withMessage('Invalid email address')
    .normalizeEmail(),
  
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
  
  validate
];

const refreshTokenValidation = [
  body('refreshToken')
    .notEmpty()
    .withMessage('Refresh token is required'),
  
  validate
];

const changePasswordValidation = [
  body('currentPassword')
    .notEmpty()
    .withMessage('Current password is required'),
  
  body('newPassword')
    .isLength({ min: 8 })
    .withMessage('New password must be at least 8 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('New password must contain at least one uppercase, lowercase, and number'),
  
  validate
];

/**
 * USER VALIDATIONS
 */
const updateProfileValidation = [
  body('username')
    .optional()
    .trim()
    .isLength({ min: 3, max: 30 })
    .withMessage('Username must be between 3 and 30 characters')
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('Username can only contain letters, numbers, and underscores'),
  
  body('avatar')
    .optional()
    .isString()
    .withMessage('Avatar must be a string'),
  
  validate
];

/**
 * QUIZ VALIDATIONS
 */
const submitQuizValidation = [
  param('quizId')
    .isInt({ min: 1 })
    .withMessage('Invalid quiz ID'),
  
  body('answers')
    .isArray({ min: 1 })
    .withMessage('Answers must be a non-empty array'),
  
  body('answers.*')
    .isInt({ min: 0, max: 3 })
    .withMessage('Each answer must be between 0 and 3'),
  
  body('timeSpent')
    .isInt({ min: 1 })
    .withMessage('Time spent must be a positive integer'),
  
  validate
];

/**
 * EXERCISE VALIDATIONS
 */
const submitExerciseValidation = [
  param('exerciseId')
    .isUUID()
    .withMessage('Invalid exercise ID'),
  
  body('answers')
    .isArray({ min: 1 })
    .withMessage('Answers must be a non-empty array'),
  
  body('answers.*')
    .isInt({ min: 0, max: 3 })
    .withMessage('Each answer must be between 0 and 3'),
  
  body('timeSpent')
    .isInt({ min: 1 })
    .withMessage('Time spent must be a positive integer'),
  
  validate
];

/**
 * LESSON VALIDATIONS
 */
const completeLessonValidation = [
  param('lessonId')
    .isUUID()
    .withMessage('Invalid lesson ID'),
  
  body('timeSpent')
    .isInt({ min: 1 })
    .withMessage('Time spent must be a positive integer'),
  
  validate
];

/**
 * PAGINATION VALIDATIONS
 */
const paginationValidation = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  
  validate
];

/**
 * UUID PARAM VALIDATION
 */
const uuidParamValidation = (paramName = 'id') => [
  param(paramName)
    .isUUID()
    .withMessage(`Invalid ${paramName}`),
  
  validate
];

const integerParamValidation = (paramName = 'id') => [
  param(paramName)
    .isInt({ min: 1 })
    .withMessage(`Invalid ${paramName}, must be a positive integer`),
  
  validate
];

module.exports = {
  validate,
  registerValidation,
  loginValidation,
  refreshTokenValidation,
  changePasswordValidation,
  updateProfileValidation,
  submitQuizValidation,
  submitExerciseValidation,
  completeLessonValidation,
  paginationValidation,
  uuidParamValidation,
  integerParamValidation
};

const rateLimit = require('express-rate-limit');

// Skip rate limiting in test environment
const skipRateLimiting = process.env.NODE_ENV === 'test';

/**
 * General API rate limiter
 */
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: {
    success: false,
    error: 'Too many requests, please try again later'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => skipRateLimiting
});

/**
 * Auth rate limiter (stricter for login/register)
 */
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts per 15 minutes
  skipSuccessfulRequests: true, // Don't count successful requests
  message: {
    success: false,
    error: 'Too many authentication attempts, please try again later'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => skipRateLimiting
});

/**
 * Quiz/Exercise submission rate limiter
 */
const submissionLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // 10 submissions per minute
  message: {
    success: false,
    error: 'Too many submissions, please slow down'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => skipRateLimiting
});

/**
 * Create custom rate limiter
 */
const createLimiter = (windowMs, max) => {
  return rateLimit({
    windowMs,
    max,
    message: {
      success: false,
      error: 'Rate limit exceeded'
    },
    standardHeaders: true,
    legacyHeaders: false,
  });
};

module.exports = {
  generalLimiter,
  authLimiter,
  submissionLimiter,
  createLimiter
};

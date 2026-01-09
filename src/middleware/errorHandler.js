/**
 * Custom error class
 */
class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Global error handler middleware
 */
const errorHandler = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.message = err.message || 'Internal Server Error';

  // Development error response (detailed)
  if (process.env.NODE_ENV === 'development') {
    return res.status(err.statusCode).json({
      success: false,
      error: err.message,
      stack: err.stack,
      details: err
    });
  }

  // Production error response (minimal)
  if (err.isOperational) {
    return res.status(err.statusCode).json({
      success: false,
      error: err.message
    });
  }

  // Programming or unknown errors: don't leak details
  console.error('ERROR 💥', err);
  return res.status(500).json({
    success: false,
    error: 'Something went wrong'
  });
};

/**
 * Catch async errors
 */
const catchAsync = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

/**
 * Handle 404 errors
 */
const notFound = (req, res) => {
  res.status(404).json({
    success: false,
    error: `Route ${req.originalUrl} not found`
  });
};

module.exports = {
  AppError,
  errorHandler,
  catchAsync,
  notFound
};

const logger = require('../utils/logger');

/**
 * Request logging middleware
 * Logs incoming requests and outgoing responses
 */
const requestLogger = (req, res, next) => {
  const startTime = Date.now();
  const method = req.method;
  const originalUrl = req.originalUrl;
  const userAgent = req.get('user-agent');
  const userInfo = req.user ? `User: ${req.user.userId}` : 'Anonymous';

  // Log incoming request
  logger.info(`📥 [${method}] ${originalUrl} - ${userInfo} - UserAgent: ${userAgent}`);

  // Capture original send function
  const originalSend = res.send;

  // Override send to log response
  res.send = function (data) {
    const duration = Date.now() - startTime;
    const statusCode = res.statusCode;
    const statusMessage = res.statusMessage || 'OK';

    // Determine log level based on status code
    let logLevel = 'info';
    if (statusCode >= 500) logLevel = 'error';
    else if (statusCode >= 400) logLevel = 'warn';

    logger.log(
      logLevel,
      `📤 [${method}] ${originalUrl} - Status: ${statusCode} ${statusMessage} - Duration: ${duration}ms`
    );

    // Call original send
    return originalSend.call(this, data);
  };

  next();
};

module.exports = requestLogger;

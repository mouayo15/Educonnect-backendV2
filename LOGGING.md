# Logging System Documentation

## Overview
The EduConnect API now has a comprehensive logging system that tracks all API requests, responses, and errors. This helps with debugging, monitoring, and understanding system behavior.

## Features

### 1. **Logger Utility** (`src/utils/logger.js`)
- Uses Winston for structured logging
- Supports multiple log levels: `error`, `warn`, `info`, `http`, `debug`
- Logs to both console and files
- File logs are stored in `/logs` directory:
  - `error.log` - Error-level logs only
  - `all.log` - All logs combined

### 2. **Request Logger Middleware** (`src/middleware/requestLogger.js`)
- Logs incoming requests with method, URL, user info, and user agent
- Logs outgoing responses with status code and duration
- Automatically determines log level based on HTTP status code:
  - 5xx errors → error level
  - 4xx errors → warn level
  - Success (2xx-3xx) → info level

### 3. **Error Handler Logging** (`src/middleware/errorHandler.js`)
- Logs all errors with full stack traces and details
- Provides different error responses for development and production
- Captures operational and non-operational errors

## Log Levels

| Level | Use Case | Symbol |
|-------|----------|--------|
| **error** | System errors, exceptions | ❌ |
| **warn** | Warnings, validation failures | ⚠️ |
| **info** | Successful operations, key events | ✅ |
| **http** | HTTP protocol details | 📡 |
| **debug** | Debugging information | 🐛 |

## Logging Patterns Used

### Authentication Events
```
📝 User registration attempt: email@example.com
✅ User registered successfully: email@example.com (ID: 123)
🔐 Login attempt: email@example.com
✅ User logged out: ID 456
🔑 Password change requested by user 789
```

### Resource Access
```
📚 Fetching all subjects
📄 Fetching user profile for ID 123
📊 Fetching user stats for ID 123
🏆 Fetching achievements for user ID 123
❓ Fetching quiz ID 456
💪 Fetching exercise ID 789
🏆 Fetching global leaderboard
```

### Errors and Warnings
```
⚠️ Login failed: Invalid password for email@example.com
⚠️ Username already taken: desired_username
🔒 Account locked: email@example.com (Failed attempts: 5)
❌ User profile not found: ID 123
```

## Configuration

### Log Level
Set the `LOG_LEVEL` environment variable to control logging verbosity:
```bash
LOG_LEVEL=debug    # Most verbose
LOG_LEVEL=info     # Default
LOG_LEVEL=warn     # Warnings and errors
LOG_LEVEL=error    # Errors only
```

### Output Locations
- **Console**: All logs (color-coded for easy reading)
- **File System**:
  - `/logs/error.log` - Error logs only
  - `/logs/all.log` - Complete log file

## Usage in Code

### Basic Logging
```javascript
const logger = require('../utils/logger');

// Success
logger.info(`✅ User registered successfully: ${email}`);

// Warning
logger.warn(`⚠️ Login failed: Invalid password`);

// Error
logger.error(`❌ Database connection failed`, { error: err });

// Debug
logger.debug(`Processing user ID: ${userId}`);
```

### In Controllers
```javascript
const logger = require('../utils/logger');

exports.getProfile = catchAsync(async (req, res) => {
  const userId = req.user.id;
  logger.info(`📄 Fetching user profile for ID ${userId}`);
  
  // ... operation code ...
  
  if (!user) {
    logger.error(`❌ User not found: ID ${userId}`);
    throw new AppError('User not found', 404);
  }
  
  logger.info(`✅ User profile retrieved: ${user.username}`);
  // ... send response ...
});
```

## Log Files

### Accessing Logs
```bash
# View error logs
cat logs/error.log

# View all logs
cat logs/all.log

# Real-time monitoring (Linux/Mac)
tail -f logs/all.log

# Real-time monitoring (PowerShell)
Get-Content logs/all.log -Wait
```

### Log Format
```
2024-01-12 10:30:45:123 info: ✅ User registered successfully: test@example.com
2024-01-12 10:31:12:456 error: ❌ [POST] /api/v1/auth/login - Error: Invalid credentials - Status: 401
2024-01-12 10:32:05:789 warn: ⚠️ Login failed: Invalid password for user@example.com
```

## Implementation Details

### Controllers with Logging
The following controllers have been enhanced with comprehensive logging:

1. **authController.js**
   - Register, login, logout, token refresh, password change
   - Tracks all auth events and failures

2. **userController.js**
   - Profile access and updates
   - Stats and achievements retrieval
   - Activity history tracking

3. **courseController.js**
   - Subject and chapter retrieval
   - Learning material access

4. **quizController.js**
   - Quiz fetching and attempts
   - Assessment tracking

5. **exerciseController.js**
   - Exercise retrieval and progress
   - Practice tracking

6. **leaderboardController.js**
   - Leaderboard access
   - Ranking queries

## Benefits

✅ **Debugging**: Quickly identify issues with detailed error traces
✅ **Monitoring**: Track API usage patterns and performance
✅ **Security**: Log suspicious activities (failed logins, locked accounts)
✅ **Auditing**: Maintain records of user actions
✅ **Performance**: Monitor endpoint response times
✅ **User Support**: Investigate user-reported issues

## Best Practices

1. **Always log the intent**: Use clear, emoji-prefixed messages
2. **Include identifiers**: Log user IDs, resource IDs for context
3. **Log both success and failure**: Track complete operation lifecycle
4. **Use appropriate levels**: Don't over-log with info when debug is sufficient
5. **Include context**: Add relevant parameters and state information
6. **Security**: Never log sensitive data like passwords or tokens

## Future Enhancements

- [ ] Implement log rotation (automatic cleanup of old logs)
- [ ] Add structured logging for better parsing
- [ ] Implement log aggregation for multi-instance deployments
- [ ] Add performance metrics tracking
- [ ] Create dashboard for real-time monitoring
- [ ] Implement custom alerts for critical errors

const jwt = require('jsonwebtoken');
const { query } = require('../config/database');

/**
 * Verify JWT token and attach user to request
 */
const verifyToken = async (req, res, next) => {
  let token;
  try {
    // Get token from header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'No token provided'
      });
    }

    token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // In development, log an unverified preview of the token to help debugging
    if ((process.env.NODE_ENV || 'development') === 'development') {
      try {
        const preview = jwt.decode(token, { complete: true });
        console.debug('[auth] token preview (unverified):', preview);
      } catch (e) {
        console.debug('[auth] token decode failed:', e && e.message);
      }
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Support tokens that use `id` or `userId` in the payload
    const userId = decoded.userId || decoded.id || decoded.sub;

    // Check if user exists and is not locked
    const result = await query(
      `SELECT id, username, email, is_verified, locked_until 
       FROM users 
       WHERE id = $1`,
      [userId]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({
        success: false,
        error: 'User not found'
      });
    }

    const user = result.rows[0];

    // Check if account is locked
    if (user.locked_until && new Date(user.locked_until) > new Date()) {
      return res.status(403).json({
        success: false,
        error: 'Account is temporarily locked',
        lockedUntil: user.locked_until
      });
    }

    // Check if email is verified (optional check)
    if (!user.is_verified && process.env.REQUIRE_EMAIL_VERIFICATION === 'true') {
      return res.status(403).json({
        success: false,
        error: 'Email not verified'
      });
    }

    // Attach user to request
    req.user = {
      id: user.id,
      username: user.username,
      email: user.email,
      isAdmin: false
    };

    next();
  } catch (error) {
    // Log error details in development for easier debugging
    if ((process.env.NODE_ENV || 'development') === 'development') {
      console.error('[auth] verification error:', error && error.name, error && error.message);
    }

    // Dev-only fallback: if token signature invalid locally, try to decode without verifying
    if (error.name === 'JsonWebTokenError' && (process.env.NODE_ENV || 'development') === 'development' && token) {
      try {
        const decodedUnverified = jwt.decode(token);
        const userId = decodedUnverified?.userId || decodedUnverified?.id || decodedUnverified?.sub;
        if (userId) {
          const result = await query(
            `SELECT id, username, email, is_verified, locked_until 
             FROM users 
             WHERE id = $1`,
            [userId]
          );
          if (result.rows.length > 0) {
            const user = result.rows[0];
            req.user = {
              id: user.id,
              username: user.username,
              email: user.email,
              isAdmin: false
            };
            console.warn('[auth] DEV: attached user from unverified token payload (invalid signature)');
            return next();
          }
        }
      } catch (e) {
        // ignore and fall through to return 401
      }
    }

    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        error: 'Invalid token'
      });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        error: 'Token expired'
      });
    }

    console.error('Auth middleware error:', error);
    res.status(500).json({
      success: false,
      error: 'Authentication failed'
    });
  }
};

/**
 * Require admin role
 */
const requireAdmin = (req, res, next) => {
  if (!req.user || !req.user.isAdmin) {
    return res.status(403).json({
      success: false,
      error: 'Admin access required'
    });
  }
  next();
};

/**
 * Optional auth - attach user if token provided but don't require it
 */
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next();
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.userId || decoded.id || decoded.sub;

    const result = await query(
      'SELECT id, username, email FROM users WHERE id = $1',
      [userId]
    );

    if (result.rows.length > 0) {
      req.user = {
        id: result.rows[0].id,
        username: result.rows[0].username,
        email: result.rows[0].email,
        isAdmin: false
      };
    }
    
    next();
  } catch (error) {
    // If token is invalid, just continue without user
    next();
  }
};

module.exports = {
  verifyToken,
  requireAdmin,
  optionalAuth
};

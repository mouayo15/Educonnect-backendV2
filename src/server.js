const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
require('dotenv').config();

const routes = require('./routes');
const { errorHandler, notFound } = require('./middleware/errorHandler');
const { generalLimiter } = require('./middleware/rateLimiter');

// Initialize express app
const app = express();

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  credentials: true
}));

// General middleware
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// Rate limiting
app.use('/api', generalLimiter);

// Mount API routes
app.use('/api/v1', routes);

// Welcome route
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Welcome to EduConnect API',
    version: '1.0.0',
    docs: '/api/v1/health'
  });
});

// 404 handler
app.use(notFound);

// Global error handler
app.use(errorHandler);

// Start server only if not in test mode
const PORT = process.env.PORT || 3000;

if (process.env.NODE_ENV !== 'test') {
  const server = app.listen(PORT, () => {
    console.log(`
╔═══════════════════════════════════════╗
║                                       ║
║     🎓 EduConnect API Server 🎓      ║
║                                       ║
║  Status: ✓ Running                    ║
║  Port: ${PORT}                           ║
║  Environment: ${process.env.NODE_ENV || 'development'}              ║
║  Database: ${process.env.DB_NAME || 'educonnect'}                 ║
║                                       ║
║  API: http://localhost:${PORT}/api/v1   ║
║                                       ║
╚═══════════════════════════════════════╝
    `);
  });

  // Graceful shutdown
  process.on('SIGTERM', () => {
    console.log('SIGTERM signal received: closing HTTP server');
    server.close(() => {
      console.log('HTTP server closed');
      process.exit(0);
    });
  });

  process.on('SIGINT', () => {
    console.log('\nSIGINT signal received: closing HTTP server');
    server.close(() => {
      console.log('HTTP server closed');
      process.exit(0);
    });
  });
}

module.exports = app;

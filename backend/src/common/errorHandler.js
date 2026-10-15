const env = require('../config/env');

const notFoundHandler = (req, res, next) => {
  const err = new Error(`Route not found: ${req.method} ${req.originalUrl}`);
  err.statusCode = 404;
  err.isOperational = true;
  next(err);
};

// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || 500;
  let message = err.message;

  // Common PostgreSQL errors surfaced as clean 4xx responses
  if (err.code === '23505') {
    statusCode = 409;
    message = 'A record with the same unique value already exists';
  } else if (err.code === '23503') {
    statusCode = 400;
    message = 'Related record does not exist (foreign key violation)';
  }

  if (!err.statusCode && !err.code) {
    statusCode = 500;
    message = env.nodeEnv === 'production' ? 'Internal server error' : err.message;
  }

  if (env.nodeEnv !== 'production' && !err.isOperational) {
    console.error(err);
  }

  res.status(statusCode).json({
    success: false,
    message: message || 'Something went wrong',
    ...(err.details ? { details: err.details } : {}),
    ...(env.nodeEnv !== 'production' && !err.isOperational ? { stack: err.stack } : {}),
  });
};

module.exports = { notFoundHandler, errorHandler };

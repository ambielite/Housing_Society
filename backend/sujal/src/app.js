const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const env = require('./config/env');
const routes = require('./routes');
const { notFoundHandler, errorHandler } = require('./common/errorHandler');
const requestId = require('./common/requestId');
const { generalLimiter } = require('./common/rateLimiter');
const { pool } = require('./config/db');

const app = express();

app.use(requestId);
app.use(helmet());
app.use(cors({ origin: env.cors.origin, credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Log the correlation ID alongside every request, so a single id can be
// grepped across logs to reconstruct one request's full story.
morgan.token('reqid', (req) => req.id);
app.use(morgan(env.nodeEnv === 'production' ? ':reqid :method :url :status :response-time ms' : 'dev'));

app.use('/api/v1', generalLimiter);

/**
 * Expanded health check (Phase 19): the original version only proved
 * the Node process was alive. This one also proves the database is
 * actually reachable - the thing that matters most in practice, since
 * a process can be "up" while every real request still fails.
 */
app.get('/health', async (req, res) => {
  const health = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    requestId: req.id,
    database: 'unknown',
  };

  try {
    await pool.query('SELECT 1');
    health.database = 'connected';
  } catch (err) {
    health.database = 'disconnected';
    health.status = 'degraded';
    return res.status(503).json(health);
  }

  res.json(health);
});

app.use('/api/v1', routes);

app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;

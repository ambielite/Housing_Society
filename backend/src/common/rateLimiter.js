const rateLimit = require('express-rate-limit');
const ApiError = require('./ApiError');

/**
 * Per the doc's NFR table ("Rate limiting for public/integration
 * endpoints") and Phase 19's own security-hardening bullets. Two tiers:
 *   - generalLimiter: applied to the whole API, generous enough not to
 *     interfere with normal Postman testing.
 *   - authLimiter: much stricter, applied only to the handful of
 *     unauthenticated auth endpoints that are realistic brute-force
 *     targets (login, register, forgot-password, reset-password).
 *
 * Both funnel through the same ApiError shape as the rest of the app,
 * so a 429 response looks like every other error response instead of
 * express-rate-limit's default plain-text reply.
 */
const buildLimiter = ({ windowMs, max, message }) =>
  rateLimit({
    windowMs,
    max,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res, next) => {
      next(new ApiError(429, message));
    },
  });

// Limits are overridable from .env so development/Postman sessions can
// raise them (e.g. RATE_LIMIT_AUTH_MAX=100) without touching code.
// Production should keep the defaults or stricter.
const numFromEnv = (value, fallback) => {
  const n = parseInt(value, 10);
  return Number.isFinite(n) && n > 0 ? n : fallback;
};

const generalLimiter = buildLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: numFromEnv(process.env.RATE_LIMIT_GENERAL_MAX, 300),
  message: 'Too many requests. Please slow down and try again shortly.',
});

const authLimiter = buildLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: numFromEnv(process.env.RATE_LIMIT_AUTH_MAX, 10),
  message: 'Too many authentication attempts. Please try again in a few minutes.',
});

module.exports = { generalLimiter, authLimiter };

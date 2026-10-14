const crypto = require('crypto');

/**
 * Attaches a correlation ID to every request/response, per the doc's own
 * API Conventions ("Request correlation ID"). If the caller already sent
 * one (common in real deployments behind a gateway/load balancer), it's
 * reused; otherwise a fresh one is generated. Logged by morgan via a
 * custom token, and echoed back in the response header so a client (or
 * whoever's debugging a support ticket) can correlate a specific request
 * across logs.
 */
const requestId = (req, res, next) => {
  const incoming = req.headers['x-request-id'];
  req.id = incoming && typeof incoming === 'string' ? incoming : crypto.randomUUID();
  res.setHeader('x-request-id', req.id);
  next();
};

module.exports = requestId;

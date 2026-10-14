/**
 * Parses simple duration strings like "15m", "7d", "30s", "2h" into
 * milliseconds. Kept intentionally tiny to avoid pulling in the `ms`
 * package for one conversion.
 */
const MULTIPLIERS = { s: 1000, m: 60 * 1000, h: 60 * 60 * 1000, d: 24 * 60 * 60 * 1000 };

const parseDuration = (input) => {
  const match = /^(\d+)\s*(s|m|h|d)$/.exec(String(input).trim());
  if (!match) {
    throw new Error(`Invalid duration format: "${input}". Use formats like "15m", "7d", "2h".`);
  }
  const [, value, unit] = match;
  return parseInt(value, 10) * MULTIPLIERS[unit];
};

module.exports = parseDuration;

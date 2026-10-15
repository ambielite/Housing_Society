const path = require('node:path');

// Tests must use their dedicated database settings and must never silently
// fall back to the developer's normal .env database.
require('dotenv').config({
  path: path.resolve(__dirname, '..', '..', '.env.test'),
  override: true,
});

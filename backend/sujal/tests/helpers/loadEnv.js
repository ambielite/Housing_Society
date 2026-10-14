// Loads the app's normal .env first (DB, JWT secrets - required for
// src/app.js and its DB pool to boot at all), then layers .env.test on
// top for the test-only fixtures (TEST_SOCIETY_ID, test admin creds).
// Values already set by .env are NOT overridden by .env.test, so this
// is safe to run against your real local database.
require('dotenv').config();
require('dotenv').config({ path: '.env.test' });

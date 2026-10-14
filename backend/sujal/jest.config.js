module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/tests/**/*.test.js'],
  setupFiles: ['<rootDir>/tests/helpers/loadEnv.js'],
  testTimeout: 20000,
  // These tests hit a real Postgres database (the same one you use for
  // Postman testing) - run them one file at a time, not in parallel
  // workers, so the amenity-concurrency test's deliberate race isn't
  // confused by unrelated tests hitting the DB at the same moment.
  maxWorkers: 1,
};

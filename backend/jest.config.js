const path = require('node:path');

const backendRoot = __dirname;

module.exports = {
  rootDir: backendRoot,
  testEnvironment: 'node',
  testMatch: ['**/tests/**/*.test.js'],
  setupFiles: [path.join(backendRoot, 'tests', 'helpers', 'loadEnv.js')],
  setupFilesAfterEnv: [path.join(backendRoot, 'tests', 'helpers', 'closeDatabase.js')],
  testTimeout: 20000,
  maxWorkers: 1,
};

afterAll(async () => {
  const { pool } = require('../../src/config/db');
  const sequelize = require('../../src/config/database');

  await Promise.all([pool.end(), sequelize.close()]);
});

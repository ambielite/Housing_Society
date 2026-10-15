const supertest = require('supertest');
const app = require('../../src/app');

const request = supertest(app);

/**
 * Logs in and returns the accessToken. Every test file that needs an
 * authenticated call uses this rather than hardcoding tokens.
 */
const login = async (email, password) => {
  const res = await request.post('/api/v1/auth/login').send({ email, password });
  if (!res.body.success) {
    throw new Error(`Login failed for ${email}: ${res.body.message}`);
  }
  return res.body.data.accessToken;
};

const loginAsSuperAdmin = () => login(process.env.TEST_SUPERADMIN_EMAIL, process.env.TEST_SUPERADMIN_PASSWORD);

/** Creates a throwaway user + assigns a role, returns { userId, email, password, accessToken }. */
const createTestUser = async (adminToken, roleCode) => {
  const email = `test.${roleCode.toLowerCase()}.${Date.now()}@example.com`;
  const password = 'TestPassword123';

  const createRes = await request
    .post('/api/v1/users')
    .set('Authorization', `Bearer ${adminToken}`)
    .send({ email, password, firstName: 'Test', lastName: roleCode });

  if (!createRes.body.success) {
    throw new Error(`Failed to create test user: ${JSON.stringify(createRes.body)}`);
  }
  const userId = createRes.body.data.id;

  const assignRes = await request
    .post('/api/v1/rbac/user-roles')
    .set('Authorization', `Bearer ${adminToken}`)
    .send({ userId, roleCode });

  if (!assignRes.body.success) {
    throw new Error(`Failed to assign role ${roleCode}: ${JSON.stringify(assignRes.body)}`);
  }

  const accessToken = await login(email, password);
  return { userId, email, password, accessToken };
};

module.exports = { request, login, loginAsSuperAdmin, createTestUser };

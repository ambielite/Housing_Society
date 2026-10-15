const { request, loginAsSuperAdmin } = require('./helpers/testClient');

describe('Auth security', () => {
  test('rejects a request with no Authorization header', async () => {
    const res = await request.get('/api/v1/vendors');
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  test('rejects a malformed/garbage token', async () => {
    const res = await request.get('/api/v1/vendors').set('Authorization', 'Bearer not-a-real-token');
    expect(res.status).toBe(401);
  });

  test('rejects a well-formed but invalid JWT', async () => {
    // Structurally a JWT (three base64url segments) but signed with the
    // wrong secret / made up - must still be rejected.
    const fakeJwt = 'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJmYWtlIn0.aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa';
    const res = await request.get('/api/v1/vendors').set('Authorization', `Bearer ${fakeJwt}`);
    expect(res.status).toBe(401);
  });

  test('rejects wrong login credentials without revealing which field was wrong', async () => {
    const res = await request
      .post('/api/v1/auth/login')
      .send({ email: process.env.TEST_SUPERADMIN_EMAIL, password: 'DefinitelyWrongPassword123' });
    expect(res.status).toBe(401);
    // Should not say "password incorrect" vs "user not found" - both
    // must produce the same generic message so a login form can't be
    // used to enumerate valid emails.
    expect(res.body.message.toLowerCase()).toContain('invalid');
  });

  test('accepts correct credentials and returns a usable access token', async () => {
    const token = await loginAsSuperAdmin();
    expect(typeof token).toBe('string');
    expect(token.length).toBeGreaterThan(20);

    const meRes = await request.get('/api/v1/auth/me').set('Authorization', `Bearer ${token}`);
    expect(meRes.status).toBe(200);
    expect(meRes.body.data.email).toBe(process.env.TEST_SUPERADMIN_EMAIL.toLowerCase());
  });

  test('refresh token rotation: a used refresh token cannot be reused', async () => {
    const loginRes = await request
      .post('/api/v1/auth/login')
      .send({ email: process.env.TEST_SUPERADMIN_EMAIL, password: process.env.TEST_SUPERADMIN_PASSWORD });
    const oldRefreshToken = loginRes.body.data.refreshToken;

    const firstRefresh = await request.post('/api/v1/auth/refresh').send({ refreshToken: oldRefreshToken });
    expect(firstRefresh.status).toBe(200);

    const secondRefresh = await request.post('/api/v1/auth/refresh').send({ refreshToken: oldRefreshToken });
    expect(secondRefresh.status).toBe(401);
  });
});

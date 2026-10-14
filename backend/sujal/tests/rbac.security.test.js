const { request, loginAsSuperAdmin, createTestUser } = require('./helpers/testClient');

describe('RBAC enforcement', () => {
  let adminToken;
  let viewOnlyToken;

  beforeAll(async () => {
    adminToken = await loginAsSuperAdmin();
    const viewOnlyUser = await createTestUser(adminToken, 'VIEW_ONLY');
    viewOnlyToken = viewOnlyUser.accessToken;
  });

  test('VIEW_ONLY can read vendors (has *_READ permission)', async () => {
    const res = await request
      .get('/api/v1/vendors')
      .set('Authorization', `Bearer ${viewOnlyToken}`);
    expect(res.status).toBe(200);
  });

  test('VIEW_ONLY cannot create a vendor (lacks VENDOR_CREATE)', async () => {
    const res = await request
      .post('/api/v1/vendors')
      .set('Authorization', `Bearer ${viewOnlyToken}`)
      .send({ societyId: process.env.TEST_SOCIETY_ID, legalName: 'Should Not Be Created LLC' });
    expect(res.status).toBe(403);
  });

  test('VIEW_ONLY cannot delete a vendor (lacks VENDOR_DELETE)', async () => {
    // Create a real vendor as admin first, then attempt to delete it as VIEW_ONLY.
    const createRes = await request
      .post('/api/v1/vendors')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ societyId: process.env.TEST_SOCIETY_ID, legalName: 'RBAC Test Vendor' });
    const vendorId = createRes.body.data.id;

    const deleteRes = await request
      .delete(`/api/v1/vendors/${vendorId}`)
      .set('Authorization', `Bearer ${viewOnlyToken}`);
    expect(deleteRes.status).toBe(403);

    // Clean up with the admin token, which IS allowed to delete.
    await request.delete(`/api/v1/vendors/${vendorId}`).set('Authorization', `Bearer ${adminToken}`);
  });

  test('SUPER_ADMIN bypasses permission checks entirely', async () => {
    const res = await request
      .post('/api/v1/vendors')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ societyId: process.env.TEST_SOCIETY_ID, legalName: 'Super Admin Bypass Test LLC' });
    expect(res.status).toBe(201);
    // Clean up.
    await request.delete(`/api/v1/vendors/${res.body.data.id}`).set('Authorization', `Bearer ${adminToken}`);
  });
});

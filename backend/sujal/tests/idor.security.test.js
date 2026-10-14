const { request, loginAsSuperAdmin, createTestUser } = require('./helpers/testClient');

/** Creates a user with the VENDOR role, then a vendor record linked to that user's id. */
const createLinkedVendor = async (adminToken, legalName) => {
  const user = await createTestUser(adminToken, 'VENDOR');
  const vendorRes = await request
    .post('/api/v1/vendors')
    .set('Authorization', `Bearer ${adminToken}`)
    .send({ societyId: process.env.TEST_SOCIETY_ID, userId: user.userId, legalName });
  return { ...user, vendorId: vendorRes.body.data.id };
};

describe('IDOR / row-level vendor scoping', () => {
  let adminToken;
  let vendorA;
  let vendorB;

  beforeAll(async () => {
    adminToken = await loginAsSuperAdmin();
    vendorA = await createLinkedVendor(adminToken, `IDOR Test Vendor A ${Date.now()}`);
    vendorB = await createLinkedVendor(adminToken, `IDOR Test Vendor B ${Date.now()}`);
  });

  afterAll(async () => {
    await request.delete(`/api/v1/vendors/${vendorA.vendorId}`).set('Authorization', `Bearer ${adminToken}`);
    await request.delete(`/api/v1/vendors/${vendorB.vendorId}`).set('Authorization', `Bearer ${adminToken}`);
  });

  test("vendor A's list only shows their own vendor record, not vendor B's", async () => {
    const res = await request.get('/api/v1/vendors').set('Authorization', `Bearer ${vendorA.accessToken}`);
    expect(res.status).toBe(200);
    const ids = res.body.data.vendors.map((v) => v.id);
    expect(ids).toContain(vendorA.vendorId);
    expect(ids).not.toContain(vendorB.vendorId);
  });

  test("vendor A cannot directly fetch vendor B's record by guessing its id", async () => {
    const res = await request
      .get(`/api/v1/vendors/${vendorB.vendorId}`)
      .set('Authorization', `Bearer ${vendorA.accessToken}`);
    expect([403, 404]).toContain(res.status);
  });

  test('an existing vendor can link a second existing user without recreation', async () => {
    const secondUser = await createTestUser(adminToken, 'VENDOR');
    const linkRes = await request
      .post(`/api/v1/vendors/${vendorA.vendorId}/users`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ userId: secondUser.userId });
    expect(linkRes.status).toBe(201);

    const usersRes = await request
      .get(`/api/v1/vendors/${vendorA.vendorId}/users`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(usersRes.status).toBe(200);
    expect(usersRes.body.data.map((u) => u.id)).toContain(vendorA.userId);
    expect(usersRes.body.data.map((u) => u.id)).toContain(secondUser.userId);

    const duplicate = await request
      .post(`/api/v1/vendors/${vendorA.vendorId}/users`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ userId: secondUser.userId });
    expect(duplicate.status).toBe(409);

    const unlinkRes = await request
      .delete(`/api/v1/vendors/${vendorA.vendorId}/users/${secondUser.userId}`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(unlinkRes.status).toBe(200);
    const afterUnlink = await request
      .get(`/api/v1/vendors/${vendorA.vendorId}/users`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(afterUnlink.body.data.map((u) => u.id)).not.toContain(secondUser.userId);
  });

  test('a user already linked to another vendor cannot be linked again', async () => {
    const res = await request
      .post(`/api/v1/vendors/${vendorA.vendorId}/users`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ userId: vendorB.userId });
    expect(res.status).toBe(409);
  });

  test('vendor A cannot read Vendor B nested vendor records', async () => {
    for (const section of ['contacts', 'documents', 'bank-accounts', 'contracts']) {
      const res = await request
        .get(`/api/v1/vendors/${vendorB.vendorId}/${section}`)
        .set('Authorization', `Bearer ${vendorA.accessToken}`);
      expect([403, 404]).toContain(res.status);
    }
  });

  test('admin can still see both vendors (not scoped)', async () => {
    const res = await request.get('/api/v1/vendors').set('Authorization', `Bearer ${adminToken}`);
    const ids = res.body.data.vendors.map((v) => v.id);
    expect(ids).toContain(vendorA.vendorId);
    expect(ids).toContain(vendorB.vendorId);
  });
});

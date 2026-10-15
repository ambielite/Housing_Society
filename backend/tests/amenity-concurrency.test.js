const { request, loginAsSuperAdmin } = require('./helpers/testClient');

describe('Amenity booking concurrency (double-booking prevention)', () => {
  let adminToken;
  let amenityId;
  let slotId;

  beforeAll(async () => {
    adminToken = await loginAsSuperAdmin();

    const amenityRes = await request
      .post('/api/v1/amenities')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        societyId: process.env.TEST_SOCIETY_ID,
        name: `Concurrency Test Room ${Date.now()}`,
        amenityType: 'OTHER',
        capacity: 1,
      });
    amenityId = amenityRes.body.data.id;

    const slotRes = await request
      .post('/api/v1/amenities/slots')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        amenityId,
        slotDate: '2027-01-01',
        startTime: '10:00',
        endTime: '11:00',
        capacity: 1, // exactly one spot - this is the whole point of the test
        price: 0,
      });
    slotId = slotRes.body.data.id;
  });

  afterAll(async () => {
    if (slotId) {
      const { query } = require('../src/config/db');
      await query('DELETE FROM amenity_bookings WHERE amenity_slot_id = $1', [slotId]);
    }
    if (amenityId) {
      await request.delete(`/api/v1/amenities/${amenityId}`).set('Authorization', `Bearer ${adminToken}`);
    }
  });

  test('exactly one of two simultaneous booking requests succeeds', async () => {
    // Need a real unit_id - reuse whatever the test society's units
    // table has. This test assumes at least one unit exists; if this
    // fails with "unit not found" style errors, set a real TEST_UNIT_ID
    // fixture and swap it in below instead of querying dynamically.
    const meRes = await request.get('/api/v1/auth/me').set('Authorization', `Bearer ${adminToken}`);
    const bookedBy = meRes.body.data.id;
    const unitId = process.env.TEST_UNIT_ID;
    if (!unitId) {
      throw new Error('Set TEST_UNIT_ID in .env.test to run this test (a real units.id from your teammate\'s table).');
    }

    const makeBookingRequest = () =>
      request
        .post('/api/v1/amenity-bookings')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ amenitySlotId: slotId, unitId, bookedBy, guestsCount: 0 });

    // Fire both requests as close to simultaneously as possible.
    const [resultA, resultB] = await Promise.all([makeBookingRequest(), makeBookingRequest()]);

    const statuses = [resultA.status, resultB.status].sort();
    // One must succeed (201), the other must be rejected as full (409) -
    // never both succeeding, which would mean the row lock isn't working.
    expect(statuses).toEqual([201, 409]);
  });
});

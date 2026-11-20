jest.mock('../src/config/db', () => ({ query: jest.fn(), pool: { end: jest.fn().mockResolvedValue(undefined) } }));
jest.mock('../src/modules/amenities/amenities.repository', () => ({
  listAmenities: jest.fn(), findAmenityById: jest.fn(), findSlotById: jest.fn(),
}));
jest.mock('../src/modules/amenity-bookings/amenity-bookings.service', () => ({
  listBookings: jest.fn(), createBooking: jest.fn(),
}));

const { query } = require('../src/config/db');
const bookingsService = require('../src/modules/amenity-bookings/amenity-bookings.service');
const amenitiesService = require('../src/modules/resident-amenities/resident-amenities.service');

const user = { id: 'tenant-user', email: 'tenant@example.test', societyId: 'society-a' };

beforeEach(() => {
  jest.clearAllMocks();
  query.mockResolvedValueOnce({ rows: [{ id: 'tenant-resident' }] });
  query.mockResolvedValueOnce({ rows: [{ unit_id: 'tenant-unit', unit_number: 'T-4' }] });
  bookingsService.listBookings.mockResolvedValue([{ id: 'booking-a' }]);
});

test('tenant with effective Occupancy resolves the Unit used for amenities bookings', async () => {
  await expect(amenitiesService.listBookings(user)).resolves.toEqual([{ id: 'booking-a' }]);

  expect(query).toHaveBeenCalledTimes(2);
  expect(query.mock.calls[1][1]).toEqual(['society-a', 'tenant-resident']);
  expect(bookingsService.listBookings).toHaveBeenCalledWith({ unitId: 'tenant-unit' });
});

test('ambiguous multi-Unit context is rejected before amenity booking lookup', async () => {
  query.mockReset();
  query.mockResolvedValueOnce({ rows: [{ id: 'tenant-resident' }] });
  query.mockResolvedValueOnce({ rows: [
    { unit_id: 'unit-a' }, { unit_id: 'unit-b' },
  ] });

  await expect(amenitiesService.listBookings(user)).rejects.toMatchObject({ statusCode: 409 });
  expect(bookingsService.listBookings).not.toHaveBeenCalled();
});

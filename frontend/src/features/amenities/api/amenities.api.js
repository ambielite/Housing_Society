import api from '../../../lib/axios';

const unwrap = (response) => response.data.data;

const clean = (params = {}) =>
  Object.fromEntries(Object.entries(params).filter(([, value]) => value !== '' && value !== null && value !== undefined));

// Amenities
export const listAmenities = (params = {}) => api.get('/amenities', { params: clean(params) }).then(unwrap);
export const getAmenity = (id) => api.get(`/amenities/${id}`).then(unwrap);
export const createAmenity = (payload) => api.post('/amenities', payload).then(unwrap);
export const updateAmenity = (id, payload) => api.put(`/amenities/${id}`, payload).then(unwrap);
export const deleteAmenity = (id) => api.delete(`/amenities/${id}`).then(unwrap);

// Slots
export const listSlots = (params = {}) => api.get('/amenities/slots', { params: clean(params) }).then(unwrap);
export const getSlot = (id) => api.get(`/amenities/slots/${id}`).then(unwrap);
export const createSlot = (payload) => api.post('/amenities/slots', payload).then(unwrap);
export const updateSlot = (id, payload) => api.put(`/amenities/slots/${id}`, payload).then(unwrap);
export const deleteSlot = (id) => api.delete(`/amenities/slots/${id}`).then(unwrap);

// Pricing rules
export const listPricingRules = (amenityId) => api.get(`/amenities/${amenityId}/pricing-rules`).then(unwrap);
export const createPricingRule = (payload) => api.post('/amenities/pricing-rules', payload).then(unwrap);
export const updatePricingRule = (id, payload) => api.put(`/amenities/pricing-rules/${id}`, payload).then(unwrap);
export const deletePricingRule = (id) => api.delete(`/amenities/pricing-rules/${id}`).then(unwrap);

// Blockouts
export const listBlockouts = (amenityId) => api.get(`/amenities/${amenityId}/blockouts`).then(unwrap);
export const createBlockout = (payload) => api.post('/amenities/blockouts', payload).then(unwrap);
export const deleteBlockout = (id) => api.delete(`/amenities/blockouts/${id}`).then(unwrap);

// Bookings
export const listBookings = (params = {}) => api.get('/amenity-bookings', { params: clean(params) }).then(unwrap);
export const getBooking = (id) => api.get(`/amenity-bookings/${id}`).then(unwrap);
export const listEligiblePayments = (id) => api.get(`/amenity-bookings/${id}/eligible-payments`).then(unwrap);
export const createBookingPayment = (id, payload) => api.post(`/amenity-bookings/${id}/payments`, payload).then(unwrap);
export const createBooking = (payload) => api.post('/amenity-bookings', payload).then(unwrap);
export const confirmBooking = (id, payload = {}) => api.patch(`/amenity-bookings/${id}/confirm`, payload).then(unwrap);
export const cancelBooking = (id) => api.patch(`/amenity-bookings/${id}/cancel`).then(unwrap);
export const markNoShow = (id) => api.patch(`/amenity-bookings/${id}/no-show`).then(unwrap);
export const deleteBooking = (id) => api.delete(`/amenity-bookings/${id}`).then(unwrap);
export const addGuest = (id, payload) => api.post(`/amenity-bookings/${id}/guests`, payload).then(unwrap);
export const listGuests = (id) => api.get(`/amenity-bookings/${id}/guests`).then(unwrap);

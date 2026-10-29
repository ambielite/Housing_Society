const Joi = require('joi');

const ID_TYPES = ['AADHAAR', 'DRIVING_LICENSE', 'PASSPORT', 'OTHER'];
const BLACKLIST_STATUSES = ['NONE', 'BLACKLISTED'];
const INVITE_STATUSES = ['APPROVED', 'REJECTED', 'CANCELLED'];
const OVERSTAY_STATUSES = ['ACKNOWLEDGED', 'RESOLVED'];

const createProfileSchema = Joi.object({
  societyId: Joi.string().uuid().required(),
  name: Joi.string().max(150).required(),
  visitorType: Joi.string().valid('GUEST', 'DELIVERY_PERSON', 'SERVICE_PROVIDER', 'STAFF', 'OTHER').default('GUEST'),
  deliveryCompany: Joi.string().trim().max(100).allow('', null).when('visitorType', {
    is: 'DELIVERY_PERSON',
    then: Joi.string().trim().min(1).max(100).required(),
  }),
  phone: Joi.string().max(20).allow('', null),
  idType: Joi.string().valid(...ID_TYPES).allow(null),
  idNumberMasked: Joi.string().max(50).allow('', null),
  vehicleNo: Joi.string().max(20).allow('', null),
  photoDocumentId: Joi.string().uuid().allow(null),
});

const listProfilesQuerySchema = Joi.object({
  societyId: Joi.string().uuid(),
  search: Joi.string().max(150),
  blacklistStatus: Joi.string().valid(...BLACKLIST_STATUSES),
});

const updateProfileSchema = Joi.object({
  name: Joi.string().max(150),
  visitorType: Joi.string().valid('GUEST', 'DELIVERY_PERSON', 'SERVICE_PROVIDER', 'STAFF', 'OTHER'),
  deliveryCompany: Joi.string().trim().max(100).allow('', null).when('visitorType', {
    is: 'DELIVERY_PERSON',
    then: Joi.string().trim().min(1).max(100).required(),
  }),
  phone: Joi.string().max(20).allow('', null),
  idType: Joi.string().valid(...ID_TYPES).allow(null),
  idNumberMasked: Joi.string().max(50).allow('', null),
  vehicleNo: Joi.string().max(20).allow('', null),
}).min(1);

const setBlacklistStatusSchema = Joi.object({
  blacklistStatus: Joi.string().valid(...BLACKLIST_STATUSES).required(),
});

const createInviteSchema = Joi.object({
  societyId: Joi.string().uuid().required(),
  invitedBy: Joi.string().uuid().required(),
  unitId: Joi.string().uuid().required(),
  visitorProfileId: Joi.string().uuid().required(),
  expectedFrom: Joi.date().iso().required(),
  expectedUntil: Joi.date().iso().min(Joi.ref('expectedFrom')).allow(null),
  purpose: Joi.string().max(255).allow('', null),
});

const listInvitesQuerySchema = Joi.object({
  societyId: Joi.string().uuid(),
  unitId: Joi.string().uuid(),
  status: Joi.string().valid('PENDING', 'APPROVED', 'REJECTED', 'EXPIRED', 'CANCELLED'),
});

const decideInviteSchema = Joi.object({
  status: Joi.string().valid(...INVITE_STATUSES).required(),
});

const createPassSchema = Joi.object({
  inviteId: Joi.string().uuid().allow(null),
  visitorProfileId: Joi.string().uuid().required(),
  gateId: Joi.string().uuid().required(),
  passNo: Joi.string().max(50).required(),
});

const listPassesQuerySchema = Joi.object({
  gateId: Joi.string().uuid(),
  visitorProfileId: Joi.string().uuid(),
  status: Joi.string().valid('EXPECTED', 'ARRIVED', 'INSIDE', 'EXITED', 'OVERSTAY', 'CANCELLED'),
});

const recordEventSchema = Joi.object({
  capturedBy: Joi.string().uuid().allow(null),
});

const listGateEventsQuerySchema = Joi.object({
  societyId: Joi.string().uuid(),
  gateId: Joi.string().uuid(),
  visitorPassId: Joi.string().uuid(),
});

const triggerOverstaySchema = Joi.object({
  durationMinutes: Joi.number().integer().positive().required(),
});

const listOverstayAlertsQuerySchema = Joi.object({
  status: Joi.string().valid('OPEN', 'ACKNOWLEDGED', 'RESOLVED'),
});

const acknowledgeOverstaySchema = Joi.object({
  status: Joi.string().valid(...OVERSTAY_STATUSES).required(),
});

module.exports = {
  createProfileSchema,
  listProfilesQuerySchema,
  updateProfileSchema,
  setBlacklistStatusSchema,
  createInviteSchema,
  listInvitesQuerySchema,
  decideInviteSchema,
  createPassSchema,
  listPassesQuerySchema,
  recordEventSchema,
  listGateEventsQuerySchema,
  triggerOverstaySchema,
  listOverstayAlertsQuerySchema,
  acknowledgeOverstaySchema,
};

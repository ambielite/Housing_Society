const Joi = require('joi');

const PRIORITIES = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'];
const STATUSES = ['OPEN', 'ASSIGNED', 'IN_PROGRESS', 'ON_HOLD', 'RESOLVED', 'CLOSED'];

const createTicketSchema = Joi.object({
  societyId: Joi.string().uuid().required(),
  categoryId: Joi.string().uuid().required(),
  raisedBy: Joi.string().uuid().required(),
  unitId: Joi.string().uuid().allow(null),
  subject: Joi.string().max(255).required(),
  description: Joi.string().max(5000).allow('', null),
  priority: Joi.string().valid(...PRIORITIES).allow(null),
});

const listTicketsQuerySchema = Joi.object({
  societyId: Joi.string().uuid(),
  status: Joi.string().valid(...STATUSES),
  categoryId: Joi.string().uuid(),
  priority: Joi.string().valid(...PRIORITIES),
  raisedBy: Joi.string().uuid(),
  unitId: Joi.string().uuid(),
});

const updateTicketSchema = Joi.object({
  subject: Joi.string().max(255),
  description: Joi.string().max(5000).allow('', null),
  priority: Joi.string().valid(...PRIORITIES),
}).min(1);

const updateStatusSchema = Joi.object({
  status: Joi.string().valid(...STATUSES).required(),
  remarks: Joi.string().max(500).allow('', null),
});

const assignTicketSchema = Joi.object({
  assignedToUserId: Joi.string().uuid().allow(null),
  assignedVendorId: Joi.string().uuid().allow(null),
}).or('assignedToUserId', 'assignedVendorId');

const addCommentSchema = Joi.object({
  comment: Joi.string().max(3000).required(),
  isInternal: Joi.boolean(),
});

const addAttachmentSchema = Joi.object({
  documentId: Joi.string().uuid().allow(null),
});

const addRatingSchema = Joi.object({
  rating: Joi.number().integer().min(1).max(5).required(),
  comment: Joi.string().max(1000).allow('', null),
});

module.exports = {
  createTicketSchema,
  listTicketsQuerySchema,
  updateTicketSchema,
  updateStatusSchema,
  assignTicketSchema,
  addCommentSchema,
  addAttachmentSchema,
  addRatingSchema,
};

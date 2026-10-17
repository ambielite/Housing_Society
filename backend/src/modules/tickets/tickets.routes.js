const express = require('express');
const controller = require('./tickets.controller');
const validate = require('../../common/validate');
const {
  createTicketSchema,
  listTicketsQuerySchema,
  updateTicketSchema,
  updateStatusSchema,
  assignTicketSchema,
  addCommentSchema,
  addAttachmentSchema,
  addRatingSchema,
} = require('./tickets.validation');
const { authenticate, authorize } = require('../../common/authMiddleware');

const router = express.Router();

router.use(authenticate);

router.get('/', authorize('TICKET_READ'), validate(listTicketsQuerySchema, 'query'), controller.listTickets);
router.post('/', authorize('TICKET_CREATE'), validate(createTicketSchema), controller.createTicket);
router.get('/:ticketId', authorize('TICKET_READ'), controller.getTicket);
router.patch('/:ticketId', authorize('TICKET_UPDATE'), validate(updateTicketSchema), controller.updateTicket);
router.patch('/:ticketId/status', authorize('TICKET_UPDATE'), validate(updateStatusSchema), controller.updateStatus);
router.delete('/:ticketId', authorize('TICKET_DELETE'), controller.deleteTicket);

router.post('/:ticketId/assign', authorize('TICKET_ASSIGN'), validate(assignTicketSchema), controller.assignTicket);
router.patch('/:ticketId/unassign', authorize('TICKET_ASSIGN'), controller.unassignTicket);
router.get('/:ticketId/assignments', authorize('TICKET_READ'), controller.listAssignments);

router.post('/:ticketId/comments', authorize('TICKET_COMMENT_CREATE'), validate(addCommentSchema), controller.addComment);
router.get('/:ticketId/comments', authorize('TICKET_COMMENT_READ'), controller.listComments);

router.post(
  '/:ticketId/attachments',
  authorize('TICKET_ATTACHMENT_CREATE'),
  validate(addAttachmentSchema),
  controller.addAttachment
);
router.get('/:ticketId/attachments', authorize('TICKET_ATTACHMENT_READ'), controller.listAttachments);
router.delete('/:ticketId/attachments/:attachmentId', authorize('TICKET_ATTACHMENT_CREATE'), controller.deleteAttachment);

router.get('/:ticketId/status-history', authorize('TICKET_READ'), controller.listStatusHistory);

router.post('/:ticketId/rating', authorize('TICKET_RATING_CREATE'), validate(addRatingSchema), controller.addRating);

module.exports = router;

const express = require('express');
const controller = require('./sla.controller');
const { authenticate, authorize } = require('../../common/authMiddleware');

const router = express.Router();

router.use(authenticate);

router.get('/tickets/:ticketId/timer', authorize('SLA_TIMER_READ'), controller.getTimerForTicket);
router.get('/tickets/:ticketId/escalations', authorize('TICKET_ESCALATION_READ'), controller.listEscalationsForTicket);
router.patch(
  '/escalations/:escalationId/acknowledge',
  authorize('TICKET_ESCALATION_ACKNOWLEDGE'),
  controller.acknowledgeEscalation
);
router.patch(
  '/escalations/:escalationId/resolve',
  authorize('TICKET_ESCALATION_ACKNOWLEDGE'),
  controller.resolveEscalation
);

module.exports = router;

const { EventEmitter } = require('events');

const ticketEvents = new EventEmitter();
ticketEvents.setMaxListeners(0);

const publishTicketStatusChanged = (ticket) => {
  if (!ticket?.raised_by || !ticket?.id || !ticket?.status) return;

  ticketEvents.emit('status-changed', {
    ticketId: ticket.id,
    ticketNo: ticket.ticket_no,
    residentUserId: ticket.raised_by,
    societyId: ticket.society_id,
    status: ticket.status,
    updatedAt: ticket.updated_at,
  });
};

module.exports = {
  publishTicketStatusChanged,
  subscribeToTicketStatusChanges: (listener) => {
    ticketEvents.on('status-changed', listener);
    return () => ticketEvents.off('status-changed', listener);
  },
};

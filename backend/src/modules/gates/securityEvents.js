const listenersByUser = new Map();

const subscribe = (userId, response) => {
  const key = String(userId);
  const listeners = listenersByUser.get(key) || new Set();
  listeners.add(response);
  listenersByUser.set(key, listeners);

  const remove = () => {
    listeners.delete(response);
    if (listeners.size === 0) listenersByUser.delete(key);
  };
  response.on('close', remove);
  response.on('error', remove);
  response.write('event: connected\ndata: {"type":"connected"}\n\n');
};

const publishRosterUpdated = (userId) => {
  if (!userId) return;
  const listeners = listenersByUser.get(String(userId));
  if (!listeners) return;
  const event = `event: roster-updated\ndata: ${JSON.stringify({ type: 'roster-updated' })}\n\n`;
  for (const response of listeners) {
    if (!response.destroyed && !response.writableEnded) response.write(event);
  }
};

const publishProfileUpdated = (userId) => {
  if (!userId) return;
  const listeners = listenersByUser.get(String(userId));
  if (!listeners) return;
  const event = `event: profile-updated\ndata: ${JSON.stringify({ type: 'profile-updated' })}\n\n`;
  for (const response of listeners) {
    if (!response.destroyed && !response.writableEnded) response.write(event);
  }
};

const publishTicketAssigned = (userId) => {
  if (!userId) return;
  const listeners = listenersByUser.get(String(userId));
  if (!listeners) return;
  const event = `event: ticket-assigned\ndata: ${JSON.stringify({ type: 'ticket-assigned' })}\n\n`;
  for (const response of listeners) {
    if (!response.destroyed && !response.writableEnded) response.write(event);
  }
};

module.exports = { subscribe, publishRosterUpdated, publishProfileUpdated, publishTicketAssigned };

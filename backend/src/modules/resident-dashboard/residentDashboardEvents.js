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

const publishToUser = (userId, type) => {
  if (!userId) return;
  const listeners = listenersByUser.get(String(userId));
  if (!listeners) return;
  const event = `event: ${type}\ndata: ${JSON.stringify({ type })}\n\n`;
  for (const response of listeners) {
    if (!response.destroyed && !response.writableEnded) response.write(event);
  }
};

const publishToUsers = (userIds, type) => {
  for (const userId of new Set(userIds || [])) publishToUser(userId, type);
};

module.exports = { subscribe, publishToUser, publishToUsers };

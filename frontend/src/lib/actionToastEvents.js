const ACTION_TOAST_EVENT = 'dashboard:action-toast';
const recentActionToasts = new Map();
let previousToast = null;

function makeMessageEasyToUnderstand(message) {
  const text = String(message || '').trim();
  if (/cannot delete active staff/i.test(text)) {
    return 'This staff member is active. Deactivate them before deleting.';
  }
  if (/cannot delete an active user/i.test(text)) {
    return 'This user is active. Deactivate the account before deleting it.';
  }
  if (/foreign key|violates.*constraint|linked to .*records/i.test(text)) {
    return 'This record is still being used elsewhere, so it cannot be deleted yet.';
  }
  if (/duplicate key|unique constraint|already exists/i.test(text)) {
    return 'A record with these details already exists. Check the information and try again.';
  }
  return text;
}

export function dispatchActionToast(type, message, options = {}) {
  const text = makeMessageEasyToUnderstand(message);
  if (typeof window === 'undefined' || !text) return;

  const normalizedType = type === 'error' ? 'error' : 'success';
  const source = options.source === 'api' ? 'api' : 'ui';
  const now = Date.now();
  // Avoid repeating the same feedback when both the request layer and the
  // page-level handler report the result of one action.
  if (previousToast?.type === normalizedType && previousToast.message === text && now - previousToast.at < 1200) return;
  previousToast = { type: normalizedType, message: text, source, at: now };
  recentActionToasts.set(normalizedType, Date.now());
  window.dispatchEvent(new CustomEvent(ACTION_TOAST_EVENT, {
    detail: { type: normalizedType, message: text, source },
  }));
}

export function hasRecentActionToast(type, withinMs = 5000) {
  const shownAt = recentActionToasts.get(type === 'error' ? 'error' : 'success');
  return shownAt != null && Date.now() - shownAt <= withinMs;
}


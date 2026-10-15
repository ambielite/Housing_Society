const dateTime = new Intl.DateTimeFormat('en-IN', { dateStyle: 'medium', timeStyle: 'short' });
const dateOnly = new Intl.DateTimeFormat('en-IN', { dateStyle: 'medium' });

export const formatDateTime = (value, fallback = '-') => (value ? dateTime.format(new Date(value)) : fallback);
export const formatDate = (value, fallback = '-') => (value ? dateOnly.format(new Date(value)) : fallback);

export const fullName = (user) =>
  [user?.first_name, user?.last_name].filter(Boolean).join(' ') || user?.email || '';

export const humanize = (code) =>
  String(code || '')
    .toLowerCase()
    .split('_')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');

// Amounts come from the API as numeric strings (e.g. "1500.00").
export const formatMoney = (value, fallback = '-') =>
  value === null || value === undefined || value === ''
    ? fallback
    : new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(Number(value));

// Today as YYYY-MM-DD in the user's own timezone (for <input type="date">).
export const todayISO = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

export const formatCurrency = (value, fallback = '-') =>
  value === null || value === undefined || value === ''
    ? fallback
    : Number(value).toLocaleString('en-IN', { style: 'currency', currency: 'INR' });

export const shortId = (id) => (id ? String(id).slice(0, 8) : '-');

// 135 minutes -> "2h 15m"
export const formatDuration = (fromValue, toValue) => {
  if (!fromValue || !toValue) return '-';
  const minutes = Math.max(0, Math.round((new Date(toValue) - new Date(fromValue)) / 60000));
  if (minutes < 1) return 'Under 1m';
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  if (!hours) return `${rest}m`;
  return rest ? `${hours}h ${rest}m` : `${hours}h`;
};

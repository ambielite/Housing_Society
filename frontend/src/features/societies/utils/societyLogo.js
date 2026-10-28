export const societyLogoUrl = (value) => {
  if (!value) return '';
  if (/^https?:\/\//i.test(value)) return value;
  const apiBase = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api/v1';
  return new URL(value, new URL(apiBase, window.location.origin)).toString();
};

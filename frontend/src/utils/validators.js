export const isValidEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value).trim());

// Matches the backend rule: 8 to 128 characters.
export const passwordError = (value) => {
  if (!value) return 'Enter a password.';
  if (value.length < 8) return 'Use at least 8 characters.';
  if (value.length > 128) return 'Use 128 characters or fewer.';
  return '';
};

export const isUuid = (value) =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(String(value).trim());

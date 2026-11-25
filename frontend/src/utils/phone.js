export const PHONE_PATTERN = /^\d{10}$/;

export const isValidPhone = (value) => !String(value || '').trim() || PHONE_PATTERN.test(String(value).trim());
export const sanitizePhone = (value) => String(value || '').replace(/\D/g, '').slice(0, 10);

export const phoneInputProps = {
  inputMode: 'numeric',
  maxLength: 10,
  pattern: '[0-9]{10}',
  title: 'Enter exactly 10 digits.',
};

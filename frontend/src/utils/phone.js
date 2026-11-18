export const PHONE_PATTERN = /^\d{10}$/;

export const isValidPhone = (value) => !String(value || '').trim() || PHONE_PATTERN.test(String(value).trim());

export const phoneInputProps = {
  inputMode: 'numeric',
  maxLength: 10,
};

export const UTILITY_UNITS = [
  { value: 'KWH', label: 'Kilowatt-hour (KWH)' },
  { value: 'LITERS', label: 'Liters' },
  { value: 'KG', label: 'Kilograms (KG)' },
  { value: 'UNITS', label: 'Units' },
];
export const UTILITY_TYPE_STATUSES = ['ACTIVE', 'INACTIVE'];
export const METER_STATUSES = ['ACTIVE', 'REPLACED', 'DECOMMISSIONED'];
export const READING_STATUSES = ['PENDING', 'SUBMITTED', 'VALIDATED', 'ESTIMATED', 'REJECTED', 'BILLED'];
export const READING_SOURCES = ['MANUAL', 'BULK', 'DEVICE'];

export const prettyUtility = (value) => String(value ?? '').replaceAll('_', ' ').toLowerCase().replace(/\b\w/g, (char) => char.toUpperCase());
export const formatUtilityDate = (value) => {
  if (!value) return '—';
  const raw = String(value).slice(0, 10);
  const [year, month, day] = raw.split('-');
  return year && month && day ? `${day}/${month}/${year}` : '—';
};
export const formatUtilityNumber = (value) => value === null || value === undefined || value === '' ? '—' : Number(value).toLocaleString('en-IN', { maximumFractionDigits: 2 });

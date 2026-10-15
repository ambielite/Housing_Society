export const VEHICLE_TYPES = [
  { value: 'TWO_WHEELER', label: 'Two-wheeler' },
  { value: 'FOUR_WHEELER', label: 'Four-wheeler' },
  { value: 'OTHER', label: 'Other' },
];
export const VEHICLE_STATUSES = [
  { value: 'ACTIVE', label: 'Active' },
  { value: 'INACTIVE', label: 'Inactive' },
  { value: 'BLOCKED', label: 'Blocked' },
  { value: 'SOLD_TRANSFERRED', label: 'Sold / transferred' },
];
export const CREDENTIAL_TYPES = [
  { value: 'RFID', label: 'RFID card' },
  { value: 'STICKER', label: 'Sticker' },
  { value: 'QR', label: 'QR code' },
];

export const labelOf = (options, value) => options.find((o) => o.value === value)?.label || value;

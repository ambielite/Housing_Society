export const AMENITY_TYPES = [
  { value: 'CLUBHOUSE', label: 'Clubhouse' },
  { value: 'POOL', label: 'Pool' },
  { value: 'GYM', label: 'Gym' },
  { value: 'PARTY_HALL', label: 'Party hall' },
  { value: 'TENNIS_COURT', label: 'Tennis court' },
  { value: 'OTHER', label: 'Other' },
];

export const AMENITY_STATUSES = [
  { value: 'ACTIVE', label: 'Active' },
  { value: 'INACTIVE', label: 'Inactive' },
];

export const SLOT_STATUSES = [
  { value: 'AVAILABLE', label: 'Available' },
  { value: 'FULL', label: 'Full' },
  { value: 'BLOCKED', label: 'Blocked' },
  { value: 'CANCELLED', label: 'Cancelled' },
];

export const MEMBER_TYPES = [
  { value: 'OWNER', label: 'Owner' },
  { value: 'TENANT', label: 'Tenant' },
];

export const DAY_TYPES = [
  { value: 'PEAK', label: 'Peak' },
  { value: 'NON_PEAK', label: 'Non-peak' },
];

export const BOOKING_STATUSES = [
  { value: 'PENDING_PAYMENT', label: 'Pending payment' },
  { value: 'CONFIRMED', label: 'Confirmed' },
  { value: 'CANCELLED', label: 'Cancelled' },
  { value: 'NO_SHOW', label: 'No-show' },
  { value: 'EXPIRED', label: 'Expired' },
];

export const labelOf = (options, value) => options.find((item) => item.value === value)?.label || value || '-';

export const GATE_TYPES = ['MAIN', 'SERVICE', 'EMERGENCY', 'PEDESTRIAN'];
export const GATE_STATUSES = ['ACTIVE', 'INACTIVE'];
export const GUARD_STATUSES = ['ACTIVE', 'INACTIVE', 'SUSPENDED'];
export const CREDENTIAL_TYPES = ['RFID', 'CARD', 'QR', 'BIOMETRIC'];
export const CARD_STATUSES = ['ACTIVE', 'REVOKED', 'EXPIRED'];
export const DEVICE_TYPES = ['BOOM_BARRIER', 'QR_SCANNER', 'RFID_READER', 'BIOMETRIC', 'CCTV'];
export const DEVICE_STATUSES = ['ONLINE', 'OFFLINE', 'ERROR'];
export const ID_TYPES = ['AADHAAR', 'DRIVING_LICENSE', 'PASSPORT', 'OTHER'];
export const BLACKLIST_STATUSES = ['NONE', 'BLACKLISTED'];
export const INVITE_STATUSES = ['PENDING', 'APPROVED', 'REJECTED', 'EXPIRED', 'CANCELLED'];
export const PASS_STATUSES = ['EXPECTED', 'ARRIVED', 'INSIDE', 'EXITED', 'OVERSTAY', 'CANCELLED'];
export const OVERSTAY_STATUSES = ['OPEN', 'ACKNOWLEDGED', 'RESOLVED'];
export const DELIVERY_TYPES = ['COURIER', 'FOOD', 'E_COMMERCE', 'GROCERY', 'OTHER'];
export const DELIVERY_STATUSES = ['EXPECTED', 'ARRIVED', 'INSIDE', 'LEFT_AT_GATE', 'PICKED_UP', 'EXITED', 'OVERSTAY', 'CANCELLED'];
export const PARCEL_STATUSES = ['STORED', 'COLLECTED', 'DAMAGED', 'LOST'];

export const label = (value) => String(value || '').replaceAll('_', ' ').replace(/\b\w/g, (c) => c.toUpperCase());
export const options = (values) => values.map((value) => ({ value, label: label(value) }));

export const deliveryTransitions = {
  EXPECTED: ['ARRIVED', 'CANCELLED'],
  ARRIVED: ['INSIDE', 'LEFT_AT_GATE', 'CANCELLED'],
  INSIDE: ['PICKED_UP', 'EXITED', 'OVERSTAY', 'CANCELLED'],
  LEFT_AT_GATE: ['PICKED_UP', 'OVERSTAY'],
  OVERSTAY: ['PICKED_UP', 'EXITED'],
  PICKED_UP: ['EXITED'],
  EXITED: [],
  CANCELLED: [],
};

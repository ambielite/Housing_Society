import { getErrorMessage } from '../../../lib/axios';

export const PARKING_TYPES = [
  { value: 'COVERED', label: 'Covered' },
  { value: 'OPEN', label: 'Open' },
  { value: 'MECHANICAL', label: 'Mechanical' },
  { value: 'STACK', label: 'Stack' },
];
export const SLOT_TYPES = [...PARKING_TYPES, { value: 'VISITOR', label: 'Visitor' }];
export const VEHICLE_TYPES = [
  { value: 'TWO_WHEELER', label: 'Two-wheeler' },
  { value: 'FOUR_WHEELER', label: 'Four-wheeler' },
  { value: 'EV', label: 'EV' },
  { value: 'OTHER', label: 'Other' },
];
export const ALLOCATION_TYPES = [
  { value: 'OWNER', label: 'Owner' },
  { value: 'TENANT', label: 'Tenant' },
  { value: 'VISITOR', label: 'Visitor' },
  { value: 'TEMPORARY_RENTAL', label: 'Temporary rental' },
];

export const labelOf = (options, value) => options.find((o) => o.value === value)?.label || value;

// The backend reports a blocked delete as a "foreign key" error - say it plainly.
export const friendlyDeleteError = (error, what) => {
  const message = getErrorMessage(error);
  return /foreign key|could not be deleted/i.test(message)
    ? `This ${what} can't be deleted because other records still use it. Mark it inactive instead.`
    : message;
};

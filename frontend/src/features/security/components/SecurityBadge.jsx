import { label } from './securityOptions';

const tone = (value) => {
  if (['ACTIVE', 'ONLINE', 'APPROVED', 'INSIDE', 'ARRIVED', 'PICKED_UP', 'COLLECTED', 'NONE', 'PROCESSED'].includes(value)) return 'badge-active';
  if (['SUSPENDED', 'BLACKLISTED', 'OVERSTAY', 'ERROR', 'LOST', 'DAMAGED', 'REJECTED', 'CANCELLED'].includes(value)) return 'badge-suspended';
  if (['PENDING', 'EXPECTED', 'STORED', 'OPEN', 'OFFLINE', 'RECEIVED'].includes(value)) return 'badge-pending';
  return 'badge-custom';
};

export default function SecurityBadge({ value }) {
  return <span className={`badge ${tone(value)}`}>{label(value)}</span>;
}

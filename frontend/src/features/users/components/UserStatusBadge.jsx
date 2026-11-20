const LABELS = {
  ACTIVE: 'Active',
  INACTIVE: 'Inactive',
  ON_LEAVE: 'On leave',
  TERMINATED: 'Terminated',
  SUSPENDED: 'Suspended',
  PENDING: 'Pending',
  ARCHIVED: 'Archived',
};

export const STATUS_OPTIONS = Object.entries(LABELS).map(([value, label]) => ({ value, label }));

export default function UserStatusBadge({ status }) {
  return <span className={`badge badge-${String(status).toLowerCase()}`}>{LABELS[status] || status}</span>;
}

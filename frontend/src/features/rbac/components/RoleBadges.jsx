export function RoleTypeBadge({ isSystem }) {
  return <span className={`badge ${isSystem ? 'badge-system' : 'badge-custom'}`}>{isSystem ? 'System' : 'Custom'}</span>;
}

export function RoleStatusBadge({ status }) {
  const active = status === 'ACTIVE';
  return <span className={`badge ${active ? 'badge-active' : 'badge-inactive'}`}>{active ? 'Active' : 'Inactive'}</span>;
}

import DataTable from '../../../components/tables/DataTable';
import { getErrorMessage } from '../../../lib/axios';
import { formatDateTime, humanize } from '../../../utils/format';

const columns = [
  { key: 'login_at', header: 'When', render: (row) => formatDateTime(row.login_at) },
  {
    key: 'success',
    header: 'Result',
    render: (row) => (
      <span className={`badge ${row.success ? 'badge-active' : 'badge-suspended'}`}>{row.success ? 'Signed in' : 'Failed'}</span>
    ),
  },
  { key: 'failure_reason', header: 'Reason', render: (row) => (row.failure_reason ? humanize(row.failure_reason) : '-') },
  { key: 'ip_address', header: 'IP address', render: (row) => row.ip_address || '-' },
  {
    key: 'user_agent',
    header: 'Device',
    render: (row) => (
      <span className="truncate" title={row.user_agent || ''}>
        {row.user_agent || '-'}
      </span>
    ),
  },
  { key: 'logout_at', header: 'Signed out', render: (row) => formatDateTime(row.logout_at) },
];

/** `history` is the object returned by useFetch(getLoginHistory). */
export default function LoginHistoryTable({ history }) {
  return (
    <DataTable
      columns={columns}
      rows={history.data}
      loading={history.loading}
      error={history.error ? getErrorMessage(history.error) : ''}
      onRetry={history.reload}
      emptyTitle="No sign-in attempts yet"
      emptyMessage="Sign-in attempts for this user will appear here."
    />
  );
}

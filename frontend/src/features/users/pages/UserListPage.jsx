import { useState } from 'react';
import { Plus } from 'lucide-react';
import { Link } from 'react-router-dom';
import useAuth from '../../../app/providers/useAuth';
import useSociety from '../../../app/store/useSociety';
import useFetch from '../../../utils/useFetch';
import useDebounce from '../../../utils/useDebounce';
import { fullName, formatDateTime, formatDate } from '../../../utils/format';
import { getErrorMessage } from '../../../lib/axios';
import * as userApi from '../api/user.api';
import PageContainer from '../../../components/layout/PageContainer';
import DataTable from '../../../components/tables/DataTable';
import UserStatusBadge, { STATUS_OPTIONS } from '../components/UserStatusBadge';

const PAGE_SIZE = 10;

export default function UserListPage() {
  const { hasPermission } = useAuth();
  const { societyId } = useSociety();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const debouncedSearch = useDebounce(search.trim());

  const { data, loading, error, reload } = useFetch(
    () => userApi.listUsers({ page, limit: PAGE_SIZE, status, search: debouncedSearch, societyId }),
    [page, status, debouncedSearch, societyId]
  );

  const canCreate = hasPermission('USER_CREATE');
  const filtersActive = Boolean(status || debouncedSearch);

  const clearFilters = () => {
    setSearch('');
    setStatus('');
    setPage(1);
  };

  const columns = [
    {
      key: 'name',
      header: 'Name',
      render: (user) => (
        <>
          <Link to={`/users/${user.id}`} className="cell-title">
            {fullName(user)}
          </Link>
          <span className="cell-sub">{user.email}</span>
        </>
      ),
    },
    { key: 'phone', header: 'Phone', render: (user) => user.phone || '-' },
    { key: 'status', header: 'Status', render: (user) => <UserStatusBadge status={user.status} /> },
    { key: 'last_login_at', header: 'Last sign-in', render: (user) => formatDateTime(user.last_login_at, 'Never') },
    { key: 'created_at', header: 'Added', render: (user) => formatDate(user.created_at) },
  ];

  const newUserButton = canCreate && (
    <Link to="/users/new" className="btn btn-primary">
      <Plus size={16} /> New user
    </Link>
  );

  return (
    <PageContainer title="Users" subtitle="Everyone who can sign in to the admin panel." actions={newUserButton}>
      <div className="toolbar">
        <input
          type="search"
          className="input toolbar-search"
          placeholder="Search by name or email"
          aria-label="Search users"
          value={search}
          onChange={(event) => {
            setSearch(event.target.value);
            setPage(1);
          }}
        />
        <select
          className="input toolbar-select"
          aria-label="Filter by status"
          value={status}
          onChange={(event) => {
            setStatus(event.target.value);
            setPage(1);
          }}
        >
          <option value="">All statuses</option>
          {STATUS_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      <DataTable
        columns={columns}
        rows={data ? data.users : null}
        loading={loading}
        error={error ? getErrorMessage(error) : ''}
        onRetry={reload}
        emptyTitle={filtersActive ? 'No users match these filters' : 'No users yet'}
        emptyMessage={filtersActive ? 'Try a different search or status.' : 'Create the first user to get started.'}
        emptyAction={
          filtersActive ? (
            <button type="button" className="btn btn-secondary" onClick={clearFilters}>
              Clear filters
            </button>
          ) : (
            newUserButton || null
          )
        }
        pagination={data ? { ...data.pagination, onPageChange: setPage } : null}
      />
    </PageContainer>
  );
}

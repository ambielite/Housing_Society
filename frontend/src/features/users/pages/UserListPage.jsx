import { useState } from 'react';
import { Plus, ShieldCheck, UserRound, UsersRound } from 'lucide-react';
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
    <PageContainer eyebrow="USER MANAGEMENT" title="Users" subtitle="Manage accounts, contact details, and access to your society." actions={newUserButton} className="user-module-page user-directory-page">
      <div className="user-directory-overview" aria-label="User directory summary">
        <article className="user-directory-metric user-directory-metric-total"><span><UsersRound size={19} /></span><div><small>Registered users</small><strong>{loading ? '—' : data?.pagination?.total ?? data?.users?.length ?? 0}</strong></div></article>
        <article className="user-directory-metric user-directory-metric-visible"><span><UserRound size={19} /></span><div><small>Users on this page</small><strong>{loading ? '—' : data?.users?.length ?? 0}</strong></div></article>
        <article className="user-directory-metric user-directory-metric-access"><span><ShieldCheck size={19} /></span><div><small>Access</small><strong>Role based</strong></div></article>
      </div>
      <section className="user-directory-panel">
        <div className="user-directory-heading"><div><span className="user-directory-kicker">ACCOUNT DIRECTORY</span><h2>User accounts</h2><p>Search by name, email, or phone number, then manage each account.</p></div><span className="user-directory-count">{loading ? 'Loading…' : `${data?.pagination?.total ?? data?.users?.length ?? 0} records`}</span></div>
      <div className="toolbar user-directory-toolbar">
        <input
          type="search"
          className="input toolbar-search"
          placeholder="Search by name, email, or phone"
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
        tableClassName="user-directory-table"
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
      </section>
    </PageContainer>
  );
}

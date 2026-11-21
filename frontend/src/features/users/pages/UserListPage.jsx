import { useDashboardFeedback } from '../../../lib/useDashboardFeedback.js';
import { confirmDashboardAction } from '../../../lib/dashboardConfirmation.js';
import { useState } from 'react';
import { Plus, Search, ShieldCheck, Trash2, UserRound, UsersRound } from 'lucide-react';
import { Link } from 'react-router-dom';
import useAuth from '../../../app/providers/useAuth';
import useSociety from '../../../app/store/useSociety';
import useFetch from '../../../utils/useFetch';
import useDebounce from '../../../utils/useDebounce';
import { fullName, formatDateTime, formatDate } from '../../../utils/format';
import { getErrorMessage } from '../../../lib/axios';
import * as userApi from '../api/user.api';
import securityApi from '../../security/api/security-operations.api';
import PageContainer from '../../../components/layout/PageContainer';
import DataTable from '../../../components/tables/DataTable';
import UserStatusBadge, { STATUS_OPTIONS } from '../components/UserStatusBadge';
import Modal from '../../../components/ui/Modal';
import UserForm from '../components/UserForm';
import Alert from '../../../components/ui/Alert';

const PAGE_SIZE = 10;

function UserTableAvatar({ user }) {
  const picture = user.profile_picture_url;
  const pictureUrl = picture
    ? (/^https?:\/\//i.test(picture)
      ? picture
      : new URL(
        picture,
        new URL(import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api/v1', window.location.origin),
      ).toString())
    : '';
  const initial = (user.first_name || user.email || '?').charAt(0).toUpperCase();

  return (
    <span className="user-directory-avatar">
      {pictureUrl && (
        <img
          src={pictureUrl}
          alt=""
          loading="lazy"
          onError={(event) => {
            event.currentTarget.hidden = true;
            event.currentTarget.nextElementSibling.hidden = false;
          }}
        />
      )}
      <span hidden={Boolean(pictureUrl)}>{initial}</span>
    </span>
  );
}

export default function UserListPage() {
  const { hasPermission, user: currentUser } = useAuth();
  const { societyId } = useSociety();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [showNewUser, setShowNewUser] = useState(false);
  const [creatingUser, setCreatingUser] = useState(false);
  const [createError, setCreateError] = useDashboardFeedback('', 'error');
  const [deleteError, setDeleteError] = useDashboardFeedback('', 'error');
  const [deletingUserId, setDeletingUserId] = useState('');
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

  const createUser = async (payload) => {
    setCreatingUser(true);
    setCreateError('');
    try {
      await userApi.createUser(payload);
      setShowNewUser(false);
      await reload();
    } catch (error) {
      setCreateError(getErrorMessage(error));
    } finally {
      setCreatingUser(false);
    }
  };

  const deleteUser = async (user) => {
    if (String(user.status).toUpperCase() === 'ACTIVE') {
      setDeleteError(user.record_type === 'SECURITY_GUARD'
        ? 'Cannot delete active staff. Deactivate the guard first.'
        : 'Cannot delete active user. Deactivate the account first.');
      return;
    }
    const name = fullName(user);
    const recordType = user.record_type === 'SECURITY_GUARD' ? 'guard staff record' : 'user account';
    if (!await confirmDashboardAction(`Permanently delete ${name}'s ${recordType}? This removes the record from the database and cannot be undone.`)) return;
    setDeleteError('');
    setDeletingUserId(user.id);
    try {
      if (user.record_type === 'SECURITY_GUARD') {
        await securityApi.deleteStaff(user.staff_id);
      } else {
        await userApi.deleteUser(user.id);
      }
      await reload();
    } catch (error) {
      setDeleteError(getErrorMessage(error));
    } finally {
      setDeletingUserId('');
    }
  };

  const columns = [
    {
      key: 'name',
      header: 'Name',
      render: (user) => (
        <div className="user-directory-name-cell">
          <UserTableAvatar user={user} />
          <span className="user-directory-name-copy">
            {user.record_type === 'SECURITY_GUARD'
              ? <Link to={`/users/guards/${user.staff_id}`} className="cell-title">{fullName(user)}</Link>
              : <Link to={`/users/${user.id}`} className="cell-title">{fullName(user)}</Link>}
            <span className="cell-sub">{user.email}</span>
          </span>
        </div>
      ),
    },
    { key: 'employee_code', header: 'Employee code', render: (user) => user.employee_code || '—' },
    { key: 'phone', header: 'Phone', render: (user) => user.phone || '-' },
    {
      key: 'roles',
      header: 'Roles',
      render: (user) => user.roles?.length
        ? <span className="chips">{user.roles.map((role) => <span className="chip" key={role}>{role}</span>)}</span>
        : <span className="muted">No role</span>,
    },
    { key: 'status', header: 'Status', render: (user) => <UserStatusBadge status={user.status} /> },
    { key: 'last_login_at', header: 'Last sign-in', render: (user) => formatDateTime(user.last_login_at, 'Never') },
    { key: 'created_at', header: 'Added', render: (user) => formatDate(user.created_at) },
    ...(hasPermission('USER_DELETE') ? [{
      key: 'actions',
      header: 'Actions',
      render: (user) => (user.record_type === 'SECURITY_GUARD' || user.id !== currentUser?.id)
        ? (
          <button
            type="button"
            className="society-icon-action society-delete-action"
            title={user.record_type === 'SECURITY_GUARD' ? 'Delete inactive staff' : 'Delete inactive user'}
            aria-label={`Delete ${user.record_type === 'SECURITY_GUARD' ? 'inactive staff member' : 'inactive user'} ${fullName(user)}`}
            disabled={deletingUserId === user.id}
            onClick={() => deleteUser(user)}
          >
            <Trash2 size={16} />
          </button>
        )
        : <span className="muted">—</span>,
    }] : []),
  ];

  const newUserButton = canCreate && (
    <button type="button" onClick={() => { setCreateError(''); setShowNewUser(true); }} className="btn btn-primary">
      <Plus size={16} /> New user
    </button>
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
        <label className="society-search toolbar-search">
          <Search size={17} />
          <input
            type="search"
            placeholder="Search by name, email, or phone"
            aria-label="Search users"
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setPage(1);
            }}
          />
        </label>
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

      {deleteError && <Alert>{deleteError}</Alert>}

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
      {showNewUser && <Modal className="user-create-dialog" title="New user" onClose={() => !creatingUser && setShowNewUser(false)} busy={creatingUser}>
        <UserForm mode="create" initialValues={{}} societyId={societyId} onSubmit={createUser} submitting={creatingUser} submitError={createError} onCancel={() => setShowNewUser(false)} />
      </Modal>}
    </PageContainer>
  );
}

import { useState } from 'react';
import { KeyRound, Plus, ShieldCheck, UsersRound } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import useAuth from '../../../app/providers/useAuth';
import useFetch from '../../../utils/useFetch';
import { getErrorMessage } from '../../../lib/axios';
import * as rbacApi from '../api/rbac.api';
import PageContainer from '../../../components/layout/PageContainer';
import DataTable from '../../../components/tables/DataTable';
import Alert from '../../../components/ui/Alert';
import Modal from '../../../components/ui/Modal';
import RoleForm from '../components/RoleForm';
import { RoleStatusBadge, RoleTypeBadge } from '../components/RoleBadges';

export default function RoleListPage() {
  const { hasPermission } = useAuth();
  const notice = useLocation().state?.notice;
  const [search, setSearch] = useState('');
  const [type, setType] = useState('');
  const [status, setStatus] = useState('');
  const [createOpen, setCreateOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState('');
  const [successNotice, setSuccessNotice] = useState('');

  const { data, loading, error, reload } = useFetch(() => rbacApi.listRoles(), []);

  // The list is small, so search and filter happen in the browser.
  const term = search.trim().toLowerCase();
  const rows = data
    ? data.filter((role) => {
        if (type === 'system' && !role.is_system_role) return false;
        if (type === 'custom' && role.is_system_role) return false;
        if (status && String(role.status || '').toLowerCase() !== status) return false;
        return !term || `${role.name} ${role.code}`.toLowerCase().includes(term);
      })
    : null;
  const filtersActive = Boolean(term || type || status);
  const systemRoles = data?.filter((role) => role.is_system_role).length || 0;
  const customRoles = data?.filter((role) => !role.is_system_role).length || 0;

  const handleCreateRole = async (payload) => {
    setCreating(true);
    setCreateError('');
    try {
      const role = await rbacApi.createRole(payload);
      setCreateOpen(false);
      setSuccessNotice(`Role "${role?.name || payload.name}" created.`);
      reload();
    } catch (requestError) {
      setCreateError(getErrorMessage(requestError));
    } finally {
      setCreating(false);
    }
  };

  const columns = [
    {
      key: 'name',
      header: 'Role',
      render: (role) => (
        <>
          <Link to={`/roles/${role.id}`} className="cell-title">
            {role.name}
          </Link>
          <span className="cell-sub">{role.code}</span>
        </>
      ),
    },
    { key: 'type', header: 'Type', render: (role) => <RoleTypeBadge isSystem={role.is_system_role} /> },
    { key: 'status', header: 'Status', render: (role) => <RoleStatusBadge status={role.status} /> },
    { key: 'description', header: 'Description', render: (role) => role.description || '-' },
  ];

  const newRoleButton = hasPermission('ROLE_CREATE') && (
    <button type="button" className="btn btn-primary" onClick={() => { setCreateError(''); setCreateOpen(true); }}>
      <Plus size={16} /> Add role
    </button>
  );

  return (
    <PageContainer
      eyebrow="ACCESS CONTROL"
      title="Roles"
      subtitle="A role is a named set of permissions. Give users roles to control what they can see and do."
      actions={newRoleButton}
      className="roles-module-page role-directory-page"
    >
      {notice && <Alert variant="success">{notice}</Alert>}
      {successNotice && <Alert variant="success">{successNotice}</Alert>}

      <div className="role-directory-overview" aria-label="Role directory summary">
        <article className="role-directory-metric role-directory-metric-total"><span><ShieldCheck size={19} /></span><div><small>All roles</small><strong>{loading ? '—' : data?.length || 0}</strong></div></article>
        <article className="role-directory-metric role-directory-metric-system"><span><KeyRound size={19} /></span><div><small>Built-in roles</small><strong>{loading ? '—' : systemRoles}</strong></div></article>
        <article className="role-directory-metric role-directory-metric-custom"><span><UsersRound size={19} /></span><div><small>Custom roles</small><strong>{loading ? '—' : customRoles}</strong></div></article>
      </div>

      <section className="role-directory-panel">
      <div className="role-directory-heading"><div><span className="role-directory-kicker">ACCESS DIRECTORY</span><h2>Roles & permissions</h2><p>Review built-in roles or manage custom access profiles.</p></div><span className="role-directory-count">{loading ? 'Loading…' : `${rows?.length ?? 0} shown`}</span></div>
      <div className="toolbar role-directory-toolbar">
        <input
          type="search"
          className="input toolbar-search"
          placeholder="Search by name or code"
          aria-label="Search roles"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
        <select className="input toolbar-select" aria-label="Filter by type" value={type} onChange={(event) => setType(event.target.value)}>
          <option value="">All types</option>
          <option value="system">System roles</option>
          <option value="custom">Custom roles</option>
        </select>
        <select className="input toolbar-select" aria-label="Filter by status" value={status} onChange={(event) => setStatus(event.target.value)}>
          <option value="">All statuses</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>

      <DataTable
        tableClassName="role-directory-table"
        columns={columns}
        rows={rows}
        loading={loading}
        error={error ? getErrorMessage(error) : ''}
        onRetry={reload}
        emptyTitle={filtersActive ? 'No roles match these filters' : 'No roles yet'}
        emptyMessage={filtersActive ? 'Try a different search or type.' : 'Create a role to get started.'}
        emptyAction={
          filtersActive ? (
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => {
                setSearch('');
                setType('');
                setStatus('');
              }}
            >
              Clear filters
            </button>
          ) : (
            newRoleButton || null
          )
        }
      />
      </section>
      {createOpen && (
        <Modal title="Create role" busy={creating} onClose={() => setCreateOpen(false)} className="role-create-dialog">
          <RoleForm
            mode="create"
            initialValues={{}}
            onSubmit={handleCreateRole}
            submitting={creating}
            submitError={createError}
            onCancel={() => setCreateOpen(false)}
            compact
          />
        </Modal>
      )}
    </PageContainer>
  );
}

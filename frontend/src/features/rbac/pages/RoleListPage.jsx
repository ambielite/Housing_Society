import { useState } from 'react';
import { Plus } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import useAuth from '../../../app/providers/useAuth';
import useFetch from '../../../utils/useFetch';
import { getErrorMessage } from '../../../lib/axios';
import * as rbacApi from '../api/rbac.api';
import PageContainer from '../../../components/layout/PageContainer';
import DataTable from '../../../components/tables/DataTable';
import Alert from '../../../components/ui/Alert';
import { RoleStatusBadge, RoleTypeBadge } from '../components/RoleBadges';

export default function RoleListPage() {
  const { hasPermission } = useAuth();
  const notice = useLocation().state?.notice;
  const [search, setSearch] = useState('');
  const [type, setType] = useState('');

  const { data, loading, error, reload } = useFetch(() => rbacApi.listRoles(), []);

  // The list is small, so search and filter happen in the browser.
  const term = search.trim().toLowerCase();
  const rows = data
    ? data.filter((role) => {
        if (type === 'system' && !role.is_system_role) return false;
        if (type === 'custom' && role.is_system_role) return false;
        return !term || `${role.name} ${role.code}`.toLowerCase().includes(term);
      })
    : null;
  const filtersActive = Boolean(term || type);

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
    <Link to="/roles/new" className="btn btn-primary">
      <Plus size={16} /> New role
    </Link>
  );

  return (
    <PageContainer
      title="Roles"
      subtitle="A role is a named set of permissions. Give users roles to control what they can see and do."
      actions={newRoleButton}
    >
      {notice && <Alert variant="success">{notice}</Alert>}

      <div className="toolbar">
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
      </div>

      <DataTable
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
              }}
            >
              Clear filters
            </button>
          ) : (
            newRoleButton || null
          )
        }
      />
    </PageContainer>
  );
}

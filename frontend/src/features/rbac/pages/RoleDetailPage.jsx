import { useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import useAuth from '../../../app/providers/useAuth';
import useFetch from '../../../utils/useFetch';
import { getErrorMessage } from '../../../lib/axios';
import * as rbacApi from '../api/rbac.api';
import PageContainer from '../../../components/layout/PageContainer';
import Alert from '../../../components/ui/Alert';
import ConfirmDialog from '../../../components/ui/ConfirmDialog';
import { FullPageLoader } from '../../../components/ui/Spinner';
import { RoleStatusBadge, RoleTypeBadge } from '../components/RoleBadges';
import RolePermissionsEditor from '../components/RolePermissionsEditor';

export default function RoleDetailPage() {
  const { roleId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { hasPermission } = useAuth();

  const canAssign = hasPermission('ROLE_PERMISSION_ASSIGN');
  const canSeeCatalog = canAssign && hasPermission('PERMISSION_READ');

  // There is no "get one role" endpoint, so the role is found in the list.
  const roles = useFetch(() => rbacApi.listRoles(), []);
  const granted = useFetch(() => rbacApi.getRolePermissions(roleId), [roleId]);
  const catalog = useFetch(() => (canSeeCatalog ? rbacApi.listPermissions() : Promise.resolve(null)), [canSeeCatalog]);

  // After each tick the API returns the fresh list; keep it here (tagged with the role it belongs to).
  const [override, setOverride] = useState(null);
  const [notice, setNotice] = useState(location.state?.notice || '');
  const [actionError, setActionError] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [busy, setBusy] = useState(false);

  if (roles.loading && !roles.data) return <FullPageLoader />;

  const role = roles.data?.find((r) => r.id === roleId);

  if (!role) {
    return (
      <div className="empty-state">
        <h1>{roles.error ? "Couldn't load this role" : 'Role not found'}</h1>
        <p>{roles.error ? getErrorMessage(roles.error) : 'It may have been deleted, or the link is wrong.'}</p>
        <p>
          <Link to="/roles">Back to roles</Link>
        </p>
      </div>
    );
  }

  const grantedRows = override?.roleId === roleId ? override.rows : granted.data;
  const isSystem = role.is_system_role;
  const canEditPermissions = !isSystem && canAssign && Boolean(catalog.data);

  const deleteRole = async () => {
    setBusy(true);
    setActionError('');
    try {
      await rbacApi.deleteRole(roleId);
      navigate('/roles', { replace: true, state: { notice: `Role "${role.name}" deleted.` } });
    } catch (err) {
      setActionError(getErrorMessage(err));
      setBusy(false);
      setConfirmDelete(false);
    }
  };

  const actionButtons = !isSystem && (
    <>
      {hasPermission('ROLE_UPDATE') && (
        <Link to={`/roles/${roleId}/edit`} className="btn btn-secondary">
          Edit
        </Link>
      )}
      {hasPermission('ROLE_DELETE') && (
        <button type="button" className="btn btn-danger" onClick={() => setConfirmDelete(true)}>
          Delete
        </button>
      )}
    </>
  );

  return (
    <PageContainer title={role.name} subtitle={role.code} actions={actionButtons}>
      <p className="back-link">
        <Link to="/roles">&larr; All roles</Link>
      </p>

      {notice && <Alert variant="success">{notice}</Alert>}
      {actionError && <Alert>{actionError}</Alert>}

      <div className="card section">
        <dl className="details">
          <dt>Type</dt>
          <dd>
            <RoleTypeBadge isSystem={isSystem} />
          </dd>
          <dt>Status</dt>
          <dd>
            <RoleStatusBadge status={role.status} />
          </dd>
          <dt>Description</dt>
          <dd>{role.description || '-'}</dd>
        </dl>
      </div>

      <div className="section">
        <h2 className="section-title">Permissions</h2>
        {isSystem && (
          <p className="muted section-hint">
            System roles are built in, so their permissions are read-only. To build your own set, create a custom role.
          </p>
        )}
        {!isSystem && canAssign && catalog.error && (
          <Alert>Couldn't load the full permission list, so you can only view this role's permissions right now.</Alert>
        )}
        {!isSystem && !canAssign && (
          <p className="muted section-hint">You can view this role's permissions but not change them.</p>
        )}

        {granted.loading && !grantedRows ? (
          <FullPageLoaderInline />
        ) : granted.error && !grantedRows ? (
          <Alert>{getErrorMessage(granted.error)}</Alert>
        ) : (
          <RolePermissionsEditor
            roleId={roleId}
            catalog={catalog.data}
            granted={grantedRows}
            canEdit={canEditPermissions}
            onGrantedChange={(rows) => {
              setNotice('');
              setOverride({ roleId, rows });
            }}
          />
        )}
      </div>

      <ConfirmDialog
        open={confirmDelete}
        title="Delete this role?"
        message={`"${role.name}" will be deleted for good. Everyone who holds it loses the role and the permissions it gave them.`}
        confirmLabel="Delete role"
        danger
        busy={busy}
        onConfirm={deleteRole}
        onCancel={() => setConfirmDelete(false)}
      />
    </PageContainer>
  );
}

function FullPageLoaderInline() {
  return (
    <div className="table-state">
      <span className="spinner" role="status" aria-label="Loading" />
    </div>
  );
}

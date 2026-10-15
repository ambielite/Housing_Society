import { useState } from 'react';
import useAuth from '../../../app/providers/useAuth';
import useFetch from '../../../utils/useFetch';
import { humanize } from '../../../utils/format';
import { getErrorMessage } from '../../../lib/axios';
import * as rbacApi from '../api/rbac.api';
import Alert from '../../../components/ui/Alert';
import ConfirmDialog from '../../../components/ui/ConfirmDialog';

/**
 * Shown on the User detail page. Lists a user's roles and (with USER_ROLE_ASSIGN)
 * lets you add or remove them.
 *   roleCodes: the user's current role codes     societyId: the user's society, if any
 *   isSelf:    true when viewing your own account (removing your own roles is blocked)
 *   onChanged(message): called after a successful change so the page can reload
 */
export default function UserRolesCard({ userId, roleCodes, societyId, isSelf, onChanged }) {
  const { hasPermission } = useAuth();
  const canManage = hasPermission('USER_ROLE_ASSIGN');
  const canListRoles = canManage && hasPermission('ROLE_READ');

  const roles = useFetch(() => (canListRoles ? rbacApi.listRoles() : Promise.resolve(null)), [canListRoles]);
  const [selected, setSelected] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [removing, setRemoving] = useState(null); // role code waiting for confirmation

  const allRoles = roles.data || [];
  const nameFor = (code) => allRoles.find((r) => r.code === code)?.name || humanize(code);
  const options = allRoles.filter((r) => r.status === 'ACTIVE' && !roleCodes.includes(r.code));

  const assign = async () => {
    if (!selected) return;
    setBusy(true);
    setError('');
    try {
      await rbacApi.assignRoleToUser({ userId, roleCode: selected, societyId });
      setSelected('');
      onChanged('Role assigned.');
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    setBusy(true);
    setError('');
    try {
      await rbacApi.removeRoleFromUser(userId, removing, societyId);
      onChanged('Role removed.');
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setBusy(false);
      setRemoving(null);
    }
  };

  return (
    <div className="card section">
      <h2 className="section-title">Roles</h2>
      {error && <Alert>{error}</Alert>}

      {roleCodes.length === 0 ? (
        <p className="muted">No role assigned yet. Without a role this user can sign in but can't open anything.</p>
      ) : (
        <span className="chips">
          {roleCodes.map((code) => (
            <span key={code} className="chip">
              {nameFor(code)}
              {canManage && !isSelf && (
                <button
                  type="button"
                  className="chip-remove"
                  aria-label={`Remove ${nameFor(code)}`}
                  onClick={() => setRemoving(code)}
                >
                  &times;
                </button>
              )}
            </span>
          ))}
        </span>
      )}

      {canManage && isSelf && <p className="field-hint">You can't remove your own roles.</p>}

      {canManage && !canListRoles && <p className="field-hint">You need permission to view roles before you can assign one.</p>}

      {canListRoles && (
        <div className="assign-row">
          <select
            className="input toolbar-select"
            aria-label="Role to assign"
            value={selected}
            onChange={(event) => setSelected(event.target.value)}
            disabled={roles.loading && !roles.data}
          >
            <option value="">{options.length ? 'Choose a role to add' : 'No more roles to add'}</option>
            {options.map((r) => (
              <option key={r.id} value={r.code}>
                {r.name}
              </option>
            ))}
          </select>
          <button type="button" className="btn btn-primary" onClick={assign} disabled={!selected || busy}>
            {busy ? 'Working...' : 'Add role'}
          </button>
        </div>
      )}

      <ConfirmDialog
        open={Boolean(removing)}
        title="Remove this role?"
        message={`${removing ? nameFor(removing) : ''} and the permissions it grants will be taken away from this user.`}
        confirmLabel="Remove role"
        danger
        busy={busy}
        onConfirm={remove}
        onCancel={() => setRemoving(null)}
      />
    </div>
  );
}

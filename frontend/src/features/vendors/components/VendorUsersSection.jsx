import { useMemo, useState } from 'react';
import useAuth from '../../../app/providers/useAuth';
import useFetch from '../../../utils/useFetch';
import { fullName } from '../../../utils/format';
import { getErrorMessage } from '../../../lib/axios';
import * as vendorsApi from '../api/vendors.api';
import * as usersApi from '../../users/api/user.api';
import DataTable from '../../../components/tables/DataTable';
import SelectField from '../../../components/ui/SelectField';
import Alert from '../../../components/ui/Alert';
import ConfirmDialog from '../../../components/ui/ConfirmDialog';

const extractUsers = (response) => {
  if (Array.isArray(response)) return response;
  if (Array.isArray(response?.users)) return response.users;
  if (Array.isArray(response?.data?.users)) return response.data.users;
  if (Array.isArray(response?.items)) return response.items;
  if (Array.isArray(response?.data?.items)) return response.data.items;
  if (Array.isArray(response?.data)) return response.data;
  return [];
};

const getUserId = (user) => user.id ?? user.user_id ?? user.userId;

export default function VendorUsersSection({ vendorId, societyId }) {
  const { hasPermission } = useAuth();

  const canManage =
    hasPermission('VENDOR_UPDATE') &&
    hasPermission('USER_READ');

  const linked = useFetch(
    () => vendorsApi.listVendorUsers(vendorId),
    [vendorId]
  );

  // Keep the backend society filter; do not load users from other societies.
 
const candidates = useFetch(
  () =>
    canManage && societyId
      ? usersApi.listUsers({ societyId, status: 'ACTIVE', limit: 100 })
      : Promise.resolve(null),
  [canManage, societyId]
);


  const [selectedUserId, setSelectedUserId] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [removeTarget, setRemoveTarget] = useState(null);

  const linkedRows = extractUsers(linked.data);

 const userOptions = useMemo(() => {
  const linkedUserIds = new Set(
    linkedRows.map(getUserId).filter(Boolean).map(String)
  );

  const users = extractUsers(candidates.data);

  return users
    .filter(
      (user) =>
        String(user.status || '').trim().toUpperCase() === 'ACTIVE'
    )
    .filter((user) => {
      const id = getUserId(user);

      return (
        id &&
        user.email &&
        !linkedUserIds.has(String(id))
      );
    })
    .map((user) => {
      const id = getUserId(user);

      return {
        value: String(id),
        label: `${fullName(user) || user.email} (${user.email})`,
      };
    });
}, [candidates.data, linkedRows, societyId]);

  const link = async () => {
    if (!selectedUserId) {
      setError('Select an existing user to link.');
      return;
    }

    setSaving(true);
    setError('');
    setNotice('');

    try {
      await vendorsApi.linkVendorUser(vendorId, selectedUserId);
      setSelectedUserId('');
      setNotice('User linked to this vendor.');
      linked.reload();
      candidates.reload();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const unlink = async () => {
    if (!removeTarget) return;

    setSaving(true);
    setError('');
    setNotice('');

    try {
      await vendorsApi.unlinkVendorUser(
        vendorId,
        getUserId(removeTarget)
      );

      setNotice('User unlinked from this vendor.');
      setRemoveTarget(null);
      linked.reload();
      candidates.reload();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const columns = [
    {
      key: 'user',
      header: 'User',
      render: (user) => (
        <>
          <span className="cell-title">
            {fullName(user) || user.email}
          </span>
          <span className="cell-sub">{user.email}</span>
        </>
      ),
    },
    {
      key: 'phone',
      header: 'Phone',
      render: (user) => user.phone || 'â€”',
    },
    {
      key: 'status',
      header: 'Status',
      render: (user) => (
        <span
          className={`badge ${
            String(user.status || '').toUpperCase() === 'ACTIVE'
              ? 'badge-active'
              : 'badge-system'
          }`}
        >
          {user.status || 'â€”'}
        </span>
      ),
    },
    {
      key: 'linked_at',
      header: 'Linked on',
      render: (user) =>
        user.linked_at
          ? new Date(user.linked_at).toLocaleDateString()
          : 'â€”',
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (user) =>
        canManage ? (
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => setRemoveTarget(user)}
          >
            Unlink
          </button>
        ) : null,
    },
  ];

  return (
    <div>
      <div className="section-head">
        <div>
          <h2 className="section-title">Linked user accounts</h2>
          <p className="muted section-hint">
            Link existing accounts to this vendor. Each vendor can have
            multiple users; a user account can belong to only one vendor.
          </p>
        </div>
      </div>

      {notice && <Alert variant="success">{notice}</Alert>}
      {error && <Alert>{error}</Alert>}

      {canManage && (
        <div className="card form-wide" style={{ marginBottom: 16 }}>
          <h3 style={{ marginTop: 0 }}>Link an existing user</h3>

          <div className="form-grid">
            <SelectField
              id="vendor-user-link"
              label="Active user in this society"
              placeholder={
                candidates.loading ? 'Loading usersâ€¦' : 'Select user'
              }
              options={userOptions}
              value={selectedUserId}
              onChange={(event) => setSelectedUserId(event.target.value)}
              hint="Users already linked to a vendor are excluded."
            />

            <div className="form-actions" style={{ alignSelf: 'end' }}>
              <button
                type="button"
                className="btn btn-primary"
                disabled={
                  saving || candidates.loading || !selectedUserId
                }
                onClick={link}
              >
                {saving ? 'Savingâ€¦' : 'Link user'}
              </button>
            </div>
          </div>

          {candidates.error && (
            <p className="field-error">
              Could not load users: {getErrorMessage(candidates.error)}
            </p>
          )}

          {/* {!candidates.loading &&
            !candidates.error &&
            !societyId && (
              <p className="field-error">
                The vendor's society ID is missing. Users were not loaded.
              </p>
            )} */}

          {!candidates.loading &&
            !candidates.error &&
            societyId &&
            userOptions.length === 0 && (
              <p className="muted">
                No unlinked active users were returned for this society.
                Check the users API response and society ID.
              </p>
            )}
        </div>
      )}

      <DataTable
        columns={columns}
        rows={linkedRows}
        loading={linked.loading}
        error={linked.error ? getErrorMessage(linked.error) : ''}
        onRetry={linked.reload}
        emptyTitle="No linked user accounts"
        emptyMessage="Link an existing user account so that person can access the vendor's permitted data."
      />

      <ConfirmDialog
        open={Boolean(removeTarget)}
        title="Unlink this user?"
        message={`${
          removeTarget
            ? fullName(removeTarget) || removeTarget.email
            : ''
        } will lose the vendor relationship. Their user account and the vendor record will remain.`}
        confirmLabel="Unlink user"
        danger
        busy={saving}
        onConfirm={unlink}
        onCancel={() => setRemoveTarget(null)}
      />
    </div>
  );
}

import { useDashboardFeedback } from '../../../lib/useDashboardFeedback.js';
import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import useAuth from '../../../app/providers/useAuth';
import useFetch from '../../../utils/useFetch';
import { fullName, formatDateTime } from '../../../utils/format';
import { getErrorMessage } from '../../../lib/axios';
import * as userApi from '../api/user.api';
import securityApi from '../../security/api/security-operations.api';
import PageContainer from '../../../components/layout/PageContainer';
import Alert from '../../../components/ui/Alert';
import { FullPageLoader } from '../../../components/ui/Spinner';
import ConfirmDialog from '../../../components/ui/ConfirmDialog';
import UserStatusBadge from '../components/UserStatusBadge';
import LoginHistoryTable from '../components/LoginHistoryTable';
import UserRolesCard from '../../rbac/components/UserRolesCard';

// What each action asks, does and reports. `name` is filled in at render time.
const ACTIONS = {
  suspend: {
    title: 'Suspend this user?',
    message: (name) => `${name} will be signed out everywhere and cannot sign in until you reactivate the account.`,
    confirmLabel: 'Suspend user',
    danger: true,
    run: (id) => userApi.updateStatus(id, 'SUSPENDED'),
    success: 'User suspended.',
  },
  activate: {
    title: 'Reactivate this user?',
    message: (name) => `${name} will be able to sign in again.`,
    confirmLabel: 'Reactivate user',
    danger: false,
    run: (id) => userApi.updateStatus(id, 'ACTIVE'),
    success: 'User reactivated.',
  },
  archive: {
    title: 'Permanently delete this user?',
    message: (name) =>
      `${name}'s inactive account will be removed from the database. This cannot be undone.`,
    confirmLabel: 'Delete user',
    danger: true,
    run: (id) => userApi.deleteUser(id),
    success: 'User deleted.',
  },
  forceLogout: {
    title: 'Sign this user out everywhere?',
    message: (name) => `Every active session for ${name} ends now. Their account stays active and they can sign in again.`,
    confirmLabel: 'Sign out everywhere',
    danger: true,
    run: (id) => userApi.forceLogout(id),
    success: 'All sessions ended.',
  },
};

const GUARD_ACTIONS = {
  suspend: {
    title: 'Deactivate this guard?',
    message: (name) => `${name} will be deactivated. Other guards using the shared login stay unchanged.`,
    confirmLabel: 'Deactivate guard',
    danger: true,
  },
  activate: {
    title: 'Activate this guard?',
    message: (name) => `${name} will be activated without changing other guard profiles.`,
    confirmLabel: 'Activate guard',
    danger: false,
  },
  archive: {
    title: 'Delete this guard?',
    message: (name) => `${name}'s inactive staff record will be permanently removed. The shared login account will remain.`,
    confirmLabel: 'Delete guard',
    danger: true,
  },
  forceLogout: {
    title: 'Sign out the shared guard login?',
    message: () => 'This ends active sessions for every guard using this shared login. They can sign in again.',
    confirmLabel: 'Sign out shared login',
    danger: true,
  },
};

export default function UserDetailPage() {
  const { userId, staffId } = useParams();
  const isGuard = Boolean(staffId);
  const location = useLocation();
  const navigate = useNavigate();
  const { user: me, hasPermission } = useAuth();

  const guardDirectory = useFetch(
    () => isGuard
      ? securityApi.getUsers().then((rows) => rows.find((row) => String(row.staff_id) === String(staffId)) || null)
      : Promise.resolve(null),
    [isGuard, staffId],
  );
  const guardProfile = useFetch(
    () => isGuard ? securityApi.getStaffById(staffId) : Promise.resolve(null),
    [isGuard, staffId],
  );
  const accountId = isGuard ? guardDirectory.data?.login_user_id : userId;
  const profile = useFetch(
    () => accountId ? userApi.getUser(accountId) : Promise.resolve(null),
    [accountId],
  );
  const history = useFetch(
    () => isGuard
      ? securityApi.getGuardLoginHistory(staffId)
      : accountId ? userApi.getLoginHistory(accountId) : Promise.resolve(null),
    [isGuard, staffId, accountId],
  );

  const [notice, setNotice] = useState(location.state?.notice || '');
  const [actionError, setActionError] = useDashboardFeedback('', 'error');
  const [pending, setPending] = useState(null); // key of ACTIONS awaiting confirmation
  const [busy, setBusy] = useState(false);
  const [profilePictureFailed, setProfilePictureFailed] = useState(false);

  const account = profile.data;
  const staff = guardProfile.data;
  const target = isGuard && staff ? {
    id: staff.id,
    first_name: staff.firstName,
    last_name: staff.lastName,
    email: staff.email || account?.email,
    phone: staff.mobileNumber,
    status: staff.status,
    society_id: staff.societyId,
    last_login_at: history.data?.find((entry) => entry.success)?.login_at || null,
    created_at: staff.createdAt,
    updated_at: staff.updatedAt,
    profile_picture_url: staff.photoPath,
    roles: account?.roles || [],
  } : account;

  useEffect(() => {
    setProfilePictureFailed(false);
  }, [target?.profile_picture_url]);

  if (isGuard && (guardDirectory.loading || guardProfile.loading || (accountId && profile.loading))) return <FullPageLoader />;
  if (!isGuard && profile.loading && !target) return <FullPageLoader />;

  const loadFailure = profile.error || (isGuard && (guardDirectory.error || guardProfile.error));
  if ((loadFailure || (isGuard && !guardDirectory.loading && !guardDirectory.data))
    && (!target || (isGuard && accountId && profile.error))) {
    const notFound = loadFailure?.response?.status === 404 || (isGuard && !guardDirectory.data);
    return (
      <div className="empty-state">
        <h1>{notFound ? 'User not found' : "Couldn't load this user"}</h1>
        <p>{notFound ? 'This user may have been removed, or the link is wrong.' : getErrorMessage(loadFailure)}</p>
        <p>
          <Link to="/users">Back to users</Link>
        </p>
      </div>
    );
  }

  const name = fullName(target);
  const isSelf = !isGuard && target.id === me.id;
  const action = pending ? (isGuard ? GUARD_ACTIONS[pending] : ACTIONS[pending]) : null;
  const profilePictureUrl = target.profile_picture_url
    ? (/^https?:\/\//i.test(target.profile_picture_url)
      ? target.profile_picture_url
      : new URL(
        target.profile_picture_url,
        new URL(import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api/v1', window.location.origin),
      ).toString())
    : '';

  const confirmAction = async () => {
    setBusy(true);
    setActionError('');
    try {
      if (isGuard) {
        if (pending === 'suspend') await securityApi.deactivateStaff(staffId);
        else if (pending === 'activate') await securityApi.activateStaff(staffId);
        else if (pending === 'archive') await securityApi.deleteStaff(staffId);
        else if (pending === 'forceLogout') await userApi.forceLogout(accountId);
      } else {
        await action.run(userId);
      }
      if (pending === 'archive') {
        navigate('/users');
        return;
      }
      setNotice(isGuard ? 'Guard record updated.' : action.success);
      profile.reload();
      history.reload();
      if (isGuard) {
        guardProfile.reload();
        guardDirectory.reload();
      }
    } catch (err) {
      setNotice('');
      setActionError(getErrorMessage(err));
    } finally {
      setBusy(false);
      setPending(null);
    }
  };

  const actionButtons = (
    <>
      {hasPermission('USER_UPDATE') && (
        <Link to={isGuard ? `/users/guards/${staffId}/edit` : `/users/${userId}/edit`} className="btn btn-secondary">
          Edit
        </Link>
      )}
      {hasPermission('USER_UPDATE') && !isGuard && !isSelf && target.status === 'ACTIVE' && (
        <button type="button" className="btn btn-secondary" onClick={() => setPending('suspend')}>
          Suspend
        </button>
      )}
      {hasPermission('USER_UPDATE') && !isGuard && target.status !== 'ACTIVE' && (
        <button type="button" className="btn btn-secondary" onClick={() => setPending('activate')}>
          Reactivate
        </button>
      )}
      {hasPermission('USER_UPDATE') && isGuard && target.status === 'ACTIVE' && (
        <button type="button" className="btn btn-secondary" onClick={() => setPending('suspend')}>
          Deactivate guard
        </button>
      )}
      {hasPermission('USER_UPDATE') && isGuard && target.status !== 'ACTIVE' && (
        <button type="button" className="btn btn-secondary" onClick={() => setPending('activate')}>
          Activate guard
        </button>
      )}
      {hasPermission('USER_DELETE') && isGuard && target.status !== 'ACTIVE' && target.status !== 'TERMINATED' && (
        <button type="button" className="btn btn-danger" onClick={() => setPending('archive')}>
          Delete guard
        </button>
      )}
      {hasPermission('USER_FORCE_LOGOUT') && (isGuard || !isSelf) && (
        <button type="button" className="btn btn-secondary" onClick={() => setPending('forceLogout')}>
          {isGuard ? 'Sign out shared login' : 'Sign out everywhere'}
        </button>
      )}
      {hasPermission('USER_DELETE') && !isSelf && target.status !== 'ACTIVE' && target.status !== 'ARCHIVED' && (
        <button type="button" className="btn btn-danger" onClick={() => setPending('archive')}>
          Delete user
        </button>
      )}
    </>
  );

  return (
    <PageContainer eyebrow="USER MANAGEMENT" title={<span className="user-detail-title"><span className="user-detail-title-avatar">{profilePictureUrl && !profilePictureFailed ? <img src={profilePictureUrl} alt="" onError={() => setProfilePictureFailed(true)} /> : name.charAt(0).toUpperCase() || '?'}</span><span>{name}</span></span>} subtitle={target.email} actions={actionButtons} className="user-module-page user-detail-page">
      <p className="back-link">
        <Link to="/users">&larr; All users</Link>
      </p>

      {notice && <Alert variant="success">{notice}</Alert>}
      {actionError && <Alert>{actionError}</Alert>}
      {isSelf && <Alert variant="info">This is your own account, so suspend, sign-out and archive are hidden.</Alert>}

      <div className="card section user-detail-profile-panel">
        <div className="user-detail-panel-heading"><div><span className="user-directory-kicker">ACCOUNT PROFILE</span><h2 className="section-title">Profile</h2><p className="muted">Identity and account activity for this user.</p></div><UserStatusBadge status={target.status} /></div>
        <dl className="details">
          <dt>Status</dt>
          <dd>
            <UserStatusBadge status={target.status} />
          </dd>
          <dt>Phone</dt>
          <dd>{target.phone || '-'}</dd>
          <dt>Society</dt>
          <dd>{target.society_id ? <span title={target.society_id}>Assigned</span> : 'Not assigned'}</dd>
          <dt>Last sign-in</dt>
          <dd>{formatDateTime(target.last_login_at, 'Never')}</dd>
          <dt>Added</dt>
          <dd>{formatDateTime(target.created_at)}</dd>
          <dt>Last updated</dt>
          <dd>{formatDateTime(target.updated_at)}</dd>
        </dl>
      </div>

      {isGuard && <Alert variant="info">Role assignments belong to the shared login account and apply to all guards using it. Sign-in history below is filtered to this guard’s employee code.</Alert>}
      <UserRolesCard
        userId={accountId}
        roleCodes={target.roles || []}
        societyId={target.society_id}
        isSelf={isSelf}
        onChanged={(message) => {
          setActionError('');
          setNotice(message);
          profile.reload();
        }}
      />

      <div className="section">
        <h2 className="section-title">Sign-in history</h2>
        <p className="muted section-hint">{isGuard ? `The last 50 sign-in attempts for employee code ${staff.employeeCode}.` : 'The last 50 attempts, successful and failed.'}</p>
        <LoginHistoryTable history={history} />
      </div>

      {action && (
        <ConfirmDialog
          open
          title={action.title}
          message={action.message(name)}
          confirmLabel={action.confirmLabel}
          danger={action.danger}
          busy={busy}
          onConfirm={confirmAction}
          onCancel={() => setPending(null)}
        />
      )}
    </PageContainer>
  );
}

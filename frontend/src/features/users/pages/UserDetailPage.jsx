import { useEffect, useState } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import useAuth from '../../../app/providers/useAuth';
import useFetch from '../../../utils/useFetch';
import { fullName, formatDateTime } from '../../../utils/format';
import { getErrorMessage } from '../../../lib/axios';
import * as userApi from '../api/user.api';
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
    title: 'Archive this user?',
    message: (name) =>
      `${name} will be signed out and lose access. The record is kept for history, and you can reactivate it later.`,
    confirmLabel: 'Archive user',
    danger: true,
    run: (id) => userApi.archiveUser(id),
    success: 'User archived.',
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

export default function UserDetailPage() {
  const { userId } = useParams();
  const location = useLocation();
  const { user: me, hasPermission } = useAuth();

  const profile = useFetch(() => userApi.getUser(userId), [userId]);
  const history = useFetch(() => userApi.getLoginHistory(userId), [userId]);

  const [notice, setNotice] = useState(location.state?.notice || '');
  const [actionError, setActionError] = useState('');
  const [pending, setPending] = useState(null); // key of ACTIONS awaiting confirmation
  const [busy, setBusy] = useState(false);
  const [profilePictureFailed, setProfilePictureFailed] = useState(false);

  const target = profile.data;

  useEffect(() => {
    setProfilePictureFailed(false);
  }, [target?.profile_picture_url]);

  if (profile.loading && !target) return <FullPageLoader />;

  if (profile.error && !target) {
    const notFound = profile.error.response?.status === 404;
    return (
      <div className="empty-state">
        <h1>{notFound ? 'User not found' : "Couldn't load this user"}</h1>
        <p>{notFound ? 'This user may have been removed, or the link is wrong.' : getErrorMessage(profile.error)}</p>
        <p>
          <Link to="/users">Back to users</Link>
        </p>
      </div>
    );
  }

  const name = fullName(target);
  const isSelf = target.id === me.id;
  const action = pending ? ACTIONS[pending] : null;
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
      await action.run(userId);
      setNotice(action.success);
      profile.reload();
      history.reload();
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
        <Link to={`/users/${userId}/edit`} className="btn btn-secondary">
          Edit
        </Link>
      )}
      {hasPermission('USER_UPDATE') && !isSelf && target.status === 'ACTIVE' && (
        <button type="button" className="btn btn-secondary" onClick={() => setPending('suspend')}>
          Suspend
        </button>
      )}
      {hasPermission('USER_UPDATE') && target.status !== 'ACTIVE' && (
        <button type="button" className="btn btn-secondary" onClick={() => setPending('activate')}>
          Reactivate
        </button>
      )}
      {hasPermission('USER_FORCE_LOGOUT') && !isSelf && (
        <button type="button" className="btn btn-secondary" onClick={() => setPending('forceLogout')}>
          Sign out everywhere
        </button>
      )}
      {hasPermission('USER_DELETE') && !isSelf && target.status !== 'ARCHIVED' && (
        <button type="button" className="btn btn-danger" onClick={() => setPending('archive')}>
          Archive
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
      {isSelf && <Alert variant="success">This is your own account, so suspend, sign-out and archive are hidden.</Alert>}

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

      <UserRolesCard
        userId={userId}
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
        <p className="muted section-hint">The last 50 attempts, successful and failed.</p>
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

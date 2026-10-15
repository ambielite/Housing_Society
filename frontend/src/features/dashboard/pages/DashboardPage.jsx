import { Clock, KeyRound, ShieldCheck, UserCheck } from 'lucide-react';
import useAuth from '../../../app/providers/useAuth';
import { roleLabel } from '../../../components/layout/Topbar';
import { formatDateTime, humanize } from '../../../utils/format';

// TEMPORARY dashboard for the auth module. It only uses the signed-in user's own
// data (no extra API calls). Replace it when the real dashboard module is merged.
export default function DashboardPage() {
  const { user, roles, permissions, hasRole } = useAuth();
  const name = user?.first_name || user?.email;

  const cards = [
    { title: 'Your Roles', value: String(roles.length), icon: ShieldCheck },
    { title: 'Permissions', value: hasRole('SUPER_ADMIN') ? 'All' : String(permissions.length), icon: KeyRound },
    { title: 'Account Status', value: humanize(user?.status), icon: UserCheck },
    { title: 'Last Sign-in', value: user?.last_login_at ? formatDateTime(user.last_login_at) : 'First sign-in', icon: Clock },
  ];

  return (
    <div className="dashboard-page">
      <div className="page-header">
        <div>
          <h1>Dashboard</h1>
          <p>Welcome back, {name}.</p>
        </div>
      </div>

      <div className="dashboard-cards">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <div className="stat-card" key={card.title}>
              <div className="stat-icon">
                <Icon size={22} />
              </div>
              <div>
                <span>{card.title}</span>
                <h2>{card.value}</h2>
              </div>
            </div>
          );
        })}
      </div>

      <div className="dashboard-grid">
        <div className="dashboard-panel">
          <h3>Your Roles</h3>
          {roles.length === 0 ? (
            <div className="empty-state">No role assigned yet.</div>
          ) : (
            <span className="chips">
              {roles.map((role) => (
                <span key={role} className="chip">
                  {roleLabel(role)}
                </span>
              ))}
            </span>
          )}
        </div>

        <div className="dashboard-panel">
          <h3>Account Details</h3>
          <dl className="details">
            <dt>Email</dt>
            <dd>{user?.email}</dd>
            <dt>Phone</dt>
            <dd>{user?.phone || '-'}</dd>
            <dt>Society</dt>
            <dd>{user?.society_id ? 'Assigned' : 'Not assigned'}</dd>
          </dl>
        </div>
      </div>
    </div>
  );
}

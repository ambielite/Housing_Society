import { useEffect, useMemo, useState } from 'react';
import {
  ArrowUpRight,
  BadgeCheck,
  Clock3,
  KeyRound,
  Layers3,
  ShieldCheck,
  UserRound,
} from 'lucide-react';
import useAuth from '../../../app/providers/useAuth';
import { roleLabel } from '../../../components/layout/Topbar';
import { formatDateTime, humanize } from '../../../utils/format';
import './account-dashboard.css';

const ACCESS_AREAS = [
  {
    name: 'Residents & property',
    color: '#7c63f5',
    matches: ['RESIDENT', 'OWNER_UNIT', 'TOWER', 'FLOOR', 'UNIT', 'MOVE_', 'AGREEMENT', 'SOCIETY'],
  },
  {
    name: 'Finance',
    color: '#16a879',
    matches: ['ACCOUNT', 'BILLING', 'INVOICE', 'PAYMENT', 'JOURNAL', 'LEDGER', 'TAX', 'RECONCILIATION', 'ACCOUNTING'],
  },
  {
    name: 'Security & access',
    color: '#3988e8',
    matches: ['GATE', 'VISITOR', 'DELIVERY', 'PARKING', 'VEHICLE', 'PATROL', 'INCIDENT', 'EMERGENCY', 'SECURITY'],
  },
  {
    name: 'Community & services',
    color: '#e49a24',
    matches: ['COMMUNITY', 'NOTICE', 'BROADCAST', 'NOTIFICATION', 'TICKET', 'AMENITY', 'UTILITY', 'METER'],
  },
  {
    name: 'Procurement & assets',
    color: '#ed6688',
    matches: ['PURCHASE', 'PROCUREMENT', 'VENDOR', 'ASSET', 'INVENTORY', 'WORK_ORDER', 'MAINTENANCE'],
  },
  {
    name: 'Administration & reports',
    color: '#20a6b2',
    matches: ['USER', 'ROLE', 'PERMISSION', 'APPROVAL', 'REPORT', 'ORGANIZATION', 'CLUSTER', 'STAFF', 'DOCUMENT', 'SOCIETY_SETTING'],
  },
];

function getAccessAreas(permissions) {
  const counts = new Map(ACCESS_AREAS.map((area) => [area.name, 0]));
  let other = 0;

  permissions.forEach((permission) => {
    const code = String(permission).toUpperCase();
    const match = code.startsWith('SOCIETY_SETTING')
      ? ACCESS_AREAS.find((area) => area.name === 'Administration & reports')
      : ACCESS_AREAS.find((area) => area.matches.some((prefix) => code.startsWith(prefix)));
    if (match) counts.set(match.name, counts.get(match.name) + 1);
    else other += 1;
  });

  const rows = ACCESS_AREAS
    .map((area) => ({ ...area, count: counts.get(area.name) }))
    .filter((area) => area.count > 0);
  if (other > 0) rows.push({ name: 'Other access', color: '#94a3b8', count: other });
  return rows.sort((a, b) => b.count - a.count);
}

function AccessBars({ rows, total }) {
  if (total === 0) {
    return (
      <div className="ad-empty-chart">
        <span className="ad-empty-ring"><ShieldCheck size={25} /></span>
        <div>
          <strong>Access is role-managed</strong>
          <p>{rows.length ? 'No individual permission codes were returned for this account.' : 'No permission codes are assigned to this account yet.'}</p>
        </div>
      </div>
    );
  }

  const max = Math.max(...rows.map((row) => row.count));
  return (
    <div className="ad-bars" role="img" aria-label={`Permission counts across ${rows.length} access areas`}>
      {rows.map((row, index) => (
        <div className="ad-bar-row" key={row.name} style={{ '--bar-color': row.color, '--bar-delay': `${index * 90}ms` }}>
          <div className="ad-bar-label"><span>{row.name}</span><strong>{row.count}</strong></div>
          <div className="ad-bar-track"><span style={{ '--bar-width': `${Math.max(4, (row.count / max) * 100)}%` }} /></div>
        </div>
      ))}
    </div>
  );
}

function AccountAvatar({ user, name }) {
  const [imageFailed, setImageFailed] = useState(false);
  const picture = user?.profile_picture_url;
  const imageUrl = picture
    ? (/^https?:\/\//i.test(picture)
      ? picture
      : new URL(
        picture,
        new URL(import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api/v1', window.location.origin),
      ).toString())
    : '';

  useEffect(() => setImageFailed(false), [imageUrl]);

  return (
    <span className="ad-account-avatar">
      {imageUrl && !imageFailed
        ? <img src={imageUrl} alt={`${name}'s profile`} onError={() => setImageFailed(true)} />
        : <span>{name?.trim()?.charAt(0)?.toUpperCase() || <UserRound size={24} />}</span>}
    </span>
  );
}

function DashboardPage() {
  const { user, roles = [], permissions = [], hasRole } = useAuth();
  const name = user?.first_name || user?.email?.split('@')[0] || 'there';
  const accessAreas = useMemo(() => getAccessAreas(permissions), [permissions]);
  const totalPermissions = permissions.length;
  const accountStatus = humanize(user?.status || 'UNKNOWN');

  const cards = [
    { title: 'Assigned roles', value: roles.length, detail: 'Your workspace identity', icon: ShieldCheck, tone: 'violet' },
    { title: 'Permissions', value: hasRole('SUPER_ADMIN') ? 'All' : totalPermissions, detail: hasRole('SUPER_ADMIN') ? 'Platform-wide access' : 'Granted capabilities', icon: KeyRound, tone: 'mint' },
    { title: 'Account status', value: accountStatus, detail: 'Current sign-in account', icon: BadgeCheck, tone: 'blue' },
    { title: 'Last sign-in', value: user?.last_login_at ? formatDateTime(user.last_login_at) : 'First sign-in', detail: 'Most recent successful access', icon: Clock3, tone: 'amber' },
  ];

  const accountRows = [
    ['Email', user?.email || '—'],
    ['Phone', user?.phone || 'Not provided'],
    ['Society access', user?.society_id ? 'Assigned' : 'Not assigned'],
    ['Account created', user?.created_at ? formatDateTime(user.created_at) : '—'],
  ];

  return (
    <main className="account-dashboard">
      <header className="ad-hero">
        <div className="ad-hero-copy">
          <div className="society-eyebrow"><span className="society-eyebrow-dot" /> YOUR ACCOUNT · ACCESS OVERVIEW</div>
          <div className="ad-hero-title-line">
            <AccountAvatar user={user} name={name} />
            <div><h1>Welcome back, <span>{name}</span></h1><p>Your roles, permissions, and account status at a glance.</p></div>
          </div>
        </div>
        <div className="ad-hero-bottom"><span><span className="ad-live-dot" /> SESSION ACTIVE</span><span>{user?.society_id ? 'Society workspace connected' : 'No society assigned'}</span></div>
      </header>

      <section className="ad-metrics" aria-label="Account summary">
        {cards.map(({ title, value, detail, icon: Icon, tone }, index) => (
          <article className={`ad-metric ad-tone-${tone}`} key={title} style={{ '--card-delay': `${index * 90}ms` }}>
            <span className="ad-metric-icon"><Icon size={20} /></span>
            <div className="ad-metric-copy"><span>{title}</span><strong title={String(value)}>{value}</strong><small>{detail}</small></div>
            <span className="ad-metric-shine" aria-hidden="true" />
          </article>
        ))}
      </section>

      <section className="ad-main-grid">
        <article className="ad-panel ad-access-panel">
          <div className="ad-panel-heading">
            <div><span className="ad-kicker">PERMISSION MAP</span><h2>Access by workspace</h2><p>Granted permission codes grouped into areas.</p></div>
            <span className="ad-panel-total"><KeyRound size={15} /> {totalPermissions} total</span>
          </div>
          <AccessBars rows={accessAreas} total={totalPermissions} />
          <div className="ad-chart-foot"><span><i /> Each bar represents permissions returned for your account.</span><span>{accessAreas.length} {accessAreas.length === 1 ? 'area' : 'areas'}</span></div>
        </article>

        <article className="ad-panel ad-profile-panel">
          <div className="ad-panel-heading">
            <div><span className="ad-kicker">IDENTITY CARD</span><h2>Account details</h2><p>Your signed-in profile.</p></div>
          </div>
          <div className="ad-profile-name"><strong>{[user?.first_name, user?.last_name].filter(Boolean).join(' ') || user?.email || 'Society member'}</strong><span className={`ad-status-pill ${String(user?.status).toLowerCase()}`}><i />{accountStatus}</span></div>
          <div className="ad-details-table">
            {accountRows.map(([label, value]) => <div className="ad-details-row" key={label}><span>{label}</span><strong>{value}</strong></div>)}
          </div>
        </article>
      </section>

      <section className="ad-panel ad-roles-panel">
        <div className="ad-panel-heading">
          <div><span className="ad-kicker">ROLE ASSIGNMENTS</span><h2>Your roles</h2><p>Roles currently linked to this account.</p></div>
          <span className="ad-panel-total"><Layers3 size={15} /> {roles.length} {roles.length === 1 ? 'role' : 'roles'}</span>
        </div>
        {roles.length ? (
          <div className="ad-role-list">
            {roles.map((role, index) => <div className="ad-role-row" key={role} style={{ '--role-delay': `${index * 70}ms` }}><span className="ad-role-icon"><ShieldCheck size={17} /></span><span><strong>{roleLabel(role)}</strong><small>{humanize(role)} access profile</small></span><span className="ad-role-tag">Assigned</span><ArrowUpRight size={16} className="ad-role-arrow" /></div>)}
          </div>
        ) : <div className="ad-no-roles">No role is assigned yet. Ask your society administrator to review your account access.</div>}
      </section>

    </main>
  );
}

export default DashboardPage;

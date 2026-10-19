import { useMemo, useState } from 'react';
import { Plus } from 'lucide-react';
import useAuth from '../../../app/providers/useAuth';
import useSociety from '../../../app/store/useSociety';
import useFetch from '../../../utils/useFetch';
import { formatDateTime } from '../../../utils/format';
import { getErrorMessage } from '../../../lib/axios';
import PageContainer from '../../../components/layout/PageContainer';
import DataTable from '../../../components/tables/DataTable';
import Alert from '../../../components/ui/Alert';
import Modal from '../../../components/ui/Modal';
import TextField from '../../../components/ui/TextField';
import SelectField from '../../../components/ui/SelectField';
import UnitSelect from '../../../components/ui/UnitSelect';
import * as api from '../api/security.api';
import { ID_TYPES, BLACKLIST_STATUSES, INVITE_STATUSES, PASS_STATUSES, OVERSTAY_STATUSES, label, deliveryTransitions } from '../components/securityOptions';
import SecurityBadge from '../components/SecurityBadge';
import { FormActions, GatePicker, VisitorPicker, InvitePicker, ErrorBox } from '../components/SecurityFormHelpers';

const list = (value) => {
  if (Array.isArray(value)) return value;
  if (Array.isArray(value?.data)) return value.data;
  if (value?.data && typeof value.data === 'object') return list(value.data);
  if (Array.isArray(value?.records)) return value.records;
  if (Array.isArray(value?.rows)) return value.rows;
  if (Array.isArray(value?.users)) return value.users;
  if (Array.isArray(value?.vendors)) return value.vendors;
  if (Array.isArray(value?.units)) return value.units;
  if (Array.isArray(value?.gates)) return value.gates;
  return [];
};

function ProfileForm({ societyId, societyName, value, onSubmit, onCancel, saving, error }) {
  const [form, setForm] = useState({ societyId, name: value?.name || '', phone: value?.phone || '', idType: value?.id_type || '', idNumberMasked: value?.id_number_masked || '', vehicleNo: value?.vehicle_no || '' });
  const edit = Boolean(value);
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  return <form onSubmit={(e) => { e.preventDefault(); onSubmit(edit ? { name: form.name, phone: form.phone || null, idType: form.idType || null, idNumberMasked: form.idNumberMasked || null, vehicleNo: form.vehicleNo || null } : { ...form, phone: form.phone || null, idType: form.idType || null, idNumberMasked: form.idNumberMasked || null, vehicleNo: form.vehicleNo || null }); }}>
    <ErrorBox error={error} />
    {!edit && <TextField id="profileSociety" label="Society" value={societyName || 'Selected society'} disabled />}
    <TextField id="visitorName" label="Visitor name" value={form.name} onChange={(e) => set('name', e.target.value)} required />
    <TextField id="visitorPhone" label="Phone" value={form.phone} onChange={(e) => set('phone', e.target.value)} />
    <SelectField id="visitorIdType" label="ID type" options={[{ value: '', label: 'Not provided' }, ...ID_TYPES.map((v) => ({ value: v, label: label(v) }))]} value={form.idType} onChange={(e) => set('idType', e.target.value)} />
    <TextField id="visitorIdMasked" label="Masked ID number" value={form.idNumberMasked} onChange={(e) => set('idNumberMasked', e.target.value)} />
    <TextField id="visitorVehicle" label="Vehicle number" value={form.vehicleNo} onChange={(e) => set('vehicleNo', e.target.value)} />
    <FormActions saving={saving} onCancel={onCancel} submitLabel={edit ? 'Save visitor' : 'Create visitor'} />
  </form>;
}

function InviteForm({ societyId, userId, profiles, onSubmit, onCancel, saving, error }) {
  const [form, setForm] = useState({ societyId, invitedBy: userId || '', unitId: '', visitorProfileId: '', expectedFrom: '', expectedUntil: '', purpose: '' });
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  return <form onSubmit={(e) => { e.preventDefault(); onSubmit({ ...form, expectedFrom: new Date(form.expectedFrom).toISOString(), expectedUntil: form.expectedUntil ? new Date(form.expectedUntil).toISOString() : null }); }}>
    <ErrorBox error={error} />
    <UnitSelect value={form.unitId} onChange={(v) => set('unitId', v)} />
    <VisitorPicker profiles={profiles} value={form.visitorProfileId} onChange={(v) => set('visitorProfileId', v)} />
    <TextField id="inviteFrom" label="Expected from" type="datetime-local" value={form.expectedFrom} onChange={(e) => set('expectedFrom', e.target.value)} required />
    <TextField id="inviteUntil" label="Expected until" type="datetime-local" value={form.expectedUntil} onChange={(e) => set('expectedUntil', e.target.value)} />
    <TextField id="invitePurpose" label="Purpose" value={form.purpose} onChange={(e) => set('purpose', e.target.value)} />
    <FormActions saving={saving} onCancel={onCancel} submitLabel="Create invite" />
  </form>;
}

function PassForm({ profiles, gates, invites, onSubmit, onCancel, saving, error }) {
  const [form, setForm] = useState({ inviteId: '', visitorProfileId: '', gateId: '', passNo: '' });
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  return <form onSubmit={(e) => { e.preventDefault(); onSubmit({ ...form, inviteId: form.inviteId || null }); }}>
    <ErrorBox error={error} />
    <VisitorPicker profiles={profiles} value={form.visitorProfileId} onChange={(v) => set('visitorProfileId', v)} />
    <InvitePicker invites={invites} value={form.inviteId} onChange={(v) => set('inviteId', v)} />
    <GatePicker gates={gates} value={form.gateId} onChange={(v) => set('gateId', v)} />
    <TextField id="passNo" label="Pass number" value={form.passNo} onChange={(e) => set('passNo', e.target.value)} required />
    <p className="field-hint">Choose an approved invite for a pre-approved visitor, or leave it blank for a walk-in pass.</p>
    <FormActions saving={saving} onCancel={onCancel} submitLabel="Issue pass" />
  </form>;
}

export default function VisitorsPage({ societyId, societyName, currentUser, gates, unitNames = {}, userNames = {}, gateNames = {} }) {
  const { hasPermission } = useAuth();
  const [tab, setTab] = useState('profiles');
  const [dialog, setDialog] = useState(null);
  const [selected, setSelected] = useState(null);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const profiles = useFetch(() => api.listVisitorProfiles({ societyId }), [societyId]);
  const invites = useFetch(() => api.listVisitorInvites({ societyId }), [societyId]);
  const passes = useFetch(() => api.listVisitorPasses({}), []);
  const events = useFetch(() => api.listGateEvents({ societyId }), [societyId]);
  const alerts = useFetch(() => api.listOverstayAlerts({}), []);
  const users = useFetch(() => api.listUsers({ societyId }), [societyId]);

  const profileRows = list(profiles.data);
  const inviteRows = list(invites.data);
  const passRows = list(passes.data);
  const eventRows = list(events.data);
  const alertRows = list(alerts.data);
  const userRows = list(users.data);

  const run = async (action, success) => {
    setError(''); setNotice('');
    try { await action(); setNotice(success); setDialog(null); setSelected(null); profiles.reload(); invites.reload(); passes.reload(); events.reload(); alerts.reload(); }
    catch (e) { setError(getErrorMessage(e)); }
  };

  const profileColumns = [
    { key: 'visitor', header: 'Visitor', render: (p) => <><span className="cell-title">{p.name}</span><span className="cell-sub">{p.phone || 'No phone'}</span></> },
    { key: 'id', header: 'ID', render: (p) => p.id_type ? label(p.id_type) : '-' },
    { key: 'vehicle', header: 'Vehicle', render: (p) => p.vehicle_no || '-' },
    { key: 'blacklist', header: 'Status', render: (p) => <SecurityBadge value={p.blacklist_status} /> },
    { key: 'actions', header: 'Actions', render: (p) => <div className="row-actions">
      {hasPermission('VISITOR_PROFILE_READ') && <button className="btn btn-secondary btn-sm" onClick={() => { setSelected(p); setDialog('profile-detail'); }}>View</button>}
      {hasPermission('VISITOR_PROFILE_UPDATE') && <button className="btn btn-secondary btn-sm" onClick={() => { setSelected(p); setDialog('profile-edit'); }}>Edit</button>}
      {hasPermission('VISITOR_PROFILE_UPDATE') && <button className="btn btn-danger btn-sm" onClick={() => run(() => api.setBlacklistStatus(p.id, p.blacklist_status === 'BLACKLISTED' ? 'NONE' : 'BLACKLISTED'), p.blacklist_status === 'BLACKLISTED' ? 'Visitor removed from blacklist.' : 'Visitor blacklisted.')}>{p.blacklist_status === 'BLACKLISTED' ? 'Unblacklist' : 'Blacklist'}</button>}
    </div> },
  ];

  const inviteColumns = [
    { key: 'visitor', header: 'Visitor', render: (i) => <span>{profileRows.find((p) => p.id === i.visitor_profile_id)?.name || i.visitor_profile_id}</span> },
    { key: 'unit', header: 'Unit', render: (i) => <span>{unitNames[i.unit_id] || i.unit_id}</span> },
    { key: 'window', header: 'Expected', render: (i) => `${formatDateTime(i.expected_from)} → ${formatDateTime(i.expected_until)}` },
    { key: 'purpose', header: 'Purpose', render: (i) => i.purpose || '-' },
    { key: 'status', header: 'Status', render: (i) => <SecurityBadge value={i.status} /> },
    { key: 'actions', header: 'Actions', render: (i) => <div className="row-actions">
      {hasPermission('VISITOR_INVITE_READ') && <button className="btn btn-secondary btn-sm" onClick={() => { setSelected(i); setDialog('invite-detail'); }}>View</button>}
      {hasPermission('VISITOR_INVITE_UPDATE') && i.status === 'PENDING' && <><button className="btn btn-primary btn-sm" onClick={() => run(() => api.decideVisitorInvite(i.id, 'APPROVED'), 'Invite approved.')}>Approve</button><button className="btn btn-danger btn-sm" onClick={() => run(() => api.decideVisitorInvite(i.id, 'REJECTED'), 'Invite rejected.')}>Reject</button></>}
    </div> },
  ];
const passColumns = [
  {
    key: 'pass',
    header: 'Pass',
    render: (p) => (
      <>
        <span className="cell-title">{p.pass_no}</span>
        <span className="cell-sub">
          {profileRows.find((v) => v.id === p.visitor_profile_id)?.name || 'Unknown visitor'}
        </span>
      </>
    )
  },
  {
    key: 'gate',
    header: 'Gate',
    render: (p) =>
      gates.find((g) => g.id === p.gate_id)?.name || 'Unknown gate'
  },
  {
    key: 'status',
    header: 'Status',
    render: (p) => <SecurityBadge value={p.status} />
  },
  {
    key: 'actions',
    header: 'Actions',
    render: (p) => (
      <div className="row-actions">
        {hasPermission('VISITOR_PASS_READ') && (
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => {
              setSelected(p);
              setDialog('pass-detail');
            }}
          >
            View
          </button>
        )}

        {hasPermission('VISITOR_PASS_UPDATE') && p.status === 'EXPECTED' && (
          <button
            className="btn btn-secondary btn-sm"
            onClick={() =>
              run(() => api.recordArrival(p.id), 'Arrival registered.')
            }
          >
            Arrival
          </button>
        )}

        {hasPermission('VISITOR_PASS_UPDATE') &&
          ['EXPECTED', 'ARRIVED'].includes(p.status) && (
            <button
              className="btn btn-primary btn-sm"
              onClick={() =>
                run(
                  () => api.recordEntry(p.id, currentUser?.id || null),
                  'Entry recorded.'
                )
              }
            >
              Entry
            </button>
          )}

        {hasPermission('VISITOR_PASS_UPDATE') &&
          ['INSIDE', 'OVERSTAY'].includes(p.status) && (
            <button
              className="btn btn-primary btn-sm"
              onClick={() =>
                run(
                  () => api.recordExit(p.id, currentUser?.id || null),
                  'Exit recorded.'
                )
              }
            >
              Exit
            </button>
          )}

        {hasPermission('VISITOR_PASS_UPDATE') && p.status === 'INSIDE' && (
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => {
              setSelected(p);
              setDialog('overstay');
            }}
          >
            Overstay
          </button>
        )}

        {hasPermission('VISITOR_PASS_UPDATE') &&
          !['EXITED', 'CANCELLED'].includes(p.status) && (
            <button
              className="btn btn-danger btn-sm"
              onClick={() =>
                run(
                  () => api.cancelVisitorPass(p.id),
                  'Visitor pass cancelled.'
                )
              }
            >
              Cancel
            </button>
          )}
      </div>
    )
  }
];
 const eventColumns = [
  {
    key: 'time',
    header: 'Event time',
    render: (e) => formatDateTime(e.event_at)
  },
  {
    key: 'type',
    header: 'Event',
    render: (e) => <SecurityBadge value={e.event_type} />
  },
  {
    key: 'gate',
    header: 'Gate',
    render: (e) =>
      gates.find((g) => g.id === e.gate_id)?.name || 'Unknown gate'
  },
  {
    key: 'pass',
    header: 'Pass',
    render: (e) =>
      passRows.find((p) => p.id === e.visitor_pass_id)?.pass_no || '-'
  },
 {
  key: 'captured',
  header: 'Captured by',
  render: (e) => {
    if (!e.captured_by) return '-';

    const user = userRows.find((u) => u.id === e.captured_by);

    return (
      user?.name ||
      user?.full_name ||
      user?.email ||
      (e.captured_by === currentUser?.id
        ? currentUser?.name || currentUser?.email
        : 'Unknown user')
    );
  }
}
];

  const alertColumns = [
  {
    key: 'pass',
    header: 'Pass',
    render: (a) =>
      passRows.find((p) => p.id === a.visitor_pass_id)?.pass_no ||
      'Unknown pass'
  },
  {
    key: 'duration',
    header: 'Duration',
    render: (a) => `${a.duration_minutes} min`
  },
  {
    key: 'triggered',
    header: 'Triggered',
    render: (a) => formatDateTime(a.triggered_at)
  },
  {
    key: 'status',
    header: 'Status',
    render: (a) => <SecurityBadge value={a.status} />
  },
  {
    key: 'actions',
    header: 'Actions',
    render: (a) => (
      <div className="row-actions">
        {hasPermission('OVERSTAY_ALERT_UPDATE') && a.status === 'OPEN' && (
          <>
            <button
              className="btn btn-primary btn-sm"
              onClick={() =>
                run(
                  () =>
                    api.acknowledgeOverstayAlert(
                      a.id,
                      'ACKNOWLEDGED'
                    ),
                  'Overstay acknowledged.'
                )
              }
            >
              Acknowledge
            </button>

            <button
              className="btn btn-secondary btn-sm"
              onClick={() =>
                run(
                  () =>
                    api.acknowledgeOverstayAlert(
                      a.id,
                      'RESOLVED'
                    ),
                  'Overstay resolved.'
                )
              }
            >
              Resolve
            </button>
          </>
        )}
      </div>
    )
  }
];
  return <div>
    <div className="tabs-bar"><div className="tabs">
      {['profiles','invites','passes','events','alerts'].map((v) => <button key={v} className={`tab ${tab === v ? 'active' : ''}`} type="button" onClick={() => setTab(v)}>{label(v)}</button>)}
    </div></div>
    {notice && <Alert variant="success">{notice}</Alert>}
    {error && !dialog && <Alert>{error}</Alert>}

    {tab === 'profiles' && <><div className="section-head"><div><h2 className="section-title">Visitor profiles</h2><p className="muted section-hint">Register and maintain visitor identity records.</p></div>{hasPermission('VISITOR_PROFILE_CREATE') && <button className="btn btn-primary" onClick={() => setDialog('profile-new')}><Plus size={16} /> New visitor</button>}</div><DataTable columns={profileColumns} rows={profileRows} loading={profiles.loading} error={profiles.error ? getErrorMessage(profiles.error) : ''} onRetry={profiles.reload} emptyTitle="No visitor profiles" emptyMessage="Register a visitor before creating an invite or pass." /></>}

    {tab === 'invites' && <><div className="section-head"><div><h2 className="section-title">Visitor invites</h2><p className="muted section-hint">Pre-approve expected visitors for a unit.</p></div>{hasPermission('VISITOR_INVITE_CREATE') && <button className="btn btn-primary" onClick={() => setDialog('invite-new')}><Plus size={16} /> New invite</button>}</div><DataTable columns={inviteColumns} rows={inviteRows} loading={invites.loading} error={invites.error ? getErrorMessage(invites.error) : ''} onRetry={invites.reload} emptyTitle="No invites" emptyMessage="Create an invite for a pre-approved visitor." /></>}

    {tab === 'passes' && <><div className="section-head"><div><h2 className="section-title">Visitor passes</h2><p className="muted section-hint">Gate-facing lifecycle: expected → arrival → entry → exit/overstay.</p></div>{hasPermission('VISITOR_PASS_CREATE') && <button className="btn btn-primary" onClick={() => setDialog('pass-new')}>Issue pass</button>}</div><DataTable columns={passColumns} rows={passRows} loading={passes.loading} error={passes.error ? getErrorMessage(passes.error) : ''} onRetry={passes.reload} emptyTitle="No visitor passes" emptyMessage="Issue a pass for an approved invite or a walk-in visitor." /></>}

    {tab === 'events' && <><div className="section-head"><div><h2 className="section-title">Gate events</h2><p className="muted section-hint">Immutable visitor entry/exit audit trail.</p></div></div><DataTable columns={eventColumns} rows={eventRows} loading={events.loading} error={events.error ? getErrorMessage(events.error) : ''} onRetry={events.reload} emptyTitle="No gate events" emptyMessage="Visitor entry/exit events will appear here." /></>}

    {tab === 'alerts' && <><div className="section-head"><div><h2 className="section-title">Overstay alerts</h2><p className="muted section-hint">Manual trigger is used by the backend; there is no automatic scheduler yet.</p></div></div><DataTable columns={alertColumns} rows={alertRows} loading={alerts.loading} error={alerts.error ? getErrorMessage(alerts.error) : ''} onRetry={alerts.reload} emptyTitle="No overstay alerts" emptyMessage="Triggered overstays will appear here." /></>}

    {dialog === 'profile-new' && <Modal title="Register visitor" onClose={() => setDialog(null)}><ProfileForm societyId={societyId} societyName={societyName} onSubmit={(p) => run(() => api.createVisitorProfile(p), 'Visitor profile created.')} onCancel={() => setDialog(null)} /></Modal>}
    {dialog === 'profile-edit' && <Modal title="Edit visitor" onClose={() => setDialog(null)}><ProfileForm societyId={societyId} societyName={societyName} value={selected} onSubmit={(p) => run(() => api.updateVisitorProfile(selected.id, p), 'Visitor profile updated.')} onCancel={() => setDialog(null)} /></Modal>}
    {dialog === 'profile-detail' && <Modal title="Visitor profile" onClose={() => setDialog(null)}><dl className="details"><dt>Name</dt><dd>{selected?.name}</dd><dt>Phone</dt><dd>{selected?.phone || '-'}</dd><dt>ID type</dt><dd>{selected?.id_type ? label(selected.id_type) : '-'}</dd><dt>Masked ID</dt><dd>{selected?.id_number_masked || '-'}</dd><dt>Vehicle</dt><dd>{selected?.vehicle_no || '-'}</dd><dt>Blacklist</dt><dd><SecurityBadge value={selected?.blacklist_status} /></dd></dl></Modal>}

    {dialog === 'invite-new' && <Modal title="Create visitor invite" onClose={() => setDialog(null)}><InviteForm societyId={societyId} userId={currentUser?.id} profiles={profileRows} onSubmit={(p) => run(() => api.createVisitorInvite(p), 'Visitor invite created.')} onCancel={() => setDialog(null)} /></Modal>}
    {dialog === 'invite-detail' && <Modal title="Visitor invite" onClose={() => setDialog(null)}><dl className="details"><dt>Visitor</dt><dd>{profileRows.find((v) => v.id === selected?.visitor_profile_id)?.name || selected?.visitor_profile_id}</dd><dt>Unit</dt><dd>{unitNames[selected?.unit_id] || selected?.unit_id}</dd><dt>Expected</dt><dd>{formatDateTime(selected?.expected_from)} → {formatDateTime(selected?.expected_until)}</dd><dt>Purpose</dt><dd>{selected?.purpose || '-'}</dd><dt>Status</dt><dd><SecurityBadge value={selected?.status} /></dd></dl></Modal>}

    {dialog === 'pass-new' && <Modal title="Issue visitor pass" onClose={() => setDialog(null)}><PassForm profiles={profileRows} gates={gates} invites={inviteRows} onSubmit={(p) => run(() => api.createVisitorPass(p), 'Visitor pass issued.')} onCancel={() => setDialog(null)} /></Modal>}
    {dialog === 'pass-detail' && <Modal title="Visitor pass" onClose={() => setDialog(null)}><dl className="details"><dt>Pass number</dt><dd>{selected?.pass_no}</dd><dt>Visitor</dt><dd >{profileRows.find((v) => v.id === selected?.visitor_profile_id)?.name || selected?.visitor_profile_id}</dd><dt>Gate</dt><dd>{gateNames[selected?.gate_id] || selected?.gate_id}</dd><dt>Invite</dt>
<dd>
  {selected?.invite_id
    ? inviteRows.find((i) => i.id === selected.invite_id)
      ? 'Approved invite'
      : 'Invite'
    : '-'}
</dd><dt>Status</dt><dd><SecurityBadge value={selected?.status} /></dd></dl></Modal>}
    {dialog === 'overstay' && <Modal title="Trigger overstay" onClose={() => setDialog(null)}><OverstayForm onSubmit={(minutes) => run(() => api.triggerOverstay(selected.id, minutes), 'Overstay alert triggered.')} onCancel={() => setDialog(null)} /></Modal>}
  </div>;
}

function OverstayForm({ onSubmit, onCancel }) {
  const [minutes, setMinutes] = useState('60');
  return <form onSubmit={(e) => { e.preventDefault(); onSubmit(Number(minutes)); }}><TextField id="durationMinutes" label="Duration (minutes)" type="number" min="1" value={minutes} onChange={(e) => setMinutes(e.target.value)} required /><FormActions saving={false} onCancel={onCancel} submitLabel="Trigger overstay" /></form>;
}

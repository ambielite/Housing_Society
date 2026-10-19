import { useEffect, useMemo, useState } from 'react';
import { Plus } from 'lucide-react';
import useAuth from '../../../app/providers/useAuth';
import useSociety from '../../../app/store/useSociety';
import useUnits from '../../../utils/useUnits';
import useFetch from '../../../utils/useFetch';
import { formatDateTime } from '../../../utils/format';
import { getErrorMessage } from '../../../lib/axios';
import societyApi from '../../societies/api/society.api';
import PageContainer from '../../../components/layout/PageContainer';
import DataTable from '../../../components/tables/DataTable';
import Alert from '../../../components/ui/Alert';
import Modal from '../../../components/ui/Modal';
import SocietyIdPrompt from '../../../components/ui/SocietyIdPrompt';
import TextField from '../../../components/ui/TextField';
import SelectField from '../../../components/ui/SelectField';
import * as api from '../api/security.api';
import { GATE_TYPES, GATE_STATUSES, GUARD_STATUSES, CREDENTIAL_TYPES, CARD_STATUSES, DEVICE_TYPES, DEVICE_STATUSES, label } from '../components/securityOptions';
import SecurityBadge from '../components/SecurityBadge';
import { FormActions, UserPicker, VendorPicker, GatePicker, ErrorBox } from '../components/SecurityFormHelpers';
import VisitorsPage from './VisitorsPage';
import DeliveriesPage from './DeliveriesPage';

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
const initial = (extra = {}) => ({ ...extra });

function GateForm({ societyId, societyName, value, gates = [], onSubmit, onCancel, saving, error }) {
  const [form, setForm] = useState(initial({ societyId, name: value?.name || '', location: value?.location || '', gateType: value?.gate_type || 'MAIN', status: value?.status || 'ACTIVE' }));
  const [validationError, setValidationError] = useState('');
  const edit = Boolean(value);
  const set = (k, v) => {
    setValidationError('');
    setForm((f) => ({ ...f, [k]: v }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const name = form.name.trim();
    const location = form.location.trim();

    if (!name) return setValidationError('Gate name is required.');
    if (name.length < 2) return setValidationError('Gate name must be at least 2 characters.');
    if (name.length > 100) return setValidationError('Gate name must not exceed 100 characters.');
    if (!location) return setValidationError('Gate location is required.');
    if (location.length > 255) return setValidationError('Gate location must not exceed 255 characters.');

    const duplicateName = gates.some((g) =>
      g.id !== value?.id && String(g.name || '').trim().toLowerCase() === name.toLowerCase()
    );
    if (duplicateName) return setValidationError('A gate with this name already exists.');

    onSubmit(edit
      ? { name, location, gateType: form.gateType, status: form.status }
      : { ...form, name, location }
    );
  };

  return <form onSubmit={handleSubmit}>
    <ErrorBox error={error} />
    {validationError && <div className="form-error">{validationError}</div>}
    {!edit && <TextField id="gateSociety" label="Society" value={societyName || 'Selected society'} disabled />}
    <TextField id="gateName" label="Gate name" value={form.name} onChange={(e) => set('name', e.target.value)} required />
    <TextField id="gateLocation" label="Location" value={form.location} onChange={(e) => set('location', e.target.value)} required />
    <SelectField id="gateType" label="Gate type" options={GATE_TYPES.map((v) => ({ value: v, label: label(v) }))} value={form.gateType} onChange={(e) => set('gateType', e.target.value)} />
    {edit && <SelectField id="gateStatus" label="Status" options={GATE_STATUSES.map((v) => ({ value: v, label: label(v) }))} value={form.status} onChange={(e) => set('status', e.target.value)} />}
    <FormActions saving={saving} onCancel={onCancel} submitLabel={edit ? 'Save changes' : 'Create gate'} />
  </form>;
}

function GuardForm({ value, guards = [], onSubmit, onCancel, saving, error }) {
  const [form, setForm] = useState({ userId: value?.user_id || '', employeeCode: value?.employee_code || '', agencyVendorId: value?.agency_vendor_id || null, status: value?.status || 'ACTIVE' });
  const [validationError, setValidationError] = useState('');
  const edit = Boolean(value);
  const set = (k, v) => {
    setValidationError('');
    setForm((f) => ({ ...f, [k]: v }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const userId = String(form.userId || '').trim();
    const employeeCode = String(form.employeeCode || '').trim();

    if (!userId) return setValidationError('Guard user is required.');
    if (!employeeCode) return setValidationError('Employee code is required.');
    if (employeeCode.length < 2) return setValidationError('Employee code must be at least 2 characters.');
    if (employeeCode.length > 50) return setValidationError('Employee code must not exceed 50 characters.');

    const duplicateUser = guards.some((g) =>
      g.id !== value?.id && g.user_id === userId
    );
    if (duplicateUser) return setValidationError('This user is already registered as a security guard.');

    const duplicateEmployeeCode = guards.some((g) =>
      g.id !== value?.id && String(g.employee_code || '').trim().toLowerCase() === employeeCode.toLowerCase()
    );
    if (duplicateEmployeeCode) return setValidationError('This employee code already exists.');

    onSubmit(edit
      ? { employeeCode, agencyVendorId: form.agencyVendorId, status: form.status }
      : { ...form, userId, employeeCode }
    );
  };

  return <form onSubmit={handleSubmit}>
    <ErrorBox error={error} />
    {validationError && <div className="form-error">{validationError}</div>}
    {!edit && <UserPicker value={form.userId} onChange={(v) => set('userId', v)} label="Guard user" />}
    <TextField id="employeeCode" label="Employee code" value={form.employeeCode} onChange={(e) => set('employeeCode', e.target.value)} required />
    <VendorPicker value={form.agencyVendorId} onChange={(v) => set('agencyVendorId', v)} />
    {edit && <SelectField id="guardStatus" label="Status" options={GUARD_STATUSES.map((v) => ({ value: v, label: label(v) }))} value={form.status} onChange={(e) => set('status', e.target.value)} />}
    <FormActions saving={saving} onCancel={onCancel} submitLabel={edit ? 'Save changes' : 'Add guard'} />
  </form>;
}

function CardForm({ societyId, value, cards = [], onSubmit, onCancel, saving, error }) {
  const [form, setForm] = useState({ societyId, holderUserId: value?.holder_user_id || '', credentialNo: value?.credential_no || '', credentialType: value?.credential_type || 'CARD', validUntil: value?.valid_until ? String(value.valid_until).slice(0, 16) : '' });
  const [validationError, setValidationError] = useState('');
  const set = (k, v) => {
    setValidationError('');
    setForm((f) => ({ ...f, [k]: v }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const holderUserId = String(form.holderUserId || '').trim();
    const credentialNo = String(form.credentialNo || '').trim();

    if (!holderUserId) return setValidationError('Card holder is required.');
    if (!credentialNo) return setValidationError('Credential number is required.');
    if (credentialNo.length < 2) return setValidationError('Credential number must be at least 2 characters.');
    if (credentialNo.length > 100) return setValidationError('Credential number must not exceed 100 characters.');

    const duplicateCredential = cards.some((c) =>
      c.id !== value?.id && String(c.credential_no || '').trim().toLowerCase() === credentialNo.toLowerCase()
    );
    if (duplicateCredential) return setValidationError('This credential number already exists.');

    if (form.validUntil) {
      const validUntil = new Date(form.validUntil);
      if (Number.isNaN(validUntil.getTime())) return setValidationError('Please enter a valid expiry date and time.');
      if (validUntil <= new Date()) return setValidationError('Valid until must be a future date and time.');
    }

    onSubmit({
      ...form,
      holderUserId,
      credentialNo,
      validUntil: form.validUntil ? new Date(form.validUntil).toISOString() : null,
    });
  };

  return <form onSubmit={handleSubmit}>
    <ErrorBox error={error} />
    {validationError && <div className="form-error">{validationError}</div>}
    <UserPicker value={form.holderUserId} onChange={(v) => set('holderUserId', v)} label="Card holder" />
    <TextField id="credentialNo" label="Credential number" value={form.credentialNo} onChange={(e) => set('credentialNo', e.target.value)} required />
    <SelectField id="credentialType" label="Credential type" options={CREDENTIAL_TYPES.map((v) => ({ value: v, label: label(v) }))} value={form.credentialType} onChange={(e) => set('credentialType', e.target.value)} />
    <TextField id="validUntil" label="Valid until" type="datetime-local" value={form.validUntil} onChange={(e) => set('validUntil', e.target.value)} />
    <FormActions saving={saving} onCancel={onCancel} submitLabel="Issue access card" />
  </form>;
}

function DeviceForm({ gates, value, onSubmit, onCancel, saving, error }) {
  const [form, setForm] = useState({ gateId: value?.gate_id || '', deviceType: value?.device_type || 'CCTV', serialNo: value?.serial_no || '', ipAddress: value?.ip_address || '', status: value?.status || 'OFFLINE', lastSeenAt: value?.last_seen_at ? String(value.last_seen_at).slice(0, 16) : '' });
  const edit = Boolean(value);
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  return <form onSubmit={(e) => { e.preventDefault(); const payload = edit ? { status: form.status, ipAddress: form.ipAddress, lastSeenAt: form.lastSeenAt ? new Date(form.lastSeenAt).toISOString() : null } : { gateId: form.gateId, deviceType: form.deviceType, serialNo: form.serialNo, ipAddress: form.ipAddress || null }; onSubmit(payload); }}>
    <ErrorBox error={error} />
    {!edit && <GatePicker gates={gates} value={form.gateId} onChange={(v) => set('gateId', v)} />}
    {!edit && <SelectField id="deviceType" label="Device type" options={DEVICE_TYPES.map((v) => ({ value: v, label: label(v) }))} value={form.deviceType} onChange={(e) => set('deviceType', e.target.value)} />}
    {!edit && <TextField id="serialNo" label="Serial number" value={form.serialNo} onChange={(e) => set('serialNo', e.target.value)} required />}
    <TextField id="deviceIp" label="IP address" value={form.ipAddress} onChange={(e) => set('ipAddress', e.target.value)} />
    {edit && <>
      <SelectField id="deviceStatus" label="Status" options={DEVICE_STATUSES.map((v) => ({ value: v, label: label(v) }))} value={form.status} onChange={(e) => set('status', e.target.value)} />
      <TextField id="lastSeenAt" label="Last seen at" type="datetime-local" value={form.lastSeenAt} onChange={(e) => set('lastSeenAt', e.target.value)} />
    </>}
    <FormActions saving={saving} onCancel={onCancel} submitLabel={edit ? 'Save device' : 'Register device'} />
  </form>;
}

export default function SecurityPage() {
  const { hasPermission, user } = useAuth();
  const { societyId } = useSociety();
  const [tab, setTab] = useState('gates');
  const [dialog, setDialog] = useState(null);
  const [selected, setSelected] = useState(null);
  const [deviceEvents, setDeviceEvents] = useState(null);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const gates = useFetch(() => societyId ? api.listGates({ societyId }) : Promise.resolve([]), [societyId]);
  const guards = useFetch(() => api.listGuards({}), []);
  const cards = useFetch(() => societyId ? api.listAccessCards({ societyId }) : Promise.resolve([]), [societyId]);
  const devices = useFetch(() => Promise.resolve(null), []);
 const users = useFetch(
  () => societyId ? api.listUsers({ limit: 100 }) : Promise.resolve(null),
  [societyId]
);
  const visitorProfiles = useFetch(() => societyId ? api.listVisitorProfiles({ societyId }) : Promise.resolve([]), [societyId]);
  const activeSociety = useFetch(() => societyId ? societyApi.getById(societyId) : Promise.resolve(null), [societyId]);
  useEffect(() => {
  if (tab === 'deliveries' && societyId) {
    visitorProfiles.reload();
  }
}, [tab, societyId]);

  const vendors = useFetch(() => societyId ? api.listVendors({ societyId, limit: 100 }) : Promise.resolve([]), [societyId]);
  const { units } = useUnits();

  const gateRows = list(gates.data);
  const guardRows = list(guards.data);
  const cardRows = list(cards.data);
  const userRows = list(users.data);
  const vendorRows = list(vendors.data);
  const unitRows = list(units);
  const societyRecord = activeSociety.data?.data?.society || activeSociety.data?.data || activeSociety.data?.society || activeSociety.data;
  const societyName = societyRecord?.name || societyRecord?.society_name || societyRecord?.societyName || '';
  const userNames = Object.fromEntries(userRows.map((u) => [u.id, `${u.first_name || u.firstName || ''} ${u.last_name || u.lastName || ''}`.trim() || u.email || u.id]));
  const vendorNames = Object.fromEntries(vendorRows.map((v) => [v.id, v.legal_name || v.name || v.id]));
  const unitNames = Object.fromEntries(unitRows.map((u) => [u.id, u.unitNumber || u.unit_number || u.name || u.id]));

  const refresh = () => { gates.reload(); guards.reload(); cards.reload(); };
  const run = async (action, success) => {
    setError(''); setNotice('');
    try { await action(); setNotice(success); setDialog(null); setSelected(null); refresh(); }
    catch (e) { setError(getErrorMessage(e)); }
  };

  const removeGate = (id) => run(() => api.deleteGate(id), 'Gate deleted.');
  const removeGuard = (id) => run(() => api.deleteGuard(id), 'Security guard deleted.');
  const revokeCard = (id) => run(() => api.revokeAccessCard(id), 'Access card revoked.');

  const openDeviceEvents = async (device) => {
    setSelected(device); setDeviceEvents(null); setError('');
    try { setDeviceEvents(await api.listDeviceEvents(device.id)); setDialog('device-events'); }
    catch (e) { setError(getErrorMessage(e)); }
  };

  const deviceRowsForGate = selected?.id ? devices.data || [] : [];

  if (!societyId) return <PageContainer title="Security & Gate Operations" subtitle="Gates, guards, credentials and device operations."><SocietyIdPrompt /></PageContainer>;

  return <PageContainer title="Security, Gate & Visitor Operations" subtitle="Manage physical access, visitors, deliveries and gate activity.">
    <div className="tabs-bar">
      <div className="tabs">
        <button className={`tab ${tab === 'gates' ? 'active' : ''}`} type="button" onClick={() => setTab('gates')}>Gates & Devices</button>
        <button className={`tab ${tab === 'visitors' ? 'active' : ''}`} type="button" onClick={() => setTab('visitors')}>Visitors</button>
        <button className={`tab ${tab === 'deliveries' ? 'active' : ''}`} type="button" onClick={() => setTab('deliveries')}>Deliveries</button>
      </div>
    </div>
    {notice && <Alert variant="success">{notice}</Alert>}
    {error && !dialog && <Alert>{error}</Alert>}

    {tab === 'gates' && <GatesPanel societyId={societyId} societyName={societyName} gates={gateRows} guards={guardRows} cards={cardRows} userNames={userNames} vendorNames={vendorNames} onRefresh={refresh} onRun={run} onDeleteGate={removeGate} onDeleteGuard={removeGuard} onRevokeCard={revokeCard} dialog={dialog} setDialog={setDialog} selected={selected} setSelected={setSelected} deviceEvents={deviceEvents} openDeviceEvents={openDeviceEvents} />}
    {tab === 'visitors' && <VisitorsPage societyId={societyId} societyName={societyName} currentUser={user} gates={gateRows} unitNames={unitNames} userNames={userNames} gateNames={Object.fromEntries(gateRows.map((g) => [g.id, g.name]))} />}
    {tab === 'deliveries' && <DeliveriesPage societyId={societyId} currentUser={user} profiles={list(visitorProfiles.data)} unitNames={unitNames} userNames={userNames} />}
  </PageContainer>;
}

function GatesPanel({ societyId, societyName, gates, guards, cards, userNames, vendorNames, onRefresh, onRun, onDeleteGate, onDeleteGuard, onRevokeCard, dialog, setDialog, selected, setSelected, deviceEvents, openDeviceEvents }) {
  const { hasPermission } = useAuth();
  const [gateDevices, setGateDevices] = useState([]);
  const [gateForDevices, setGateForDevices] = useState(null);
  const [formError, setFormError] = useState('');
  const [cardDetail, setCardDetail] = useState(null);
  const [guardDetail, setGuardDetail] = useState(null);
  const [deviceDetail, setDeviceDetail] = useState(null);
  const [deviceDialog, setDeviceDialog] = useState(null);
  const [eventForm, setEventForm] = useState({ externalEventId: '', eventType: '', payload: '{}' });
  const [eventSaving, setEventSaving] = useState(false);

  const showGateDevices = async (gate) => {
    setGateForDevices(gate); setFormError('');
    try { setGateDevices(await api.listGateDevices(gate.id)); setDeviceDialog('list'); }
    catch (e) { setFormError(getErrorMessage(e)); }
  };
  const refreshDevices = async () => { if (gateForDevices) setGateDevices(await api.listGateDevices(gateForDevices.id)); };

  const submitDeviceEvent = async (e) => {
    e.preventDefault(); setEventSaving(true); setFormError('');
    try { const payload = JSON.parse(eventForm.payload || '{}'); await api.ingestDeviceEvent(selected.id, { externalEventId: eventForm.externalEventId || null, eventType: eventForm.eventType, payload }); setEventForm({ externalEventId: '', eventType: '', payload: '{}' }); await refreshDevices(); setDeviceDialog('list'); }
    catch (err) { setFormError(err instanceof SyntaxError ? 'Payload must be valid JSON.' : getErrorMessage(err)); }
    finally { setEventSaving(false); }
  };

  const gateColumns = [
    { key: 'name', header: 'Gate', render: (g) => <><span className="cell-title">{g.name}</span><span className="cell-sub">{g.location || 'No location'}</span></> },
    { key: 'type', header: 'Type', render: (g) => label(g.gate_type) },
    { key: 'status', header: 'Status', render: (g) => <SecurityBadge value={g.status} /> },
    { key: 'actions', header: 'Actions', render: (g) => <div className="row-actions">
      {hasPermission('GATE_UPDATE') && <button className="btn btn-secondary btn-sm" onClick={() => { setSelected(g); setDialog('edit-gate'); }}>Edit</button>}
      {hasPermission('GATE_DEVICE_READ') && <button className="btn btn-secondary btn-sm" onClick={() => showGateDevices(g)}>Devices</button>}
      {hasPermission('GATE_DELETE') && <button className="btn btn-danger btn-sm" onClick={() => onDeleteGate(g.id)}>Delete</button>}
    </div> },
  ];

  const guardColumns = [
    { key: 'user', header: 'User', render: (g) => <span>{[g.user_first_name, g.user_last_name].filter(Boolean).join(' ') || g.user_email || userNames[g.user_id] || g.user_id}</span> },
    { key: 'employee', header: 'Employee code', render: (g) => g.employee_code || '-' },
    { key: 'agency', header: 'Agency', render: (g) => g.agency_vendor_id ? vendorNames[g.agency_vendor_id] || g.agency_vendor_id.slice(0, 8) : '-' },
    { key: 'status', header: 'Status', render: (g) => <SecurityBadge value={g.status} /> },
    { key: 'actions', header: 'Actions', render: (g) => <div className="row-actions">
      {hasPermission('SECURITY_GUARD_UPDATE') && <button className="btn btn-secondary btn-sm" onClick={() => { setSelected(g); setDialog('edit-guard'); }}>Edit</button>}
      {hasPermission('SECURITY_GUARD_READ') && <button className="btn btn-secondary btn-sm" onClick={async () => { try { setGuardDetail(await api.getGuard(g.id)); setDialog('guard-detail'); } catch (e) { setFormError(getErrorMessage(e)); } }}>View</button>}
      {hasPermission('SECURITY_GUARD_DELETE') && <button className="btn btn-danger btn-sm" onClick={() => onDeleteGuard(g.id)}>Delete</button>}
    </div> },
  ];

  const cardColumns = [
    { key: 'credential', header: 'Credential', render: (c) => <><span className="cell-title">{c.credential_no}</span><span className="cell-sub">{label(c.credential_type)}</span></> },
    { key: 'holder', header: 'Holder', render: (c) => <span>{[c.holder_first_name, c.holder_last_name].filter(Boolean).join(' ') || c.holder_email || userNames[c.holder_user_id] || c.holder_user_id}</span> },
    { key: 'valid', header: 'Valid until', render: (c) => formatDateTime(c.valid_until) },
    { key: 'status', header: 'Status', render: (c) => <SecurityBadge value={c.status} /> },
    { key: 'actions', header: 'Actions', render: (c) => <div className="row-actions">
      {hasPermission('ACCESS_CARD_READ') && <button className="btn btn-secondary btn-sm" onClick={async () => { try { setCardDetail(await api.getAccessCard(c.id)); setDialog('card-detail'); } catch (e) { setFormError(getErrorMessage(e)); } }}>View</button>}
      {hasPermission('ACCESS_CARD_UPDATE') && c.status !== 'REVOKED' && <button className="btn btn-danger btn-sm" onClick={() => onRevokeCard(c.id)}>Revoke</button>}
    </div> },
  ];

  return <>
    <div className="section-head"><div><h2 className="section-title">Gates</h2><p className="muted section-hint">Society entry points and their hardware.</p></div>
      {hasPermission('GATE_CREATE') && <button className="btn btn-primary" onClick={() => setDialog('new-gate')}><Plus size={16} /> New gate</button>}</div>
    <DataTable columns={gateColumns} rows={gates} emptyTitle="No gates" emptyMessage="Create a gate before registering devices." />
    <div className="section">
      <div className="section-head"><div><h2 className="section-title">Security guards</h2><p className="muted section-hint">Guards are linked to existing user accounts.</p></div>
        {hasPermission('SECURITY_GUARD_CREATE') && <button className="btn btn-primary" onClick={() => setDialog('new-guard')}>Add guard</button>}</div>
      <DataTable columns={guardColumns} rows={guards} emptyTitle="No guards" emptyMessage="Add a security guard linked to a user." />
    </div>
    <div className="section">
      <div className="section-head"><div><h2 className="section-title">Access cards</h2><p className="muted section-hint">Credentials are issued to existing users.</p></div>
        {hasPermission('ACCESS_CARD_CREATE') && <button className="btn btn-primary" onClick={() => setDialog('new-card')}>Issue access card</button>}</div>
      <DataTable columns={cardColumns} rows={cards} emptyTitle="No access cards" emptyMessage="Issue a credential to an existing user." />
    </div>

    {dialog === 'new-gate' && <Modal title="Create gate" onClose={() => setDialog(null)}><GateForm societyId={societyId} societyName={societyName} gates={gates} onSubmit={(p) => onRun(() => api.createGate(p), 'Gate created.')} onCancel={() => setDialog(null)} /></Modal>}
    {dialog === 'edit-gate' && <Modal title="Edit gate" onClose={() => setDialog(null)}><GateForm societyId={societyId} societyName={societyName} value={selected} gates={gates} onSubmit={(p) => onRun(() => api.updateGate(selected.id, p), 'Gate updated.')} onCancel={() => setDialog(null)} /></Modal>}
    {dialog === 'new-guard' && <Modal title="Add security guard" onClose={() => setDialog(null)}><GuardForm guards={guards} onSubmit={(p) => onRun(() => api.createGuard(p), 'Security guard added.')} onCancel={() => setDialog(null)} /></Modal>}
    {dialog === 'edit-guard' && <Modal title="Edit security guard" onClose={() => setDialog(null)}><GuardForm value={selected} guards={guards} onSubmit={(p) => onRun(() => api.updateGuard(selected.id, p), 'Security guard updated.')} onCancel={() => setDialog(null)} /></Modal>}
    {dialog === 'guard-detail' && <Modal title="Security guard" onClose={() => setDialog(null)}><dl className="details"><dt>User</dt><dd>{[guardDetail?.user_first_name, guardDetail?.user_last_name].filter(Boolean).join(' ') || guardDetail?.user_email || userNames[guardDetail?.user_id] || guardDetail?.user_id}</dd><dt>Employee code</dt><dd>{guardDetail?.employee_code || '-'}</dd><dt>Agency</dt><dd>{guardDetail?.agency_vendor_name || (guardDetail?.agency_vendor_id ? (vendorNames[guardDetail.agency_vendor_id] || guardDetail.agency_vendor_id) : '-')}</dd><dt>Status</dt><dd><SecurityBadge value={guardDetail?.status} /></dd></dl></Modal>}
    {dialog === 'new-card' && <Modal title="Issue access card" onClose={() => setDialog(null)}><CardForm societyId={societyId} cards={cards} onSubmit={(p) => onRun(() => api.issueAccessCard(p), 'Access card issued.')} onCancel={() => setDialog(null)} /></Modal>}
    {dialog === 'card-detail' && <Modal title="Access card" onClose={() => setDialog(null)}><dl className="details"><dt>Credential</dt><dd>{cardDetail?.credential_no}</dd><dt>Type</dt><dd>{label(cardDetail?.credential_type)}</dd><dt>Holder</dt><dd>{[cardDetail?.holder_first_name, cardDetail?.holder_last_name].filter(Boolean).join(' ') || cardDetail?.holder_email || userNames[cardDetail?.holder_user_id] || cardDetail?.holder_user_id}</dd><dt>Status</dt><dd><SecurityBadge value={cardDetail?.status} /></dd><dt>Valid from</dt><dd>{formatDateTime(cardDetail?.valid_from)}</dd><dt>Valid until</dt><dd>{formatDateTime(cardDetail?.valid_until)}</dd></dl></Modal>}

    <div className="section">
      <div className="section-head"><div><h2 className="section-title">Gate devices</h2><p className="muted section-hint">Select a gate to manage its devices and event log.</p></div></div>
      <div className="security-device-grid">{gates.map((g) => <button key={g.id} type="button" className="security-device-card" onClick={() => showGateDevices(g)}><strong>{g.name}</strong><span>{g.location || 'No location'}</span></button>)}</div>
    </div>

    {deviceDialog === 'list' && <Modal title={`${gateForDevices?.name || 'Gate'} devices`} onClose={() => setDeviceDialog(null)}>
      <div className="section-head"><p className="muted section-hint">Devices registered for this gate.</p>{hasPermission('GATE_DEVICE_CREATE') && <button className="btn btn-primary btn-sm" onClick={() => setDeviceDialog('new')}>Register device</button>}</div>
      <DataTable columns={[
        { key: 'device', header: 'Device', render: (d) => <><span className="cell-title">{label(d.device_type)}</span><span className="cell-sub">{d.serial_no}</span></> },
        { key: 'status', header: 'Status', render: (d) => <SecurityBadge value={d.status} /> },
        { key: 'ip', header: 'IP', render: (d) => d.ip_address || '-' },
        { key: 'actions', header: 'Actions', render: (d) => <div className="row-actions">
          {hasPermission('GATE_DEVICE_UPDATE') && <button className="btn btn-secondary btn-sm" onClick={() => { setSelected(d); setDeviceDialog('edit'); }}>Edit</button>}
          {hasPermission('DEVICE_EVENT_READ') && <button className="btn btn-secondary btn-sm" onClick={() => openDeviceEvents(d)}>Events</button>}
          {hasPermission('DEVICE_EVENT_CREATE') && <button className="btn btn-secondary btn-sm" onClick={() => { setSelected(d); setDeviceDialog('event'); }}>Record event</button>}
          {hasPermission('GATE_DEVICE_READ') && <button className="btn btn-secondary btn-sm" onClick={async () => { try { setSelected(await api.getGateDevice(d.id)); setDeviceDialog('detail'); } catch (e) { setFormError(getErrorMessage(e)); } }}>View</button>}
        </div> },
      ]} rows={gateDevices} emptyTitle="No devices" emptyMessage="Register the first device for this gate." />
    </Modal>}

    {deviceDialog === 'new' && <Modal title="Register gate device" onClose={() => setDeviceDialog('list')}><DeviceForm gates={gates} onSubmit={(p) => onRun(async () => { await api.createGateDevice(p); setGateDevices(await api.listGateDevices(gateForDevices.id)); setDeviceDialog('list'); }, 'Gate device registered.')} onCancel={() => setDeviceDialog('list')} /></Modal>}
    {deviceDialog === 'edit' && <Modal title="Update gate device" onClose={() => setDeviceDialog('list')}><DeviceForm gates={gates} value={selected} onSubmit={(p) => onRun(async () => { await api.updateGateDevice(selected.id, p); setGateDevices(await api.listGateDevices(gateForDevices.id)); setDeviceDialog('list'); }, 'Gate device updated.')} onCancel={() => setDeviceDialog('list')} /></Modal>}
    {deviceDialog === 'detail' && <Modal title="Gate device" onClose={() => setDeviceDialog('list')}><dl className="details"><dt>Type</dt><dd>{label(selected?.device_type)}</dd><dt>Serial</dt><dd>{selected?.serial_no}</dd><dt>IP</dt><dd>{selected?.ip_address || '-'}</dd><dt>Status</dt><dd><SecurityBadge value={selected?.status} /></dd><dt>Last seen</dt><dd>{formatDateTime(selected?.last_seen_at)}</dd></dl></Modal>}
    {deviceDialog === 'event' && <Modal title="Record device event" onClose={() => setDeviceDialog('list')}><form onSubmit={submitDeviceEvent}><ErrorBox error={formError} /><TextField id="externalEventId" label="External event ID" value={eventForm.externalEventId} onChange={(e) => setEventForm((f) => ({ ...f, externalEventId: e.target.value }))} /><TextField id="eventType" label="Event type" value={eventForm.eventType} onChange={(e) => setEventForm((f) => ({ ...f, eventType: e.target.value }))} required /><div className="field"><label htmlFor="devicePayload">Payload JSON</label><textarea id="devicePayload" className="input" rows="5" value={eventForm.payload} onChange={(e) => setEventForm((f) => ({ ...f, payload: e.target.value }))} /></div><FormActions saving={eventSaving} onCancel={() => setDeviceDialog('list')} submitLabel="Record event" /></form></Modal>}
    {dialog === 'device-events' && <Modal title="Device event log" onClose={() => setDialog(null)}><DataTable columns={[{ key: 'type', header: 'Event', render: (e) => e.event_type }, { key: 'external', header: 'External ID', render: (e) => e.external_event_id || '-' }, { key: 'at', header: 'Event at', render: (e) => formatDateTime(e.event_at) }, { key: 'status', header: 'Status', render: (e) => <SecurityBadge value={e.status} /> }]} rows={deviceEvents || []} emptyTitle="No device events" emptyMessage="No events recorded for this device." /></Modal>}
  </>;
}

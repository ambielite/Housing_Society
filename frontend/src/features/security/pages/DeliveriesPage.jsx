import { useState } from 'react';
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
import { DELIVERY_TYPES, DELIVERY_STATUSES, PARCEL_STATUSES, deliveryTransitions, label } from '../components/securityOptions';
import SecurityBadge from '../components/SecurityBadge';
import { FormActions, VisitorPicker, DeliveryPicker, ErrorBox } from '../components/SecurityFormHelpers';

const list = (value) => {
  if (Array.isArray(value)) return value;
  return value?.data ||
    value?.records ||
    value?.rows ||
    value?.items ||
    value?.users ||
    value?.vendors ||
    value?.units ||
    value?.profiles ||
    value?.visitorProfiles ||
    value?.gates ||
    value?.devices ||
    value?.results ||
    [];
};

function DeliveryForm({ societyId, profiles, onSubmit, onCancel }) {
  const [form, setForm] = useState({ societyId, unitId: '', visitorProfileId: '', deliveryType: 'COURIER', courierName: '', trackingNo: '' });
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const selectedVisitor = profiles.find((profile) => String(profile.id) === String(form.visitorProfileId));
  return <form onSubmit={(e) => { e.preventDefault(); onSubmit({ ...form, visitorProfileId: form.visitorProfileId || null, courierName: form.courierName || null, trackingNo: form.trackingNo || null }); }}>
    <UnitSelect value={form.unitId} onChange={(v) => set('unitId', v)} />
    <VisitorPicker profiles={profiles} value={form.visitorProfileId} onChange={(v) => set('visitorProfileId', v)} />
    {selectedVisitor?.visitor_type === 'DELIVERY_PERSON' && <TextField id="selectedDeliveryCompany" label="Delivery company" value={selectedVisitor.delivery_company || 'Not provided on visitor profile'} disabled hint="Company is taken from the selected visitor profile." />}
    <SelectField id="deliveryType" label="Delivery type" options={DELIVERY_TYPES.map((v) => ({ value: v, label: label(v) }))} value={form.deliveryType} onChange={(e) => set('deliveryType', e.target.value)} />
    <TextField id="courierName" label="Courier / source" value={form.courierName} onChange={(e) => set('courierName', e.target.value)} />
    <TextField id="trackingNo" label="Tracking number" value={form.trackingNo} onChange={(e) => set('trackingNo', e.target.value)} />
    <FormActions saving={false} onCancel={onCancel} submitLabel="Register delivery" />
  </form>;
}

function DeliveryStatusForm({ current, onSubmit, onCancel }) {
  const [status, setStatus] = useState('');
  const [receivedAt, setReceivedAt] = useState('');
  const [handedOverAt, setHandedOverAt] = useState('');
  const choices = deliveryTransitions[current] || [];
  return <form onSubmit={(e) => { e.preventDefault(); onSubmit({ status, receivedAt: receivedAt ? new Date(receivedAt).toISOString() : null, handedOverAt: handedOverAt ? new Date(handedOverAt).toISOString() : null }); }}>
    <SelectField id="deliveryStatus" label="New status" options={choices.map((v) => ({ value: v, label: label(v) }))} placeholder="Select status" value={status} onChange={(e) => setStatus(e.target.value)} />
    <TextField id="receivedAt" label="Received at (optional)" type="datetime-local" value={receivedAt} onChange={(e) => setReceivedAt(e.target.value)} />
    <TextField id="handedOverAt" label="Handed over at (optional)" type="datetime-local" value={handedOverAt} onChange={(e) => setHandedOverAt(e.target.value)} />
    <p className="field-hint">Only backend-supported transitions are offered.</p>
    <FormActions saving={false} onCancel={onCancel} submitLabel="Change status" />
  </form>;
}

function ParcelForm({ deliveries, currentUser, onSubmit, onCancel }) {
  const [form, setForm] = useState({ deliveryId: '', parcelCode: '', storageLocation: '', receivedBy: currentUser?.id || '' });
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  return <form onSubmit={(e) => { e.preventDefault(); onSubmit({ ...form, receivedBy: form.receivedBy || null, parcelCode: form.parcelCode || null, storageLocation: form.storageLocation || null }); }}>
    <DeliveryPicker deliveries={deliveries} value={form.deliveryId} onChange={(v) => set('deliveryId', v)} />
    <TextField id="parcelCode" label="Parcel code" value={form.parcelCode} onChange={(e) => set('parcelCode', e.target.value)} />
    <TextField id="storageLocation" label="Storage location" value={form.storageLocation} onChange={(e) => set('storageLocation', e.target.value)} />
    <TextField id="receivedBy" label="Received by" value={form.receivedBy} disabled hint="Automatically uses the logged-in user." />
    <FormActions saving={false} onCancel={onCancel} submitLabel="Log parcel" />
  </form>;
}

function ParcelStatusForm({ onSubmit, onCancel }) {
  const [status, setStatus] = useState('');
  return <form onSubmit={(e) => { e.preventDefault(); onSubmit(status); }}>
    <SelectField id="parcelStatus" label="New status" options={PARCEL_STATUSES.map((v) => ({ value: v, label: label(v) }))} placeholder="Select status" value={status} onChange={(e) => setStatus(e.target.value)} />
    <p className="field-hint">The backend only permits status changes while the parcel is STORED.</p>
    <FormActions saving={false} onCancel={onCancel} submitLabel="Change status" />
  </form>;
}

export default function DeliveriesPage({ societyId, currentUser, profiles, unitNames = {}, userNames = {} }) {
  const { hasPermission } = useAuth();
  const [tab, setTab] = useState('deliveries');
  const [dialog, setDialog] = useState(null);
  const [selected, setSelected] = useState(null);
  const [detail, setDetail] = useState(null);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const deliveries = useFetch(() => api.listDeliveries({ societyId }), [societyId]);
  const parcels = useFetch(() => api.listParcels({}), []);
  const deliveryRows = list(deliveries.data);
  const parcelRows = list(parcels.data);

  const run = async (action, success) => {
    setError(''); setNotice('');
    try { await action(); setNotice(success); setDialog(null); setSelected(null); deliveries.reload(); parcels.reload(); }
    catch (e) { setError(getErrorMessage(e)); }
  };

  const deliveryColumns = [
    { key: 'delivery', header: 'Delivery', render: (d) => <><span className="cell-title">{label(d.delivery_type)}</span>{d.courier_name && <span className="cell-sub">Courier / source: {d.courier_name}</span>}{d.tracking_no && <span className="cell-sub">Tracking number: {d.tracking_no}</span>}</> },
    { key: 'unit', header: 'Unit', render: (d) => <span>{unitNames[d.unit_id] || d.unit_id}</span> },
    { key: 'visitor', header: 'Visitor', render: (d) => d.visitor_profile_id ? <span>{profiles.find((p) => p.id === d.visitor_profile_id)?.name || d.visitor_profile_id}</span> : '-' },
    { key: 'status', header: 'Status', render: (d) => <SecurityBadge value={d.status} /> },
    { key: 'actions', header: 'Actions', render: (d) => <div className="row-actions">
      {hasPermission('DELIVERY_READ') && <button className="btn btn-secondary btn-sm" onClick={async () => { try { setDetail(await api.getDelivery(d.id)); setDialog('delivery-detail'); } catch (e) { setError(getErrorMessage(e)); } }}>View</button>}
      {hasPermission('DELIVERY_UPDATE') && (deliveryTransitions[d.status] || []).length > 0 && <button className="btn btn-primary btn-sm" onClick={() => { setSelected(d); setDialog('delivery-status'); }}>Change status</button>}
    </div> },
  ];

  const parcelColumns = [
    { key: 'parcel', header: 'Parcel', render: (p) => <><span className="cell-title">{p.parcel_code || p.id.slice(0, 8)}</span><span className="cell-sub">{p.storage_location || 'No storage location'}</span></> },
    { key: 'delivery', header: 'Delivery', render: (p) => <span>{deliveryRows.find((d) => d.id === p.delivery_id)?.tracking_no || deliveryRows.find((d) => d.id === p.delivery_id)?.courier_name || p.delivery_id}</span> },
    { 
  key: 'received', 
  header: 'Received by', 
  render: (p) => userNames[p.received_by] || p.received_by || '-' 
},
    { key: 'status', header: 'Status', render: (p) => <SecurityBadge value={p.status} /> },
    { key: 'actions', header: 'Actions', render: (p) => <div className="row-actions">
      {hasPermission('PARCEL_READ') && <button className="btn btn-secondary btn-sm" onClick={async () => { try { setDetail(await api.getParcel(p.id)); setDialog('parcel-detail'); } catch (e) { setError(getErrorMessage(e)); } }}>View</button>}
      {hasPermission('PARCEL_UPDATE') && p.status === 'STORED' && <button className="btn btn-primary btn-sm" onClick={() => { setSelected(p); setDialog('parcel-status'); }}>Change status</button>}
    </div> },
  ];

  return <div>
    <div className="tabs-bar"><div className="tabs"><button className={`tab ${tab === 'deliveries' ? 'active' : ''}`} type="button" onClick={() => setTab('deliveries')}>Deliveries</button><button className={`tab ${tab === 'parcels' ? 'active' : ''}`} type="button" onClick={() => setTab('parcels')}>Parcels</button></div></div>
    {notice && <Alert variant="success">{notice}</Alert>}
    {error && !dialog && <Alert>{error}</Alert>}

    {tab === 'deliveries' && <><div className="section-head"><div><h2 className="section-title">Deliveries</h2><p className="muted section-hint">Register incoming deliveries against a society unit.</p></div>{hasPermission('DELIVERY_CREATE') && <button className="btn btn-primary" onClick={() => setDialog('delivery-new')}><span className="button-plus" aria-hidden="true">+</span> Register delivery</button>}</div><DataTable tableClassName="society-table security-actions-table" columns={deliveryColumns} rows={deliveryRows} loading={deliveries.loading} error={deliveries.error ? getErrorMessage(deliveries.error) : ''} onRetry={deliveries.reload} emptyTitle="No deliveries" emptyMessage="Register an incoming delivery to begin tracking it." /></>}

    {tab === 'parcels' && <><div className="section-head"><div><h2 className="section-title">Parcels</h2><p className="muted section-hint">Log stored parcels and mark them collected, damaged or lost.</p></div>{hasPermission('PARCEL_CREATE') && <button className="btn btn-primary" onClick={() => setDialog('parcel-new')}><span className="button-plus" aria-hidden="true">+</span> Log parcel</button>}</div><DataTable tableClassName="society-table security-actions-table" columns={parcelColumns} rows={parcelRows} loading={parcels.loading} error={parcels.error ? getErrorMessage(parcels.error) : ''} onRetry={parcels.reload} emptyTitle="No parcels" emptyMessage="Log a parcel against an existing delivery." /></>}

    {dialog === 'delivery-new' && <Modal title="Register delivery" onClose={() => setDialog(null)}><DeliveryForm societyId={societyId} profiles={profiles} onSubmit={(p) => run(() => api.createDelivery(p), 'Delivery registered.')} onCancel={() => setDialog(null)} /></Modal>}
    {dialog === 'delivery-status' && <Modal title="Change delivery status" onClose={() => setDialog(null)}><DeliveryStatusForm current={selected?.status} onSubmit={(p) => run(() => api.updateDeliveryStatus(selected.id, p), 'Delivery status updated.')} onCancel={() => setDialog(null)} /></Modal>}
    {dialog === 'delivery-detail' && <Modal title="Delivery details" onClose={() => setDialog(null)}><dl className="details"><dt>Type</dt><dd>{label(detail?.delivery_type)}</dd><dt>Unit</dt><dd>{unitNames[detail?.unit_id] || detail?.unit_id}</dd><dt>Courier</dt><dd>{detail?.courier_name || '-'}</dd><dt>Tracking</dt><dd>{detail?.tracking_no || '-'}</dd><dt>Status</dt><dd><SecurityBadge value={detail?.status} /></dd><dt>Received</dt><dd>{formatDateTime(detail?.received_at)}</dd><dt>Handed over</dt><dd>{formatDateTime(detail?.handed_over_at)}</dd></dl><div className="section"><h3>Parcels</h3><DataTable tableClassName="society-table" columns={[{ key: 'code', header: 'Code', render: (p) => p.parcel_code || '-' }, { key: 'location', header: 'Location', render: (p) => p.storage_location || '-' }, { key: 'status', header: 'Status', render: (p) => <SecurityBadge value={p.status} /> }]} rows={detail?.parcels || []} emptyTitle="No parcels" emptyMessage="No parcels have been logged for this delivery." /></div></Modal>}
    {dialog === 'parcel-new' && <Modal title="Log parcel" onClose={() => setDialog(null)}><ParcelForm deliveries={deliveryRows} currentUser={currentUser} onSubmit={(p) => run(() => api.createParcel(p), 'Parcel logged.')} onCancel={() => setDialog(null)} /></Modal>}
    {dialog === 'parcel-status' && <Modal title="Change parcel status" onClose={() => setDialog(null)}><ParcelStatusForm onSubmit={(status) => run(() => api.updateParcelStatus(selected.id, status, currentUser?.id || null), 'Parcel status updated.')} onCancel={() => setDialog(null)} /></Modal>}
    {dialog === 'parcel-detail' && <Modal title="Parcel details" onClose={() => setDialog(null)}><dl className="details"><dt>Parcel code</dt><dd>{detail?.parcel_code || '-'}</dd><dt>Delivery</dt><dd>{deliveryRows.find((d) => d.id === detail?.delivery_id)?.tracking_no || deliveryRows.find((d) => d.id === detail?.delivery_id)?.courier_name || detail?.delivery_id}</dd><dt>Storage</dt><dd>{detail?.storage_location || '-'}</dd><dt>Received by</dt><dd>{detail?.received_by ? (userNames[detail.received_by] || detail.received_by) : '-'}</dd><dt>Collected by</dt><dd>{detail?.collected_by ? (userNames[detail.collected_by] || detail.collected_by) : '-'}</dd><dt>Collected at</dt><dd>{formatDateTime(detail?.collected_at)}</dd><dt>Status</dt><dd><SecurityBadge value={detail?.status} /></dd></dl></Modal>}
  </div>;
}

import { useState } from 'react';
import { Plus, SquarePen, Trash2 } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import useAuth from '../../../app/providers/useAuth';
import useSociety from '../../../app/store/useSociety';
import useFetch from '../../../utils/useFetch';
import { formatDate, formatMoney } from '../../../utils/format';
import { getErrorMessage } from '../../../lib/axios';
import PageContainer from '../../../components/layout/PageContainer';
import DataTable from '../../../components/tables/DataTable';
import Alert from '../../../components/ui/Alert';
import Modal from '../../../components/ui/Modal';
import ConfirmDialog from '../../../components/ui/ConfirmDialog';
import SocietyIdPrompt from '../../../components/ui/SocietyIdPrompt';
import AmenityTabs from '../components/AmenityTabs';
import SlotForm from '../components/SlotForm';
import { SlotStatusBadge } from '../components/AmenityBadges';
import { SLOT_STATUSES } from '../components/amenityOptions';
import * as api from '../api/amenities.api';

export default function SlotListPage() {
  const { hasPermission } = useAuth();
  const { societyId } = useSociety();
  const [searchParams] = useSearchParams();
  const [amenityFilter, setAmenityFilter] = useState(searchParams.get('amenityId') || '');
  const [dateFilter, setDateFilter] = useState(searchParams.get('slotDate') || '');
  const [status, setStatus] = useState('');
  const [dialog, setDialog] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const amenities = useFetch(() => (societyId ? api.listAmenities({ societyId }) : Promise.resolve(null)), [societyId]);
  const slots = useFetch(
    () => (societyId ? api.listSlots({ amenityId: amenityFilter, slotDate: dateFilter, status }) : Promise.resolve(null)),
    [societyId, amenityFilter, dateFilter, status]
  );

  if (!societyId) return <PageContainer title="Amenity slots"><AmenityTabs /><SocietyIdPrompt /></PageContainer>;

  const amenityById = new Map((amenities.data || []).map((a) => [a.id, a]));
  const rows = slots.data && amenities.data ? slots.data.filter((slot) => amenityById.has(slot.amenity_id)) : null;
  const options = (amenities.data || []).map((a) => ({ value: a.id, label: a.name }));

  const save = async (payload) => {
    setSaving(true); setError('');
    try {
      if (dialog.type === 'edit') {
        await api.updateSlot(dialog.slot.id, payload);
        setNotice('Slot updated.');
      } else {
        await api.createSlot(payload);
        setNotice('Slot created.');
      }
      setDialog(null);
      slots.reload();
    } catch (err) { setError(getErrorMessage(err)); }
    finally { setSaving(false); }
  };

  const remove = async () => {
    setSaving(true); setError('');
    try {
      await api.deleteSlot(deleting.id);
      setNotice('Slot deleted.');
      slots.reload();
    } catch (err) { setError(getErrorMessage(err)); }
    finally { setSaving(false); setDeleting(null); }
  };

  const newButton = hasPermission('AMENITY_SLOT_CREATE')
    ? <button className="btn btn-primary" onClick={() => { setError(''); setDialog({ type: 'create' }); }}><Plus size={16} /> New slot</button>
    : null;

  return (
    <PageContainer title="Amenity slots" subtitle="Create and maintain bookable time windows." actions={newButton}>
      <AmenityTabs />
      {notice && <Alert variant="success">{notice}</Alert>}
      {error && <Alert>{error}</Alert>}
      <div className="toolbar">
        <select className="input toolbar-select" value={amenityFilter} onChange={(e) => setAmenityFilter(e.target.value)} aria-label="Filter by amenity">
          <option value="">All amenities</option>
          {options.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
        </select>
        <input className="input toolbar-select" type="date" value={dateFilter} onChange={(e) => setDateFilter(e.target.value)} aria-label="Filter by date" />
        <select className="input toolbar-select" value={status} onChange={(e) => setStatus(e.target.value)} aria-label="Filter by status">
          <option value="">All statuses</option>
          {SLOT_STATUSES.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
        </select>
        {(amenityFilter || dateFilter || status) && <button className="btn btn-secondary" onClick={() => { setAmenityFilter(''); setDateFilter(''); setStatus(''); }}>Clear filters</button>}
      </div>
      <DataTable
        columns={[
          { key: 'amenity', header: 'Amenity', render: (s) => <span className="cell-title">{amenityById.get(s.amenity_id)?.name || 'Unknown'}</span> },
          { key: 'date', header: 'Date', render: (s) => formatDate(s.slot_date) },
          { key: 'time', header: 'Time', render: (s) => `${String(s.start_time).slice(0, 5)} - ${String(s.end_time).slice(0, 5)}` },
          { key: 'capacity', header: 'Capacity', render: (s) => s.capacity },
          { key: 'price', header: 'Price', render: (s) => formatMoney(s.price) },
          { key: 'status', header: 'Status', render: (s) => <SlotStatusBadge status={s.status} /> },
          { key: 'actions', header: 'Actions', render: (s) => <div className="row-actions">
            {hasPermission('AMENITY_SLOT_UPDATE') && <button type="button" className="society-icon-action" title="Edit slot" aria-label={`Edit slot ${s.slot_date}`} onClick={() => { setError(''); setDialog({ type: 'edit', slot: s }); }}><SquarePen size={16} /></button>}
            {hasPermission('AMENITY_SLOT_DELETE') && <button type="button" className="society-icon-action society-delete-action" title="Delete slot" aria-label={`Delete slot ${s.slot_date}`} onClick={() => setDeleting(s)}><Trash2 size={16} /></button>}
          </div> },
        ]}
        rows={rows}
        loading={slots.loading || amenities.loading}
        error={slots.error || amenities.error ? getErrorMessage(slots.error || amenities.error) : ''}
        onRetry={() => { slots.reload(); amenities.reload(); }}
        emptyTitle="No slots found"
        emptyMessage="Create slots from here or from an amenity's detail page."
        emptyAction={(amenityFilter || dateFilter || status) ? <button className="btn btn-secondary" onClick={() => { setAmenityFilter(''); setDateFilter(''); setStatus(''); }}>Clear filters</button> : null}
      />
      {dialog && <Modal title={dialog.type === 'edit' ? 'Edit slot' : 'New slot'} onClose={() => !saving && setDialog(null)} busy={saving}>
        <SlotForm slot={dialog.slot} amenityOptions={options} onSubmit={save} onCancel={() => setDialog(null)} saving={saving} error={error} />
      </Modal>}
      <ConfirmDialog open={Boolean(deleting)} title="Delete this slot?" message="A slot cannot be deleted while bookings are attached to it." confirmLabel="Delete slot" danger busy={saving} onConfirm={remove} onCancel={() => setDeleting(null)} />
    </PageContainer>
  );
}

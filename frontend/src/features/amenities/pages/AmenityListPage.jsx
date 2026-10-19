import { useState } from 'react';
import { Plus } from 'lucide-react';
import { Link } from 'react-router-dom';
import useAuth from '../../../app/providers/useAuth';
import useSociety from '../../../app/store/useSociety';
import useFetch from '../../../utils/useFetch';
import { getErrorMessage } from '../../../lib/axios';
import PageContainer from '../../../components/layout/PageContainer';
import DataTable from '../../../components/tables/DataTable';
import Alert from '../../../components/ui/Alert';
import Modal from '../../../components/ui/Modal';
import ConfirmDialog from '../../../components/ui/ConfirmDialog';
import SocietyIdPrompt from '../../../components/ui/SocietyIdPrompt';
import AmenityTabs from '../components/AmenityTabs';
import AmenityForm from '../components/AmenityForm';
import { AmenityStatusBadge } from '../components/AmenityBadges';
import { AMENITY_STATUSES, AMENITY_TYPES, labelOf } from '../components/amenityOptions';
import * as api from '../api/amenities.api';

export default function AmenityListPage() {
  const { hasPermission } = useAuth();
  const { societyId } = useSociety();
  const [status, setStatus] = useState('');
  const [dialog, setDialog] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const amenities = useFetch(
    () => (societyId ? api.listAmenities({ societyId, status }) : Promise.resolve(null)),
    [societyId, status]
  );

  if (!societyId) {
    return <PageContainer title="Amenities" subtitle="Manage the society's bookable facilities."><AmenityTabs /><SocietyIdPrompt /></PageContainer>;
  }

  const save = async (payload) => {
    setSaving(true); setError('');
    try {
      if (dialog.mode === 'edit') {
        await api.updateAmenity(dialog.amenity.id, payload);
        setNotice('Amenity updated.');
      } else {
        await api.createAmenity({ ...payload, societyId });
        setNotice('Amenity created.');
      }
      setDialog(null);
      amenities.reload();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally { setSaving(false); }
  };

  const remove = async () => {
    setSaving(true); setError('');
    try {
      await api.deleteAmenity(deleting.id);
      setNotice(`Amenity "${deleting.name}" deleted.`);
      amenities.reload();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
      setDeleting(null);
    }
  };

  const newButton = hasPermission('AMENITY_CREATE')
    ? <button className="btn btn-primary" onClick={() => { setError(''); setDialog({ mode: 'create' }); }}><Plus size={16} /> New amenity</button>
    : null;

  const columns = [
    { key: 'name', header: 'Amenity', render: (a) => <Link to={`/amenities/${a.id}`} className="cell-title">{a.name}</Link> },
    { key: 'type', header: 'Type', render: (a) => labelOf(AMENITY_TYPES, a.amenity_type) },
    { key: 'capacity', header: 'Capacity', render: (a) => a.capacity ?? '-' },
    { key: 'location', header: 'Location', render: (a) => a.location || '-' },
    { key: 'booking', header: 'Booking', render: (a) => a.booking_required ? 'Required' : 'Not required' },
    { key: 'status', header: 'Status', render: (a) => <AmenityStatusBadge status={a.status} /> },
    {
      key: 'actions', header: '',
      render: (a) => <div className="row-actions">
        <Link className="btn btn-secondary btn-sm" to={`/amenities/${a.id}`}>Manage</Link>
        {hasPermission('AMENITY_UPDATE') && <button className="btn btn-secondary btn-sm" onClick={() => { setError(''); setDialog({ mode: 'edit', amenity: a }); }}>Edit</button>}
        {hasPermission('AMENITY_DELETE') && <button className="btn btn-secondary btn-sm" onClick={() => setDeleting(a)}>Delete</button>}
      </div>,
    },
  ];

  return (
    <PageContainer title="Amenities" subtitle="Manage amenities and their booking configuration." actions={newButton}>
      <AmenityTabs />
      {notice && <Alert variant="success">{notice}</Alert>}
      {error && <Alert>{error}</Alert>}
      <div className="toolbar">
        <select className="input toolbar-select" value={status} onChange={(e) => setStatus(e.target.value)} aria-label="Filter amenities by status">
          <option value="">All statuses</option>
          {AMENITY_STATUSES.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
        </select>
      </div>
      <DataTable
        columns={columns}
        rows={amenities.data}
        loading={amenities.loading}
        error={amenities.error ? getErrorMessage(amenities.error) : ''}
        onRetry={amenities.reload}
        emptyTitle="No amenities yet"
        emptyMessage="Create an amenity such as a clubhouse, gym, pool or party hall."
        emptyAction={status ? <button className="btn btn-secondary" onClick={() => setStatus('')}>Clear filters</button> : null}
      />
      {dialog && <Modal title={dialog.mode === 'edit' ? 'Edit amenity' : 'New amenity'} onClose={() => !saving && setDialog(null)} busy={saving}>
        <AmenityForm amenity={dialog.amenity} onSubmit={save} onCancel={() => setDialog(null)} saving={saving} error={error} />
      </Modal>}
      <ConfirmDialog open={Boolean(deleting)} title="Delete this amenity?" message={`"${deleting?.name || ''}" can only be deleted when no slots are attached.`} confirmLabel="Delete amenity" danger busy={saving} onConfirm={remove} onCancel={() => setDeleting(null)} />
    </PageContainer>
  );
}

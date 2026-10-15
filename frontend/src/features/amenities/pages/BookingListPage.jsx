import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import useAuth from '../../../app/providers/useAuth';
import useSociety from '../../../app/store/useSociety';
import useFetch from '../../../utils/useFetch';
import { formatDateTime, formatMoney } from '../../../utils/format';
import { getErrorMessage } from '../../../lib/axios';
import PageContainer from '../../../components/layout/PageContainer';
import DataTable from '../../../components/tables/DataTable';
import Alert from '../../../components/ui/Alert';
import Modal from '../../../components/ui/Modal';
import SocietyIdPrompt from '../../../components/ui/SocietyIdPrompt';
import AmenityTabs from '../components/AmenityTabs';
import BookingForm from '../components/BookingForm';
import { BookingStatusBadge } from '../components/AmenityBadges';
import { BOOKING_STATUSES } from '../components/amenityOptions';
import * as api from '../api/amenities.api';

export default function BookingListPage() {
  const { user, hasPermission } = useAuth();
  const { societyId } = useSociety();
  const navigate = useNavigate();
  const location = useLocation();
  const [status, setStatus] = useState('');
  const [dialog, setDialog] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const bookings = useFetch(() => (societyId ? api.listBookings({ status }) : Promise.resolve(null)), [societyId, status]);
  const canReadAmenities = hasPermission('AMENITY_READ');
  const canReadSlots = hasPermission('AMENITY_SLOT_READ');
  const amenities = useFetch(() => (societyId && canReadAmenities ? api.listAmenities({ societyId }) : Promise.resolve(null)), [societyId, canReadAmenities]);
  const slots = useFetch(() => (canReadSlots ? api.listSlots() : Promise.resolve(null)), [canReadSlots]);

  if (!societyId && canReadAmenities) return <PageContainer title="Bookings"><AmenityTabs /><SocietyIdPrompt /></PageContainer>;

  const amenityById = new Map((amenities.data || []).map((a) => [a.id, a]));
  const slotById = new Map((slots.data || []).map((s) => [s.id, s]));
  const rows = bookings.data
    ? bookings.data.filter((booking) => {
      if (!canReadAmenities && !canReadSlots) return true;
      const slot = slotById.get(booking.amenity_slot_id);
      return !slot || amenityById.has(slot.amenity_id);
    })
    : null;

  const create = async (payload) => {
    setSaving(true); setError('');
    try {
      const created = await api.createBooking(payload);
      setDialog(false);
      navigate(`/amenities/bookings/${created.id}`, { state: { notice: 'Booking created successfully.' } });
    } catch (err) { setError(getErrorMessage(err)); }
    finally { setSaving(false); }
  };

  const newButton = hasPermission('AMENITY_BOOKING_CREATE')
    ? <button className="btn btn-primary" onClick={() => { setError(''); setDialog(true); }}>New booking</button>
    : null;

  return (
    <PageContainer title="Amenity bookings" subtitle="Reservations, payment status and booking lifecycle." actions={newButton}>
      <AmenityTabs />
      {location.state?.notice && <Alert variant="success">{location.state.notice}</Alert>}
      {error && <Alert>{error}</Alert>}
      <div className="toolbar">
        <select className="input toolbar-select" value={status} onChange={(e) => setStatus(e.target.value)} aria-label="Filter bookings by status">
          <option value="">All statuses</option>
          {BOOKING_STATUSES.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
        </select>
      </div>
      <DataTable
        columns={[
          { key: 'booking', header: 'Booking', render: (b) => <Link to={`/amenities/bookings/${b.id}`} className="cell-title">{b.booking_no}</Link> },
          { key: 'slot', header: 'Slot', render: (b) => {
            const slot = slotById.get(b.amenity_slot_id);
            return slot ? <><span className="cell-title">{amenityById.get(slot.amenity_id)?.name || 'Amenity'}</span><span className="cell-sub">{formatDateTime(`${String(slot.slot_date).slice(0,10)}T${String(slot.start_time).slice(0,5)}`)}</span></> : <span className="mono">{b.amenity_slot_id}</span>;
          }},
          { key: 'guests', header: 'Guests', render: (b) => b.guests_count },
          { key: 'amount', header: 'Amount', render: (b) => formatMoney(b.amount) },
          { key: 'status', header: 'Status', render: (b) => <BookingStatusBadge status={b.status} /> },
          { key: 'created', header: 'Created', render: (b) => formatDateTime(b.created_at) },
        ]}
        rows={rows}
        loading={bookings.loading || (canReadSlots && slots.loading) || (canReadAmenities && amenities.loading)}
        error={bookings.error || slots.error || amenities.error ? getErrorMessage(bookings.error || slots.error || amenities.error) : ''}
        onRetry={() => { bookings.reload(); slots.reload(); amenities.reload(); }}
        emptyTitle="No bookings found"
        emptyMessage="Create a booking for an available amenity slot."
        emptyAction={status ? <button className="btn btn-secondary" onClick={() => setStatus('')}>Clear filters</button> : null}
      />
      {dialog && (
        <Modal title="New amenity booking" onClose={() => !saving && setDialog(false)} busy={saving}>
          <BookingForm userId={user?.id} amenities={amenities.data || []} onSubmit={create} onCancel={() => setDialog(false)} saving={saving} error={error} />
        </Modal>
      )}
    </PageContainer>
  );
}

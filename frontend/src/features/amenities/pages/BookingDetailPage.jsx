import { useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import useAuth from '../../../app/providers/useAuth';
import useFetch from '../../../utils/useFetch';
import { formatDateTime, formatMoney } from '../../../utils/format';
import { getErrorMessage } from '../../../lib/axios';
import PageContainer from '../../../components/layout/PageContainer';
import Alert from '../../../components/ui/Alert';
import DataTable from '../../../components/tables/DataTable';
import Modal from '../../../components/ui/Modal';
import ConfirmDialog from '../../../components/ui/ConfirmDialog';
import TextField from '../../../components/ui/TextField';
import GuestForm from '../components/GuestForm';
import AmenityTabs from '../components/AmenityTabs';
import { BookingStatusBadge } from '../components/AmenityBadges';
import * as api from '../api/amenities.api';

function ConfirmForm({ onSubmit, onCancel, saving, error }) {
  const [paymentId, setPaymentId] = useState('');
  const submit = (event) => {
    event.preventDefault();
    onSubmit(paymentId.trim() ? { paymentId: paymentId.trim() } : {});
  };
  return (
    <form onSubmit={submit} noValidate>
      {error && <Alert>{error}</Alert>}
      <TextField id="payment-id" label="Payment ID (optional)" value={paymentId} onChange={(e) => setPaymentId(e.target.value)} hint="Phase 7 Payments is not required yet; the backend accepts this as an optional UUID placeholder." />
      <div className="form-actions">
        <button className="btn btn-primary" type="submit" disabled={saving}>{saving ? 'Confirming...' : 'Confirm booking'}</button>
        <button className="btn btn-secondary" type="button" onClick={onCancel} disabled={saving}>Cancel</button>
      </div>
    </form>
  );
}

export default function BookingDetailPage() {
  const { bookingId } = useParams();
  const { hasPermission } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [dialog, setDialog] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState(location.state?.notice || '');
  const [deleteOpen, setDeleteOpen] = useState(false);

  const booking = useFetch(() => api.getBooking(bookingId), [bookingId]);

  const act = async (action, payload) => {
    setSaving(true); setError('');
    try {
      // Every lifecycle API expects the booking UUID as its first argument.
      // Pass the route ID explicitly so the API URL never contains [object Object].
      const result = await action(bookingId, payload);
      booking.reload();
      setDialog(null);
      setNotice(result?.status === 'CONFIRMED' ? 'Booking confirmed.' : 'Booking updated.');
    } catch (err) { setError(getErrorMessage(err)); }
    finally { setSaving(false); }
  };

  const remove = async () => {
    setSaving(true); setError('');
    try {
      await api.deleteBooking(bookingId);
      navigate('/amenities/bookings', { replace: true, state: { notice: 'Booking deleted successfully.' } });
    } catch (err) { setError(getErrorMessage(err)); }
    finally { setSaving(false); setDeleteOpen(false); }
  };

  if (booking.error) return <PageContainer title="Booking"><AmenityTabs /><Alert>{getErrorMessage(booking.error)}</Alert></PageContainer>;
  if (!booking.data) return <PageContainer title="Booking"><AmenityTabs /><div className="table-state">Loading...</div></PageContainer>;

  const b = booking.data;
  const canUpdate = hasPermission('AMENITY_BOOKING_UPDATE');

  return (
    <PageContainer title={b.booking_no} subtitle="Booking details and lifecycle actions.">
      <AmenityTabs />
      <div className="back-link"><Link to="/amenities/bookings">← Back to bookings</Link></div>
      {notice && <Alert variant="success">{notice}</Alert>}
      {error && <Alert>{error}</Alert>}

      <div className="dashboard-grid">
        <section className="card">
          <div className="section-head"><div><h2 className="section-title">Booking</h2><p className="muted">Reservation record returned by the booking API.</p></div><BookingStatusBadge status={b.status} /></div>
          <dl className="details">
            <dt>Booking number</dt><dd className="mono">{b.booking_no}</dd>
            <dt>Slot ID</dt><dd className="mono">{b.amenity_slot_id}</dd>
            <dt>Unit ID</dt><dd className="mono">{b.unit_id}</dd>
            <dt>Booked by</dt><dd className="mono">{b.booked_by}</dd>
            <dt>Guests</dt><dd>{b.guests_count}</dd>
            <dt>Amount</dt><dd>{formatMoney(b.amount)}</dd>
            <dt>Payment ID</dt><dd className="mono">{b.payment_id || '-'}</dd>
            <dt>Created</dt><dd>{formatDateTime(b.created_at)}</dd>
            <dt>Updated</dt><dd>{formatDateTime(b.updated_at)}</dd>
          </dl>
        </section>

        <section className="card">
          <h2 className="section-title">Actions</h2>
          <p className="muted">Actions are shown only when the current user has the corresponding backend permission.</p>
          <div className="assign-row">
            {canUpdate && b.status === 'PENDING_PAYMENT' && <button className="btn btn-primary" onClick={() => { setError(''); setDialog({ type: 'confirm' }); }}>Confirm payment</button>}
            {canUpdate && !['CANCELLED', 'EXPIRED'].includes(b.status) && <button className="btn btn-secondary" onClick={() => act(api.cancelBooking)}>Cancel booking</button>}
            {canUpdate && b.status === 'CONFIRMED' && <button className="btn btn-secondary" onClick={() => act(api.markNoShow)}>Mark no-show</button>}
            {hasPermission('AMENITY_BOOKING_CREATE') && <button className="btn btn-secondary" onClick={() => { setError(''); setDialog({ type: 'guest' }); }}>Add guest</button>}
            {hasPermission('AMENITY_BOOKING_DELETE') && <button className="btn btn-secondary" onClick={() => setDeleteOpen(true)}>Delete</button>}
          </div>
        </section>
      </div>

      <section className="card section">
        <div className="section-head"><div><h2 className="section-title">Guests</h2><p className="muted">Guest records attached to this booking.</p></div></div>
        {(b.guests || []).length ? (
          <DataTable
            columns={[
              { key: 'name', header: 'Name' },
              { key: 'phone', header: 'Phone', render: (g) => g.phone || '-' },
              { key: 'idType', header: 'ID type', render: (g) => g.id_type || '-' },
              { key: 'idNumber', header: 'Masked ID', render: (g) => g.id_number_masked || '-' },
            ]}
            rows={b.guests}
          />
        ) : <div className="empty-state" style={{ margin: 0, padding: '28px 0' }}><h2>No guest records</h2><p>Add guests if the reservation requires them.</p></div>}
      </section>

      {dialog?.type === 'confirm' && <Modal title="Confirm booking" onClose={() => !saving && setDialog(null)} busy={saving}>
        <ConfirmForm onSubmit={(payload) => act(api.confirmBooking, payload)} onCancel={() => setDialog(null)} saving={saving} error={error} />
      </Modal>}
      {dialog?.type === 'guest' && <Modal title="Add guest" onClose={() => !saving && setDialog(null)} busy={saving}>
        <GuestForm onSubmit={(payload) => act((id, data) => api.addGuest(id, data), payload)} onCancel={() => setDialog(null)} saving={saving} error={error} />
      </Modal>}
      <ConfirmDialog open={deleteOpen} title="Delete this booking?" message="This removes the booking record. Use cancellation when you want to keep the booking history." confirmLabel="Delete booking" danger busy={saving} onConfirm={remove} onCancel={() => setDeleteOpen(false)} />
    </PageContainer>
  );
}

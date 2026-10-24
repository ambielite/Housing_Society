import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import useAuth from '../../../app/providers/useAuth';
import useSociety from '../../../app/store/useSociety';
import useFetch from '../../../utils/useFetch';
import { formatDateTime, formatMoney } from '../../../utils/format';
import apiClient, { getErrorMessage } from '../../../lib/axios';
import PageContainer from '../../../components/layout/PageContainer';
import Alert from '../../../components/ui/Alert';
import DataTable from '../../../components/tables/DataTable';
import Modal from '../../../components/ui/Modal';
import ConfirmDialog from '../../../components/ui/ConfirmDialog';
import GuestForm from '../components/GuestForm';
import AmenityTabs from '../components/AmenityTabs';
import { BookingStatusBadge } from '../components/AmenityBadges';
import * as api from '../api/amenities.api';
import unitApi from '../../units/api/unit.api';
import floorApi from '../../floors/api/floor.api';
import towerApi from '../../towers/api/tower.api';

const rowsFrom = (response, key) => {
  const rows = Array.isArray(response) ? response : response?.data || response?.[key] || [];
  return Array.isArray(rows) ? rows : [];
};

function ConfirmForm({ bookingId, amount, onSubmit, onCancel, saving, error, canCreateFinancePayment }) {
  const [paymentId, setPaymentId] = useState('');
  const [payments, setPayments] = useState([]);
  const [loadingPayments, setLoadingPayments] = useState(Number(amount) > 0);
  const [paymentLoadError, setPaymentLoadError] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('CASH');
  const [paymentReference, setPaymentReference] = useState('');
  const [recordingPayment, setRecordingPayment] = useState(false);
  const [recordPaymentError, setRecordPaymentError] = useState('');
  const [recordPaymentNotice, setRecordPaymentNotice] = useState('');

  const loadPayments = async () => {
    setLoadingPayments(true);
    setPaymentLoadError('');
    try {
      const rows = await api.listEligiblePayments(bookingId);
      setPayments(Array.isArray(rows) ? rows : []);
    } catch (err) {
      setPaymentLoadError(getErrorMessage(err));
    } finally {
      setLoadingPayments(false);
    }
  };

  useEffect(() => {
    if (Number(amount) <= 0) return undefined;
    let active = true;
    api.listEligiblePayments(bookingId)
      .then((rows) => { if (active) setPayments(Array.isArray(rows) ? rows : []); })
      .catch((err) => { if (active) setPaymentLoadError(getErrorMessage(err)); })
      .finally(() => { if (active) setLoadingPayments(false); });
    return () => { active = false; };
  }, [bookingId, amount]);

  const recordFinancePayment = async () => {
    setRecordingPayment(true);
    setRecordPaymentError('');
    setRecordPaymentNotice('');
    try {
      const payment = await api.createBookingPayment(bookingId, {
        paymentMethod,
        paymentReference: paymentReference.trim() || undefined,
      });
      const paymentReferenceLabel = payment.paymentReference || payment.payment_reference || 'recorded payment';
      setRecordPaymentNotice(`Finance payment ${paymentReferenceLabel} is ${payment.status}. Verify it in Finance → Payments, then refresh this list.`);
      await loadPayments();
    } catch (err) {
      setRecordPaymentError(getErrorMessage(err));
    } finally {
      setRecordingPayment(false);
    }
  };

  const submit = (event) => {
    event.preventDefault();
    onSubmit(paymentId ? { paymentId } : {});
  };
  const paymentRequired = Number(amount) > 0;

  return (
    <form onSubmit={submit} noValidate>
      {error && <Alert>{error}</Alert>}
      {paymentRequired ? <div className="field">
        <label htmlFor="booking-payment">Verified payment <span className="required">*</span></label>
        <select className="input" id="booking-payment" value={paymentId} onChange={(event) => setPaymentId(event.target.value)} disabled={loadingPayments || !!paymentLoadError || payments.length === 0} required>
          <option value="">{loadingPayments ? 'Loading eligible payments…' : paymentLoadError ? 'Payments could not be loaded' : payments.length ? 'Select a payment' : 'No eligible payments found'}</option>
          {payments.map((payment) => (
            <option key={payment.id} value={payment.id} disabled={!['SUCCESS', 'VERIFIED'].includes(payment.status)}>
              {`${payment.payment_reference} · ${payment.payment_method} · ${formatMoney(payment.amount)} · ${payment.status === 'VERIFICATION_PENDING' ? 'Pending verification in Finance' : payment.status}`}
            </option>
          ))}
        </select>
        <p className="field-hint">Choose a successful or verified payment for this society, unit, and booking amount.</p>
        {paymentLoadError && <Alert>{paymentLoadError}</Alert>}
        {!loadingPayments && !paymentLoadError && payments.some((payment) => payment.status === 'VERIFICATION_PENDING') && <p className="field-hint">A matching payment is waiting for Finance verification. Verify it in Finance, then refresh this list to select it.</p>}
        {!loadingPayments && !paymentLoadError && payments.length === 0 && <p className="field-hint">Record and verify the matching payment in Finance before confirming this booking.</p>}
        {!loadingPayments && payments.length > 0 && <button className="btn btn-secondary" type="button" onClick={loadPayments}>Refresh payments</button>}
        {!loadingPayments && payments.length === 0 && canCreateFinancePayment && <div className="section" style={{ marginTop: 16 }}>
          <h3 className="section-title">Record payment in Finance</h3>
          <p className="muted">This creates the amenity invoice and a pending Finance payment for this booking.</p>
          {recordPaymentError && <Alert>{recordPaymentError}</Alert>}
          {recordPaymentNotice && <Alert variant="success">{recordPaymentNotice}</Alert>}
          <div className="form-grid">
            <div className="field">
              <label htmlFor="booking-payment-method">Payment method</label>
              <select className="input" id="booking-payment-method" value={paymentMethod} onChange={(event) => setPaymentMethod(event.target.value)}>
                <option value="CASH">Cash</option>
                <option value="CHEQUE">Cheque</option>
                <option value="NEFT">NEFT</option>
                <option value="RTGS">RTGS</option>
                <option value="BANK_TRANSFER">Bank transfer</option>
              </select>
            </div>
            <div className="field">
              <label htmlFor="booking-payment-reference">Payment reference (optional)</label>
              <input className="input" id="booking-payment-reference" value={paymentReference} onChange={(event) => setPaymentReference(event.target.value)} maxLength={100} />
            </div>
          </div>
          <button className="btn btn-secondary" type="button" onClick={recordFinancePayment} disabled={recordingPayment}>
            {recordingPayment ? 'Recording…' : 'Record payment in Finance'}
          </button>
        </div>}
        {!loadingPayments && payments.length === 0 && !canCreateFinancePayment && <p className="field-hint">You need Invoice Create and Payment Create permissions to record a payment here.</p>}
      </div> : <p className="muted">This booking has no charge, so no payment record is needed.</p>}
      <div className="form-actions">
        <button className="btn btn-primary" type="submit" disabled={saving || loadingPayments || (!!paymentRequired && !paymentId)}>{saving ? 'Confirming...' : 'Confirm booking'}</button>
        <button className="btn btn-secondary" type="button" onClick={onCancel} disabled={saving}>Cancel</button>
      </div>
    </form>
  );
}

export default function BookingDetailPage() {
  const { bookingId } = useParams();
  const { hasPermission, user } = useAuth();
  const { societyId } = useSociety();
  const navigate = useNavigate();
  const location = useLocation();
  const [dialog, setDialog] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState(location.state?.notice || '');
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [relatedLabels, setRelatedLabels] = useState({ unit: '', bookedBy: '', slot: '' });

  const booking = useFetch(() => api.getBooking(bookingId), [bookingId]);
  const b = booking.data;

  useEffect(() => {
    if (!b || !societyId) return undefined;
    let active = true;
    const config = { headers: { 'x-society-id': societyId } };
    Promise.allSettled([
      unitApi.getAll(config),
      floorApi.getAll(config),
      towerApi.getAll(config),
      apiClient.get('/users', { params: { limit: 100 } }),
      api.listSlots(),
      api.listAmenities({ societyId }),
    ]).then(([unitResult, floorResult, towerResult, userResult, slotResult, amenityResult]) => {
      if (!active) return;
      let unit = '';
      if (unitResult.status === 'fulfilled' && floorResult.status === 'fulfilled' && towerResult.status === 'fulfilled') {
        const units = rowsFrom(unitResult.value, 'units');
        const floors = new Map(rowsFrom(floorResult.value, 'floors').map((item) => [item.id, item]));
        const towers = new Map(rowsFrom(towerResult.value, 'towers').map((item) => [item.id, item]));
        const selectedUnit = units.find((item) => String(item.id) === String(b.unit_id || b.unitId));
        if (selectedUnit) {
          const floor = floors.get(selectedUnit.floorId || selectedUnit.floor_id);
          const tower = towers.get(floor?.towerId || floor?.tower_id);
          unit = `${selectedUnit.unitNumber || selectedUnit.unit_number || selectedUnit.name || 'Unit'}${tower?.name ? ` - ${tower.name}` : ''}`;
        }
      }

      let bookedBy = '';
      if (userResult.status === 'fulfilled') {
        const userData = userResult.value.data?.data;
        const users = rowsFrom(userData, 'users');
        const bookedUser = users.find((item) => String(item.id) === String(b.booked_by || b.bookedBy));
        if (bookedUser) {
          bookedBy = [bookedUser.first_name || bookedUser.firstName, bookedUser.last_name || bookedUser.lastName].filter(Boolean).join(' ')
            || bookedUser.full_name || bookedUser.fullName || bookedUser.name || bookedUser.email || '';
        }
      }
      if (!bookedBy && String(user?.id) === String(b.booked_by || b.bookedBy)) {
        bookedBy = [user?.first_name || user?.firstName, user?.last_name || user?.lastName].filter(Boolean).join(' ')
          || user?.email || '';
      }

      let slot = '';
      if (slotResult.status === 'fulfilled') {
        const slots = rowsFrom(slotResult.value, 'slots');
        const selectedSlot = slots.find((item) => String(item.id) === String(b.amenity_slot_id || b.amenitySlotId));
        if (selectedSlot) {
          const amenities = amenityResult.status === 'fulfilled' ? rowsFrom(amenityResult.value, 'amenities') : [];
          const amenityName = amenities.find((item) => String(item.id) === String(selectedSlot.amenity_id || selectedSlot.amenityId))?.name;
          const date = String(selectedSlot.slot_date || selectedSlot.slotDate || '').slice(0, 10);
          const start = String(selectedSlot.start_time || selectedSlot.startTime || '').slice(0, 5);
          const end = String(selectedSlot.end_time || selectedSlot.endTime || '').slice(0, 5);
          slot = [amenityName, date, start && end ? `${start} - ${end}` : ''].filter(Boolean).join(' · ');
        }
      }
      setRelatedLabels({ unit, bookedBy, slot });
    });
    return () => { active = false; };
  }, [b?.id, b?.unit_id, b?.unitId, b?.booked_by, b?.bookedBy, b?.amenity_slot_id, b?.amenitySlotId, societyId, user]);

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

  const canUpdate = hasPermission('AMENITY_BOOKING_UPDATE');
  const canCreateFinancePayment = hasPermission('INVOICE_CREATE') && hasPermission('PAYMENT_CREATE');

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
            <dt>Slot</dt><dd>{relatedLabels.slot || 'Slot details unavailable'}</dd>
            <dt>Unit</dt><dd>{b.unit_id || b.unitId ? relatedLabels.unit || 'Unit details unavailable' : 'No unit assigned'}</dd>
            <dt>Booked by</dt><dd>{relatedLabels.bookedBy || 'User details unavailable'}</dd>
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
            {hasPermission('AMENITY_BOOKING_CREATE') && <button className="btn btn-secondary" onClick={() => { setError(''); setDialog({ type: 'guest' }); }}><span className="button-plus" aria-hidden="true">+</span> Add guest</button>}
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
        <ConfirmForm bookingId={bookingId} amount={b.amount} onSubmit={(payload) => act(api.confirmBooking, payload)} onCancel={() => setDialog(null)} saving={saving} error={error} canCreateFinancePayment={canCreateFinancePayment} />
      </Modal>}
      {dialog?.type === 'guest' && <Modal title="Add guest" onClose={() => !saving && setDialog(null)} busy={saving}>
        <GuestForm onSubmit={(payload) => act((id, data) => api.addGuest(id, data), payload)} onCancel={() => setDialog(null)} saving={saving} error={error} />
      </Modal>}
      <ConfirmDialog open={deleteOpen} title="Delete this booking?" message="This removes the booking record. Use cancellation when you want to keep the booking history." confirmLabel="Delete booking" danger busy={saving} onConfirm={remove} onCancel={() => setDeleteOpen(false)} />
    </PageContainer>
  );
}

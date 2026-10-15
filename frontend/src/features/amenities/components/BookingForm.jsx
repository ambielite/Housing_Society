import { useEffect, useState } from 'react';
import SelectField from '../../../components/ui/SelectField';
import TextField from '../../../components/ui/TextField';
import UnitSelect from '../../../components/ui/UnitSelect';
import Alert from '../../../components/ui/Alert';
import { DAY_TYPES, MEMBER_TYPES } from './amenityOptions';
import { todayISO } from '../../../utils/format';
import * as api from '../api/amenities.api';

export default function BookingForm({ userId, amenities, onSubmit, onCancel, saving, error }) {
  const [amenityId, setAmenityId] = useState('');
  const [slotDate, setSlotDate] = useState(todayISO());
  const [slotOptions, setSlotOptions] = useState([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [slotError, setSlotError] = useState('');
  const [values, setValues] = useState({
    amenitySlotId: '',
    unitId: '',
    guestsCount: 0,
    memberType: '',
    dayType: '',
  });
  const [guests, setGuests] = useState([]);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (!amenityId || !slotDate) {
      setSlotOptions([]);
      setValues((current) => ({ ...current, amenitySlotId: '' }));
      return;
    }
    let cancelled = false;
    setLoadingSlots(true);
    setSlotError('');
    api.listSlots({ amenityId, slotDate })
      .then((rows) => {
        if (!cancelled) {
          setSlotOptions((rows || []).filter((slot) => slot.status === 'AVAILABLE').map((slot) => ({
            value: slot.id,
            label: `${String(slot.start_time).slice(0, 5)} - ${String(slot.end_time).slice(0, 5)} · Capacity ${slot.capacity} · ₹${Number(slot.price).toFixed(2)}`,
          })));
        }
      })
      .catch((err) => !cancelled && setSlotError(err?.response?.data?.message || 'Could not load slots.'))
      .finally(() => !cancelled && setLoadingSlots(false));
    return () => { cancelled = true; };
  }, [amenityId, slotDate]);

  useEffect(() => {
    const count = Number(values.guestsCount) || 0;
    setGuests((current) => Array.from({ length: count }, (_, index) => current[index] || { name: '', phone: '' }));
  }, [values.guestsCount]);

  const change = (event) => setValues((current) => ({ ...current, [event.target.name]: event.target.value }));

  const changeGuest = (index, field, value) => {
    setGuests((current) => current.map((guest, i) => (i === index ? { ...guest, [field]: value } : guest)));
  };

  const submit = (event) => {
    event.preventDefault();
    const next = {};
    if (!amenityId) next.amenityId = 'Choose an amenity.';
    if (!values.amenitySlotId) next.amenitySlotId = 'Choose an available slot.';
    if (!values.unitId) next.unitId = 'Choose a unit.';
    const count = Number(values.guestsCount);
    if (!Number.isInteger(count) || count < 0) next.guestsCount = 'Guest count cannot be negative.';
    guests.forEach((guest, index) => {
      if (!guest.name.trim()) next[`guest-${index}`] = `Enter guest ${index + 1}'s name or reduce the guest count.`;
    });
    setErrors(next);
    if (Object.keys(next).length) return;

    onSubmit({
      amenitySlotId: values.amenitySlotId,
      unitId: values.unitId,
      bookedBy: userId,
      guestsCount: count,
      memberType: values.memberType || null,
      dayType: values.dayType || null,
      guests: guests.map((guest) => ({ name: guest.name.trim(), phone: guest.phone.trim() || null })),
    });
  };

  return (
    <form onSubmit={submit} noValidate>
      {error && <Alert>{error}</Alert>}
      {slotError && <Alert>{slotError}</Alert>}
      <div className="form-grid">
        <SelectField id="booking-amenity" label="Amenity" placeholder="Choose an amenity" options={amenities.map((a) => ({ value: a.id, label: a.name }))} value={amenityId} onChange={(e) => { setAmenityId(e.target.value); setValues((v) => ({ ...v, amenitySlotId: '' })); }} error={errors.amenityId} />
        <TextField id="booking-date" label="Slot date" type="date" value={slotDate} onChange={(e) => { setSlotDate(e.target.value); setValues((v) => ({ ...v, amenitySlotId: '' })); }} />
      </div>
      <SelectField id="booking-slot" name="amenitySlotId" label="Available slot" placeholder={loadingSlots ? 'Loading slots...' : slotOptions.length ? 'Choose a slot' : 'No available slots'} options={slotOptions} value={values.amenitySlotId} onChange={change} error={errors.amenitySlotId} disabled={loadingSlots || !amenityId} />
      <UnitSelect value={values.unitId} onChange={(unitId) => setValues((v) => ({ ...v, unitId }))} error={errors.unitId} />
      <div className="form-grid">
        <TextField id="booking-guests" name="guestsCount" type="number" min="0" step="1" label="Guest count" value={values.guestsCount} onChange={change} error={errors.guestsCount} />
        <SelectField id="booking-member" name="memberType" label="Member type (optional)" placeholder="Use slot default price" options={MEMBER_TYPES} value={values.memberType} onChange={change} />
      </div>
      <SelectField id="booking-day" name="dayType" label="Day type (optional)" placeholder="Use slot default price" options={DAY_TYPES} value={values.dayType} onChange={change} />
      {guests.length > 0 && (
        <div className="section">
          <h3 className="section-title">Guest details</h3>
          <p className="section-hint muted">Guest records are optional at the API level, but names are collected here so the booking stays easy to manage.</p>
          {guests.map((guest, index) => (
            <div className="form-grid" key={index}>
              <TextField id={`guest-name-${index}`} label={`Guest ${index + 1} name`} value={guest.name} onChange={(e) => changeGuest(index, 'name', e.target.value)} error={errors[`guest-${index}`]} />
              <TextField id={`guest-phone-${index}`} label="Phone (optional)" value={guest.phone} onChange={(e) => changeGuest(index, 'phone', e.target.value)} />
            </div>
          ))}
        </div>
      )}
      <div className="form-actions">
        <button type="submit" className="btn btn-primary" disabled={saving || loadingSlots}>{saving ? 'Booking...' : 'Create booking'}</button>
        <button type="button" className="btn btn-secondary" onClick={onCancel} disabled={saving}>Cancel</button>
      </div>
    </form>
  );
}

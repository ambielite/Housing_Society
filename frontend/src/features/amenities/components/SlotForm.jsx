import { useEffect, useState } from 'react';
import TextField from '../../../components/ui/TextField';
import SelectField from '../../../components/ui/SelectField';
import Alert from '../../../components/ui/Alert';
import { SLOT_STATUSES } from './amenityOptions';
import { todayISO } from '../../../utils/format';

const toAmPm = (time) => {
  if (!time) return '';
  const [hourText, minute] = String(time).slice(0, 5).split(':');
  const hour = Number(hourText);
  return `${String(hour % 12 || 12).padStart(2, '0')}:${minute} ${hour >= 12 ? 'PM' : 'AM'}`;
};

const to24Hour = (value) => {
  const match = /^(\d{1,2}):([0-5]\d)\s*(AM|PM)$/i.exec(value.trim());
  if (!match) return null;
  const hour = Number(match[1]);
  if (hour < 1 || hour > 12) return null;
  const hour24 = (hour % 12) + (match[3].toUpperCase() === 'PM' ? 12 : 0);
  return `${String(hour24).padStart(2, '0')}:${match[2]}`;
};

export default function SlotForm({ slot, amenityOptions, defaultAmenityId = '', onSubmit, onCancel, saving, error }) {
  const isEdit = Boolean(slot);
  const [values, setValues] = useState({
    amenityId: slot?.amenity_id || defaultAmenityId,
    dateFrom: slot?.slot_date ? String(slot.slot_date).slice(0, 10) : todayISO(),
    dateTill: slot?.slot_date ? String(slot.slot_date).slice(0, 10) : todayISO(),
    startTime: slot?.start_time ? toAmPm(slot.start_time) : '06:00 PM',
    endTime: slot?.end_time ? toAmPm(slot.end_time) : '08:00 PM',
    capacity: slot?.capacity ?? '',
    price: slot?.price ?? '',
    status: slot?.status || 'AVAILABLE',
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    setValues({
      amenityId: slot?.amenity_id || defaultAmenityId,
      dateFrom: slot?.slot_date ? String(slot.slot_date).slice(0, 10) : todayISO(),
      dateTill: slot?.slot_date ? String(slot.slot_date).slice(0, 10) : todayISO(),
      startTime: slot?.start_time ? toAmPm(slot.start_time) : '06:00 PM',
      endTime: slot?.end_time ? toAmPm(slot.end_time) : '08:00 PM',
      capacity: slot?.capacity ?? '',
      price: slot?.price ?? '',
      status: slot?.status || 'AVAILABLE',
    });
    setErrors({});
  }, [slot, defaultAmenityId]);

  const change = (event) => setValues((current) => ({ ...current, [event.target.name]: event.target.value }));

  const submit = (event) => {
    event.preventDefault();
    const next = {};
    if (!values.amenityId) next.amenityId = 'Choose an amenity.';
    if (!values.dateFrom) next.dateFrom = 'Choose a start date.';
    if (!isEdit && !values.dateTill) next.dateTill = 'Choose an end date.';
    if (values.dateFrom && values.dateTill && values.dateTill < values.dateFrom) next.dateTill = 'End date must be on or after the start date.';
    const startTime24 = to24Hour(values.startTime);
    const endTime24 = to24Hour(values.endTime);
    if (!startTime24) next.startTime = 'Enter a time like 06:30 PM.';
    if (!endTime24) next.endTime = 'Enter a time like 08:00 PM.';
    if (startTime24 && endTime24 && endTime24 <= startTime24) next.endTime = 'End time must be after start time.';
    if (!values.capacity || !Number.isInteger(Number(values.capacity)) || Number(values.capacity) <= 0) next.capacity = 'Capacity must be a positive whole number.';
    if (values.price === '' || Number.isNaN(Number(values.price)) || Number(values.price) < 0) next.price = 'Enter a price of 0 or more.';
    setErrors(next);
    if (Object.keys(next).length) return;

    if (isEdit) {
      const payload = {};
      if (startTime24 !== String(slot.start_time).slice(0, 5)) payload.startTime = startTime24;
      if (endTime24 !== String(slot.end_time).slice(0, 5)) payload.endTime = endTime24;
      if (Number(values.capacity) !== Number(slot.capacity)) payload.capacity = Number(values.capacity);
      if (Number(values.price) !== Number(slot.price)) payload.price = Number(values.price);
      if (values.status !== slot.status) payload.status = values.status;
      if (!Object.keys(payload).length) return onSubmit({});
      onSubmit(payload);
      return;
    }

    onSubmit({
      amenityId: values.amenityId,
      dateFrom: values.dateFrom,
      dateTill: values.dateTill,
      startTime: startTime24,
      endTime: endTime24,
      capacity: Number(values.capacity),
      price: Number(values.price),
    });
  };

  return (
    <form onSubmit={submit} noValidate>
      {error && <Alert>{error}</Alert>}
      {isEdit ? (
        <p className="field-hint slot-area-note">Amenity: {amenityOptions.find((item) => item.value === values.amenityId)?.label || 'Unknown'}</p>
      ) : (
        <SelectField id="slot-amenity" name="amenityId" label="Amenity" placeholder="Choose an amenity" options={amenityOptions} value={values.amenityId} onChange={change} error={errors.amenityId} />
      )}
      {!isEdit && <div className="form-grid">
        <TextField id="slot-date-from" name="dateFrom" type="date" label="Active from" value={values.dateFrom} onChange={change} error={errors.dateFrom} />
        <TextField id="slot-date-till" name="dateTill" type="date" label="Active through" value={values.dateTill} min={values.dateFrom} onChange={change} error={errors.dateTill} />
      </div>}
      <div className="form-grid">
        <TextField id="slot-start" name="startTime" label="Start time (AM/PM)" placeholder="06:00 PM" value={values.startTime} onChange={change} error={errors.startTime} />
        <TextField id="slot-end" name="endTime" label="End time (AM/PM)" placeholder="08:00 PM" value={values.endTime} onChange={change} error={errors.endTime} />
      </div>
      {!isEdit && <p className="field-hint slot-area-note">A bookable slot will be created for each date, including the final date.</p>}
      <div className="form-grid">
        <TextField id="slot-capacity" name="capacity" type="number" min="1" step="1" label="Capacity" value={values.capacity} onChange={change} error={errors.capacity} />
        <TextField id="slot-price" name="price" type="number" min="0" step="0.01" label="Default price (INR)" value={values.price} onChange={change} error={errors.price} />
      </div>
      {isEdit && <SelectField id="slot-status" name="status" label="Status" options={SLOT_STATUSES} value={values.status} onChange={change} />}
      <div className="form-actions">
        <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Saving...' : isEdit ? 'Save changes' : 'Create slot'}</button>
        <button type="button" className="btn btn-secondary" onClick={onCancel} disabled={saving}>Cancel</button>
      </div>
    </form>
  );
}

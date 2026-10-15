import { useEffect, useState } from 'react';
import TextField from '../../../components/ui/TextField';
import SelectField from '../../../components/ui/SelectField';
import Alert from '../../../components/ui/Alert';
import { SLOT_STATUSES } from './amenityOptions';
import { todayISO } from '../../../utils/format';

export default function SlotForm({ slot, amenityOptions, defaultAmenityId = '', onSubmit, onCancel, saving, error }) {
  const isEdit = Boolean(slot);
  const [values, setValues] = useState({
    amenityId: slot?.amenity_id || defaultAmenityId,
    slotDate: slot?.slot_date ? String(slot.slot_date).slice(0, 10) : todayISO(),
    startTime: slot?.start_time ? String(slot.start_time).slice(0, 5) : '18:00',
    endTime: slot?.end_time ? String(slot.end_time).slice(0, 5) : '20:00',
    capacity: slot?.capacity ?? '',
    price: slot?.price ?? '',
    status: slot?.status || 'AVAILABLE',
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    setValues({
      amenityId: slot?.amenity_id || defaultAmenityId,
      slotDate: slot?.slot_date ? String(slot.slot_date).slice(0, 10) : todayISO(),
      startTime: slot?.start_time ? String(slot.start_time).slice(0, 5) : '18:00',
      endTime: slot?.end_time ? String(slot.end_time).slice(0, 5) : '20:00',
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
    if (!values.slotDate) next.slotDate = 'Choose a date.';
    if (!values.startTime) next.startTime = 'Enter a start time.';
    if (!values.endTime) next.endTime = 'Enter an end time.';
    if (values.startTime && values.endTime && values.endTime <= values.startTime) next.endTime = 'End time must be after start time.';
    if (!values.capacity || !Number.isInteger(Number(values.capacity)) || Number(values.capacity) <= 0) next.capacity = 'Capacity must be a positive whole number.';
    if (values.price === '' || Number.isNaN(Number(values.price)) || Number(values.price) < 0) next.price = 'Enter a price of 0 or more.';
    setErrors(next);
    if (Object.keys(next).length) return;

    if (isEdit) {
      const payload = {};
      if (values.startTime !== String(slot.start_time).slice(0, 5)) payload.startTime = values.startTime;
      if (values.endTime !== String(slot.end_time).slice(0, 5)) payload.endTime = values.endTime;
      if (Number(values.capacity) !== Number(slot.capacity)) payload.capacity = Number(values.capacity);
      if (Number(values.price) !== Number(slot.price)) payload.price = Number(values.price);
      if (values.status !== slot.status) payload.status = values.status;
      if (!Object.keys(payload).length) return onSubmit({});
      onSubmit(payload);
      return;
    }

    onSubmit({
      amenityId: values.amenityId,
      slotDate: values.slotDate,
      startTime: values.startTime,
      endTime: values.endTime,
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
      {!isEdit && <TextField id="slot-date" name="slotDate" type="date" label="Date" value={values.slotDate} onChange={change} error={errors.slotDate} />}
      <div className="form-grid">
        <TextField id="slot-start" name="startTime" type="time" label="Start time" value={values.startTime} onChange={change} error={errors.startTime} />
        <TextField id="slot-end" name="endTime" type="time" label="End time" value={values.endTime} onChange={change} error={errors.endTime} />
      </div>
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

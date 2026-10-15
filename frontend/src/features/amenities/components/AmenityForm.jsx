import { useEffect, useState } from 'react';
import TextField from '../../../components/ui/TextField';
import SelectField from '../../../components/ui/SelectField';
import Alert from '../../../components/ui/Alert';
import { AMENITY_TYPES, AMENITY_STATUSES } from './amenityOptions';

export default function AmenityForm({ amenity, onSubmit, onCancel, saving, error }) {
  const isEdit = Boolean(amenity);
  const [values, setValues] = useState({
    name: amenity?.name || '',
    amenityType: amenity?.amenity_type || '',
    capacity: amenity?.capacity ?? '',
    location: amenity?.location || '',
    bookingRequired: amenity?.booking_required ?? true,
    status: amenity?.status || 'ACTIVE',
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    setValues({
      name: amenity?.name || '',
      amenityType: amenity?.amenity_type || '',
      capacity: amenity?.capacity ?? '',
      location: amenity?.location || '',
      bookingRequired: amenity?.booking_required ?? true,
      status: amenity?.status || 'ACTIVE',
    });
    setErrors({});
  }, [amenity]);

  const change = (event) => {
    const { name, value, type, checked } = event.target;
    setValues((current) => ({ ...current, [name]: type === 'checkbox' ? checked : value }));
  };

  const submit = (event) => {
    event.preventDefault();
    const next = {};
    if (!values.name.trim()) next.name = 'Enter an amenity name.';
    if (!values.amenityType) next.amenityType = 'Choose an amenity type.';
    if (values.capacity !== '' && (!Number.isInteger(Number(values.capacity)) || Number(values.capacity) <= 0)) {
      next.capacity = 'Capacity must be a positive whole number.';
    }
    setErrors(next);
    if (Object.keys(next).length) return;

    const payload = {
      name: values.name.trim(),
      amenityType: values.amenityType,
      capacity: values.capacity === '' ? null : Number(values.capacity),
      location: values.location.trim() || null,
      bookingRequired: Boolean(values.bookingRequired),
    };
    if (isEdit) payload.status = values.status;
    onSubmit(payload);
  };

  return (
    <form onSubmit={submit} noValidate>
      {error && <Alert>{error}</Alert>}
      <TextField id="amenity-name" name="name" label="Name" placeholder="e.g. Clubhouse Party Hall" value={values.name} onChange={change} error={errors.name} />
      <SelectField id="amenity-type" name="amenityType" label="Amenity type" placeholder="Choose type" options={AMENITY_TYPES} value={values.amenityType} onChange={change} error={errors.amenityType} />
      <div className="form-grid">
        <TextField id="amenity-capacity" name="capacity" type="number" min="1" step="1" label="Capacity (optional)" value={values.capacity} onChange={change} error={errors.capacity} />
        <TextField id="amenity-location" name="location" label="Location (optional)" value={values.location} onChange={change} />
      </div>
      {isEdit && (
        <SelectField id="amenity-status" name="status" label="Status" options={AMENITY_STATUSES} value={values.status} onChange={change} />
      )}
      <label className="checkbox-field">
        <input type="checkbox" name="bookingRequired" checked={values.bookingRequired} onChange={change} />
        <span>Booking required for this amenity</span>
      </label>
      <div className="form-actions">
        <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Saving...' : isEdit ? 'Save changes' : 'Create amenity'}</button>
        <button type="button" className="btn btn-secondary" onClick={onCancel} disabled={saving}>Cancel</button>
      </div>
    </form>
  );
}

import { useState } from 'react';
import TextField from '../../../components/ui/TextField';
import SelectField from '../../../components/ui/SelectField';
import Alert from '../../../components/ui/Alert';
import { PARKING_TYPES } from './parkingOptions';

/** Create: name, type, zone. Edit: also status; sends only what changed. */
export default function AreaForm({ mode, area, onSubmit, onCancel, saving, error }) {
  const isEdit = mode === 'edit';
  const [values, setValues] = useState({
    name: area?.name || '',
    parkingType: area?.parking_type || '',
    zone: area?.zone || '',
    status: area?.status || 'ACTIVE',
  });
  const [errors, setErrors] = useState({});
  const [note, setNote] = useState('');

  const onChange = (event) => {
    setNote('');
    setValues((v) => ({ ...v, [event.target.name]: event.target.value }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    const next = {};
    if (!values.name.trim()) next.name = 'Enter a name for this area.';
    else if (values.name.trim().length > 150) next.name = 'Use 150 characters or fewer.';
    if (!values.parkingType) next.parkingType = 'Choose a parking type.';
    if (values.zone.trim().length > 100) next.zone = 'Use 100 characters or fewer.';
    setErrors(next);
    if (Object.keys(next).length) return;

    const current = { name: values.name.trim(), parkingType: values.parkingType, zone: values.zone.trim() };

    if (isEdit) {
      const changes = {};
      if (current.name !== area.name) changes.name = current.name;
      if (current.parkingType !== area.parking_type) changes.parkingType = current.parkingType;
      if (current.zone !== (area.zone || '')) changes.zone = current.zone;
      if (values.status !== area.status) changes.status = values.status;
      if (!Object.keys(changes).length) {
        setNote("You haven't changed anything yet.");
        return;
      }
      onSubmit(changes);
      return;
    }

    const payload = { name: current.name, parkingType: current.parkingType };
    if (current.zone) payload.zone = current.zone;
    onSubmit(payload);
  };

  return (
    <form onSubmit={handleSubmit} noValidate>
      {error && <Alert>{error}</Alert>}
      {note && <Alert variant="success">{note}</Alert>}
      <TextField id="name" name="name" label="Area name" placeholder="e.g. Basement 1" value={values.name} onChange={onChange} error={errors.name} />
      <SelectField
        id="parkingType"
        name="parkingType"
        label="Parking type"
        placeholder="Choose a type"
        options={PARKING_TYPES}
        value={values.parkingType}
        onChange={onChange}
        error={errors.parkingType}
      />
      <TextField id="zone" name="zone" label="Zone (optional)" placeholder="e.g. B1" value={values.zone} onChange={onChange} error={errors.zone} />
      {isEdit && (
        <SelectField
          id="status"
          name="status"
          label="Status"
          options={[{ value: 'ACTIVE', label: 'Active' }, { value: 'INACTIVE', label: 'Inactive' }]}
          value={values.status}
          onChange={onChange}
        />
      )}
      <div className="form-actions">
        <button type="submit" className="btn btn-primary" disabled={saving}>
          {saving ? 'Saving...' : isEdit ? 'Save changes' : 'Create area'}
        </button>
        <button type="button" className="btn btn-secondary" onClick={onCancel} disabled={saving}>
          Cancel
        </button>
      </div>
    </form>
  );
}

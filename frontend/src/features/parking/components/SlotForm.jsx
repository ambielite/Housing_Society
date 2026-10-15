import { useState } from 'react';
import TextField from '../../../components/ui/TextField';
import SelectField from '../../../components/ui/SelectField';
import Alert from '../../../components/ui/Alert';
import { SLOT_TYPES, VEHICLE_TYPES } from './parkingOptions';

/**
 * Create: area, code, slot type, vehicle type.
 * Edit:   code, types, status (the area cannot be changed). Sends only what changed.
 */
export default function SlotForm({ mode, slot, areaOptions, defaultAreaId = '', onSubmit, onCancel, saving, error }) {
  const isEdit = mode === 'edit';
  const [values, setValues] = useState({
    parkingAreaId: slot?.parking_area_id || defaultAreaId,
    slotCode: slot?.slot_code || '',
    slotType: slot?.slot_type || '',
    vehicleType: slot?.vehicle_type || '',
    status: slot?.status || 'ACTIVE',
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
    if (!isEdit && !values.parkingAreaId) next.parkingAreaId = 'Choose a parking area.';
    if (!values.slotCode.trim()) next.slotCode = 'Enter a slot code.';
    else if (values.slotCode.trim().length > 50) next.slotCode = 'Use 50 characters or fewer.';
    if (!values.slotType) next.slotType = 'Choose a slot type.';
    if (!values.vehicleType) next.vehicleType = 'Choose a vehicle type.';
    setErrors(next);
    if (Object.keys(next).length) return;

    const code = values.slotCode.trim();

    if (isEdit) {
      const changes = {};
      if (code !== slot.slot_code) changes.slotCode = code;
      if (values.slotType !== slot.slot_type) changes.slotType = values.slotType;
      if (values.vehicleType !== slot.vehicle_type) changes.vehicleType = values.vehicleType;
      if (values.status !== slot.status) changes.status = values.status;
      if (!Object.keys(changes).length) {
        setNote("You haven't changed anything yet.");
        return;
      }
      onSubmit(changes);
      return;
    }

    onSubmit({ parkingAreaId: values.parkingAreaId, slotCode: code, slotType: values.slotType, vehicleType: values.vehicleType });
  };

  const areaName = areaOptions.find((a) => a.value === values.parkingAreaId)?.label;

  return (
    <form onSubmit={handleSubmit} noValidate>
      {error && <Alert>{error}</Alert>}
      {note && <Alert variant="success">{note}</Alert>}
      {isEdit ? (
        <p className="field-hint slot-area-note">Area: {areaName || 'Unknown'} (can't be changed)</p>
      ) : (
        <SelectField
          id="parkingAreaId"
          name="parkingAreaId"
          label="Parking area"
          placeholder="Choose an area"
          options={areaOptions}
          value={values.parkingAreaId}
          onChange={onChange}
          error={errors.parkingAreaId}
        />
      )}
      <TextField
        id="slotCode"
        name="slotCode"
        label="Slot code"
        placeholder="e.g. B1-045"
        hint="Must be unique within the area."
        value={values.slotCode}
        onChange={onChange}
        error={errors.slotCode}
      />
      <div className="form-grid">
        <SelectField id="slotType" name="slotType" label="Slot type" placeholder="Choose" options={SLOT_TYPES} value={values.slotType} onChange={onChange} error={errors.slotType} />
        <SelectField id="vehicleType" name="vehicleType" label="Vehicle type" placeholder="Choose" options={VEHICLE_TYPES} value={values.vehicleType} onChange={onChange} error={errors.vehicleType} />
      </div>
      {isEdit && (
        <SelectField
          id="status"
          name="status"
          label="Status"
          options={[{ value: 'ACTIVE', label: 'Active' }, { value: 'INACTIVE', label: 'Inactive' }]}
          value={values.status}
          onChange={onChange}
          hint="An inactive slot can't be allocated."
        />
      )}
      <div className="form-actions">
        <button type="submit" className="btn btn-primary" disabled={saving}>
          {saving ? 'Saving...' : isEdit ? 'Save changes' : 'Create slot'}
        </button>
        <button type="button" className="btn btn-secondary" onClick={onCancel} disabled={saving}>
          Cancel
        </button>
      </div>
    </form>
  );
}

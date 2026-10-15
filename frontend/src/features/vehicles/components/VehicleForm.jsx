import { useState } from 'react';
import { Link } from 'react-router-dom';
import TextField from '../../../components/ui/TextField';
import SelectField from '../../../components/ui/SelectField';
import UnitSelect from '../../../components/ui/UnitSelect';
import Alert from '../../../components/ui/Alert';
import { isUuid } from '../../../utils/validators';
import { VEHICLE_TYPES } from './vehicleOptions';

const normalizeReg = (text) => text.toUpperCase().replace(/\s+/g, ' ').trim();

/**
 * Create: registration number, type, unit, make, model, colour.
 * Edit:   unit, make, model, colour (registration number and type can't change). Sends only what changed.
 */
export default function VehicleForm({ mode, vehicle, onSubmit, cancelTo, saving, error }) {
  const isEdit = mode === 'edit';
  const [values, setValues] = useState({
    registrationNo: vehicle?.registration_no || '',
    vehicleType: vehicle?.vehicle_type || '',
    unitId: vehicle?.unit_id || '',
    make: vehicle?.make || '',
    model: vehicle?.model || '',
    color: vehicle?.color || '',
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
    const reg = normalizeReg(values.registrationNo);

    if (!isEdit) {
      if (!reg) next.registrationNo = 'Enter the registration number.';
      else if (reg.length > 20) next.registrationNo = 'Use 20 characters or fewer.';
      else if (!/^[A-Z0-9][A-Z0-9 -]*$/.test(reg)) next.registrationNo = 'Use letters, numbers, spaces and hyphens only.';
      if (!values.vehicleType) next.vehicleType = 'Choose a vehicle type.';
    }
    if (values.unitId.trim() && !isUuid(values.unitId)) next.unitId = "That doesn't look like a valid unit ID.";
    if (isEdit && vehicle.unit_id && !values.unitId.trim()) next.unitId = 'A unit can be changed but not removed.';
    if (values.make.trim().length > 100) next.make = 'Use 100 characters or fewer.';
    if (values.model.trim().length > 100) next.model = 'Use 100 characters or fewer.';
    if (values.color.trim().length > 50) next.color = 'Use 50 characters or fewer.';
    setErrors(next);
    if (Object.keys(next).length) return;

    const current = { make: values.make.trim(), model: values.model.trim(), color: values.color.trim(), unitId: values.unitId.trim() };

    if (isEdit) {
      const changes = {};
      if (current.make !== (vehicle.make || '')) changes.make = current.make;
      if (current.model !== (vehicle.model || '')) changes.model = current.model;
      if (current.color !== (vehicle.color || '')) changes.color = current.color;
      if (current.unitId && current.unitId !== (vehicle.unit_id || '')) changes.unitId = current.unitId;
      if (!Object.keys(changes).length) {
        setNote("You haven't changed anything yet.");
        return;
      }
      onSubmit(changes);
      return;
    }

    const payload = { registrationNo: reg, vehicleType: values.vehicleType };
    if (current.make) payload.make = current.make;
    if (current.model) payload.model = current.model;
    if (current.color) payload.color = current.color;
    if (current.unitId) payload.unitId = current.unitId;
    onSubmit(payload);
  };

  return (
    <form className="card form-wide" onSubmit={handleSubmit} noValidate>
      {error && <Alert>{error}</Alert>}
      {note && <Alert variant="success">{note}</Alert>}

      <div className="form-grid">
        <TextField
          id="registrationNo"
          name="registrationNo"
          label="Registration number"
          placeholder="e.g. MH12AB1234"
          value={values.registrationNo}
          onChange={onChange}
          error={errors.registrationNo}
          disabled={isEdit}
          hint={isEdit ? "The registration number can't be changed." : undefined}
        />
        <SelectField
          id="vehicleType"
          name="vehicleType"
          label="Vehicle type"
          placeholder="Choose a type"
          options={VEHICLE_TYPES}
          value={values.vehicleType}
          onChange={onChange}
          error={errors.vehicleType}
          disabled={isEdit}
        />
        <TextField id="make" name="make" label="Make (optional)" placeholder="e.g. Honda" value={values.make} onChange={onChange} error={errors.make} />
        <TextField id="model" name="model" label="Model (optional)" placeholder="e.g. City" value={values.model} onChange={onChange} error={errors.model} />
        <TextField id="color" name="color" label="Colour (optional)" placeholder="e.g. White" value={values.color} onChange={onChange} error={errors.color} />
        <UnitSelect label="Unit (optional)" value={values.unitId} onChange={(unitId) => setValues((v) => ({ ...v, unitId }))} error={errors.unitId} />
      </div>

      <div className="form-actions">
        <button type="submit" className="btn btn-primary" disabled={saving}>
          {saving ? 'Saving...' : isEdit ? 'Save changes' : 'Register vehicle'}
        </button>
        <Link to={cancelTo} className="btn btn-secondary">
          Cancel
        </Link>
      </div>
    </form>
  );
}

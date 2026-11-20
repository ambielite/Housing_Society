import { useState } from 'react';
import { Link } from 'react-router-dom';
import TextField from '../../../components/ui/TextField';
import SelectField from '../../../components/ui/SelectField';
import UnitSelect from '../../../components/ui/UnitSelect';
import Alert from '../../../components/ui/Alert';
import { isUuid } from '../../../utils/validators';
import { VEHICLE_TYPES } from './vehicleOptions';

const normalizeReg = (text) => text.trim().toUpperCase().replace(/[\s-]+/g, '');
const registrationPattern = /^[A-Z]{2}\d{1,4}[A-Z]{1,3}\d{1,4}$/;
const registrationPrefixPattern = /^[A-Z]{0,2}(?:\d{0,4}(?:[A-Z]{0,3}(?:\d{0,4})?)?)?$/;
const invalidRegistrationMessage = 'Vehicle number is not correct. Check its format and try again.';

/**
 * Create: registration number, type, unit, make, model, colour.
 * Edit:   unit, make, model, colour (registration number and type can't change). Sends only what changed.
 */
export default function VehicleForm({ mode, vehicle, onSubmit, cancelTo, onCancel, saving, error }) {
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
  const [invalidRegistrationAttempt, setInvalidRegistrationAttempt] = useState(false);

  const onChange = (event) => {
    setNote('');
    const { name } = event.target;
    const value = name === 'registrationNo' ? event.target.value.toUpperCase() : event.target.value;
    if (name === 'registrationNo') {
      if (!registrationPrefixPattern.test(normalizeReg(value))) {
        setInvalidRegistrationAttempt(true);
        setErrors((current) => ({ ...current, registrationNo: invalidRegistrationMessage }));
        return;
      }
      setInvalidRegistrationAttempt(false);
    }
    setErrors((current) => {
      const remaining = { ...current };
      delete remaining[name];
      return remaining;
    });
    setValues((current) => ({ ...current, [name]: value }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    const next = {};
    const reg = normalizeReg(values.registrationNo);

    if (!isEdit) {
      if (invalidRegistrationAttempt) next.registrationNo = invalidRegistrationMessage;
      else if (!reg) next.registrationNo = 'Enter the registration number.';
      else if (reg.length < 5) next.registrationNo = 'The registration number is too short to be valid.';
      else if (reg.length > 13) next.registrationNo = 'The registration number is too long to be valid.';
      else if (!registrationPattern.test(reg)) {
        next.registrationNo = 'Use the format MH12AB1234: state, RTO, series, then number.';
      } else if (/^0+$/.test(reg.match(/\d+$/)?.[0] || '')) {
        next.registrationNo = 'The final registration number cannot be all zeros.';
      }
      if (!values.vehicleType) next.vehicleType = 'Choose a vehicle type.';
    }
    if (!values.unitId.trim()) next.unitId = 'Choose a unit for this vehicle.';
    else if (!isUuid(values.unitId)) next.unitId = "That doesn't look like a valid unit ID.";
    if (!values.make.trim()) next.make = 'Enter the vehicle make.';
    else if (values.make.trim().length > 100) next.make = 'Use 100 characters or fewer.';
    if (values.model.trim().length > 100) next.model = 'Use 100 characters or fewer.';
    if (!values.color.trim()) next.color = 'Enter the vehicle colour.';
    else if (values.color.trim().length > 50) next.color = 'Use 50 characters or fewer.';
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

    const payload = {
      registrationNo: reg,
      vehicleType: values.vehicleType,
      make: current.make,
      color: current.color,
      unitId: current.unitId,
    };
    if (current.model) payload.model = current.model;
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
          maxLength={20}
          value={values.registrationNo}
          onChange={onChange}
          error={errors.registrationNo}
          disabled={isEdit}
          hint={isEdit
            ? "The registration number can't be changed."
            : 'Spaces and hyphens are accepted and removed when saved.'}
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
        <TextField id="make" name="make" label="Make" placeholder="e.g. Honda" value={values.make} onChange={onChange} error={errors.make} />
        <TextField id="model" name="model" label="Model (optional)" placeholder="e.g. City" value={values.model} onChange={onChange} error={errors.model} />
        <TextField id="color" name="color" label="Colour" placeholder="e.g. White" value={values.color} onChange={onChange} error={errors.color} />
        <UnitSelect
          label="Unit"
          value={values.unitId}
          onChange={(unitId) => {
            setValues((current) => ({ ...current, unitId }));
            setErrors((current) => {
              const remaining = { ...current };
              delete remaining.unitId;
              return remaining;
            });
          }}
          error={errors.unitId}
        />
      </div>

      <div className="form-actions">
        <button type="submit" className="btn btn-primary" disabled={saving}>
          {saving ? 'Saving...' : isEdit ? 'Save changes' : 'Register vehicle'}
        </button>
        {onCancel ? (
          <button type="button" className="btn btn-secondary" onClick={onCancel} disabled={saving}>Cancel</button>
        ) : (
          <Link to={cancelTo} className="btn btn-secondary">Cancel</Link>
        )}
      </div>
    </form>
  );
}

import { useState } from 'react';
import SelectField from '../../../components/ui/SelectField';
import Alert from '../../../components/ui/Alert';

/** vehicleOptions / visitorOptions / slotOptions: [{ value, label }]. */
export default function LogEntryForm({ vehicleOptions, visitorOptions, slotOptions, onSubmit, onCancel, saving, error }) {
  const [who, setWho] = useState('resident'); // 'resident' | 'visitor'
  const [values, setValues] = useState({ vehicleId: '', visitorId: '', slotId: '' });
  const [errors, setErrors] = useState({});
  const availableSlotOptions = who === 'visitor'
    ? slotOptions.filter((slot) => slot.slotType === 'VISITOR')
    : slotOptions.filter((slot) => slot.slotType !== 'VISITOR');

  const onChange = (event) => setValues((v) => ({ ...v, [event.target.name]: event.target.value }));
  const changeWho = (nextWho) => {
    setWho(nextWho);
    setValues((current) => ({ ...current, slotId: '' }));
    setErrors({});
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    const next = {};
    if (who === 'resident' && !values.vehicleId) next.vehicleId = 'Choose a resident vehicle.';
    if (who === 'visitor' && !values.visitorId) next.visitorId = 'Choose a visitor.';
    if (!values.slotId) next.slotId = 'Choose a slot.';
    setErrors(next);
    if (Object.keys(next).length) return;

    onSubmit({
      slotId: values.slotId,
      ...(who === 'resident' ? { vehicleId: values.vehicleId } : { visitorId: values.visitorId.trim() }),
    });
  };

  return (
    <form onSubmit={handleSubmit} noValidate>
      {error && <Alert>{error}</Alert>}

      <fieldset className="choice-group">
        <legend>Who is entering?</legend>
        <label>
          <input type="radio" name="who" checked={who === 'resident'} onChange={() => changeWho('resident')} /> Resident
        </label>
        <label>
          <input type="radio" name="who" checked={who === 'visitor'} onChange={() => changeWho('visitor')} /> Visitor
        </label>
      </fieldset>

      {who === 'resident' ? (
        <SelectField
          id="vehicleId"
          name="vehicleId"
          label="Resident vehicle"
          placeholder={vehicleOptions.length ? 'Choose a vehicle' : 'No active vehicles found'}
          options={vehicleOptions}
          value={values.vehicleId}
          onChange={onChange}
          error={errors.vehicleId}
        />
      ) : (
        <SelectField
          id="visitorId"
          name="visitorId"
          label="Visitor"
          placeholder={visitorOptions.length ? 'Choose a visitor' : 'No visitors or active invites found'}
          options={visitorOptions}
          value={values.visitorId}
          onChange={onChange}
          error={errors.visitorId}
        />
      )}

      <SelectField
        id="slotId"
        name="slotId"
        label="Parking slot"
        placeholder={availableSlotOptions.length ? 'Choose a free slot' : who === 'visitor' ? 'No free visitor slots available' : 'No free resident slots available'}
        options={availableSlotOptions}
        value={values.slotId}
        onChange={onChange}
        error={errors.slotId}
      />

      <div className="form-actions">
        <button type="submit" className="btn btn-primary" disabled={saving}>
          {saving ? 'Saving...' : 'Log entry'}
        </button>
        <button type="button" className="btn btn-secondary" onClick={onCancel} disabled={saving}>
          Cancel
        </button>
      </div>
    </form>
  );
}

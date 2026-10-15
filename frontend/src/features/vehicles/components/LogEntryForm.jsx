import { useState } from 'react';
import TextField from '../../../components/ui/TextField';
import SelectField from '../../../components/ui/SelectField';
import Alert from '../../../components/ui/Alert';
import { isUuid } from '../../../utils/validators';

/** vehicleOptions / slotOptions: [{ value, label }]. Visitors are entered by ID until the visitors screens exist. */
export default function LogEntryForm({ vehicleOptions, slotOptions, onSubmit, onCancel, saving, error }) {
  const [who, setWho] = useState('vehicle'); // 'vehicle' | 'visitor'
  const [values, setValues] = useState({ vehicleId: '', visitorId: '', slotId: '' });
  const [errors, setErrors] = useState({});

  const onChange = (event) => setValues((v) => ({ ...v, [event.target.name]: event.target.value }));

  const handleSubmit = (event) => {
    event.preventDefault();
    const next = {};
    if (who === 'vehicle' && !values.vehicleId) next.vehicleId = 'Choose a vehicle.';
    if (who === 'visitor') {
      if (!values.visitorId.trim()) next.visitorId = 'Enter the visitor ID.';
      else if (!isUuid(values.visitorId)) next.visitorId = "That doesn't look like a valid visitor ID.";
    }
    if (!values.slotId) next.slotId = 'Choose a slot.';
    setErrors(next);
    if (Object.keys(next).length) return;

    onSubmit({
      slotId: values.slotId,
      ...(who === 'vehicle' ? { vehicleId: values.vehicleId } : { visitorId: values.visitorId.trim() }),
    });
  };

  return (
    <form onSubmit={handleSubmit} noValidate>
      {error && <Alert>{error}</Alert>}

      <fieldset className="choice-group">
        <legend>Who is entering?</legend>
        <label>
          <input type="radio" name="who" checked={who === 'vehicle'} onChange={() => setWho('vehicle')} /> Registered vehicle
        </label>
        <label>
          <input type="radio" name="who" checked={who === 'visitor'} onChange={() => setWho('visitor')} /> Visitor
        </label>
      </fieldset>

      {who === 'vehicle' ? (
        <SelectField
          id="vehicleId"
          name="vehicleId"
          label="Vehicle"
          placeholder={vehicleOptions.length ? 'Choose a vehicle' : 'No active vehicles found'}
          options={vehicleOptions}
          value={values.vehicleId}
          onChange={onChange}
          error={errors.vehicleId}
        />
      ) : (
        <TextField
          id="visitorId"
          name="visitorId"
          label="Visitor ID"
          placeholder="Paste the visitor's ID"
          value={values.visitorId}
          onChange={onChange}
          error={errors.visitorId}
          hint="Temporary: visitor IDs come from the visitors section."
        />
      )}

      <SelectField
        id="slotId"
        name="slotId"
        label="Parking slot"
        placeholder={slotOptions.length ? 'Choose a free slot' : 'No free slots available'}
        options={slotOptions}
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

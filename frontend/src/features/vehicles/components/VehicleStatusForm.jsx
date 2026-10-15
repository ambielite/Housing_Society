import { useState } from 'react';
import SelectField from '../../../components/ui/SelectField';
import Alert from '../../../components/ui/Alert';
import { VEHICLE_STATUSES } from './vehicleOptions';

export default function VehicleStatusForm({ currentStatus, onSubmit, onCancel, saving, error }) {
  const [status, setStatus] = useState(currentStatus);
  const [note, setNote] = useState('');

  const handleSubmit = (event) => {
    event.preventDefault();
    if (status === currentStatus) {
      setNote('Choose a different status first.');
      return;
    }
    onSubmit(status);
  };

  return (
    <form onSubmit={handleSubmit} noValidate>
      {error && <Alert>{error}</Alert>}
      {note && <Alert variant="success">{note}</Alert>}
      <SelectField
        id="status"
        label="Status"
        options={VEHICLE_STATUSES}
        value={status}
        onChange={(event) => {
          setNote('');
          setStatus(event.target.value);
        }}
        hint="Blocked, inactive and sold vehicles should not be given gate access."
      />
      <div className="form-actions">
        <button type="submit" className="btn btn-primary" disabled={saving}>
          {saving ? 'Saving...' : 'Update status'}
        </button>
        <button type="button" className="btn btn-secondary" onClick={onCancel} disabled={saving}>
          Cancel
        </button>
      </div>
    </form>
  );
}

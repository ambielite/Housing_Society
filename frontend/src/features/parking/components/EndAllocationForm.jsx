import { useState } from 'react';
import TextField from '../../../components/ui/TextField';
import SelectField from '../../../components/ui/SelectField';
import Alert from '../../../components/ui/Alert';

const today = () => new Date().toISOString().slice(0, 10);

export default function EndAllocationForm({ onSubmit, onCancel, saving, error }) {
  const [values, setValues] = useState({ status: 'EXPIRED', endDate: today() });

  const onChange = (event) => setValues((v) => ({ ...v, [event.target.name]: event.target.value }));

  const handleSubmit = (event) => {
    event.preventDefault();
    const payload = { status: values.status };
    if (values.endDate) payload.endDate = values.endDate;
    onSubmit(payload);
  };

  return (
    <form onSubmit={handleSubmit} noValidate>
      {error && <Alert>{error}</Alert>}
      <p className="muted section-hint">Ending an allocation frees the slot so it can be given to someone else.</p>
      <SelectField
        id="status"
        name="status"
        label="How is it ending?"
        options={[
          { value: 'EXPIRED', label: 'Expired - it ran its course' },
          { value: 'CANCELLED', label: 'Cancelled - ended early' },
        ]}
        value={values.status}
        onChange={onChange}
      />
      <TextField id="endDate" name="endDate" type="date" label="End date" value={values.endDate} onChange={onChange} />
      <div className="form-actions">
        <button type="submit" className="btn btn-primary" disabled={saving}>
          {saving ? 'Saving...' : 'End allocation'}
        </button>
        <button type="button" className="btn btn-secondary" onClick={onCancel} disabled={saving}>
          Cancel
        </button>
      </div>
    </form>
  );
}

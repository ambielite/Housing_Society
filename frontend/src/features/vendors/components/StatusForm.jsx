import { useState } from 'react';
import SelectField from '../../../components/ui/SelectField';
import Alert from '../../../components/ui/Alert';

/** Generic "pick a new status" form, used for vendors and for contracts. */
export default function StatusForm({ options, currentValue, label = 'Status', hint, submitLabel = 'Update status', onSubmit, onCancel, saving, error }) {
  const [value, setValue] = useState(currentValue);
  const [note, setNote] = useState('');

  const handleSubmit = (event) => {
    event.preventDefault();
    if (value === currentValue) {
      setNote('Choose a different status first.');
      return;
    }
    onSubmit(value);
  };

  return (
    <form onSubmit={handleSubmit} noValidate>
      {error && <Alert>{error}</Alert>}
      {note && <Alert variant="success">{note}</Alert>}
      <SelectField
        id="status"
        label={label}
        options={options}
        value={value}
        onChange={(event) => {
          setNote('');
          setValue(event.target.value);
        }}
        hint={hint}
      />
      <div className="form-actions">
        <button type="submit" className="btn btn-primary" disabled={saving}>
          {saving ? 'Saving...' : submitLabel}
        </button>
        <button type="button" className="btn btn-secondary" onClick={onCancel} disabled={saving}>
          Cancel
        </button>
      </div>
    </form>
  );
}

import { useState } from 'react';
import TextField from '../../../components/ui/TextField';
import Alert from '../../../components/ui/Alert';
import { suggestNumber } from './procurementOptions';

const today = () => new Date().toISOString().slice(0, 10);

export default function RfqForm({ onSubmit, onCancel, saving, error }) {
  const [values, setValues] = useState({ rfqNo: suggestNumber('RFQ'), issueDate: today(), dueDate: '' });
  const [errors, setErrors] = useState({});

  const onChange = (event) => setValues((v) => ({ ...v, [event.target.name]: event.target.value }));

  const handleSubmit = (event) => {
    event.preventDefault();
    const next = {};
    if (!values.rfqNo.trim()) next.rfqNo = 'Enter an RFQ number.';
    else if (values.rfqNo.trim().length > 50) next.rfqNo = 'Use 50 characters or fewer.';
    if (!values.issueDate) next.issueDate = 'Choose an issue date.';
    if (values.dueDate && values.dueDate < values.issueDate) next.dueDate = 'The deadline must be on or after the issue date.';
    setErrors(next);
    if (Object.keys(next).length) return;

    const payload = { rfqNo: values.rfqNo.trim(), issueDate: values.issueDate };
    if (values.dueDate) payload.dueDate = values.dueDate;
    onSubmit(payload);
  };

  return (
    <form onSubmit={handleSubmit} noValidate>
      {error && <Alert>{error}</Alert>}
      <TextField id="rfqNo" name="rfqNo" label="RFQ number" value={values.rfqNo} onChange={onChange} error={errors.rfqNo} hint="Must be unique across all RFQs." />
      <div className="form-grid">
        <TextField id="issueDate" name="issueDate" type="date" label="Issue date" value={values.issueDate} onChange={onChange} error={errors.issueDate} />
        <TextField id="dueDate" name="dueDate" type="date" label="Quote deadline (optional)" value={values.dueDate} onChange={onChange} error={errors.dueDate} />
      </div>
      <div className="form-actions">
        <button type="submit" className="btn btn-primary" disabled={saving}>
          {saving ? 'Saving...' : 'Create RFQ'}
        </button>
        <button type="button" className="btn btn-secondary" onClick={onCancel} disabled={saving}>
          Cancel
        </button>
      </div>
    </form>
  );
}

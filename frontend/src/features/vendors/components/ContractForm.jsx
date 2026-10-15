import { useState } from 'react';
import TextField from '../../../components/ui/TextField';
import Alert from '../../../components/ui/Alert';

const today = () => new Date().toISOString().slice(0, 10);

export default function ContractForm({ onSubmit, onCancel, saving, error }) {
  const [values, setValues] = useState({ contractNo: '', startDate: today(), endDate: '', value: '', paymentTerms: '' });
  const [errors, setErrors] = useState({});

  const onChange = (event) => setValues((v) => ({ ...v, [event.target.name]: event.target.value }));

  const handleSubmit = (event) => {
    event.preventDefault();
    const next = {};
    if (!values.contractNo.trim()) next.contractNo = 'Enter the contract number.';
    else if (values.contractNo.trim().length > 50) next.contractNo = 'Use 50 characters or fewer.';
    if (!values.startDate) next.startDate = 'Choose a start date.';
    if (values.endDate && values.endDate < values.startDate) next.endDate = 'The end date must be on or after the start date.';
    if (values.value !== '' && (Number.isNaN(Number(values.value)) || Number(values.value) < 0)) next.value = 'Enter an amount of 0 or more.';
    if (values.paymentTerms.trim().length > 255) next.paymentTerms = 'Use 255 characters or fewer.';
    setErrors(next);
    if (Object.keys(next).length) return;

    const payload = { contractNo: values.contractNo.trim(), startDate: values.startDate };
    if (values.endDate) payload.endDate = values.endDate;
    if (values.value !== '') payload.value = Number(values.value);
    if (values.paymentTerms.trim()) payload.paymentTerms = values.paymentTerms.trim();
    onSubmit(payload);
  };

  return (
    <form onSubmit={handleSubmit} noValidate>
      {error && <Alert>{error}</Alert>}
      <TextField id="contractNo" name="contractNo" label="Contract number" value={values.contractNo} onChange={onChange} error={errors.contractNo} />
      <div className="form-grid">
        <TextField id="startDate" name="startDate" type="date" label="Start date" value={values.startDate} onChange={onChange} error={errors.startDate} />
        <TextField id="endDate" name="endDate" type="date" label="End date (optional)" value={values.endDate} onChange={onChange} error={errors.endDate} />
      </div>
      <TextField id="value" name="value" type="number" min="0" step="0.01" label="Contract value in INR (optional)" value={values.value} onChange={onChange} error={errors.value} />
      <TextField id="paymentTerms" name="paymentTerms" label="Payment terms (optional)" placeholder="e.g. Net 30 days" value={values.paymentTerms} onChange={onChange} error={errors.paymentTerms} />
      <div className="form-actions">
        <button type="submit" className="btn btn-primary" disabled={saving}>
          {saving ? 'Saving...' : 'Add contract'}
        </button>
        <button type="button" className="btn btn-secondary" onClick={onCancel} disabled={saving}>
          Cancel
        </button>
      </div>
    </form>
  );
}

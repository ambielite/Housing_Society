import { useState } from 'react';
import TextField from '../../../components/ui/TextField';
import SelectField from '../../../components/ui/SelectField';
import Alert from '../../../components/ui/Alert';

const CRITERIA = ['Price', 'Delivery time', 'Warranty', 'Service level', 'Reputation'];

/** vendorOptions: vendors that were invited to this RFQ. */
export default function ComparisonForm({ vendorOptions, onSubmit, onCancel, saving, error }) {
  const [values, setValues] = useState({ vendorId: '', criterion: '', score: '', remarks: '' });
  const [errors, setErrors] = useState({});

  const onChange = (event) => setValues((v) => ({ ...v, [event.target.name]: event.target.value }));

  const handleSubmit = (event) => {
    event.preventDefault();
    const next = {};
    if (!values.vendorId) next.vendorId = 'Choose a vendor.';
    if (!values.criterion.trim()) next.criterion = 'Enter what is being scored.';
    else if (values.criterion.trim().length > 100) next.criterion = 'Use 100 characters or fewer.';
    if (values.score === '' || Number.isNaN(Number(values.score)) || Number(values.score) < 0 || Number(values.score) > 100) {
      next.score = 'Enter a score from 0 to 100.';
    }
    if (values.remarks.trim().length > 500) next.remarks = 'Use 500 characters or fewer.';
    setErrors(next);
    if (Object.keys(next).length) return;

    const payload = { vendorId: values.vendorId, criterion: values.criterion.trim(), score: Number(values.score) };
    if (values.remarks.trim()) payload.remarks = values.remarks.trim();
    onSubmit(payload);
  };

  return (
    <form onSubmit={handleSubmit} noValidate>
      {error && <Alert>{error}</Alert>}
      <SelectField id="vendorId" name="vendorId" label="Vendor" placeholder="Choose a vendor" options={vendorOptions} value={values.vendorId} onChange={onChange} error={errors.vendorId} />
      <TextField id="criterion" name="criterion" label="Criterion" list="criteria-list" placeholder="e.g. Price" value={values.criterion} onChange={onChange} error={errors.criterion} />
      <datalist id="criteria-list">
        {CRITERIA.map((c) => (
          <option key={c} value={c} />
        ))}
      </datalist>
      <TextField id="score" name="score" type="number" min="0" max="100" step="0.01" label="Score (0 to 100)" value={values.score} onChange={onChange} error={errors.score} />
      <TextField id="remarks" name="remarks" label="Remarks (optional)" value={values.remarks} onChange={onChange} error={errors.remarks} />
      <div className="form-actions">
        <button type="submit" className="btn btn-primary" disabled={saving}>
          {saving ? 'Saving...' : 'Add score'}
        </button>
        <button type="button" className="btn btn-secondary" onClick={onCancel} disabled={saving}>
          Cancel
        </button>
      </div>
    </form>
  );
}

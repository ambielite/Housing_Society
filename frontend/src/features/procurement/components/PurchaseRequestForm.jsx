import { useState } from 'react';
import { Link } from 'react-router-dom';
import TextField from '../../../components/ui/TextField';
import Alert from '../../../components/ui/Alert';
import { suggestNumber } from './procurementOptions';

const today = () => new Date().toISOString().slice(0, 10);

export default function PurchaseRequestForm({ onSubmit, cancelTo, saving, error }) {
  const [values, setValues] = useState({
    requestNo: suggestNumber('PR'),
    requestedDate: today(),
    department: '',
    estimatedAmount: '',
    justification: '',
  });
  const [errors, setErrors] = useState({});

  const onChange = (event) => setValues((v) => ({ ...v, [event.target.name]: event.target.value }));

  const handleSubmit = (event) => {
    event.preventDefault();
    const next = {};
    if (!values.requestNo.trim()) next.requestNo = 'Enter a request number.';
    else if (values.requestNo.trim().length > 50) next.requestNo = 'Use 50 characters or fewer.';
    if (!values.requestedDate) next.requestedDate = 'Choose a date.';
    if (values.department.trim().length > 100) next.department = 'Use 100 characters or fewer.';
    if (values.estimatedAmount !== '' && (Number.isNaN(Number(values.estimatedAmount)) || Number(values.estimatedAmount) < 0)) {
      next.estimatedAmount = 'Enter an amount of 0 or more.';
    }
    if (values.justification.trim().length > 2000) next.justification = 'Use 2000 characters or fewer.';
    setErrors(next);
    if (Object.keys(next).length) return;

    const payload = { requestNo: values.requestNo.trim(), requestedDate: values.requestedDate };
    if (values.department.trim()) payload.department = values.department.trim();
    if (values.estimatedAmount !== '') payload.estimatedAmount = Number(values.estimatedAmount);
    if (values.justification.trim()) payload.justification = values.justification.trim();
    onSubmit(payload);
  };

  return (
    <form className="card form-wide" onSubmit={handleSubmit} noValidate>
      {error && <Alert>{error}</Alert>}
      <div className="form-grid">
        <TextField id="requestNo" name="requestNo" label="Request number" value={values.requestNo} onChange={onChange} error={errors.requestNo} hint="Must be unique in this society." />
        <TextField id="requestedDate" name="requestedDate" type="date" label="Requested on" value={values.requestedDate} onChange={onChange} error={errors.requestedDate} />
        <TextField id="department" name="department" label="Department (optional)" placeholder="e.g. Maintenance" value={values.department} onChange={onChange} error={errors.department} />
        <TextField
          id="estimatedAmount"
          name="estimatedAmount"
          type="number"
          min="0"
          step="0.01"
          label="Estimated amount in INR (optional)"
          value={values.estimatedAmount}
          onChange={onChange}
          error={errors.estimatedAmount}
        />
      </div>
      <div className="field">
        <label htmlFor="justification">Justification (optional)</label>
        <textarea
          id="justification"
          name="justification"
          rows={4}
          className={`input${errors.justification ? ' input-error' : ''}`}
          placeholder="Why is this purchase needed?"
          value={values.justification}
          onChange={onChange}
        />
        {errors.justification && <p className="field-error">{errors.justification}</p>}
      </div>
      <div className="form-actions">
        <button type="submit" className="btn btn-primary" disabled={saving}>
          {saving ? 'Saving...' : 'Create request'}
        </button>
        <Link to={cancelTo} className="btn btn-secondary">
          Cancel
        </Link>
      </div>
    </form>
  );
}

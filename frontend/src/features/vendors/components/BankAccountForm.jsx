import { useState } from 'react';
import TextField from '../../../components/ui/TextField';
import Alert from '../../../components/ui/Alert';
import { IFSC_PATTERN } from './vendorOptions';

/** Only the last 4 digits of the account number are collected; the full number is never stored. */
export default function BankAccountForm({ onSubmit, onCancel, saving, error }) {
  const [values, setValues] = useState({ bankName: '', beneficiaryName: '', last4: '', ifsc: '' });
  const [errors, setErrors] = useState({});

  const onChange = (event) => setValues((v) => ({ ...v, [event.target.name]: event.target.value }));

  const handleSubmit = (event) => {
    event.preventDefault();
    const ifsc = values.ifsc.trim().toUpperCase();
    const next = {};
    if (!values.bankName.trim()) next.bankName = 'Enter the bank name.';
    else if (values.bankName.trim().length > 150) next.bankName = 'Use 150 characters or fewer.';
    if (!values.beneficiaryName.trim()) next.beneficiaryName = 'Enter the account holder\'s name.';
    else if (values.beneficiaryName.trim().length > 150) next.beneficiaryName = 'Use 150 characters or fewer.';
    if (!/^[0-9]{4}$/.test(values.last4.trim())) next.last4 = 'Enter the last 4 digits of the account number.';
    if (!ifsc) next.ifsc = 'Enter the IFSC code.';
    else if (!IFSC_PATTERN.test(ifsc)) next.ifsc = 'An IFSC looks like HDFC0001234.';
    setErrors(next);
    if (Object.keys(next).length) return;

    onSubmit({
      bankName: values.bankName.trim(),
      beneficiaryName: values.beneficiaryName.trim(),
      accountNoMasked: `XXXXXXXX${values.last4.trim()}`,
      ifsc,
    });
  };

  return (
    <form onSubmit={handleSubmit} noValidate>
      {error && <Alert>{error}</Alert>}
      <TextField id="bankName" name="bankName" label="Bank name" value={values.bankName} onChange={onChange} error={errors.bankName} />
      <TextField id="beneficiaryName" name="beneficiaryName" label="Account holder name" value={values.beneficiaryName} onChange={onChange} error={errors.beneficiaryName} />
      <div className="form-grid">
        <TextField
          id="last4"
          name="last4"
          label="Account number (last 4 digits)"
          inputMode="numeric"
          maxLength={4}
          value={values.last4}
          onChange={onChange}
          error={errors.last4}
          hint="For safety, the full number is not stored."
        />
        <TextField id="ifsc" name="ifsc" label="IFSC code" placeholder="HDFC0001234" value={values.ifsc} onChange={onChange} error={errors.ifsc} />
      </div>
      <div className="form-actions">
        <button type="submit" className="btn btn-primary" disabled={saving}>
          {saving ? 'Saving...' : 'Add bank account'}
        </button>
        <button type="button" className="btn btn-secondary" onClick={onCancel} disabled={saving}>
          Cancel
        </button>
      </div>
    </form>
  );
}

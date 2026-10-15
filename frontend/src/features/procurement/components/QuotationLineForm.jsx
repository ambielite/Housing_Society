import { useState } from 'react';
import TextField from '../../../components/ui/TextField';
import Alert from '../../../components/ui/Alert';
import { formatCurrency } from '../../../utils/format';

export default function QuotationLineForm({ onSubmit, onCancel, saving, error }) {
  const [values, setValues] = useState({ description: '', quantity: '1', unitPrice: '', tax: '' });
  const [errors, setErrors] = useState({});

  const onChange = (event) => setValues((v) => ({ ...v, [event.target.name]: event.target.value }));

  const lineTotal = (Number(values.quantity) || 0) * (Number(values.unitPrice) || 0) + (Number(values.tax) || 0);

  const handleSubmit = (event) => {
    event.preventDefault();
    const next = {};
    if (!values.description.trim()) next.description = 'Describe the item or service.';
    else if (values.description.trim().length > 255) next.description = 'Use 255 characters or fewer.';
    if (!(Number(values.quantity) > 0)) next.quantity = 'Enter a quantity above 0.';
    if (values.unitPrice === '' || Number.isNaN(Number(values.unitPrice)) || Number(values.unitPrice) < 0) next.unitPrice = 'Enter a price of 0 or more.';
    if (values.tax !== '' && (Number.isNaN(Number(values.tax)) || Number(values.tax) < 0)) next.tax = 'Enter a tax amount of 0 or more.';
    setErrors(next);
    if (Object.keys(next).length) return;

    const payload = { description: values.description.trim(), quantity: Number(values.quantity), unitPrice: Number(values.unitPrice) };
    if (values.tax !== '') payload.tax = Number(values.tax);
    onSubmit(payload);
  };

  return (
    <form onSubmit={handleSubmit} noValidate>
      {error && <Alert>{error}</Alert>}
      <TextField id="description" name="description" label="Item or service" value={values.description} onChange={onChange} error={errors.description} />
      <div className="form-grid">
        <TextField id="quantity" name="quantity" type="number" min="0" step="0.01" label="Quantity" value={values.quantity} onChange={onChange} error={errors.quantity} />
        <TextField id="unitPrice" name="unitPrice" type="number" min="0" step="0.01" label="Unit price in INR" value={values.unitPrice} onChange={onChange} error={errors.unitPrice} />
      </div>
      <TextField id="tax" name="tax" type="number" min="0" step="0.01" label="Tax amount in INR (optional)" value={values.tax} onChange={onChange} error={errors.tax} hint="The tax for this whole line, as an amount (not a percentage)." />
      <p className="muted section-hint">Line total: {formatCurrency(lineTotal)}</p>
      <div className="form-actions">
        <button type="submit" className="btn btn-primary" disabled={saving}>
          {saving ? 'Saving...' : 'Add line'}
        </button>
        <button type="button" className="btn btn-secondary" onClick={onCancel} disabled={saving}>
          Cancel
        </button>
      </div>
    </form>
  );
}

import { useState } from 'react';
import TextField from '../../../components/ui/TextField';
import SelectField from '../../../components/ui/SelectField';
import Alert from '../../../components/ui/Alert';

export default function RequestLineForm({ onSubmit, onCancel, saving, error, assetCategories = [] }) {
  const [values, setValues] = useState({ itemDescription: '', quantity: '1', estimatedUnitCost: '', assetCategoryId: '' });
  const [errors, setErrors] = useState({});

  const onChange = (event) => setValues((v) => ({ ...v, [event.target.name]: event.target.value }));

  const handleSubmit = (event) => {
    event.preventDefault();
    const next = {};
    if (!values.itemDescription.trim()) next.itemDescription = 'Describe the item or service.';
    else if (values.itemDescription.trim().length > 255) next.itemDescription = 'Use 255 characters or fewer.';
    if (!(Number(values.quantity) > 0)) next.quantity = 'Enter a quantity above 0.';
    if (values.estimatedUnitCost !== '' && (Number.isNaN(Number(values.estimatedUnitCost)) || Number(values.estimatedUnitCost) < 0)) {
      next.estimatedUnitCost = 'Enter a cost of 0 or more.';
    }
    setErrors(next);
    if (Object.keys(next).length) return;

    const payload = { itemDescription: values.itemDescription.trim(), quantity: Number(values.quantity), assetCategoryId: values.assetCategoryId || null };
    if (values.estimatedUnitCost !== '') payload.estimatedUnitCost = Number(values.estimatedUnitCost);
    onSubmit(payload);
  };

  return (
    <form onSubmit={handleSubmit} noValidate>
      {error && <Alert>{error}</Alert>}
      <TextField id="itemDescription" name="itemDescription" label="Item or service" placeholder="e.g. Lift maintenance, 12 months" value={values.itemDescription} onChange={onChange} error={errors.itemDescription} />
      <div className="form-grid">
        <TextField id="quantity" name="quantity" type="number" min="0" step="0.01" label="Quantity" value={values.quantity} onChange={onChange} error={errors.quantity} />
        <TextField id="estimatedUnitCost" name="estimatedUnitCost" type="number" min="0" step="0.01" label="Estimated unit cost in INR (optional)" value={values.estimatedUnitCost} onChange={onChange} error={errors.estimatedUnitCost} />
      </div>
      <SelectField id="request-asset-category" label="Asset category (optional)" value={values.assetCategoryId} onChange={(event) => setValues((current) => ({ ...current, assetCategoryId: event.target.value }))} options={assetCategories.map((category) => ({ value: category.id, label: `${category.categoryCode || category.category_code || ''}${category.categoryCode || category.category_code ? ' · ' : ''}${category.categoryName || category.category_name || 'Asset category'}` }))} placeholder={assetCategories.length ? 'No asset category' : 'No active asset categories'} />
      <div className="form-actions">
        <button type="submit" className="btn btn-primary" disabled={saving}>
          {saving ? 'Saving...' : 'Add item'}
        </button>
        <button type="button" className="btn btn-secondary" onClick={onCancel} disabled={saving}>
          Cancel
        </button>
      </div>
    </form>
  );
}

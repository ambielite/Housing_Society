import { useState } from 'react';
import TextField from '../../../components/ui/TextField';
import SelectField from '../../../components/ui/SelectField';
import Alert from '../../../components/ui/Alert';

export default function PurchaseOrderLineForm({ saving, error, onSubmit, onCancel, assetCategories = [] }) {
  const [form, setForm] = useState({ itemDescription: '', quantity: '1', unitPrice: '', tax: '0', assetCategoryId: '' });
  const update = (field) => (event) => setForm((current) => ({ ...current, [field]: event.target.value }));
  const submit = (event) => {
    event.preventDefault();
    onSubmit({
      itemDescription: form.itemDescription.trim(),
      quantity: Number(form.quantity),
      unitPrice: Number(form.unitPrice),
      tax: Number(form.tax || 0),
      assetCategoryId: form.assetCategoryId || null,
    });
  };
  return (
    <form onSubmit={submit} noValidate>
      {error && <Alert>{error}</Alert>}
      <TextField id="itemDescription" label="Item description" value={form.itemDescription} onChange={update('itemDescription')} maxLength={255} required />
      <div className="form-grid">
        <TextField id="quantity" label="Quantity" type="number" min="0.01" step="0.01" value={form.quantity} onChange={update('quantity')} required />
        <TextField id="unitPrice" label="Unit price" type="number" min="0" step="0.01" value={form.unitPrice} onChange={update('unitPrice')} required />
        <TextField id="tax" label="Tax" type="number" min="0" step="0.01" value={form.tax} onChange={update('tax')} />
        <SelectField id="assetCategoryId" label="Asset category (optional)" value={form.assetCategoryId} onChange={update('assetCategoryId')} options={assetCategories.map((category) => ({ value: category.id, label: `${category.categoryCode || category.category_code || ''}${category.categoryCode || category.category_code ? ' · ' : ''}${category.categoryName || category.category_name || 'Asset category'}` }))} placeholder={assetCategories.length ? 'No asset category' : 'No active asset categories'} />
      </div>
      <div className="form-actions">
        <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Saving...' : 'Add line'}</button>
        <button type="button" className="btn btn-secondary" onClick={onCancel} disabled={saving}>Cancel</button>
      </div>
    </form>
  );
}

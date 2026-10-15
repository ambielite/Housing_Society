import { useState } from 'react';
import TextField from '../../../components/ui/TextField';
import Alert from '../../../components/ui/Alert';

export default function PurchaseOrderLineForm({ saving, error, onSubmit, onCancel }) {
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
        <TextField id="assetCategoryId" label="Asset category ID" value={form.assetCategoryId} onChange={update('assetCategoryId')} placeholder="Optional UUID" />
      </div>
      <div className="form-actions">
        <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Saving...' : 'Add line'}</button>
        <button type="button" className="btn btn-secondary" onClick={onCancel} disabled={saving}>Cancel</button>
      </div>
    </form>
  );
}

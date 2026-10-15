import { useEffect, useState } from 'react';
import TextField from '../../../components/ui/TextField';
import SelectField from '../../../components/ui/SelectField';
import Alert from '../../../components/ui/Alert';
import { todayISO } from '../../../utils/format';

export default function PurchaseOrderForm({ vendors, purchaseRequests = [], purchaseRequestsLoading = false, saving, error, onSubmit, onCancel }) {
  const [form, setForm] = useState({
    vendorId: '',
    purchaseRequestId: '',
    poNo: '',
    poDate: todayISO(),
    deliveryDate: '',
  });

  useEffect(() => {
    if (vendors.length === 1 && !form.vendorId) setForm((current) => ({ ...current, vendorId: vendors[0].id }));
  }, [vendors, form.vendorId]);

  const update = (field) => (event) => setForm((current) => ({ ...current, [field]: event.target.value }));

  const submit = (event) => {
    event.preventDefault();
    onSubmit({
      vendorId: form.vendorId,
      purchaseRequestId: form.purchaseRequestId || null,
      poNo: form.poNo.trim(),
      poDate: form.poDate || null,
      deliveryDate: form.deliveryDate || null,
    });
  };

  return (
    <form onSubmit={submit} noValidate>
      {error && <Alert>{error}</Alert>}
      <div className="form-grid">
        <SelectField
          id="vendorId"
          label="Vendor"
          value={form.vendorId}
          onChange={update('vendorId')}
          options={vendors.map((vendor) => ({ value: vendor.id, label: vendor.trade_name ? `${vendor.legal_name} (${vendor.trade_name})` : vendor.legal_name }))}
          placeholder="Select vendor"
          required
        />
        <TextField id="poNo" label="PO number" value={form.poNo} onChange={update('poNo')} maxLength={50} required />
        <TextField id="poDate" label="PO date" type="date" value={form.poDate} onChange={update('poDate')} />
        <TextField id="deliveryDate" label="Delivery date" type="date" value={form.deliveryDate} onChange={update('deliveryDate')} />
        <SelectField
          id="purchaseRequestId"
          label="Purchase request"
          value={form.purchaseRequestId}
          onChange={update('purchaseRequestId')}
          options={purchaseRequests.map((request) => ({
            value: request.id,
            label: `${request.request_no}${request.department ? ` — ${request.department}` : ''}`,
          }))}
          placeholder={purchaseRequestsLoading ? 'Loading purchase requests...' : 'No linked purchase request'}
          hint="Optional. Select a purchase request if this PO is part of an existing procurement workflow."
          disabled={purchaseRequestsLoading}
        />
      </div>
      {vendors.length === 0 && <Alert>No vendors are available for the selected society.</Alert>}
      <div className="form-actions">
        <button type="submit" className="btn btn-primary" disabled={saving || vendors.length === 0}>
          {saving ? 'Creating...' : 'Create purchase order'}
        </button>
        <button type="button" className="btn btn-secondary" onClick={onCancel} disabled={saving}>Cancel</button>
      </div>
    </form>
  );
}

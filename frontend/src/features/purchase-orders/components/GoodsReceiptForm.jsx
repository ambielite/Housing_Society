import { useState } from 'react';
import TextField from '../../../components/ui/TextField';
import SelectField from '../../../components/ui/SelectField';
import Alert from '../../../components/ui/Alert';
import { RECEIPT_STATUSES } from './purchaseOrderOptions';

export default function GoodsReceiptForm({ po, saving, error, onSubmit, onCancel }) {
  const [receiptNo, setReceiptNo] = useState('');
  const [status, setStatus] = useState('ACCEPTED');
  const [lines, setLines] = useState((po.lines || []).map((line) => ({ poLineId: line.id, receivedQty: '', acceptedQty: '', rejectedQty: '' })));

  const updateLine = (index, field, value) => setLines((current) => current.map((line, i) => (i === index ? { ...line, [field]: value } : line)));
  const submit = (event) => {
    event.preventDefault();
    onSubmit({
      purchaseOrderId: po.id,
      receiptNo: receiptNo.trim(),
      status,
      lines: lines.filter((line) => line.receivedQty !== '').map((line) => ({
        poLineId: line.poLineId,
        receivedQty: Number(line.receivedQty),
        acceptedQty: line.acceptedQty === '' ? null : Number(line.acceptedQty),
        rejectedQty: line.rejectedQty === '' ? null : Number(line.rejectedQty),
      })),
    });
  };

  return (
    <form onSubmit={submit} noValidate>
      {error && <Alert>{error}</Alert>}
      <TextField id="receiptNo" label="Receipt number" value={receiptNo} onChange={(e) => setReceiptNo(e.target.value)} maxLength={50} required />
      <SelectField id="receiptStatus" label="Receipt status" value={status} onChange={(e) => setStatus(e.target.value)} options={RECEIPT_STATUSES} />
      <div className="table-wrap">
        <table className="table">
          <thead><tr><th>Item</th><th>Ordered</th><th>Received</th><th>Accepted</th><th>Rejected</th></tr></thead>
          <tbody>
            {(po.lines || []).map((line, index) => (
              <tr key={line.id}>
                <td>{line.item_description}</td>
                <td>{line.quantity}</td>
                <td><input className="input" type="number" min="0.01" step="0.01" value={lines[index]?.receivedQty || ''} onChange={(e) => updateLine(index, 'receivedQty', e.target.value)} /></td>
                <td><input className="input" type="number" min="0" step="0.01" value={lines[index]?.acceptedQty || ''} onChange={(e) => updateLine(index, 'acceptedQty', e.target.value)} /></td>
                <td><input className="input" type="number" min="0" step="0.01" value={lines[index]?.rejectedQty || ''} onChange={(e) => updateLine(index, 'rejectedQty', e.target.value)} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="form-actions">
        <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Recording...' : 'Record receipt'}</button>
        <button type="button" className="btn btn-secondary" onClick={onCancel} disabled={saving}>Cancel</button>
      </div>
    </form>
  );
}

import { useEffect, useState } from 'react';
import useSociety from '../../../app/store/useSociety';
import * as procurementApi from '../../procurement/api/procurement.api';
import * as poApi from '../../purchase-orders/api/purchase-orders.api';
import * as approvalEntityApi from '../api/approval-entities.api';
import SelectField from '../../../components/ui/SelectField';
import TextField from '../../../components/ui/TextField';
import Alert from '../../../components/ui/Alert';
import { ENTITY_TYPES } from './approvalOptions';

const getRows = (data, key) => {
  if (Array.isArray(data)) return data;
  return Array.isArray(data?.[key]) ? data[key] : [];
};

export default function ApprovalForm({ onSubmit, onCancel, saving = false, error = '' }) {
  const { societyId } = useSociety();
  const [entityType, setEntityType] = useState('PURCHASE_REQUEST');
  const [entityId, setEntityId] = useState('');
  const [approvalType, setApprovalType] = useState('STANDARD');
  const [entities, setEntities] = useState([]);
  const [loadingEntities, setLoadingEntities] = useState(false);
  const [entityError, setEntityError] = useState('');

  useEffect(() => {
    let active = true;
    setEntityId('');
    setEntityError('');
    if (!societyId) return undefined;

    setLoadingEntities(true);
    const load = async () => {
      try {
        let result;
        if (entityType === 'PURCHASE_REQUEST') {
          result = await procurementApi.listRequests({ societyId });
          result = getRows(result, 'requests');
        } else if (entityType === 'PURCHASE_ORDER') {
          result = await poApi.listPurchaseOrders({ societyId });
          result = getRows(result, 'purchaseOrders');
        } else {
          result = await approvalEntityApi.listVendorInvoices({ vendorId: undefined });
          result = getRows(result, 'invoices');
        }
        if (active) setEntities(result);
      } catch (err) {
        if (active) {
          setEntities([]);
          setEntityError(err?.response?.data?.message || err?.message || 'Could not load entities.');
        }
      } finally {
        if (active) setLoadingEntities(false);
      }
    };
    load();
    return () => { active = false; };
  }, [societyId, entityType]);

  const submit = (event) => {
    event.preventDefault();
    onSubmit({ entityType, entityId, approvalType: approvalType.trim() });
  };

  const labelFor = (item) => {
    if (entityType === 'PURCHASE_REQUEST') return `${item.request_no || item.id}${item.department ? ` — ${item.department}` : ''}`;
    if (entityType === 'PURCHASE_ORDER') return `${item.po_no || item.id}${item.status ? ` — ${item.status}` : ''}`;
    return `${item.invoice_no || item.id}${item.status ? ` — ${item.status}` : ''}`;
  };

  return (
    <form onSubmit={submit} className="stack-form">
      {(error || entityError) && <Alert>{error || entityError}</Alert>}
      <SelectField
        id="approvalEntityType"
        label="Entity type"
        value={entityType}
        onChange={(e) => setEntityType(e.target.value)}
        options={ENTITY_TYPES.map((type) => ({ value: type, label: type.replaceAll('_', ' ') }))}
        required
      />
      <SelectField
        id="approvalEntityId"
        label="Entity"
        value={entityId}
        onChange={(e) => setEntityId(e.target.value)}
        options={entities.map((item) => ({ value: item.id, label: labelFor(item) }))}
        placeholder={loadingEntities ? 'Loading...' : 'Select entity'}
        required
        disabled={loadingEntities || entities.length === 0}
      />
      {entities.length === 0 && !loadingEntities && !entityError && (
        <p className="field-hint">No {entityType.replaceAll('_', ' ').toLowerCase()} records are available for this society.</p>
      )}
      <TextField
        id="approvalType"
        label="Approval type"
        value={approvalType}
        onChange={(e) => setApprovalType(e.target.value)}
        maxLength={50}
        required
      />
      <div className="dialog-actions">
        <button type="button" className="btn btn-secondary" onClick={onCancel} disabled={saving}>Cancel</button>
        <button type="submit" className="btn btn-primary" disabled={saving || loadingEntities || !entityId}>
          {saving ? 'Raising...' : 'Raise approval'}
        </button>
      </div>
    </form>
  );
}

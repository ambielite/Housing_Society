import { useState } from 'react';
import useAuth from '../../../app/providers/useAuth';
import useFetch from '../../../utils/useFetch';
import { formatCurrency, formatDate } from '../../../utils/format';
import { getErrorMessage } from '../../../lib/axios';
import * as vendorsApi from '../api/vendors.api';
import DataTable from '../../../components/tables/DataTable';
import Alert from '../../../components/ui/Alert';
import Modal from '../../../components/ui/Modal';
import ContractForm from './ContractForm';
import StatusForm from './StatusForm';
import { ContractStatusBadge } from './VendorBadges';
import { CONTRACT_STATUSES } from './vendorOptions';

export default function VendorContractsSection({ vendorId }) {
  const { hasPermission } = useAuth();
  const canEdit = hasPermission('VENDOR_UPDATE');
  const contracts = useFetch(() => vendorsApi.listContracts(vendorId), [vendorId]);

  const [dialog, setDialog] = useState(null); // { type: 'add' } | { type: 'status', contract }
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [notice, setNotice] = useState('');

  const openDialog = (next) => {
    setSaveError('');
    setNotice('');
    setDialog(next);
  };

  const add = async (payload) => {
    setSaving(true);
    setSaveError('');
    try {
      await vendorsApi.addContract(vendorId, payload);
      setDialog(null);
      setNotice('Contract added.');
      contracts.reload();
    } catch (err) {
      setSaveError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const changeStatus = async (status) => {
    setSaving(true);
    setSaveError('');
    try {
      await vendorsApi.updateContractStatus(vendorId, dialog.contract.id, status);
      setDialog(null);
      setNotice('Contract status updated.');
      contracts.reload();
    } catch (err) {
      setSaveError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const columns = [
    {
      key: 'contractNo',
      header: 'Contract',
      render: (c) => (
        <>
          <span className="cell-title">{c.contract_no}</span>
          {c.payment_terms && <span className="cell-sub">{c.payment_terms}</span>}
        </>
      ),
    },
    {
      key: 'period',
      header: 'Period',
      render: (c) => `${formatDate(c.start_date)} to ${c.end_date ? formatDate(c.end_date) : 'open-ended'}`,
    },
    { key: 'value', header: 'Value', render: (c) => formatCurrency(c.value) },
    { key: 'status', header: 'Status', render: (c) => <ContractStatusBadge status={c.status} /> },
    {
      key: 'actions',
      header: '',
      render: (c) =>
        canEdit ? (
          <div className="row-actions">
            <button type="button" className="btn btn-secondary btn-sm" onClick={() => openDialog({ type: 'status', contract: c })}>
              Change status
            </button>
          </div>
        ) : null,
    },
  ];

  return (
    <div>
      <div className="section-head">
        <div>
          <h2 className="section-title">Contracts</h2>
          <p className="muted section-hint">Agreements with this vendor and their validity.</p>
        </div>
        {canEdit && (
          <button type="button" className="btn btn-primary" onClick={() => openDialog({ type: 'add' })}>
            Add contract
          </button>
        )}
      </div>
      {notice && <Alert variant="success">{notice}</Alert>}

      <DataTable
        columns={columns}
        rows={contracts.data}
        loading={contracts.loading}
        error={contracts.error ? getErrorMessage(contracts.error) : ''}
        onRetry={contracts.reload}
        emptyTitle="No contracts yet"
        emptyMessage="Add a contract to record the agreement terms."
      />

      {dialog && (
        <Modal title={dialog.type === 'add' ? 'Add contract' : `Contract ${dialog.contract.contract_no}`} onClose={() => setDialog(null)} busy={saving}>
          {dialog.type === 'add' ? (
            <ContractForm onSubmit={add} onCancel={() => setDialog(null)} saving={saving} error={saveError} />
          ) : (
            <StatusForm
              options={CONTRACT_STATUSES}
              currentValue={dialog.contract.status}
              label="Contract status"
              submitLabel="Update status"
              onSubmit={changeStatus}
              onCancel={() => setDialog(null)}
              saving={saving}
              error={saveError}
            />
          )}
        </Modal>
      )}
    </div>
  );
}

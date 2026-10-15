import { useState } from 'react';
import useAuth from '../../../app/providers/useAuth';
import useFetch from '../../../utils/useFetch';
import { formatDateTime } from '../../../utils/format';
import { getErrorMessage } from '../../../lib/axios';
import * as vendorsApi from '../api/vendors.api';
import DataTable from '../../../components/tables/DataTable';
import Alert from '../../../components/ui/Alert';
import Modal from '../../../components/ui/Modal';
import BankAccountForm from './BankAccountForm';
import { VerificationBadge } from './VendorBadges';

export default function VendorBankSection({ vendorId }) {
  const { hasPermission } = useAuth();
  const canEdit = hasPermission('VENDOR_UPDATE');
  const accounts = useFetch(() => vendorsApi.listBankAccounts(vendorId), [vendorId]);

  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [notice, setNotice] = useState('');
  const [pageError, setPageError] = useState('');

  const add = async (payload) => {
    setSaving(true);
    setSaveError('');
    try {
      await vendorsApi.addBankAccount(vendorId, payload);
      setShowForm(false);
      setNotice('Bank account added. It stays Pending until someone verifies it.');
      accounts.reload();
    } catch (err) {
      setSaveError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const verify = async (account) => {
    setPageError('');
    setNotice('');
    try {
      await vendorsApi.verifyBankAccount(vendorId, account.id);
      setNotice('Bank account verified.');
      accounts.reload();
    } catch (err) {
      setPageError(getErrorMessage(err));
    }
  };

  const columns = [
    {
      key: 'bank',
      header: 'Bank',
      render: (a) => (
        <>
          <span className="cell-title">{a.bank_name || '-'}</span>
          <span className="cell-sub">{a.beneficiary_name || ''}</span>
        </>
      ),
    },
    { key: 'account', header: 'Account', render: (a) => <span className="mono">{a.account_no_masked || '-'}</span> },
    { key: 'ifsc', header: 'IFSC', render: (a) => <span className="mono">{a.ifsc || '-'}</span> },
    { key: 'status', header: 'Status', render: (a) => <VerificationBadge status={a.status} /> },
    { key: 'verified', header: 'Verified on', render: (a) => formatDateTime(a.verified_at) },
    {
      key: 'actions',
      header: '',
      render: (a) =>
        canEdit && a.status !== 'VERIFIED' ? (
          <div className="row-actions">
            <button type="button" className="btn btn-primary btn-sm" onClick={() => verify(a)}>
              Verify
            </button>
          </div>
        ) : null,
    },
  ];

  return (
    <div>
      <div className="section-head">
        <div>
          <h2 className="section-title">Bank accounts</h2>
          <p className="muted section-hint">Where payments to this vendor are sent. Verify before paying.</p>
        </div>
        {canEdit && (
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => {
              setSaveError('');
              setNotice('');
              setPageError('');
              setShowForm(true);
            }}
          >
            Add bank account
          </button>
        )}
      </div>
      {notice && <Alert variant="success">{notice}</Alert>}
      {pageError && <Alert>{pageError}</Alert>}

      <DataTable
        columns={columns}
        rows={accounts.data}
        loading={accounts.loading}
        error={accounts.error ? getErrorMessage(accounts.error) : ''}
        onRetry={accounts.reload}
        emptyTitle="No bank accounts yet"
        emptyMessage="Add the account payments will go to."
      />

      {showForm && (
        <Modal title="Add bank account" onClose={() => setShowForm(false)} busy={saving}>
          <BankAccountForm onSubmit={add} onCancel={() => setShowForm(false)} saving={saving} error={saveError} />
        </Modal>
      )}
    </div>
  );
}

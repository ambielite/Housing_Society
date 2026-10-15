import { useState } from 'react';
import useAuth from '../../../app/providers/useAuth';
import useFetch from '../../../utils/useFetch';
import { formatDate } from '../../../utils/format';
import { getErrorMessage } from '../../../lib/axios';
import * as vendorsApi from '../api/vendors.api';
import DataTable from '../../../components/tables/DataTable';
import Alert from '../../../components/ui/Alert';
import Modal from '../../../components/ui/Modal';
import DocumentForm from './DocumentForm';
import { VerificationBadge } from './VendorBadges';
import { DOCUMENT_TYPES, labelOf } from './vendorOptions';

export default function VendorDocumentsSection({ vendorId }) {
  const { hasPermission } = useAuth();
  const canEdit = hasPermission('VENDOR_UPDATE');
  const documents = useFetch(() => vendorsApi.listDocuments(vendorId), [vendorId]);

  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [notice, setNotice] = useState('');
  const [pageError, setPageError] = useState('');

  const add = async (payload) => {
    setSaving(true);
    setSaveError('');
    try {
      await vendorsApi.addDocument(vendorId, payload);
      setShowForm(false);
      setNotice('Document added. It stays Pending until someone verifies it.');
      documents.reload();
    } catch (err) {
      setSaveError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const setVerification = async (document, status) => {
    setPageError('');
    setNotice('');
    try {
      await vendorsApi.verifyDocument(vendorId, document.id, status);
      setNotice(status === 'VERIFIED' ? 'Document verified.' : 'Document rejected.');
      documents.reload();
    } catch (err) {
      setPageError(getErrorMessage(err));
    }
  };

  const columns = [
    { key: 'type', header: 'Document', render: (d) => <span className="cell-title">{labelOf(DOCUMENT_TYPES, d.document_type)}</span> },
    { key: 'expiry', header: 'Expires', render: (d) => formatDate(d.expiry_date, 'No expiry') },
    { key: 'status', header: 'Verification', render: (d) => <VerificationBadge status={d.verification_status} /> },
    {
      key: 'actions',
      header: '',
      render: (d) =>
        canEdit ? (
          <div className="row-actions">
            {d.verification_status !== 'VERIFIED' && (
              <button type="button" className="btn btn-primary btn-sm" onClick={() => setVerification(d, 'VERIFIED')}>
                Verify
              </button>
            )}
            {d.verification_status !== 'REJECTED' && (
              <button type="button" className="btn btn-secondary btn-sm" onClick={() => setVerification(d, 'REJECTED')}>
                Reject
              </button>
            )}
          </div>
        ) : null,
    },
  ];

  return (
    <div>
      <div className="section-head">
        <div>
          <h2 className="section-title">Documents</h2>
          <p className="muted section-hint">Registration papers and certificates, checked before the vendor is activated.</p>
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
            Add document
          </button>
        )}
      </div>
      {notice && <Alert variant="success">{notice}</Alert>}
      {pageError && <Alert>{pageError}</Alert>}

      <DataTable
        columns={columns}
        rows={documents.data}
        loading={documents.loading}
        error={documents.error ? getErrorMessage(documents.error) : ''}
        onRetry={documents.reload}
        emptyTitle="No documents yet"
        emptyMessage="Record the documents this vendor has provided."
      />

      {showForm && (
        <Modal title="Add document" onClose={() => setShowForm(false)} busy={saving}>
          <DocumentForm onSubmit={add} onCancel={() => setShowForm(false)} saving={saving} error={saveError} />
        </Modal>
      )}
    </div>
  );
}

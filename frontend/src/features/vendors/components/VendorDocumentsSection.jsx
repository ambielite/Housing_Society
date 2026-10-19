import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import useAuth from '../../../app/providers/useAuth';
import useSociety from '../../../app/store/useSociety';
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
import * as vaultApi from '../../document-vault/api/documentVault.api';

export default function VendorDocumentsSection({ vendorId }) {
  const { hasPermission } = useAuth();
  const { societyId } = useSociety();
  const canEdit = hasPermission('VENDOR_UPDATE');
  const canReadVault = hasPermission('DOCUMENT_READ');
  const documents = useFetch(() => vendorsApi.listDocuments(vendorId), [vendorId]);

  const [showForm, setShowForm] = useState(false);
  const [vaultDocuments, setVaultDocuments] = useState([]);
  const [vaultLoading, setVaultLoading] = useState(false);
  const [vaultError, setVaultError] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [notice, setNotice] = useState('');
  const [pageError, setPageError] = useState('');
  const [preview, setPreview] = useState(null);
  const [previewLoading, setPreviewLoading] = useState(false);

  useEffect(() => () => {
    if (preview?.url) URL.revokeObjectURL(preview.url);
  }, [preview]);

  useEffect(() => {
    if (!showForm || !societyId || !canReadVault) return undefined;
    let active = true;
    setVaultLoading(true);
    setVaultError('');
    vendorsApi.listVaultDocuments(societyId)
      .then((response) => {
        if (!active) return;
        const rows = Array.isArray(response) ? response : response?.documents || [];
        setVaultDocuments(rows);
      })
      .catch((err) => { if (active) setVaultError(getErrorMessage(err)); })
      .finally(() => { if (active) setVaultLoading(false); });
    return () => { active = false; };
  }, [showForm, societyId, canReadVault]);

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

  const viewDocument = async (document) => {
    if (!document.document_id) return;
    setPreviewLoading(true);
    setPageError('');
    try {
      const response = await vaultApi.downloadDocument(document.document_id);
      const file = response.data;
      setPreview({
        url: URL.createObjectURL(file),
        mimeType: file.type || '',
        fileName: document.document_file_name || document.document_title || 'document',
        title: document.document_title || document.document_file_name || 'Document preview',
      });
    } catch (err) {
      setPageError(getErrorMessage(err));
    } finally {
      setPreviewLoading(false);
    }
  };

  const columns = [
    { key: 'type', header: 'Document', render: (d) => <div><span className="cell-title">{labelOf(DOCUMENT_TYPES, d.document_type)}</span>{d.document_id ? <Link className="cell-sub" to={`/document-vault/${d.document_id}`}>{d.document_title || d.document_file_name || 'Open linked file'}</Link> : <span className="cell-sub">No Document Vault file linked</span>}</div> },
    { key: 'view', header: 'View document', render: (d) => d.document_id ? (
      canReadVault
        ? <button type="button" className="btn btn-secondary btn-sm" onClick={() => viewDocument(d)} disabled={previewLoading}>{previewLoading ? 'Loading...' : 'View document'}</button>
        : <span className="muted">Document Read access required</span>
    ) : <span className="muted">—</span> },
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
          <DocumentForm onSubmit={add} onCancel={() => setShowForm(false)} saving={saving} error={saveError} vaultDocuments={vaultDocuments} vaultLoading={vaultLoading} vaultError={canReadVault ? vaultError : 'You need Document Read access to select a Document Vault file.'} />
        </Modal>
      )}

      {preview && <Modal title={preview.title} onClose={() => setPreview(null)}><div style={{ minWidth: 'min(80vw, 900px)', minHeight: '60vh' }}>{preview.mimeType === 'application/pdf' ? <iframe title={preview.title} src={preview.url} style={{ width: 'min(80vw, 900px)', height: '70vh', border: 0 }} /> : preview.mimeType.startsWith('image/') ? <img src={preview.url} alt={preview.title} style={{ display: 'block', maxWidth: '80vw', maxHeight: '70vh', objectFit: 'contain', margin: '0 auto' }} /> : <div className="table-state"><h3>Preview isn’t available for this file type.</h3><a className="btn btn-primary" href={preview.url} download={preview.fileName}>Download document</a></div>}</div></Modal>}
    </div>
  );
}

import { useMemo, useState } from 'react';
import { Download, FileText, FolderClosed, FolderOpen, Plus, Printer, Share2, ShieldCheck } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import useAuth from '../../../app/providers/useAuth';
import useSociety from '../../../app/store/useSociety';
import useFetch from '../../../utils/useFetch';
import { getErrorMessage } from '../../../lib/axios';
import PageContainer from '../../../components/layout/PageContainer';
import DataTable from '../../../components/tables/DataTable';
import Alert from '../../../components/ui/Alert';
import Modal from '../../../components/ui/Modal';
import ConfirmDialog from '../../../components/ui/ConfirmDialog';
import SocietyIdPrompt from '../../../components/ui/SocietyIdPrompt';
import * as vaultApi from '../api/documentVault.api';
import FolderForm from '../components/FolderForm';
import UploadDocumentForm from '../components/UploadDocumentForm';
import { shareDocument as openDocumentShare } from '../utils/shareDocument';
import { DOCUMENT_STATUSES, DOCUMENT_TYPES, formatBytes, formatDate, pretty, SENSITIVITIES } from '../components/documentVaultOptions';

export default function DocumentVaultPage() {
  const { hasPermission } = useAuth();
  const { societyId } = useSociety();
  const notice = useLocation().state?.notice;
  const [search, setSearch] = useState('');
  const [folderFilter, setFolderFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [sensitivityFilter, setSensitivityFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showFolder, setShowFolder] = useState(false);
  const [showUpload, setShowUpload] = useState(false);
  const [editingFolder, setEditingFolder] = useState(null);
  const [deletingFolder, setDeletingFolder] = useState(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');
  const [pageNotice, setPageNotice] = useState(notice || '');
  const [pageError, setPageError] = useState('');

  const canReadFolders = hasPermission('DOCUMENT_FOLDER_READ');
  const folders = useFetch(() => (societyId && canReadFolders ? vaultApi.listFolders({ societyId }) : Promise.resolve([])), [societyId, canReadFolders]);
  const docs = useFetch(() => (societyId ? vaultApi.listDocuments({ societyId, folderId: folderFilter, documentType: typeFilter, sensitivity: sensitivityFilter, status: statusFilter, search: search.trim() }) : Promise.resolve([])), [societyId, folderFilter, typeFilter, sensitivityFilter, statusFilter, search]);
  const folderNames = useMemo(() => new Map((folders.data || []).map((folder) => [folder.id, folder.name])), [folders.data]);
  const activeFilters = Boolean(search || folderFilter || typeFilter || sensitivityFilter || statusFilter);
  const folderList = Array.isArray(folders.data) ? folders.data : (folders.data?.folders || []);
  const documentList = Array.isArray(docs.data) ? docs.data : (docs.data?.documents || []);

  const createFolder = async (payload) => {
    setSaving(true); setFormError('');
    try { await vaultApi.createFolder(payload); setShowFolder(false); setPageNotice('Folder created successfully.'); folders.reload(); }
    catch (error) { setFormError(getErrorMessage(error)); }
    finally { setSaving(false); }
  };
  const saveFolder = async (payload) => {
    setSaving(true); setFormError('');
    try { await vaultApi.updateFolder(editingFolder.id, payload); setEditingFolder(null); setPageNotice('Folder updated successfully.'); folders.reload(); }
    catch (error) { setFormError(getErrorMessage(error)); }
    finally { setSaving(false); }
  };
  const upload = async (payload) => {
    setSaving(true); setFormError('');
    try { await vaultApi.uploadDocument(payload); setShowUpload(false); setPageNotice('Document uploaded successfully.'); docs.reload(); }
    catch (error) { setFormError(getErrorMessage(error)); }
    finally { setSaving(false); }
  };
  const removeFolder = async () => {
    setSaving(true); setPageError('');
    try { await vaultApi.deleteFolder(deletingFolder.id); setDeletingFolder(null); setPageNotice('Folder deleted successfully.'); folders.reload(); docs.reload(); }
    catch (error) { setPageError(getErrorMessage(error)); setDeletingFolder(null); }
    finally { setSaving(false); }
  };
  const clearFilters = () => { setSearch(''); setFolderFilter(''); setTypeFilter(''); setSensitivityFilter(''); setStatusFilter(''); };
  const shareDocument = async (doc) => {
    setPageError('');
    try { await openDocumentShare(doc); }
    catch (error) {
      if (error?.name !== 'AbortError') setPageError(error?.message || 'Could not open the share menu.');
    }
  };
  const downloadDocument = async (doc) => {
    setSaving(true); setPageError(''); setPageNotice('');
    try {
      const response = await vaultApi.downloadDocument(doc.id);
      const url = URL.createObjectURL(response.data);
      const anchor = window.document.createElement('a');
      anchor.href = url;
      anchor.download = doc.file_name || doc.title || 'document';
      anchor.click();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
      setPageNotice('Document download started.');
    } catch (error) { setPageError(getErrorMessage(error)); }
    finally { setSaving(false); }
  };
  const printDocument = async (doc) => {
    const printWindow = window.open('about:blank', '_blank');
    if (!printWindow) {
      setPageError('Allow pop-ups to print this document.');
      return;
    }
    setSaving(true); setPageError(''); setPageNotice('');
    try {
      const response = await vaultApi.downloadDocument(doc.id);
      const url = URL.createObjectURL(response.data);
      let released = false;
      const releaseUrl = () => {
        if (released) return;
        released = true;
        URL.revokeObjectURL(url);
      };
      printWindow.document.title = doc.title || doc.file_name || 'Document';
      printWindow.addEventListener('load', () => {
        printWindow.focus();
        window.setTimeout(() => printWindow.print(), 400);
      }, { once: true });
      printWindow.addEventListener('afterprint', () => {
        releaseUrl();
        printWindow.close();
      }, { once: true });
      printWindow.addEventListener('pagehide', releaseUrl, { once: true });
      printWindow.location.href = url;
      window.setTimeout(releaseUrl, 5 * 60 * 1000);
      setPageNotice('Document opened for printing.');
    } catch (error) {
      printWindow.close();
      setPageError(getErrorMessage(error));
    } finally { setSaving(false); }
  };

  if (!societyId) return <PageContainer eyebrow="SOCIETY RECORDS" title="Document Vault" subtitle="Manage society documents, versions and access."><SocietyIdPrompt /></PageContainer>;

  const actions = (
    <>
      {hasPermission('DOCUMENT_FOLDER_CREATE') && <button className="btn btn-secondary" onClick={() => { setFormError(''); setShowFolder(true); }}><Plus size={16} /> New folder</button>}
      {hasPermission('DOCUMENT_CREATE') && <button className="btn btn-primary" onClick={() => { setFormError(''); setShowUpload(true); }}><span className="button-plus" aria-hidden="true">+</span> Upload document</button>}
    </>
  );

  const columns = [
    { key: 'title', header: 'Document', render: (doc) => <><Link to={`/document-vault/${doc.id}`} className="cell-title">{doc.title}</Link><span className="cell-sub">{doc.file_name || 'File'}</span></> },
    ...(canReadFolders ? [{ key: 'folder', header: 'Folder', render: (doc) => folderNames.get(doc.folder_id) || 'Folder' }] : []),
    { key: 'type', header: 'Type', render: (doc) => pretty(doc.document_type) },
    { key: 'sensitivity', header: 'Sensitivity', render: (doc) => pretty(doc.sensitivity) },
    { key: 'size', header: 'Size', render: (doc) => formatBytes(doc.size_bytes) },
    { key: 'status', header: 'Status', render: (doc) => {
      const status = String(doc.status || '').toUpperCase();
      const tone = status === 'ACTIVE' ? 'success' : ['EXPIRED', 'DELETED', 'REVOKED'].includes(status) ? 'danger' : 'neutral';
      return <span className={`moveinout-status moveinout-status-${tone}`}>{pretty(status)}</span>;
    } },
    { key: 'created', header: 'Uploaded', render: (doc) => formatDate(doc.created_at) },
    { key: 'actions', header: 'Actions', render: (doc) => <div className="society-row-actions invoice-row-actions">
      {(hasPermission('DOCUMENT_DOWNLOAD') || (doc.visibility === 'PUBLIC' && doc.sensitivity !== 'CONFIDENTIAL')) && <>
        <button type="button" className="society-icon-action" title={`Download ${doc.title || 'document'}`} aria-label={`Download ${doc.title || 'document'}`} disabled={saving} onClick={() => downloadDocument(doc)}><Download size={16} aria-hidden="true" /></button>
        <button type="button" className="society-icon-action" title={`Print ${doc.title || 'document'}`} aria-label={`Print ${doc.title || 'document'}`} disabled={saving} onClick={() => printDocument(doc)}><Printer size={16} aria-hidden="true" /></button>
      </>}
      <button type="button" className="society-icon-action" title={`Share ${doc.title || 'document'}`} aria-label={`Share ${doc.title || 'document'}`} disabled={saving} onClick={() => shareDocument(doc)}><Share2 size={16} aria-hidden="true" /></button>
    </div> },
  ];

  return (
    <PageContainer eyebrow="SOCIETY RECORDS" title="Document Vault" subtitle="Organize society records, upload files, manage versions and control access." actions={actions} className="document-vault-page">
      {pageNotice && <Alert variant="success">{pageNotice}</Alert>}
      {pageError && <Alert variant="error">{pageError}</Alert>}
      <div className="document-vault-overview" aria-label="Document vault summary">
        <article className="document-vault-metric document-vault-metric-files"><span className="document-vault-metric-icon"><FileText size={19} /></span><div><span>Files in view</span><strong>{docs.loading ? '—' : documentList.length}</strong></div></article>
        {canReadFolders && <article className="document-vault-metric document-vault-metric-folders"><span className="document-vault-metric-icon"><FolderOpen size={19} /></span><div><span>Folders</span><strong>{folders.loading ? '—' : folderList.length}</strong></div></article>}
        <article className="document-vault-metric document-vault-metric-access"><span className="document-vault-metric-icon"><ShieldCheck size={19} /></span><div><span>Access controlled</span><strong>Private</strong></div></article>
      </div>
      {canReadFolders && <section className="card section document-vault-panel document-vault-folders">
        <div className="document-vault-section-heading"><div><span className="document-vault-kicker">LIBRARY</span><h2 className="section-title">Browse folders</h2><p className="muted">Choose a category to narrow the documents below.</p></div><span className="document-vault-count">{folderList.length} {folderList.length === 1 ? 'folder' : 'folders'}</span></div>
        {folders.error && <Alert variant="error">{getErrorMessage(folders.error)}</Alert>}
        {folders.loading ? <p className="muted">Loading folders…</p> : folderList.length ? (
          <div className="folder-grid">
            {folderList.map((folder) => (
              <div className={`folder-tile document-vault-folder${folderFilter === folder.id ? ' selected' : ''}`} key={folder.id}>
                <button type="button" className="folder-select" onClick={() => setFolderFilter(folderFilter === folder.id ? '' : folder.id)} aria-pressed={folderFilter === folder.id}>
                  <span className="document-vault-folder-icon"><FolderClosed size={21} /></span><span className="document-vault-folder-title"><strong>{folder.name}</strong><span className="document-vault-folder-count">{documentList.filter((doc) => doc.folder_id === folder.id).length} files</span></span><span className="cell-sub">{pretty(folder.folder_type)} · {pretty(folder.status)}</span>
                </button>
                <div className="folder-actions">
                  {hasPermission('DOCUMENT_FOLDER_UPDATE') && <button className="btn btn-ghost btn-sm" onClick={() => { setFormError(''); setEditingFolder(folder); }}>Edit</button>}
                  {hasPermission('DOCUMENT_FOLDER_DELETE') && <button className="btn btn-ghost btn-sm" onClick={() => setDeletingFolder(folder)}>Delete</button>}
                </div>
              </div>
            ))}
          </div>
        ) : <div className="empty-state compact"><h3>No folders yet</h3><p>Create a folder to organize uploaded documents.</p></div>}
      </section>}

      <section className="card section document-vault-panel document-vault-documents">
        <div className="document-vault-section-heading"><div><span className="document-vault-kicker">YOUR RECORDS</span><h2 className="section-title">Documents</h2><p className="muted">Search, filter and open a document to manage its details.</p></div><span className="document-vault-count">{docs.loading ? 'Loading…' : `${documentList.length} ${documentList.length === 1 ? 'file' : 'files'}`}</span></div>
        <div className="toolbar document-toolbar">
          <input className="input toolbar-search" type="search" placeholder="Search document title" aria-label="Search document title" value={search} onChange={(e) => setSearch(e.target.value)} />
          {canReadFolders && <select className="input toolbar-select" aria-label="Filter folder" value={folderFilter} onChange={(e) => setFolderFilter(e.target.value)}><option value="">All folders</option>{folderList.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}</select>}
          <select className="input toolbar-select" aria-label="Filter document type" value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}><option value="">All types</option>{DOCUMENT_TYPES.map((v) => <option key={v}>{v}</option>)}</select>
          <select className="input toolbar-select" aria-label="Filter sensitivity" value={sensitivityFilter} onChange={(e) => setSensitivityFilter(e.target.value)}><option value="">All sensitivities</option>{SENSITIVITIES.map((v) => <option key={v}>{v}</option>)}</select>
          <select className="input toolbar-select" aria-label="Filter status" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}><option value="">All statuses</option>{DOCUMENT_STATUSES.map((v) => <option key={v}>{v}</option>)}</select>
          {activeFilters && <button type="button" className="btn btn-secondary" onClick={clearFilters}>Clear filters</button>}
        </div>
        <DataTable columns={columns} rows={documentList} loading={docs.loading} error={docs.error ? getErrorMessage(docs.error) : ''} onRetry={docs.reload} emptyTitle={activeFilters ? 'No documents match these filters' : 'No documents yet'} emptyMessage={activeFilters ? 'Adjust your search or filters, or clear filters to see all documents.' : 'Upload a document to start building your society’s document library.'}  />
      </section>

      {showFolder && <Modal title="Create folder" onClose={() => !saving && setShowFolder(false)} busy={saving}><FolderForm folders={folderList} societyId={societyId} onSubmit={createFolder} onCancel={() => setShowFolder(false)} saving={saving} error={formError} /></Modal>}
      {editingFolder && <Modal title="Edit folder" onClose={() => !saving && setEditingFolder(null)} busy={saving}><FolderForm initial={editingFolder} societyId={societyId} onSubmit={saveFolder} onCancel={() => setEditingFolder(null)} saving={saving} error={formError} /></Modal>}
      {showUpload && <Modal title="Upload document" onClose={() => !saving && setShowUpload(false)} busy={saving}><UploadDocumentForm folders={folderList} societyId={societyId} onSubmit={upload} onCancel={() => setShowUpload(false)} saving={saving} error={formError} /></Modal>}
      {deletingFolder && <ConfirmDialog open={Boolean(deletingFolder)} danger title="Delete folder" message={`Delete "${deletingFolder.name}"? Folders containing documents or sub-folders cannot be deleted.`} confirmLabel="Delete folder" busy={saving} onCancel={() => setDeletingFolder(null)} onConfirm={removeFolder} />}
    </PageContainer>
  );
}

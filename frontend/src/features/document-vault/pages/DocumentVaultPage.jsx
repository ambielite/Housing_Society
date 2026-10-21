import { useMemo, useState } from 'react';
import { Plus, Share2 } from 'lucide-react';
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

  if (!societyId) return <PageContainer title="Document Vault" subtitle="Manage society documents, versions and access."><SocietyIdPrompt /></PageContainer>;

  const actions = (
    <>
      {hasPermission('DOCUMENT_FOLDER_CREATE') && <button className="btn btn-secondary" onClick={() => { setFormError(''); setShowFolder(true); }}><Plus size={16} /> New folder</button>}
      {hasPermission('DOCUMENT_CREATE') && <button className="btn btn-primary" onClick={() => { setFormError(''); setShowUpload(true); }}>Upload document</button>}
    </>
  );

  const columns = [
    { key: 'title', header: 'Document', render: (doc) => <><Link to={`/document-vault/${doc.id}`} className="cell-title">{doc.title}</Link><span className="cell-sub">{doc.file_name || 'File'}</span></> },
    ...(canReadFolders ? [{ key: 'folder', header: 'Folder', render: (doc) => folderNames.get(doc.folder_id) || 'Folder' }] : []),
    { key: 'type', header: 'Type', render: (doc) => pretty(doc.document_type) },
    { key: 'sensitivity', header: 'Sensitivity', render: (doc) => pretty(doc.sensitivity) },
    { key: 'size', header: 'Size', render: (doc) => formatBytes(doc.size_bytes) },
    { key: 'status', header: 'Status', render: (doc) => pretty(doc.status) },
    { key: 'created', header: 'Uploaded', render: (doc) => formatDate(doc.created_at) },
    { key: 'share', header: 'Share', render: (doc) => <button type="button" className="btn btn-ghost btn-sm" title={`Share ${doc.title || 'document'}`} aria-label={`Share ${doc.title || 'document'}`} onClick={() => shareDocument(doc)}><Share2 size={16} aria-hidden="true" /></button> },
  ];

  return (
    <PageContainer title="Document Vault" subtitle="Organize society records, upload files, manage versions and control access." actions={actions}>
      {pageNotice && <Alert variant="success">{pageNotice}</Alert>}
      {pageError && <Alert variant="error">{pageError}</Alert>}
      {canReadFolders && <section className="card section">
        <div className="section-heading"><div><h2 className="section-title">Folders</h2><p className="muted">Browse by document category.</p></div></div>
        {folders.error && <Alert variant="error">{getErrorMessage(folders.error)}</Alert>}
        {folders.loading ? <p className="muted">Loading folders…</p> : folderList.length ? (
          <div className="folder-grid">
            {folderList.map((folder) => (
              <div className={`folder-tile${folderFilter === folder.id ? ' selected' : ''}`} key={folder.id}>
                <button type="button" className="folder-select" onClick={() => setFolderFilter(folderFilter === folder.id ? '' : folder.id)} aria-pressed={folderFilter === folder.id}>
                  <span className="folder-icon">▰</span><strong>{folder.name}</strong><span className="cell-sub">{pretty(folder.folder_type)} · {pretty(folder.status)}</span>
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

      <section className="card section">
        <div className="section-heading"><div><h2 className="section-title">Documents</h2><p className="muted">Search, filter and open a document to manage its details.</p></div></div>
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

import { useState } from 'react';
import Alert from '../../../components/ui/Alert';
import { DOCUMENT_TYPES, SENSITIVITIES, VISIBILITIES, visibilityHelp } from './documentVaultOptions';

export default function UploadDocumentForm({ folders, societyId, onSubmit, onCancel, saving, error }) {
  const [file, setFile] = useState(null);
  const [folderId, setFolderId] = useState('');
  const [documentType, setDocumentType] = useState('OTHER');
  const [title, setTitle] = useState('');
  const [sensitivity, setSensitivity] = useState('INTERNAL');
  const [visibility, setVisibility] = useState('COMMITTEE_ONLY');
  const [effectiveDate, setEffectiveDate] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const allowed = '.pdf,.png,.jpg,.jpeg,.doc,.docx,.xls,.xlsx';
  return (
    <form className="stack-form" onSubmit={(event) => {
      event.preventDefault();
      if (!file || !folderId) return;
      onSubmit({ file, societyId, folderId, documentType, title: title.trim(), sensitivity, visibility, effectiveDate, expiryDate });
    }}>
      {error && <Alert variant="error">{error}</Alert>}
      <label className="field">Document title<input className="input" required maxLength={255} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Society Bylaws 2026 Edition" /></label>
      <label className="field">File<input className="input" type="file" required accept={allowed} onChange={(e) => setFile(e.target.files?.[0] || null)} /><span className="field-hint">PDF, PNG, JPEG, Word or Excel; maximum 20 MB.</span></label>
      {file && <p className="field-hint">Selected: {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)</p>}
      <label className="field">Folder<select className="input" required value={folderId} onChange={(e) => setFolderId(e.target.value)}><option value="">Select folder</option>{folders.filter((folder) => folder.status === 'ACTIVE').map((folder) => <option key={folder.id} value={folder.id}>{folder.name}</option>)}</select></label>
      <label className="field">Document type<select className="input" value={documentType} onChange={(e) => setDocumentType(e.target.value)}>{DOCUMENT_TYPES.map((type) => <option key={type}>{type}</option>)}</select></label>
      <div className="form-grid">
        <label className="field">Sensitivity<select className="input" value={sensitivity} onChange={(e) => setSensitivity(e.target.value)}>{SENSITIVITIES.map((v) => <option key={v}>{v}</option>)}</select></label>
        <label className="field">Visibility<select className="input" value={visibility} onChange={(e) => setVisibility(e.target.value)}>{VISIBILITIES.map((v) => <option key={v}>{v}</option>)}</select><span className="field-hint">{visibilityHelp(visibility)}</span></label>
        <label className="field">Effective date<input className="input" type="date" value={effectiveDate} onChange={(e) => setEffectiveDate(e.target.value)} /></label>
        <label className="field">Expiry date<input className="input" type="date" min={effectiveDate || undefined} value={expiryDate} onChange={(e) => setExpiryDate(e.target.value)} /></label>
      </div>
      <div className="form-actions"><button className="btn btn-primary" disabled={saving || !file || !folderId || !title.trim()}>{saving ? 'Uploading…' : 'Upload document'}</button><button type="button" className="btn btn-secondary" onClick={onCancel} disabled={saving}>Cancel</button></div>
    </form>
  );
}

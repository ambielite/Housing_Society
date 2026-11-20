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
    <form className="stack-form document-vault-form document-upload-form" onSubmit={(event) => {
      event.preventDefault();
      if (!file || !folderId) return;
      onSubmit({ file, societyId, folderId, documentType, title: title.trim(), sensitivity, visibility, effectiveDate, expiryDate });
    }}>
      {error && <Alert variant="error">{error}</Alert>}
      <p className="document-upload-intro">Add a file to the society vault and set who can access it.</p>

      <section className="document-upload-section">
        <header className="document-upload-section-title"><h3>Document information</h3><span>Fields marked with * are required</span></header>
        <div className="document-upload-grid">
          <label className="field document-upload-wide">Document title <span className="required">*</span><input className="input" required maxLength={255} value={title} onChange={(event) => setTitle(event.target.value)} placeholder="e.g. Society Bylaws 2026 Edition" /></label>
          <label className="field">Folder <span className="required">*</span><select className="input" required value={folderId} onChange={(event) => setFolderId(event.target.value)}><option value="">Select folder</option>{folders.filter((folder) => folder.status === 'ACTIVE').map((folder) => <option key={folder.id} value={folder.id}>{folder.name}</option>)}</select></label>
          <label className="field">Document type<select className="input" value={documentType} onChange={(event) => setDocumentType(event.target.value)}>{DOCUMENT_TYPES.map((type) => <option key={type}>{type}</option>)}</select></label>
        </div>
      </section>

      <section className="document-upload-section">
        <header className="document-upload-section-title"><h3>Upload file</h3><span>PDF, PNG, JPEG, Word or Excel; maximum 20 MB</span></header>
        <label className="field document-upload-file">Choose a file <span className="required">*</span><input className="input" type="file" required accept={allowed} onChange={(event) => setFile(event.target.files?.[0] || null)} /></label>
        {file && <p className="document-upload-selected">Selected: {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)</p>}
      </section>

      <section className="document-upload-section">
        <header className="document-upload-section-title"><h3>Access and dates</h3><span>Control document access and validity</span></header>
        <div className="document-upload-grid">
          <label className="field">Sensitivity<select className="input" value={sensitivity} onChange={(event) => setSensitivity(event.target.value)}>{SENSITIVITIES.map((value) => <option key={value}>{value}</option>)}</select></label>
          <label className="field">Visibility<select className="input" value={visibility} onChange={(event) => setVisibility(event.target.value)}>{VISIBILITIES.map((value) => <option key={value}>{value}</option>)}</select><span className="field-hint">{visibilityHelp(visibility)}</span></label>
          <label className="field">Effective date<input className="input" type="date" value={effectiveDate} onChange={(event) => setEffectiveDate(event.target.value)} /></label>
          <label className="field">Expiry date<input className="input" type="date" min={effectiveDate || undefined} value={expiryDate} onChange={(event) => setExpiryDate(event.target.value)} /></label>
        </div>
      </section>

      <div className="form-actions document-upload-actions"><button className="btn btn-primary" disabled={saving || !file || !folderId || !title.trim()}>{saving ? 'Uploading…' : 'Upload document'}</button><button type="button" className="btn btn-secondary" onClick={onCancel} disabled={saving}>Cancel</button></div>
    </form>
  );
}

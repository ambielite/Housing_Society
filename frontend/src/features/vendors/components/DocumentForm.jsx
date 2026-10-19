import { useState } from 'react';
import TextField from '../../../components/ui/TextField';
import SelectField from '../../../components/ui/SelectField';
import Alert from '../../../components/ui/Alert';
import { DOCUMENT_TYPES } from './vendorOptions';

export default function DocumentForm({ onSubmit, onCancel, saving, error, vaultDocuments = [], vaultLoading = false, vaultError = '' }) {
  const [values, setValues] = useState({ documentType: '', documentId: '', expiryDate: '' });
  const [errors, setErrors] = useState({});

  const onChange = (event) => setValues((v) => ({ ...v, [event.target.name]: event.target.value }));

  const handleSubmit = (event) => {
    event.preventDefault();
    const next = {};
    if (!values.documentType) next.documentType = 'Choose a document type.';
    setErrors(next);
    if (Object.keys(next).length) return;

    const payload = { documentType: values.documentType, documentId: values.documentId || null };
    if (values.expiryDate) payload.expiryDate = values.expiryDate;
    onSubmit(payload);
  };

  return (
    <form onSubmit={handleSubmit} noValidate>
      {error && <Alert>{error}</Alert>}
      <SelectField
        id="documentType"
        name="documentType"
        label="Document type"
        placeholder="Choose a type"
        options={DOCUMENT_TYPES}
        value={values.documentType}
        onChange={onChange}
        error={errors.documentType}
        hint="Choose a document type, then optionally attach an active file from this society’s Document Vault."
      />
      <div className="field">
        <label htmlFor="vendor-document-file">Document Vault file (optional)</label>
        <select
          className="input"
          id="vendor-document-file"
          name="documentId"
          value={values.documentId}
          onChange={onChange}
          disabled={vaultLoading || !!vaultError || vaultDocuments.length === 0}
        >
          <option value="">{vaultLoading ? 'Loading society documents…' : vaultError ? 'Could not load society documents' : vaultDocuments.length ? 'No file attached' : 'No active society documents'}</option>
          {vaultDocuments.map((document) => (
            <option key={document.id} value={document.id}>
              {`${document.title || document.file_name || 'Untitled document'}${document.file_name && document.title ? ` — ${document.file_name}` : ''}`}
            </option>
          ))}
        </select>
        <p className="field-hint">Select an existing file from this society’s Document Vault. Upload files there first.</p>
        {vaultError && <Alert>{vaultError}</Alert>}
      </div>
      <TextField id="expiryDate" name="expiryDate" type="date" label="Expiry date (optional)" value={values.expiryDate} onChange={onChange} />
      <div className="form-actions">
        <button type="submit" className="btn btn-primary" disabled={saving}>
          {saving ? 'Saving...' : 'Add document'}
        </button>
        <button type="button" className="btn btn-secondary" onClick={onCancel} disabled={saving}>
          Cancel
        </button>
      </div>
    </form>
  );
}

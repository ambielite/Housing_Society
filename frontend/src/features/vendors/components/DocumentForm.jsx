import { useState } from 'react';
import TextField from '../../../components/ui/TextField';
import SelectField from '../../../components/ui/SelectField';
import Alert from '../../../components/ui/Alert';
import { DOCUMENT_TYPES } from './vendorOptions';

export default function DocumentForm({ onSubmit, onCancel, saving, error }) {
  const [values, setValues] = useState({ documentType: '', expiryDate: '' });
  const [errors, setErrors] = useState({});

  const onChange = (event) => setValues((v) => ({ ...v, [event.target.name]: event.target.value }));

  const handleSubmit = (event) => {
    event.preventDefault();
    const next = {};
    if (!values.documentType) next.documentType = 'Choose a document type.';
    setErrors(next);
    if (Object.keys(next).length) return;

    const payload = { documentType: values.documentType };
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
        hint="This records the document. Attaching the actual file comes with the document vault."
      />
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

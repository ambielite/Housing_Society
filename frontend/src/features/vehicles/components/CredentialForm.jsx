import { useState } from 'react';
import TextField from '../../../components/ui/TextField';
import SelectField from '../../../components/ui/SelectField';
import Alert from '../../../components/ui/Alert';
import { CREDENTIAL_TYPES } from './vehicleOptions';

export default function CredentialForm({ onSubmit, onCancel, saving, error }) {
  const [values, setValues] = useState({ credentialType: '', credentialValue: '', expiresAt: '' });
  const [errors, setErrors] = useState({});

  const onChange = (event) => setValues((v) => ({ ...v, [event.target.name]: event.target.value }));

  const handleSubmit = (event) => {
    event.preventDefault();
    const next = {};
    if (!values.credentialType) next.credentialType = 'Choose a credential type.';
    if (!values.credentialValue.trim()) next.credentialValue = 'Enter the card, sticker or QR number.';
    else if (values.credentialValue.trim().length > 100) next.credentialValue = 'Use 100 characters or fewer.';
    if (values.expiresAt && new Date(values.expiresAt) <= new Date()) next.expiresAt = 'The expiry must be in the future.';
    setErrors(next);
    if (Object.keys(next).length) return;

    const payload = { credentialType: values.credentialType, credentialValue: values.credentialValue.trim() };
    if (values.expiresAt) payload.expiresAt = new Date(values.expiresAt).toISOString();
    onSubmit(payload);
  };

  return (
    <form onSubmit={handleSubmit} noValidate>
      {error && <Alert>{error}</Alert>}
      <SelectField
        id="credentialType"
        name="credentialType"
        label="Credential type"
        placeholder="Choose a type"
        options={CREDENTIAL_TYPES}
        value={values.credentialType}
        onChange={onChange}
        error={errors.credentialType}
      />
      <TextField
        id="credentialValue"
        name="credentialValue"
        label="Card / sticker / QR number"
        value={values.credentialValue}
        onChange={onChange}
        error={errors.credentialValue}
        hint="Each number can belong to only one vehicle, ever."
      />
      <TextField
        id="expiresAt"
        name="expiresAt"
        type="datetime-local"
        label="Expires (optional)"
        value={values.expiresAt}
        onChange={onChange}
        error={errors.expiresAt}
      />
      <div className="form-actions">
        <button type="submit" className="btn btn-primary" disabled={saving}>
          {saving ? 'Saving...' : 'Add credential'}
        </button>
        <button type="button" className="btn btn-secondary" onClick={onCancel} disabled={saving}>
          Cancel
        </button>
      </div>
    </form>
  );
}

import { useState } from 'react';
import SelectField from '../../../components/ui/SelectField';
import Alert from '../../../components/ui/Alert';

/** vendorOptions: [{ value, label }] of ACTIVE vendors that haven't been invited yet. */
export default function InviteVendorForm({ vendorOptions, onSubmit, onCancel, saving, error }) {
  const [vendorId, setVendorId] = useState('');
  const [fieldError, setFieldError] = useState('');

  const handleSubmit = (event) => {
    event.preventDefault();
    if (!vendorId) {
      setFieldError('Choose a vendor.');
      return;
    }
    onSubmit(vendorId);
  };

  return (
    <form onSubmit={handleSubmit} noValidate>
      {error && <Alert>{error}</Alert>}
      <SelectField
        id="vendorId"
        label="Vendor"
        placeholder={vendorOptions.length ? 'Choose a vendor' : 'No more active vendors to invite'}
        options={vendorOptions}
        value={vendorId}
        onChange={(event) => {
          setFieldError('');
          setVendorId(event.target.value);
        }}
        error={fieldError}
        hint="Only Active vendors can be invited."
      />
      <div className="form-actions">
        <button type="submit" className="btn btn-primary" disabled={saving}>
          {saving ? 'Inviting...' : 'Invite vendor'}
        </button>
        <button type="button" className="btn btn-secondary" onClick={onCancel} disabled={saving}>
          Cancel
        </button>
      </div>
    </form>
  );
}

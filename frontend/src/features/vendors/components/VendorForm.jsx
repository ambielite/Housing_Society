import { useState } from 'react';
import { Link } from 'react-router-dom';
import TextField from '../../../components/ui/TextField';
import SelectField from '../../../components/ui/SelectField';
import Alert from '../../../components/ui/Alert';
import { isValidEmail } from '../../../utils/validators';
import { GSTIN_PATTERN, PAN_PATTERN, PHONE_PATTERN } from './vendorOptions';

/**
 * Create: all fields, plus an optional linked login (so a Vendor user can sign in as this vendor).
 * Edit:   business details only; sends just what changed. The linked login can't be changed later.
 * userOptions: [{ value, label }] - empty when the viewer can't see users.
 */
export default function VendorForm({ mode, vendor, userOptions = [], onSubmit, cancelTo, saving, error }) {
  const isEdit = mode === 'edit';
  const [values, setValues] = useState({
    legalName: vendor?.legal_name || '',
    tradeName: vendor?.trade_name || '',
    pan: vendor?.pan || '',
    gstin: vendor?.gstin || '',
    contactEmail: vendor?.contact_email || '',
    phone: vendor?.phone || '',
    userId: '',
  });
  const [errors, setErrors] = useState({});
  const [note, setNote] = useState('');

  const onChange = (event) => {
    setNote('');
    setValues((v) => ({ ...v, [event.target.name]: event.target.value }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    const current = {
      legalName: values.legalName.trim(),
      tradeName: values.tradeName.trim(),
      pan: values.pan.trim().toUpperCase(),
      gstin: values.gstin.trim().toUpperCase(),
      contactEmail: values.contactEmail.trim(),
      phone: values.phone.trim(),
    };

    const next = {};
    if (!current.legalName) next.legalName = 'Enter the vendor\'s registered (legal) name.';
    else if (current.legalName.length > 255) next.legalName = 'Use 255 characters or fewer.';
    if (current.tradeName.length > 255) next.tradeName = 'Use 255 characters or fewer.';
    if (current.pan && !PAN_PATTERN.test(current.pan)) next.pan = 'A PAN looks like ABCDE1234F.';
    if (current.gstin && !GSTIN_PATTERN.test(current.gstin)) next.gstin = 'That doesn\'t look like a valid GSTIN (15 characters).';
    if (current.contactEmail && !isValidEmail(current.contactEmail)) next.contactEmail = 'Enter a valid email address.';
    if (current.phone && !PHONE_PATTERN.test(current.phone)) next.phone = 'Enter a valid phone number.';
    setErrors(next);
    if (Object.keys(next).length) return;

    if (isEdit) {
      const initial = {
        legalName: vendor.legal_name || '',
        tradeName: vendor.trade_name || '',
        pan: vendor.pan || '',
        gstin: vendor.gstin || '',
        contactEmail: vendor.contact_email || '',
        phone: vendor.phone || '',
      };
      const changes = {};
      Object.keys(current).forEach((key) => {
        if (current[key] !== initial[key]) changes[key] = current[key];
      });
      if (!Object.keys(changes).length) {
        setNote("You haven't changed anything yet.");
        return;
      }
      onSubmit(changes);
      return;
    }

    const payload = { legalName: current.legalName };
    ['tradeName', 'pan', 'gstin', 'contactEmail', 'phone'].forEach((key) => {
      if (current[key]) payload[key] = current[key];
    });
    if (values.userId) payload.userId = values.userId;
    onSubmit(payload);
  };

  return (
    <form className="card form-wide" onSubmit={handleSubmit} noValidate>
      {error && <Alert>{error}</Alert>}
      {note && <Alert variant="success">{note}</Alert>}

      <div className="form-grid">
        <TextField id="legalName" name="legalName" label="Legal name" value={values.legalName} onChange={onChange} error={errors.legalName} />
        <TextField id="tradeName" name="tradeName" label="Trade name (optional)" value={values.tradeName} onChange={onChange} error={errors.tradeName} />
        <TextField id="pan" name="pan" label="PAN (optional)" placeholder="ABCDE1234F" value={values.pan} onChange={onChange} error={errors.pan} />
        <TextField id="gstin" name="gstin" label="GSTIN (optional)" placeholder="27ABCDE1234F1Z5" value={values.gstin} onChange={onChange} error={errors.gstin} />
        <TextField id="contactEmail" name="contactEmail" type="email" label="Contact email (optional)" value={values.contactEmail} onChange={onChange} error={errors.contactEmail} />
        <TextField id="phone" name="phone" type="tel" label="Phone (optional)" value={values.phone} onChange={onChange} error={errors.phone} />
      </div>

      {!isEdit && userOptions.length > 0 && (
        <SelectField
          id="userId"
          name="userId"
          label="Vendor login (optional)"
          placeholder="No login"
          options={userOptions}
          value={values.userId}
          onChange={onChange}
          hint="Pick the user account this vendor signs in with. It can't be changed later."
        />
      )}

      <div className="form-actions">
        <button type="submit" className="btn btn-primary" disabled={saving}>
          {saving ? 'Saving...' : isEdit ? 'Save changes' : 'Create vendor'}
        </button>
        <Link to={cancelTo} className="btn btn-secondary">
          Cancel
        </Link>
      </div>
    </form>
  );
}

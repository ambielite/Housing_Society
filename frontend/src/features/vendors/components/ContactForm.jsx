import { useState } from 'react';
import TextField from '../../../components/ui/TextField';
import Alert from '../../../components/ui/Alert';
import { isValidEmail } from '../../../utils/validators';
import { PHONE_PATTERN } from './vendorOptions';

export default function ContactForm({ onSubmit, onCancel, saving, error }) {
  const [values, setValues] = useState({ name: '', designation: '', email: '', phone: '', isPrimary: false });
  const [errors, setErrors] = useState({});

  const onChange = (event) => {
    const { name, value, type, checked } = event.target;
    setValues((v) => ({ ...v, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    const next = {};
    if (!values.name.trim()) next.name = 'Enter the contact\'s name.';
    else if (values.name.trim().length > 150) next.name = 'Use 150 characters or fewer.';
    if (values.designation.trim().length > 100) next.designation = 'Use 100 characters or fewer.';
    if (values.email.trim() && !isValidEmail(values.email)) next.email = 'Enter a valid email address.';
    if (values.phone.trim() && !PHONE_PATTERN.test(values.phone.trim())) next.phone = 'Enter a valid phone number.';
    setErrors(next);
    if (Object.keys(next).length) return;

    const payload = { name: values.name.trim(), isPrimary: values.isPrimary };
    if (values.designation.trim()) payload.designation = values.designation.trim();
    if (values.email.trim()) payload.email = values.email.trim();
    if (values.phone.trim()) payload.phone = values.phone.trim();
    onSubmit(payload);
  };

  return (
    <form onSubmit={handleSubmit} noValidate>
      {error && <Alert>{error}</Alert>}
      <TextField id="name" name="name" label="Name" value={values.name} onChange={onChange} error={errors.name} />
      <TextField id="designation" name="designation" label="Designation (optional)" placeholder="e.g. Account manager" value={values.designation} onChange={onChange} error={errors.designation} />
      <div className="form-grid">
        <TextField id="email" name="email" type="email" label="Email (optional)" value={values.email} onChange={onChange} error={errors.email} />
        <TextField id="phone" name="phone" type="tel" label="Phone (optional)" value={values.phone} onChange={onChange} error={errors.phone} />
      </div>
      <label className="check-row">
        <input type="checkbox" name="isPrimary" checked={values.isPrimary} onChange={onChange} /> Primary contact
      </label>
      <div className="form-actions">
        <button type="submit" className="btn btn-primary" disabled={saving}>
          {saving ? 'Saving...' : 'Add contact'}
        </button>
        <button type="button" className="btn btn-secondary" onClick={onCancel} disabled={saving}>
          Cancel
        </button>
      </div>
    </form>
  );
}

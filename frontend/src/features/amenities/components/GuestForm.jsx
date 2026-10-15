import { useState } from 'react';
import TextField from '../../../components/ui/TextField';
import Alert from '../../../components/ui/Alert';

export default function GuestForm({ onSubmit, onCancel, saving, error }) {
  const [values, setValues] = useState({ name: '', phone: '', idType: '', idNumberMasked: '' });
  const [validation, setValidation] = useState({});

  const change = (event) => setValues((current) => ({ ...current, [event.target.name]: event.target.value }));

  const submit = (event) => {
    event.preventDefault();
    const next = {};
    if (!values.name.trim()) next.name = 'Enter the guest name.';
    setValidation(next);
    if (Object.keys(next).length) return;
    onSubmit({
      name: values.name.trim(),
      phone: values.phone.trim() || null,
      idType: values.idType.trim() || null,
      idNumberMasked: values.idNumberMasked.trim() || null,
    });
  };

  return (
    <form onSubmit={submit} noValidate>
      {error && <Alert>{error}</Alert>}
      <TextField id="guest-name" name="name" label="Name" value={values.name} onChange={change} error={validation.name} />
      <TextField id="guest-phone" name="phone" label="Phone (optional)" value={values.phone} onChange={change} />
      <div className="form-grid">
        <TextField id="guest-id-type" name="idType" label="ID type (optional)" value={values.idType} onChange={change} />
        <TextField id="guest-id-number" name="idNumberMasked" label="Masked ID number (optional)" value={values.idNumberMasked} onChange={change} />
      </div>
      <div className="form-actions">
        <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Adding...' : 'Add guest'}</button>
        <button type="button" className="btn btn-secondary" onClick={onCancel} disabled={saving}>Cancel</button>
      </div>
    </form>
  );
}

import { useState } from 'react';
import { Link } from 'react-router-dom';
import { isValidEmail, passwordError } from '../../../utils/validators';
import TextField from '../../../components/ui/TextField';
import Alert from '../../../components/ui/Alert';

const EMPTY = { firstName: '', lastName: '', email: '', phone: '', password: '', status: 'ACTIVE' };
const PHONE_PATTERN = /^[0-9+\-\s()]{6,20}$/;

/**
 * mode="create": all fields, sends the full payload.
 * mode="edit":   name + phone only (the API never changes email/password/status here);
 *                sends just the fields that actually changed.
 */
export default function UserForm({ mode, initialValues, societyId, onSubmit, submitting, submitError, cancelTo }) {
  const isEdit = mode === 'edit';
  const [values, setValues] = useState({ ...EMPTY, ...initialValues });
  const [errors, setErrors] = useState({});
  const [note, setNote] = useState('');

  const onChange = (event) => {
    setNote('');
    setValues((v) => ({ ...v, [event.target.name]: event.target.value }));
  };

  const validate = () => {
    const next = {};
    if (!values.firstName.trim()) next.firstName = 'Enter a first name.';
    else if (values.firstName.trim().length > 100) next.firstName = 'Use 100 characters or fewer.';
    if (values.lastName.trim().length > 100) next.lastName = 'Use 100 characters or fewer.';
    if (values.phone.trim() && !PHONE_PATTERN.test(values.phone.trim())) next.phone = 'Enter a valid phone number.';
    if (!isEdit) {
      if (!values.email.trim()) next.email = 'Enter an email address.';
      else if (!isValidEmail(values.email)) next.email = 'Enter a valid email address.';
      const pwError = passwordError(values.password);
      if (pwError) next.password = pwError;
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    if (!validate()) return;

    const trimmed = {
      firstName: values.firstName.trim(),
      lastName: values.lastName.trim(),
      phone: values.phone.trim(),
    };

    if (isEdit) {
      const changes = {};
      Object.keys(trimmed).forEach((key) => {
        if (trimmed[key] !== (initialValues[key] || '')) changes[key] = trimmed[key];
      });
      if (Object.keys(changes).length === 0) {
        setNote("You haven't changed anything yet.");
        return;
      }
      onSubmit(changes);
      return;
    }

    const payload = {
      email: values.email.trim(),
      password: values.password,
      firstName: trimmed.firstName,
      status: values.status,
    };
    if (trimmed.lastName) payload.lastName = trimmed.lastName;
    if (trimmed.phone) payload.phone = trimmed.phone;
    if (societyId) payload.societyId = societyId;
    onSubmit(payload);
  };

  return (
    <form className="card form-wide" onSubmit={handleSubmit} noValidate>
      {submitError && <Alert>{submitError}</Alert>}
      {note && <Alert variant="success">{note}</Alert>}

      <div className="form-grid">
        <TextField id="firstName" name="firstName" label="First name" value={values.firstName} onChange={onChange} error={errors.firstName} />
        <TextField id="lastName" name="lastName" label="Last name" value={values.lastName} onChange={onChange} error={errors.lastName} />
        <TextField
          id="email"
          name="email"
          type="email"
          label="Email"
          autoComplete="off"
          value={values.email}
          onChange={onChange}
          error={errors.email}
          disabled={isEdit}
          hint={isEdit ? "Email can't be changed." : undefined}
        />
        <TextField id="phone" name="phone" type="tel" label="Phone" value={values.phone} onChange={onChange} error={errors.phone} />
        {!isEdit && (
          <>
            <TextField
              id="password"
              name="password"
              type="password"
              label="Temporary password"
              autoComplete="new-password"
              hint="8 to 128 characters. Share it with the user securely."
              value={values.password}
              onChange={onChange}
              error={errors.password}
            />
            <div className="field">
              <label htmlFor="status">Starting status</label>
              <select id="status" name="status" className="input" value={values.status} onChange={onChange}>
                <option value="ACTIVE">Active - can sign in now</option>
                <option value="PENDING">Pending - cannot sign in yet</option>
                <option value="SUSPENDED">Suspended - blocked</option>
              </select>
            </div>
          </>
        )}
      </div>

      {!isEdit && societyId && <p className="field-hint">This user will be added to your society.</p>}

      <div className="form-actions">
        <button type="submit" className="btn btn-primary" disabled={submitting}>
          {submitting ? 'Saving...' : isEdit ? 'Save changes' : 'Create user'}
        </button>
        <Link to={cancelTo} className="btn btn-secondary">
          Cancel
        </Link>
      </div>
    </form>
  );
}

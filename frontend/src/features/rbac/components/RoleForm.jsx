import { useState } from 'react';
import { Link } from 'react-router-dom';
import TextField from '../../../components/ui/TextField';
import Alert from '../../../components/ui/Alert';

const EMPTY = { name: '', code: '', description: '', status: 'ACTIVE' };

// "Helpdesk Manager" -> "HELPDESK_MANAGER" (the backend allows letters and underscores only)
const toCode = (text) =>
  text
    .toUpperCase()
    .replace(/[^A-Z]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 50);

/**
 * mode="create": name, code, description. The code follows the name until you edit it yourself.
 * mode="edit":   name, description, status (the code can never change). Sends only what changed.
 */
export default function RoleForm({ mode, initialValues, onSubmit, submitting, submitError, cancelTo, onCancel, compact = false }) {
  const isEdit = mode === 'edit';
  const [values, setValues] = useState({ ...EMPTY, ...initialValues });
  const [codeTouched, setCodeTouched] = useState(false);
  const [errors, setErrors] = useState({});
  const [note, setNote] = useState('');

  const onChange = (event) => {
    const { name, value } = event.target;
    setNote('');
    setValues((v) => {
      const next = { ...v, [name]: value };
      if (name === 'name' && !isEdit && !codeTouched) next.code = toCode(value);
      return next;
    });
  };

  const onCodeChange = (event) => {
    setCodeTouched(true);
    setNote('');
    setValues((v) => ({ ...v, code: event.target.value.toUpperCase() }));
  };

  const validate = () => {
    const next = {};
    if (!values.name.trim()) next.name = 'Enter a role name.';
    else if (values.name.trim().length > 100) next.name = 'Use 100 characters or fewer.';
    if (!isEdit) {
      if (!values.code.trim()) next.code = 'Enter a role code.';
      else if (!/^[A-Z_]+$/.test(values.code)) next.code = 'Use capital letters and underscores only, like FACILITY_LEAD.';
      else if (values.code.length > 50) next.code = 'Use 50 characters or fewer.';
    }
    if (values.description.trim().length > 255) next.description = 'Use 255 characters or fewer.';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    if (!validate()) return;

    const trimmed = { name: values.name.trim(), description: values.description.trim() };

    if (isEdit) {
      const changes = {};
      if (trimmed.name !== initialValues.name) changes.name = trimmed.name;
      if (trimmed.description !== (initialValues.description || '')) changes.description = trimmed.description;
      if (values.status !== initialValues.status) changes.status = values.status;
      if (Object.keys(changes).length === 0) {
        setNote("You haven't changed anything yet.");
        return;
      }
      onSubmit(changes);
      return;
    }

    const payload = { name: trimmed.name, code: values.code.trim() };
    if (trimmed.description) payload.description = trimmed.description;
    onSubmit(payload);
  };

  return (
    <form className={compact ? 'role-form-dialog-body' : 'card form-narrow'} onSubmit={handleSubmit} noValidate>
      {submitError && <Alert>{submitError}</Alert>}
      {note && <Alert variant="success">{note}</Alert>}

      <TextField id="name" name="name" label="Role name" value={values.name} onChange={onChange} error={errors.name} />
      <TextField
        id="code"
        name="code"
        label="Role code"
        value={values.code}
        onChange={onCodeChange}
        error={errors.code}
        disabled={isEdit}
        hint={isEdit ? "The code can't be changed." : 'A short unique ID. Capital letters and underscores only.'}
      />
      <div className="field">
        <label htmlFor="description">Description</label>
        <textarea
          id="description"
          name="description"
          rows={3}
          className={`input${errors.description ? ' input-error' : ''}`}
          value={values.description}
          onChange={onChange}
        />
        {errors.description && <p className="field-error">{errors.description}</p>}
      </div>
      {isEdit && (
        <div className="field">
          <label htmlFor="status">Status</label>
          <select id="status" name="status" className="input" value={values.status} onChange={onChange}>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
          </select>
        </div>
      )}

      <div className="form-actions">
        <button type="submit" className="btn btn-primary" disabled={submitting}>
          {submitting ? 'Saving...' : isEdit ? 'Save changes' : 'Create role'}
        </button>
        {onCancel ? (
          <button type="button" className="btn btn-secondary" onClick={onCancel}>Cancel</button>
        ) : (
          <Link to={cancelTo} className="btn btn-secondary">Cancel</Link>
        )}
      </div>
    </form>
  );
}

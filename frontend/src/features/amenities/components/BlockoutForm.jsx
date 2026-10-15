import { useState } from 'react';
import TextField from '../../../components/ui/TextField';
import Alert from '../../../components/ui/Alert';

const toLocalInput = (date) => {
  const d = new Date(date);
  const pad = (v) => String(v).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

export default function BlockoutForm({ amenityId, onSubmit, onCancel, saving, error }) {
  const [values, setValues] = useState({ startAt: '', endAt: '', reason: '' });
  const [errors, setErrors] = useState({});

  const change = (event) => setValues((current) => ({ ...current, [event.target.name]: event.target.value }));

  const submit = (event) => {
    event.preventDefault();
    const next = {};
    if (!values.startAt) next.startAt = 'Choose a start date/time.';
    if (!values.endAt) next.endAt = 'Choose an end date/time.';
    if (values.startAt && values.endAt && new Date(values.endAt) <= new Date(values.startAt)) next.endAt = 'End must be after start.';
    setErrors(next);
    if (Object.keys(next).length) return;
    onSubmit({
      amenityId,
      startAt: new Date(values.startAt).toISOString(),
      endAt: new Date(values.endAt).toISOString(),
      reason: values.reason.trim() || null,
    });
  };

  return (
    <form onSubmit={submit} noValidate>
      {error && <Alert>{error}</Alert>}
      <TextField id="blockout-start" name="startAt" type="datetime-local" label="Starts" value={values.startAt} onChange={change} error={errors.startAt} />
      <TextField id="blockout-end" name="endAt" type="datetime-local" label="Ends" value={values.endAt} onChange={change} error={errors.endAt} />
      <TextField id="blockout-reason" name="reason" label="Reason (optional)" placeholder="e.g. Annual deep cleaning" value={values.reason} onChange={change} />
      <div className="form-actions">
        <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Saving...' : 'Create blockout'}</button>
        <button type="button" className="btn btn-secondary" onClick={onCancel} disabled={saving}>Cancel</button>
      </div>
    </form>
  );
}

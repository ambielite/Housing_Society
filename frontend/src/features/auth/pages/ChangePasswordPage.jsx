import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuth from '../../../app/providers/useAuth';
import * as authApi from '../api/auth.api';
import { getErrorMessage } from '../../../lib/axios';
import { passwordError } from '../../../utils/validators';
import PageContainer from '../../../components/layout/PageContainer';
import TextField from '../../../components/ui/TextField';
import Alert from '../../../components/ui/Alert';

export default function ChangePasswordPage() {
  const navigate = useNavigate();
  const { clearSession } = useAuth();
  const [values, setValues] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const onChange = (event) => setValues((v) => ({ ...v, [event.target.name]: event.target.value }));

  const validate = () => {
    const next = {};
    if (!values.currentPassword) next.currentPassword = 'Enter your current password.';
    const pwError = passwordError(values.newPassword);
    if (pwError) next.newPassword = pwError;
    else if (values.newPassword === values.currentPassword) next.newPassword = 'Choose a password different from the current one.';
    if (values.confirmPassword !== values.newPassword) next.confirmPassword = 'The passwords do not match.';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const onSubmit = async (event) => {
    event.preventDefault();
    setSubmitError('');
    if (!validate()) return;
    setSubmitting(true);
    try {
      await authApi.changePassword({ currentPassword: values.currentPassword, newPassword: values.newPassword });
      // The server ends every session after a password change, so sign in again.
      navigate('/login', { replace: true, state: { notice: 'Password changed. Sign in with your new password.' } });
      clearSession();
    } catch (err) {
      setSubmitError(getErrorMessage(err));
      setSubmitting(false);
    }
  };

  return (
    <PageContainer title="Change password" subtitle="You'll be signed out on all devices afterwards.">
      <form className="card form-narrow" onSubmit={onSubmit} noValidate>
        {submitError && <Alert>{submitError}</Alert>}
        <TextField
          id="currentPassword"
          name="currentPassword"
          type="password"
          label="Current password"
          autoComplete="current-password"
          value={values.currentPassword}
          onChange={onChange}
          error={errors.currentPassword}
        />
        <TextField
          id="newPassword"
          name="newPassword"
          type="password"
          label="New password"
          autoComplete="new-password"
          hint="8 to 128 characters."
          value={values.newPassword}
          onChange={onChange}
          error={errors.newPassword}
        />
        <TextField
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          label="Confirm new password"
          autoComplete="new-password"
          value={values.confirmPassword}
          onChange={onChange}
          error={errors.confirmPassword}
        />
        <button type="submit" className="btn btn-primary" disabled={submitting}>
          {submitting ? 'Saving...' : 'Change password'}
        </button>
      </form>
    </PageContainer>
  );
}

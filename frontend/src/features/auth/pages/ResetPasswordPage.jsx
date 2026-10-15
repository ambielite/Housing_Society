import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import * as authApi from '../api/auth.api';
import { getErrorMessage } from '../../../lib/axios';
import { passwordError } from '../../../utils/validators';
import AuthCard from '../components/AuthCard';
import TextField from '../../../components/ui/TextField';
import Alert from '../../../components/ui/Alert';

export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const tokenFromLink = searchParams.get('token') || '';

  const [values, setValues] = useState({ token: tokenFromLink, newPassword: '', confirmPassword: '' });
  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const onChange = (event) => setValues((v) => ({ ...v, [event.target.name]: event.target.value }));

  const validate = () => {
    const next = {};
    if (!values.token.trim()) next.token = 'Enter the reset token.';
    const pwError = passwordError(values.newPassword);
    if (pwError) next.newPassword = pwError;
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
      await authApi.resetPassword({ token: values.token.trim(), newPassword: values.newPassword });
      navigate('/login', { replace: true, state: { notice: 'Password reset. Sign in with your new password.' } });
    } catch (err) {
      setSubmitError(getErrorMessage(err));
      setSubmitting(false);
    }
  };

  return (
    <AuthCard title="Choose a new password" subtitle="The reset token works once and expires after 30 minutes.">
      <form onSubmit={onSubmit} noValidate>
        {submitError && <Alert>{submitError}</Alert>}
        {!tokenFromLink && (
          <TextField id="token" name="token" label="Reset token" value={values.token} onChange={onChange} error={errors.token} />
        )}
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
        <button type="submit" className="btn btn-primary btn-block" disabled={submitting}>
          {submitting ? 'Saving...' : 'Reset password'}
        </button>
      </form>
      <p className="auth-links">
        <Link to="/login">Back to sign in</Link>
      </p>
    </AuthCard>
  );
}

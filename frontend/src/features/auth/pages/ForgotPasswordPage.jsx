import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import * as authApi from '../api/auth.api';
import { getErrorMessage } from '../../../lib/axios';
import { isValidEmail, passwordError } from '../../../utils/validators';
import AuthCard from '../components/AuthCard';
import TextField from '../../../components/ui/TextField';
import Alert from '../../../components/ui/Alert';

export default function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [requested, setRequested] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const onRequestOtp = async (event) => {
    event.preventDefault();
    setError('');
    if (!isValidEmail(email)) {
      setFieldErrors({ email: 'Enter a valid email address.' });
      return;
    }
    setFieldErrors({});
    setSubmitting(true);
    try {
      await authApi.requestAdminPasswordResetOtp(email.trim());
      setRequested(true);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  const onResetPassword = async (event) => {
    event.preventDefault();
    setError('');
    const next = {};
    if (!/^\d{6}$/.test(otp)) next.otp = 'Enter the 6-digit code sent to your email.';
    const pwError = passwordError(newPassword);
    if (pwError) next.newPassword = pwError;
    if (confirmPassword !== newPassword) next.confirmPassword = 'The passwords do not match.';
    setFieldErrors(next);
    if (Object.keys(next).length) return;
    setSubmitting(true);
    try {
      await authApi.resetAdminPasswordWithOtp({ email: email.trim(), otp, newPassword });
      navigate('/login', { replace: true, state: { notice: 'Password reset. Sign in with your new password.' } });
    } catch (err) {
      setError(getErrorMessage(err));
      setSubmitting(false);
    }
  };

  return (
    <AuthCard variant="login" className={requested ? 'auth-card--recovery' : ''} title={requested ? 'Choose a new password' : 'Forgot Password?'} subtitle={requested ? 'Enter the verification code sent to your admin email, then set a new password.' : 'Enter your admin account email to receive a password reset code.'}>
      {error && <Alert>{error}</Alert>}
      {!requested ? (
        <form onSubmit={onRequestOtp} noValidate>
          <TextField id="email" type="email" label="Email Address" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} error={fieldErrors.email} />
          <button type="submit" className="btn btn-primary btn-block" disabled={submitting}>
            {submitting ? 'Sending...' : 'Send verification code'}
          </button>
        </form>
      ) : (
        <form onSubmit={onResetPassword} noValidate>
          <Alert variant="info">If this email belongs to an admin account, a verification code will be sent.</Alert>
          <TextField id="otp" label="6-digit verification code" inputMode="numeric" autoComplete="one-time-code" value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))} error={fieldErrors.otp} />
          <TextField id="newPassword" type="password" label="New password" autoComplete="new-password" hint="8 to 128 characters." value={newPassword} onChange={(e) => setNewPassword(e.target.value)} error={fieldErrors.newPassword} />
          <TextField id="confirmPassword" type="password" label="Confirm new password" autoComplete="new-password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} error={fieldErrors.confirmPassword} />
          <button type="submit" className="btn btn-primary btn-block" disabled={submitting}>
            {submitting ? 'Saving...' : 'Reset password'}
          </button>
        </form>
      )}
      <p className="auth-links"><Link to="/login">Back to sign in</Link></p>
      <div className="login-secure-note"><span aria-hidden="true">♧</span> Secure &amp; Trusted</div>
      <div className="login-copyright">Powered By <a href="https://ambielite.in/" target="_blank" rel="noopener noreferrer">Ambi Elite Pvt Ltd</a></div>
    </AuthCard>
  );
}

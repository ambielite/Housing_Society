import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import * as authApi from '../api/auth.api';
import { getErrorMessage } from '../../../lib/axios';
import { isValidEmail } from '../../../utils/validators';
import AuthCard from '../components/AuthCard';
import TextField from '../../../components/ui/TextField';
import Alert from '../../../components/ui/Alert';

export default function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [fieldError, setFieldError] = useState('');
  const [result, setResult] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async (event) => {
    event.preventDefault();
    setError('');
    if (!isValidEmail(email)) {
      setFieldError('Enter a valid email address.');
      return;
    }
    setFieldError('');
    setSubmitting(true);
    try {
      setResult(await authApi.forgotPassword(email.trim()));
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthCard title="Reset your password" subtitle="Enter your account email and we'll generate a reset token.">
      {result ? (
        <>
          <Alert variant="success">{result.message}</Alert>
          {/* The backend only returns devResetToken outside production (no email provider yet). */}
          {result.devResetToken && (
            <div className="dev-box">
              <p>Development only: email isn't connected yet, so use this token directly.</p>
              <button
                type="button"
                className="btn btn-primary btn-block"
                onClick={() => navigate(`/reset-password?token=${result.devResetToken}`)}
              >
                Continue to reset password
              </button>
            </div>
          )}
        </>
      ) : (
        <form onSubmit={onSubmit} noValidate>
          {error && <Alert>{error}</Alert>}
          <TextField
            id="email"
            type="email"
            label="Email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            error={fieldError}
          />
          <button type="submit" className="btn btn-primary btn-block" disabled={submitting}>
            {submitting ? 'Sending...' : 'Send reset token'}
          </button>
        </form>
      )}
      <p className="auth-links">
        <Link to="/login">Back to sign in</Link>
      </p>
    </AuthCard>
  );
}

import { useState } from 'react';
import { Link } from 'react-router-dom';
import useAuth from '../../../app/providers/useAuth';
import { getErrorMessage } from '../../../lib/axios';
import { isValidEmail } from '../../../utils/validators';
import TextField from '../../../components/ui/TextField';
import Alert from '../../../components/ui/Alert';

export default function LoginForm() {
  const { login } = useAuth();
  const [values, setValues] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const onChange = (event) => setValues((v) => ({ ...v, [event.target.name]: event.target.value }));

  const validate = () => {
    const next = {};
    if (!values.email.trim()) next.email = 'Enter your email address.';
    else if (!isValidEmail(values.email)) next.email = 'Enter a valid email address.';
    if (!values.password) next.password = 'Enter your password.';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const onSubmit = async (event) => {
    event.preventDefault();
    setSubmitError('');
    if (!validate()) return;
    setSubmitting(true);
    try {
      // On success AuthProvider stores the user and PublicOnlyRoute redirects.
      await login(values.email.trim(), values.password);
    } catch (error) {
      setSubmitError(getErrorMessage(error));
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={onSubmit} noValidate>
      {submitError && <Alert>{submitError}</Alert>}
      <TextField
        id="email"
        name="email"
        type="email"
        label="Email Address"
        autoComplete="username"
        value={values.email}
        onChange={onChange}
        error={errors.email}
      />
      <TextField
        id="password"
        name="password"
        type="password"
        label="Password"
        autoComplete="current-password"
        value={values.password}
        onChange={onChange}
        error={errors.password}
      />
      <div className="login-form-options">
        <label className="remember-me"><input type="checkbox" /> <span>Remember Me</span></label>
        <Link to="/forgot-password">Forgot Password?</Link>
      </div>
      <button type="submit" className="btn btn-primary btn-block" disabled={submitting}>
        {submitting ? 'Signing in...' : <><span aria-hidden="true">↪</span> Sign In</>}
      </button>
      <div className="login-secure-note"><span aria-hidden="true">♧</span> Secure &amp; Trusted</div>
      <div className="login-copyright">Powered By <a href="https://ambielite.in/" target="_blank" rel="noopener noreferrer">Ambi Elite Pvt Ltd</a></div>
    </form>
  );
}

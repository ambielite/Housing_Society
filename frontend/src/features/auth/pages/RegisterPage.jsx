import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import * as authApi from '../api/auth.api';
import { getErrorMessage } from '../../../lib/axios';
import { isValidEmail, passwordError } from '../../../utils/validators';
import AuthCard from '../components/AuthCard';
import TextField from '../../../components/ui/TextField';
import Alert from '../../../components/ui/Alert';

const PHONE_PATTERN = /^[0-9+\-\s()]{6,20}$/;

export default function RegisterPage() {
  const navigate = useNavigate();
  const [values, setValues] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  });
  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const onChange = (event) => setValues((v) => ({ ...v, [event.target.name]: event.target.value }));

  const validate = () => {
    const next = {};
    if (!values.firstName.trim()) next.firstName = 'Enter your first name.';
    else if (values.firstName.trim().length > 100) next.firstName = 'Use 100 characters or fewer.';
    if (values.lastName.trim().length > 100) next.lastName = 'Use 100 characters or fewer.';
    if (!values.email.trim()) next.email = 'Enter your email address.';
    else if (!isValidEmail(values.email)) next.email = 'Enter a valid email address.';
    if (values.phone.trim() && !PHONE_PATTERN.test(values.phone.trim())) next.phone = 'Enter a valid phone number.';
    const pwError = passwordError(values.password);
    if (pwError) next.password = pwError;
    if (values.confirmPassword !== values.password) next.confirmPassword = 'The passwords do not match.';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const onSubmit = async (event) => {
    event.preventDefault();
    setSubmitError('');
    if (!validate()) return;

    const payload = {
      email: values.email.trim(),
      password: values.password,
      firstName: values.firstName.trim(),
    };
    if (values.lastName.trim()) payload.lastName = values.lastName.trim();
    if (values.phone.trim()) payload.phone = values.phone.trim();

    setSubmitting(true);
    try {
      await authApi.register(payload);
      navigate('/login', {
        replace: true,
        state: { notice: 'Account created. An administrator needs to give you a role before you can use the system.' },
      });
    } catch (err) {
      setSubmitError(getErrorMessage(err));
      setSubmitting(false);
    }
  };

  return (
    <AuthCard title="Create an account" subtitle="An administrator will give you access after you sign up.">
      <form onSubmit={onSubmit} noValidate>
        {submitError && <Alert>{submitError}</Alert>}
        <div className="form-grid">
          <TextField id="firstName" name="firstName" label="First name" autoComplete="given-name" value={values.firstName} onChange={onChange} error={errors.firstName} />
          <TextField id="lastName" name="lastName" label="Last name" autoComplete="family-name" value={values.lastName} onChange={onChange} error={errors.lastName} />
        </div>
        <TextField id="email" name="email" type="email" label="Email" autoComplete="email" value={values.email} onChange={onChange} error={errors.email} />
        <TextField id="phone" name="phone" type="tel" label="Phone (optional)" autoComplete="tel" value={values.phone} onChange={onChange} error={errors.phone} />
        <TextField
          id="password"
          name="password"
          type="password"
          label="Password"
          autoComplete="new-password"
          hint="8 to 128 characters."
          value={values.password}
          onChange={onChange}
          error={errors.password}
        />
        <TextField
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          label="Confirm password"
          autoComplete="new-password"
          value={values.confirmPassword}
          onChange={onChange}
          error={errors.confirmPassword}
        />
        <button type="submit" className="btn btn-primary btn-block" disabled={submitting}>
          {submitting ? 'Creating account...' : 'Create account'}
        </button>
      </form>
      <p className="auth-links">
        Already have an account? <Link to="/login">Sign in</Link>
      </p>
    </AuthCard>
  );
}

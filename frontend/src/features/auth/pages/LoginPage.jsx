import { useLocation } from 'react-router-dom';
import AuthCard from '../components/AuthCard';
import LoginForm from '../components/LoginForm';
import Alert from '../../../components/ui/Alert';

export default function LoginPage() {
  const notice = useLocation().state?.notice;

  return (
    <AuthCard variant="login" title="SIGN IN" subtitle="Sign in to access your society dashboard">
      {notice && <Alert variant="info">{notice}</Alert>}
      <LoginForm />
    </AuthCard>
  );
}

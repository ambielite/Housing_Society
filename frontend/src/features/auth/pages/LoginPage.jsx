import { useLocation } from 'react-router-dom';
import AuthCard from '../components/AuthCard';
import LoginForm from '../components/LoginForm';
import Alert from '../../../components/ui/Alert';

export default function LoginPage() {
  const notice = useLocation().state?.notice;

  return (
    <AuthCard title="Sign in" subtitle="Use the email and password your society administrator gave you.">
      {notice && <Alert variant="success">{notice}</Alert>}
      <LoginForm />
    </AuthCard>
  );
}

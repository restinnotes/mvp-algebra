import { checkAuth } from '@/app/actions';
import LoginForm from './LoginForm';

export default async function PasswordGate({ children }: { children: React.ReactNode }) {
  const isAuth = await checkAuth();

  if (isAuth) {
    return <>{children}</>;
  }

  return <LoginForm />;
}
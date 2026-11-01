import { LoginForm } from './login-form';
import { safeNext } from '../safe-next';

export const metadata = { title: 'Log in — RepAI' };

export default async function LoginPage({ searchParams }) {
  const params = await searchParams;
  return (
    <LoginForm
      next={safeNext(params?.next)}
      authError={params?.error === 'auth' }
    />
  );
}

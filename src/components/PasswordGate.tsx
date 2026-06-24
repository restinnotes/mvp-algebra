import { cookies } from 'next/headers';
import crypto from 'crypto';
import PasswordForm from './PasswordForm';

const SECRET_KEY = process.env.SESSION_SECRET || 'fallback-secret-for-demo-purposes-only';

function verifySignature(payload: string, signature: string): boolean {
    const expectedSignature = crypto.createHmac('sha256', SECRET_KEY).update(payload).digest('hex');
    const expectedBuffer = Buffer.from(expectedSignature, 'hex');
    const actualBuffer = Buffer.from(signature, 'hex');

    if (expectedBuffer.length !== actualBuffer.length) {
        return false;
    }

    return crypto.timingSafeEqual(expectedBuffer, actualBuffer);
}

export default async function PasswordGate({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get('auth_session');

  let isAuthenticated = false;

  if (sessionCookie && sessionCookie.value) {
      const parts = sessionCookie.value.split('.');
      if (parts.length === 2) {
          const [payload, signature] = parts;
          isAuthenticated = verifySignature(payload, signature);
      }
  }

  if (isAuthenticated) {
    return <>{children}</>;
  }

  return <PasswordForm />;
}

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import crypto from 'crypto';

const APP_PASSWORD = process.env.APP_PASSWORD || process.env.NEXT_PUBLIC_APP_PASSWORD || '';
const COOKIE_SECRET = process.env.COOKIE_SECRET || APP_PASSWORD;

function signCookie(payload: string): string {
  if (!COOKIE_SECRET) throw new Error('Cookie secret not configured');
  const hmac = crypto.createHmac('sha256', COOKIE_SECRET);
  hmac.update(payload);
  return `${payload}.${hmac.digest('hex')}`;
}

function verifyCookie(cookieValue: string): boolean {
  if (!COOKIE_SECRET) return false;

  const parts = cookieValue.split('.');
  if (parts.length !== 2) return false;
  const [payload, signature] = parts;

  if (payload !== 'authenticated') return false;

  const expectedSignature = crypto.createHmac('sha256', COOKIE_SECRET).update(payload).digest('hex');
  const sigBuf = Buffer.from(signature);
  const expectedBuf = Buffer.from(expectedSignature);

  if (sigBuf.length !== expectedBuf.length) return false;
  return crypto.timingSafeEqual(sigBuf, expectedBuf);
}

export async function GET(req: NextRequest) {
  const cookieStore = await cookies();
  const authCookie = cookieStore.get('auth_session');

  if (authCookie && verifyCookie(authCookie.value)) {
    return NextResponse.json({ authenticated: true });
  }

  return NextResponse.json({ authenticated: false }, { status: 401 });
}

export async function POST(req: NextRequest) {
  try {
    const { password } = await req.json();

    if (!APP_PASSWORD) {
      return NextResponse.json({ error: '密码未配置，请联系管理员' }, { status: 500 });
    }

    if (password === APP_PASSWORD) {
      const cookieStore = await cookies();
      const signedValue = signCookie('authenticated');

      cookieStore.set('auth_session', signedValue, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        path: '/',
        maxAge: 60 * 60 * 24 * 7 // 1 week
      });

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: '密码错误，请重试' }, { status: 401 });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

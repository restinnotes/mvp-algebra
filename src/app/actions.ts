'use server';

import { cookies } from 'next/headers';
import crypto from 'crypto';

const AUTH_COOKIE = 'auth_session';
const SECRET = process.env.APP_SECRET || 'fallback-secret-for-dev-only-change-in-prod';
const APP_PASSWORD = process.env.APP_PASSWORD;

function sign(payload: string): string {
  const hmac = crypto.createHmac('sha256', SECRET);
  hmac.update(payload);
  return `${payload}.${hmac.digest('hex')}`;
}

function verify(cookieValue: string | undefined): boolean {
  if (!cookieValue) return false;
  const [payload, signature] = cookieValue.split('.');
  if (!payload || !signature) return false;

  const expectedSignature = crypto.createHmac('sha256', SECRET).update(payload).digest('hex');
  const sigBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expectedSignature);

  if (sigBuffer.length !== expectedBuffer.length) return false;
  return crypto.timingSafeEqual(sigBuffer, expectedBuffer) && payload === 'authenticated';
}

export async function login(password: string): Promise<{ success: boolean; error?: string }> {
  if (!APP_PASSWORD) {
    return { success: false, error: '密码未配置，请联系管理员' };
  }

  if (password !== APP_PASSWORD) {
    return { success: false, error: '密码错误，请重试' };
  }

  const signedValue = sign('authenticated');
  const cookieStore = await cookies();
  cookieStore.set(AUTH_COOKIE, signedValue, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    maxAge: 60 * 60 * 24 * 7 // 1 week
  });

  return { success: true };
}

export async function checkAuth(): Promise<boolean> {
  const cookieStore = await cookies();
  const authCookie = cookieStore.get(AUTH_COOKIE);
  return verify(authCookie?.value);
}

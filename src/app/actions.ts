'use server';

import { cookies } from 'next/headers';
import crypto from 'crypto';

const SECRET_KEY = process.env.APP_SECRET;
if (!SECRET_KEY && process.env.NODE_ENV === 'production') {
  console.error("CRITICAL: APP_SECRET is not set in production!");
}
const EFFECTIVE_SECRET = SECRET_KEY || crypto.randomBytes(32).toString('hex');
// Use server-side env variable, not NEXT_PUBLIC_
const APP_PASSWORD = process.env.APP_PASSWORD || process.env.NEXT_PUBLIC_APP_PASSWORD;

function createSignature(payload: string) {
  return crypto.createHmac('sha256', EFFECTIVE_SECRET).update(payload).digest('hex');
}

export async function verifyPassword(password: string) {
  if (!APP_PASSWORD) {
    return { error: '密码未配置，请联系管理员' };
  }

  if (password === APP_PASSWORD) {
    const payload = 'verified';
    const signature = createSignature(payload);
    const value = `${payload}.${signature}`;

    const cookieStore = await cookies();
    cookieStore.set('auth_token', value, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 * 24 * 7, // 1 week
    });

    return { success: true };
  }

  return { error: '密码错误，请重试' };
}

export async function checkAuth() {
  const cookieStore = await cookies();
  const token = cookieStore.get('auth_token')?.value;

  if (!token) return false;

  const [payload, signature] = token.split('.');
  if (!payload || !signature) return false;

  const expectedSignature = createSignature(payload);

  const sigBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expectedSignature);

  if (sigBuffer.length !== expectedBuffer.length) return false;

  return crypto.timingSafeEqual(sigBuffer, expectedBuffer) && payload === 'verified';
}
'use server';

import { cookies } from 'next/headers';
import crypto from 'crypto';

const SECRET_KEY = process.env.APP_SECRET_KEY || 'default_secret_key_for_dev_only';
const APP_PASSWORD = process.env.NEXT_PUBLIC_APP_PASSWORD;

function generateSignature(payload: string): string {
  return crypto.createHmac('sha256', SECRET_KEY).update(payload).digest('hex');
}

export async function verifyPassword(password: string): Promise<{ success: boolean; error?: string }> {
  if (!APP_PASSWORD) {
    return { success: false, error: '密码未配置，请联系管理员' };
  }
  if (password === APP_PASSWORD) {
    const expires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
    const payload = `auth_true_${expires.getTime()}`;
    const signature = generateSignature(payload);

    const cookieStore = await cookies();
    cookieStore.set('auth_token', `${payload}.${signature}`, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      expires: expires,
      path: '/',
    });
    return { success: true };
  }
  return { success: false, error: '密码错误，请重试' };
}

export async function checkAuth(): Promise<boolean> {
  const cookieStore = await cookies();
  const token = cookieStore.get('auth_token')?.value;

  if (!token) return false;

  const [payload, signature] = token.split('.');
  if (!payload || !signature) return false;

  const expectedSignature = generateSignature(payload);

  const sigBuf = Buffer.from(signature);
  const expectedBuf = Buffer.from(expectedSignature);

  if (sigBuf.length !== expectedBuf.length) return false;

  if (!crypto.timingSafeEqual(sigBuf, expectedBuf)) {
    return false;
  }

  const parts = payload.split('_');
  const expTime = parseInt(parts[2] || '0', 10);

  if (Date.now() > expTime) {
    return false;
  }

  return true;
}

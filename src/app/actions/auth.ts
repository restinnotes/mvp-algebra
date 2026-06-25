'use server';

import { cookies } from 'next/headers';
import crypto from 'crypto';

const AUTH_SECRET = process.env.AUTH_SECRET || 'dev_secret_key_123';
const APP_PASSWORD = process.env.APP_PASSWORD || process.env.NEXT_PUBLIC_APP_PASSWORD;

function sign(value: string): string {
    const hmac = crypto.createHmac('sha256', AUTH_SECRET);
    hmac.update(value);
    return `${value}.${hmac.digest('hex')}`;
}

export async function verifyPassword(password: string): Promise<{ success: boolean; error?: string }> {
    if (!APP_PASSWORD) {
        return { success: false, error: '密码未配置，请联系管理员' };
    }

    if (password === APP_PASSWORD) {
        const cookieStore = await cookies();
        cookieStore.set('auth_session', sign('authenticated'), {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            path: '/',
            maxAge: 60 * 60 * 24 * 7 // 1 week
        });
        return { success: true };
    }

    return { success: false, error: '密码错误，请重试' };
}

export async function isAuthenticated(): Promise<boolean> {
    const cookieStore = await cookies();
    const cookie = cookieStore.get('auth_session');
    if (!cookie?.value) return false;

    const [val, sig] = cookie.value.split('.');
    if (val !== 'authenticated' || !sig) return false;

    const hmac = crypto.createHmac('sha256', AUTH_SECRET);
    hmac.update(val);
    const expectedSig = hmac.digest('hex');

    const sigBuffer = Buffer.from(sig, 'hex');
    const expectedBuffer = Buffer.from(expectedSig, 'hex');

    if (sigBuffer.length !== expectedBuffer.length) return false;

    return crypto.timingSafeEqual(sigBuffer, expectedBuffer);
}

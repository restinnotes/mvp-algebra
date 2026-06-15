'use server';

import { cookies } from 'next/headers';
import crypto from 'crypto';

const APP_PASSWORD = process.env.APP_PASSWORD || process.env.NEXT_PUBLIC_APP_PASSWORD;
const SECRET_KEY = process.env.SESSION_SECRET || 'fallback-secret-for-local-dev-only-change-in-prod';

function signPayload(payload: string): string {
    return crypto.createHmac('sha256', SECRET_KEY).update(payload).digest('hex');
}

export async function loginWithPassword(password: string) {
    if (!APP_PASSWORD) {
        return { error: '密码未配置，请联系管理员' };
    }

    if (password === APP_PASSWORD) {
        const expires = Date.now() + 1000 * 60 * 60 * 24; // 1 day
        const payload = `auth:${expires}`;
        const signature = signPayload(payload);
        const value = `${payload}.${signature}`;

        const cookieStore = await cookies();
        cookieStore.set('auth_session', value, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            path: '/',
            maxAge: 60 * 60 * 24
        });

        return { success: true };
    }

    return { error: '密码错误，请重试' };
}

export async function checkAuthStatus(): Promise<boolean> {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('auth_session');

    if (!sessionCookie || !sessionCookie.value) {
        return false;
    }

    const parts = sessionCookie.value.split('.');
    if (parts.length !== 2) return false;

    const [payload, signature] = parts;
    const expectedSignature = signPayload(payload);

    const sigBuffer = Buffer.from(signature, 'hex');
    const expectedBuffer = Buffer.from(expectedSignature, 'hex');

    if (sigBuffer.length !== expectedBuffer.length) {
        return false;
    }

    if (!crypto.timingSafeEqual(sigBuffer, expectedBuffer)) {
        return false;
    }

    const expiresStr = payload.split(':')[1];
    if (Date.now() > parseInt(expiresStr, 10)) {
        return false;
    }

    return true;
}

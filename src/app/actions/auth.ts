'use server';

import { cookies } from 'next/headers';
import crypto from 'crypto';

const APP_PASSWORD = process.env.APP_PASSWORD || process.env.NEXT_PUBLIC_APP_PASSWORD;
const SECRET_KEY = process.env.SESSION_SECRET || 'fallback-secret-for-demo-purposes-only';

function sign(payload: string): string {
    return crypto.createHmac('sha256', SECRET_KEY).update(payload).digest('hex');
}

export async function verifyPassword(password: string): Promise<{ success: boolean; error?: string }> {
    if (!APP_PASSWORD) {
        return { success: false, error: '密码未配置，请联系管理员' };
    }

    if (password === APP_PASSWORD) {
        const payload = `auth_${Date.now()}`;
        const signature = sign(payload);
        const cookieValue = `${payload}.${signature}`;

        const cookieStore = await cookies();
        cookieStore.set('auth_session', cookieValue, {
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

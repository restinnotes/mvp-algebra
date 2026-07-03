import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { password } = body;

        // Use server-side environment variable (no NEXT_PUBLIC_ prefix)
        // Fallback to NEXT_PUBLIC_ for backwards compatibility if needed, but we shouldn't
        const correctPassword = process.env.APP_PASSWORD || process.env.NEXT_PUBLIC_APP_PASSWORD;

        if (!correctPassword) {
            return NextResponse.json({ error: '密码未配置，请联系管理员' }, { status: 500 });
        }

        if (password === correctPassword) {
            return NextResponse.json({ success: true });
        } else {
            return NextResponse.json({ error: '密码错误，请重试' }, { status: 401 });
        }
    } catch (error: unknown) {
        return NextResponse.json({ error: '网络错误，请稍后重试' }, { status: 500 });
    }
}

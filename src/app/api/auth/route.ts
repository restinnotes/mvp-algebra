import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { password } = await req.json();
    const correctPassword = process.env.APP_PASSWORD || process.env.NEXT_PUBLIC_APP_PASSWORD;

    if (!correctPassword) {
      return NextResponse.json({ error: '密码未配置，请联系管理员' }, { status: 400 });
    }

    if (password === correctPassword) {
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: '密码错误，请重试' }, { status: 401 });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

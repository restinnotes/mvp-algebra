import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { password } = await req.json();

    // Check against the server-side only APP_PASSWORD
    // We also fallback to NEXT_PUBLIC_APP_PASSWORD for backwards compatibility if APP_PASSWORD isn't set yet,
    // but the environment variable should be migrated to APP_PASSWORD.
    const validPassword = process.env.APP_PASSWORD || process.env.NEXT_PUBLIC_APP_PASSWORD;

    if (!validPassword) {
      return NextResponse.json({ error: 'Password not configured' }, { status: 500 });
    }

    if (password === validPassword) {
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Invalid password' }, { status: 401 });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

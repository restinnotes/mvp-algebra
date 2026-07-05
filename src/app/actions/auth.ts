'use server';

export async function verifyAppPassword(password: string) {
  // Support both for backward compatibility during transition
  const expectedPassword = process.env.APP_PASSWORD || process.env.NEXT_PUBLIC_APP_PASSWORD;

  if (!expectedPassword) {
    return { error: '密码未配置，请联系管理员' };
  }

  if (password === expectedPassword) {
    return { success: true };
  }

  return { error: '密码错误，请重试' };
}

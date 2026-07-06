'use server';

export async function verifyPassword(password: string) {
  // Use NEXT_PUBLIC_APP_PASSWORD as fallback just in case the environment isn't fully migrated yet,
  // but ideally it should just be APP_PASSWORD going forward to prevent leakage to the browser.
  const appPassword = process.env.APP_PASSWORD || process.env.NEXT_PUBLIC_APP_PASSWORD;

  if (!appPassword) {
    return { error: '密码未配置，请联系管理员' };
  }

  if (password === appPassword) {
    return { success: true };
  }

  return { error: '密码错误，请重试' };
}
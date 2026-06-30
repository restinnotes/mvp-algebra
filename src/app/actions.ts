'use server'

export async function verifyAppPassword(password: string): Promise<{ success: boolean, error?: string }> {
  // Use APP_PASSWORD securely on the server.
  // Fallback to NEXT_PUBLIC_APP_PASSWORD only for backwards compatibility,
  // but note that exposing secrets via NEXT_PUBLIC_ is a security risk.
  const correctPassword = process.env.APP_PASSWORD || process.env.NEXT_PUBLIC_APP_PASSWORD;

  if (!correctPassword) {
    return { success: false, error: '密码未配置，请联系管理员' };
  }

  if (password === correctPassword) {
    return { success: true };
  }

  return { success: false, error: '密码错误，请重试' };
}

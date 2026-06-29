'use server';

export async function verifyPassword(password: string): Promise<boolean> {
  const APP_PASSWORD = process.env.NEXT_PUBLIC_APP_PASSWORD || process.env.APP_PASSWORD;

  if (!APP_PASSWORD) {
    // If no password is set, we might reject or accept depending on policy.
    // The previous implementation would reject.
    return false;
  }

  return password === APP_PASSWORD;
}

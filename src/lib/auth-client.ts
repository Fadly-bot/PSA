import { createAuthClient } from 'better-auth/react';

/**
 * Client-side Better Auth instance.
 *
 * baseURL resolution — this was the source of the "Failed to fetch" error
 * on production:
 *  - Uses NEXT_PUBLIC_BETTER_AUTH_URL when set (e.g. a dedicated API domain).
 *  - Otherwise falls back to the SAME origin the page is served from
 *    (window.location.origin), guaranteeing same-origin requests even when
 *    the env var is missing or was set after the last Vercel build.
 *
 * NEVER hardcode `http://localhost:3000` as the fallback: on an https page
 * the browser blocks those requests as mixed content and every fetch
 * rejects with "Failed to fetch". Better Auth core also does not send CORS
 * headers, so cross-origin requests are silently blocked in the browser.
 */
const envBaseUrl = process.env.NEXT_PUBLIC_BETTER_AUTH_URL
  ?.trim()
  .replace(/\/+$/, '');
const baseURL =
  envBaseUrl || (typeof window !== 'undefined' ? window.location.origin : undefined);

export const authClient = createAuthClient({ baseURL });

export const signOut = () => authClient.signOut();

export type { Session } from 'better-auth';

/** Friendly Indonesian messages for known Better Auth error codes. */
const AUTH_ERROR_MESSAGES: Record<string, string> = {
  USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL:
    'Email sudah terdaftar. Silakan gunakan email lain.',
  INVALID_EMAIL_OR_PASSWORD: 'Email atau kata sandi salah.',
  INVALID_EMAIL: 'Format email tidak valid.',
  INVALID_PASSWORD: 'Kata sandi tidak valid.',
  PASSWORD_TOO_SHORT: 'Kata sandi terlalu pendek.',
  PASSWORD_TOO_LONG: 'Kata sandi terlalu panjang.',
  USER_NOT_FOUND: 'Pengguna tidak ditemukan.',
};

/**
 * Convert a Better Auth error (`res.error`) or a thrown network error into a
 * clear, user-facing message. Raw browser errors such as "Failed to fetch"
 * (CORS / mixed content / offline) are translated into an actionable hint
 * instead of being shown verbatim.
 */
export function getAuthErrorMessage(error: unknown): string {
  if (error && typeof error === 'object') {
    const e = error as { message?: unknown; code?: unknown };
    if (typeof e.code === 'string' && AUTH_ERROR_MESSAGES[e.code]) {
      return AUTH_ERROR_MESSAGES[e.code];
    }
    if (typeof e.message === 'string' && e.message.trim()) {
      const lower = e.message.toLowerCase();
      if (
        lower.includes('failed to fetch') ||
        lower.includes('fetch failed') ||
        lower.includes('networkerror') ||
        lower.includes('network error') ||
        lower.includes('load failed') ||
        lower.includes('offline')
      ) {
        return 'Tidak dapat terhubung ke server. Periksa koneksi internet Anda, lalu coba lagi.';
      }
      return e.message;
    }
  }
  if (typeof error === 'string' && error.trim()) return error;
  return 'Terjadi kesalahan. Silakan coba lagi.';
}

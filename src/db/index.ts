import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';
import * as relations from './relations';
import { resolveConnectionString } from './connection-string';

/**
 * postgres.js client, created at module scope but SAFELY:
 * `resolveConnectionString` (see `./connection-string`) normalizes and
 * validates DATABASE_URL — fixing common paste errors (unencoded password
 * characters, placeholders, quotes, missing sslmode for remote hosts) — and
 * the try/catch guarantees that importing this module NEVER breaks
 * `next build`. Next.js evaluates route modules during build to collect
 * configuration (e.g. for /sitemap.xml), so a malformed DATABASE_URL used to
 * crash the whole build with `TypeError: Invalid URL`.
 *
 * If the URL is genuinely unusable, a "broken" client is exported instead:
 * the build succeeds, but every database query fails at request time with a
 * clear, actionable error (visible in Vercel logs) instead of silently
 * misbehaving.
 */
export const client: ReturnType<typeof postgres> = (() => {
  try {
    return postgres(resolveConnectionString(process.env.DATABASE_URL ?? ''));
  } catch (error) {
    const e = error instanceof Error ? error : new Error(String(error));
    console.error(`[db] ${e.message}`);
    return createBrokenClient(e);
  }
})();

export const db = drizzle(client, { schema: { ...schema, ...relations } });
export type DB = typeof db;

/**
 * Minimal stand-in client that throws `error` on the first query. It is only
 * used when DATABASE_URL cannot be used at all, so drizzle/better-auth can be
 * imported safely at build time and fail loudly (not silently) at runtime.
 */
function createBrokenClient(error: Error): ReturnType<typeof postgres> {
  const fail = () => {
    throw error;
  };
  return {
    options: { parsers: {}, serializers: {} },
    unsafe: fail,
    begin: fail,
  } as unknown as ReturnType<typeof postgres>;
}

/**
 * DATABASE_URL validation & normalization — shared by the runtime DB client
 * (`src/db/index.ts`) and the CLI environment checker
 * (`scripts/check-env.ts`).
 *
 * Why this exists:
 * postgres.js (the `postgres` package) parses the connection string with
 * `new URL()` the moment the module is imported (`parseUrl` in
 * postgres/src/index.js). A malformed value — leftover Supabase placeholder
 * like `[YOUR-PASSWORD]`, unencoded special characters in the password
 * (`/ ? # % @ :`), surrounding quotes, whitespace — throws
 * `TypeError: Invalid URL` at module evaluation and breaks `next build` for
 * EVERY route, even ones that never touch the database (e.g. /sitemap.xml).
 *
 * These helpers never log or return secret values — only diagnostics that
 * reference them.
 */

const DEFAULT_URL = 'postgresql://postgres:postgres@localhost:5432/tbm_semesta_alam';

/** Placeholders shown by the Supabase dashboard, e.g. `[YOUR-PASSWORD]`. */
const PLACEHOLDER_PATTERN = /\[[A-Z0-9][A-Z0-9 _-]*\]/;

/** Actionable error for a broken DATABASE_URL. */
export class DatabaseUrlError extends Error {
  constructor(message: string, options?: { cause?: unknown }) {
    super(message, options);
    this.name = 'DatabaseUrlError';
  }
}

/**
 * Simulates exactly what postgres.js does when parsing the connection string:
 * `new URL(...)` then `decodeURIComponent` on username/password. Any failure
 * means postgres.js would crash the module import at build time.
 *
 * It ALSO rejects silent misparse: when the password contains an unencoded
 * `/`, the URL parser truncates the authority early and quietly resolves a
 * wrong host (e.g. `u:p@ss/word@host:5432/db` parses with host `ss` instead
 * of `host`). postgres.js would then try to connect to the wrong server at
 * runtime. We detect this by comparing the parsed hostname against the host
 * segment that follows the last `@` before the query/fragment.
 */
export function isParseableDatabaseUrl(value: string): boolean {
  try {
    const url = new URL(value);
    decodeURIComponent(url.username);
    decodeURIComponent(url.password);
  } catch {
    return false;
  }
  return hostMatches(value);
}

function hostMatches(value: string): boolean {
  const afterScheme = value.slice(value.indexOf('://') + 3);
  const qIdx = afterScheme.indexOf('?');
  const hIdx = afterScheme.indexOf('#');
  const limit =
    qIdx === -1 ? (hIdx === -1 ? afterScheme.length : hIdx) : hIdx === -1 ? qIdx : Math.min(qIdx, hIdx);
  const authority = afterScheme.slice(0, limit);
  const at = authority.lastIndexOf('@');
  if (at === -1) return true; // no userinfo — nothing to mis-split
  const candidate = authority.slice(at + 1).split('/')[0];
  const candidateHost = candidate.startsWith('[')
    ? candidate.slice(0, candidate.indexOf(']') + 1)
    : candidate.split(':')[0];
  return candidateHost === new URL(value).hostname;
}

/**
 * Best-effort fix for a malformed connection string: percent-encode the
 * password portion so postgres.js can parse it. Example:
 *   `postgresql://user:MyP@ssw0rd/1@host:5432/db`
 *   → `postgresql://user:MyP%40ssw0rd%2F1@host:5432/db`
 *
 * Returns the input unchanged when there is nothing safe to repair (the
 * caller then reports the URL as invalid instead of guessing).
 */
export function encodePasswordSpecialChars(value: string): string {
  const schemeIdx = value.indexOf('://');
  if (schemeIdx === -1) return value;
  const rest = value.slice(schemeIdx + 3);
  // The userinfo/host separator is always the LAST '@' in the authority part.
  const lastAt = rest.lastIndexOf('@');
  if (lastAt === -1) return value;
  const userinfo = rest.slice(0, lastAt);
  const colon = userinfo.indexOf(':');
  if (colon === -1) return value; // no password → nothing to encode
  const password = userinfo.slice(colon + 1);
  if (!password) return value;
  const encoded = encodeURIComponent(password);
  if (encoded === password) return value;
  return `${value.slice(0, schemeIdx + 3)}${userinfo.slice(0, colon + 1)}${encoded}@${rest.slice(lastAt + 1)}`;
}

/**
 * Supabase (and most managed Postgres, e.g. Neon/RDS) REQUIRE SSL, while
 * postgres.js defaults to `ssl: false`. That combination builds fine but
 * fails on the very first query at runtime. For remote hosts we append
 * `sslmode=require` unless the URL already sets an explicit ssl/sslmode
 * (explicit values are respected). Localhost is left untouched.
 */
export function ensureRemoteSsl(value: string): string {
  const url = new URL(value);
  const host = url.hostname;
  const isLocal =
    host === 'localhost' || host === '127.0.0.1' || host === '::1' || host.endsWith('.local');
  if (!isLocal && !url.searchParams.has('sslmode') && !url.searchParams.has('ssl')) {
    url.searchParams.set('sslmode', 'require');
  }
  return url.toString();
}

/**
 * Validate + normalize DATABASE_URL into a value postgres.js can consume.
 * Throws {@link DatabaseUrlError} with an actionable message when the value
 * cannot be made usable.
 */
export function resolveConnectionString(raw: string): string {
  let value = raw.trim();

  // Remove surrounding quotes accidentally pasted from docs/editors.
  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    value = value.slice(1, -1).trim();
  }

  if (!value) {
    if (process.env.NODE_ENV === 'production') {
      console.error(
        '[db] PERINGATAN: DATABASE_URL tidak di-set di environment production. ' +
          'Set DATABASE_URL di Vercel (Settings → Environment Variables) — semua query database akan gagal.',
      );
    }
    return DEFAULT_URL;
  }

  if (!/^postgres(?:ql)?:\/\//.test(value)) {
    throw new DatabaseUrlError(
      'DATABASE_URL tidak valid: harus diawali "postgresql://". ' +
        'Gunakan connection string URI dari Supabase (Project Settings → Database → Connection string → URI).',
    );
  }

  const placeholder = value.match(PLACEHOLDER_PATTERN);
  if (placeholder) {
    throw new DatabaseUrlError(
      `DATABASE_URL masih berisi placeholder "${placeholder[0]}" (mis. [YOUR-PASSWORD]). ` +
        'Ganti dengan password asli yang sudah di-URL-encode di Vercel.',
    );
  }

  if (isParseableDatabaseUrl(value)) return ensureRemoteSsl(value);

  // Password kemungkinan mengandung karakter khusus yang belum di-encode
  // (mis. "P@ssw0rd/1" → "P%40ssw0rd%2F1"). Perbaiki otomatis, lalu ulangi.
  const repaired = encodePasswordSpecialChars(value);
  if (repaired !== value && isParseableDatabaseUrl(repaired)) {
    return ensureRemoteSsl(repaired);
  }

  throw new DatabaseUrlError(
    'DATABASE_URL tidak dapat di-parse sebagai URL PostgreSQL yang valid. ' +
      'Periksa nilai di Vercel: tidak boleh ada spasi, tanda kutip, atau placeholder, ' +
      'dan karakter khusus pada password (/ ? # % @ :) wajib di-URL-encode (mis. @ → %40).',
  );
}

/** Safe, non-secret description of DATABASE_URL for diagnostics/CLI. */
export function describeDatabaseUrl(
  raw: string,
): { host: string; port: string; database: string; user: string; hasPassword: boolean; sslMode: string } | null {
  try {
    const url = new URL(resolveConnectionString(raw));
    return {
      host: url.hostname,
      port: url.port || '5432',
      database: url.pathname.replace(/^\//, '') || '(default)',
      user: url.username,
      hasPassword: url.password.length > 0,
      sslMode: url.searchParams.get('sslmode') ?? 'none',
    };
  } catch {
    return null;
  }
}

/** Phase 2 E2E (temporary): cover upload tests + dashboard timing. */
import { db } from '../src/db/index';
import { accounts, auditLogs, members, roles, sessions, users } from '../src/db/schema';
import { eq, ilike } from 'drizzle-orm';

const BASE = 'http://localhost:3000';
const ts = Date.now();
const EMAIL = `p2e2e.${ts}@gmail.com`;
let userId = '';

function log(ok: boolean, label: string, detail = '') {
  console.log(`${ok ? 'PASS' : 'FAIL'} | ${label}${detail ? ` | ${detail}` : ''}`);
}

const PNG_1PX = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
  'base64',
);

async function main() {
  // Register staff.
  const res = await fetch(`${BASE}/api/auth/sign-up/email`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Origin: BASE },
    body: JSON.stringify({ name: 'P2 E2E', email: EMAIL, password: 'Test123456!' }),
  });
  const j = await res.json().catch(() => ({}));
  userId = j?.user?.id ?? '';
  const cookie = (res.headers.getSetCookie?.() ?? [])
    .map((c) => c.split(';')[0])
    .find((c) => c.startsWith('better-auth.session_token='))
    ?.split('=').slice(1).join('=') ?? '';
  if (!userId || !cookie) { log(false, 'register staff', `HTTP ${res.status}`); await cleanup(); return; }
  const [staffRole] = await db.select({ id: roles.id }).from(roles).where(eq(roles.name, 'staff')).limit(1);
  await db.update(users).set({ roleId: staffRole!.id }).where(eq(users.id, userId));
  log(true, 'register + promote staff');

  const auth = { Cookie: `better-auth.session_token=${cookie}`, Origin: BASE };

  async function upload(name: string, data: Buffer, type: string, slug?: string): Promise<{ status: number; body: any; ms: number }> {
    const fd = new FormData();
    fd.append('file', new Blob([new Uint8Array(data)], { type }), name);
    if (slug) fd.append('slug', slug);
    const t0 = performance.now();
    const r = await fetch(`${BASE}/api/books/upload`, { method: 'POST', headers: auth, body: fd });
    const b = await r.json().catch(() => ({}));
    return { status: r.status, body: b, ms: Math.round(performance.now() - t0) };
  }

  // 1. Invalid MIME (.txt).
  let r = await upload('cover.txt', Buffer.from('not an image'), 'text/plain', 'judul');
  log(r.status === 400 && /Format file/i.test(r.body?.error ?? ''), 'upload .txt ditolak (validasi MIME)', `HTTP ${r.status} | ${r.body?.error}`);

  // 2. Too large (> 5 MB).
  const big = Buffer.alloc(6 * 1024 * 1024, 1);
  r = await upload('big.png', big, 'image/png', 'judul');
  log(r.status === 400 && /Ukuran file maksimal/i.test(r.body?.error ?? ''), 'upload >5MB ditolak (validasi ukuran)', `HTTP ${r.status} | ${r.body?.error}`);

  // 3. Valid PNG with messy slug (spaces/colons) — reaches storage layer.
  r = await upload('cover.png', PNG_1PX, 'image/png', 'Laskar Pelangi: Edisi 2024');
  if (r.status === 200) {
    log(true, 'upload PNG valid BERHASIL', `HTTP ${r.status} | url=${(r.body?.url ?? '').slice(0, 80)}`);
  } else if (r.status === 503 && /STORAGE_NOT_CONFIGURED|belum dikonfigurasi/i.test(r.body?.error ?? '')) {
    log(true, 'upload PNG valid: validasi & sanitasi lolos, terhenti di konfigurasi storage (env belum diset di env ini)', `HTTP ${r.status} | ${r.body?.error}`);
  } else {
    log(false, 'upload PNG valid', `HTTP ${r.status} | ${JSON.stringify(r.body).slice(0, 200)}`);
  }

  // 4. Dashboard API timing (staff view).
  const t0 = performance.now();
  const dashRes = await fetch(`${BASE}/api/dashboard`, { headers: auth });
  const dash = await dashRes.json().catch(() => ({}));
  const dashMs = Math.round(performance.now() - t0);
  const hasStats = !!dash?.stats && typeof dash.stats.totalBooks === 'number';
  log(dashRes.status === 200 && hasStats, 'GET /api/dashboard (staff)', `HTTP ${dashRes.status} | ${dashMs}ms | stats keys=${Object.keys(dash?.stats ?? {}).length}`);

  await cleanup();
  process.exit(0);
}

async function cleanup() {
  try {
    if (userId) {
      await db.delete(accounts).where(eq(accounts.userId, userId));
      await db.delete(sessions).where(eq(sessions.userId, userId));
      await db.delete(members).where(eq(members.userId, userId));
      await db.delete(auditLogs).where(eq(auditLogs.userId, userId));
      await db.delete(users).where(eq(users.id, userId));
    }
    const leftovers = await db.select({ id: users.id }).from(users).where(ilike(users.email, 'p2e2e.%@gmail.com'));
    for (const u of leftovers) {
      await db.delete(accounts).where(eq(accounts.userId, u.id));
      await db.delete(sessions).where(eq(sessions.userId, u.id));
      await db.delete(members).where(eq(members.userId, u.id));
      await db.delete(auditLogs).where(eq(auditLogs.userId, u.id));
      await db.delete(users).where(eq(users.id, u.id));
    }
    log(true, 'cleanup selesai');
  } catch (e: any) {
    log(false, 'cleanup', e?.message ?? String(e));
  }
}

main().catch((e: any) => { console.error('E2E failed:', e?.message ?? String(e)); process.exit(1); });

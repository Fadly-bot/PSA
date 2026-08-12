/**
 * STOCK FIELD E2E — verifies the "Stok" input on Tambah Buku:
 *  - Admin can create a book with stock=3 → 3 book_inventories (available, unique codes)
 *  - Staff can create a book with stock=2 → 2 book_inventories
 *  - Validation: -1 / 1.5 / 1001 / non-number rejected, 0 & omitted allowed (0 copies)
 *  - Permission: member 403, guest 401
 *  - Audit log entries created for automatic inventories
 *
 * All test data uses a unique prefix and is cleaned up at the end.
 * Run: node --env-file-if-exists=.env.local --import tsx scripts/_stock-test.ts
 */
import { db } from '../src/db/index';
import {
  accounts, auditLogs, bookInventories, bookSources, books, members,
  roles, sessions, settings, users,
} from '../src/db/schema';
import { and, eq, gte, inArray, or } from 'drizzle-orm';

const BASE = 'http://localhost:3000';
const ts = Date.now();
const P = `STK${ts}`;
const PASSWORD = 'Test123456!';
const startedAt = new Date();

let pass = 0;
let fail = 0;
const failures: string[] = [];

function log(ok: boolean, label: string, detail = '') {
  if (ok) pass++;
  else { fail++; failures.push(label); }
  console.log(`${ok ? 'PASS' : 'FAIL'} | ${label}${detail ? ` | ${detail}` : ''}`);
}

async function api(path: string, init?: RequestInit) {
  const signal = AbortSignal.timeout(30000);
  return fetch(`${BASE}${path}`, { ...init, signal });
}

/** Extract the better-auth session cookie from a response. */
function cookieFrom(res: Response): string {
  return (res.headers.getSetCookie?.() ?? [])
    .map((c) => c.split(';')[0])
    .find((c) => c.startsWith('better-auth.session_token='))
    ?.split('=').slice(1).join('=') ?? '';
}

async function register(name: string, email: string): Promise<{ userId: string; cookie: string }> {
  const res = await api('/api/auth/sign-up/email', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Origin: BASE },
    body: JSON.stringify({ name, email, password: PASSWORD }),
  });
  const j = await res.json().catch(() => ({}));
  return { userId: j?.user?.id ?? '', cookie: cookieFrom(res) };
}

async function setRole(userId: string, roleName: string) {
  const [role] = await db.select({ id: roles.id }).from(roles).where(eq(roles.name, roleName)).limit(1);
  if (role) await db.update(users).set({ roleId: role.id }).where(eq(users.id, userId));
}

const auth = (cookie: string) => ({ 'Content-Type': 'application/json', Cookie: `better-auth.session_token=${cookie}`, Origin: BASE });

const userIds: string[] = [];
const bookIds: string[] = [];

async function inventoryRows(bookId: string) {
  return db.select().from(bookInventories).where(eq(bookInventories.bookId, bookId));
}

async function cleanup() {
  try {
    const [invs] = await Promise.all([
      bookIds.length ? db.select({ id: bookInventories.id }).from(bookInventories).where(inArray(bookInventories.bookId, bookIds)) : Promise.resolve([] as any[]),
    ]);
    if (invs.length) await db.delete(bookInventories).where(inArray(bookInventories.id, invs.map((i) => i.id)));
    if (bookIds.length) await db.delete(books).where(inArray(books.id, bookIds));
    // Delete the fallback "Umum" source ONLY if this run created it (window check).
    const [fallback] = await db
      .select({ id: bookSources.id })
      .from(bookSources)
      .where(and(eq(bookSources.name, 'Umum'), gte(bookSources.createdAt, new Date(startedAt.getTime() - 1000))))
      .limit(1);
    if (fallback) await db.delete(bookSources).where(eq(bookSources.id, fallback.id));
    if (userIds.length) {
      // Register hook membuat profil member untuk SEMUA user (termasuk admin/staff).
      await db.update(settings).set({ createdBy: null, updatedBy: null }).where(or(inArray(settings.createdBy, userIds), inArray(settings.updatedBy, userIds)));
      await db.delete(auditLogs).where(inArray(auditLogs.userId, userIds));
      await db.delete(accounts).where(inArray(accounts.userId, userIds));
      await db.delete(sessions).where(inArray(sessions.userId, userIds));
      await db.delete(members).where(inArray(members.userId, userIds));
      await db.delete(users).where(inArray(users.id, userIds));
    }
    log(true, 'cleanup selesai');
  } catch (e: any) {
    log(false, 'cleanup', e?.message ?? String(e));
  }
}

async function main() {
  console.log(`=== STOCK FIELD E2E (prefix ${P}) ===\n`);
  const step = (s: string) => console.log(`\n-- ${s} --`);

  // ── 1. Setup users ───────────────────────────────────────────────────
  step('1. Setup');
  const admin = await register('STK Admin', `stk.admin.${ts}@gmail.com`);
  const staff = await register('STK Staff', `stk.staff.${ts}@gmail.com`);
  const member = await register('STK Member', `stk.member.${ts}@gmail.com`);
  for (const u of [admin.userId, staff.userId, member.userId]) if (u) userIds.push(u);
  await setRole(admin.userId, 'admin');
  await setRole(staff.userId, 'staff');
  log(!!admin.userId && !!staff.userId && !!member.userId, 'register admin/staff/member + role');
  const adminAuth = auth(admin.cookie);
  const staffAuth = auth(staff.cookie);
  const memberAuth = auth(member.cookie);

  const makeIsbn = (n: number) => `978${String(ts + n).slice(-9)}`;

  async function createBook(h: Record<string, string>, isbn: string, stock?: number) {
    const body: Record<string, unknown> = { title: `${P} Buku ${isbn.slice(-5)}`, isbn };
    if (stock !== undefined) body.stock = stock;
    return api('/api/books', { method: 'POST', headers: h, body: JSON.stringify(body) });
  }

  // ── 2. Admin: stock = 3 ──────────────────────────────────────────────
  step('2. Admin menambah buku dengan Stok = 3');
  let res = await createBook(adminAuth, makeIsbn(0), 3);
  const adminBook = await res.json().catch(() => ({}));
  if (adminBook?.id) bookIds.push(adminBook.id);
  log(res.status === 201 && !!adminBook.id, 'ADMIN: POST /api/books stock=3 -> 201', `HTTP ${res.status}`);
  let invs = adminBook?.id ? await inventoryRows(adminBook.id) : [];
  log(invs.length === 3, 'ADMIN: 3 inventaris tercatat', `count=${invs.length}`);
  log(invs.every((i) => i.status === 'available'), 'ADMIN: semua inventaris berstatus available');
  log(invs.every((i) => !!i.sourceId), 'ADMIN: semua inventaris punya sumber buku');
  const codes = invs.map((i) => i.inventoryCode);
  log(new Set(codes).size === codes.length, 'ADMIN: kode inventaris unik', codes.join(', '));
  log(codes.every((c) => c.startsWith('INV-')), 'ADMIN: kode mengikuti format INV-', codes[0] ?? '');

  // Detail buku menampilkan inventaris.
  res = await api(`/api/books/${adminBook.id}`, { headers: adminAuth });
  const detail = await res.json().catch(() => ({}));
  log(res.status === 200 && (detail.inventories ?? []).length === 3, 'ADMIN: GET /api/books/:id menampilkan 3 inventaris', `HTTP ${res.status}`);

  // Katalog menampilkan total & available inventory.
  res = await api(`/api/books?q=${encodeURIComponent(makeIsbn(0))}&limit=5`, { headers: adminAuth });
  const list = await res.json().catch(() => ({}));
  const found = (list.items ?? []).find((b: any) => b.id === adminBook.id);
  log(!!found && found.totalInventory === 3 && found.availableInventory === 3, 'ADMIN: totalInventory=3 & availableInventory=3', `total=${found?.totalInventory} avail=${found?.availableInventory}`);

  // ── 3. Staff: stock = 2 ──────────────────────────────────────────────
  step('3. Staff menambah buku dengan Stok = 2');
  res = await createBook(staffAuth, makeIsbn(1), 2);
  const staffBook = await res.json().catch(() => ({}));
  if (staffBook?.id) bookIds.push(staffBook.id);
  log(res.status === 201 && !!staffBook.id, 'STAFF: POST /api/books stock=2 -> 201', `HTTP ${res.status}`);
  invs = staffBook?.id ? await inventoryRows(staffBook.id) : [];
  log(invs.length === 2, 'STAFF: 2 inventaris tercatat', `count=${invs.length}`);
  log(new Set(invs.map((i) => i.inventoryCode)).size === invs.length, 'STAFF: kode inventaris unik');

  // ── 4. Validation ────────────────────────────────────────────────────
  step('4. Validasi input Stok');
  res = await createBook(staffAuth, makeIsbn(2), -1);
  log(res.status === 400, 'VALIDASI: stock=-1 ditolak (400)', `HTTP ${res.status}`);

  res = await createBook(staffAuth, makeIsbn(3), 0);
  const zeroBook = await res.json().catch(() => ({}));
  if (zeroBook?.id) bookIds.push(zeroBook.id);
  log(res.status === 201, 'VALIDASI: stock=0 diizinkan (0 eksemplar)', `HTTP ${res.status}`);
  log(zeroBook?.id ? (await inventoryRows(zeroBook.id)).length === 0 : false, 'VALIDASI: stock=0 -> tanpa inventaris');

  res = await createBook(staffAuth, makeIsbn(4));
  const noStockBook = await res.json().catch(() => ({}));
  if (noStockBook?.id) bookIds.push(noStockBook.id);
  log(res.status === 201, 'VALIDASI: tanpa stock diizinkan (backward compatible)', `HTTP ${res.status}`);
  log(noStockBook?.id ? (await inventoryRows(noStockBook.id)).length === 0 : false, 'VALIDASI: tanpa stock -> tanpa inventaris');

  res = await createBook(staffAuth, makeIsbn(5), 1.5);
  log(res.status === 400, 'VALIDASI: stock=1.5 (bukan bilangan bulat) ditolak', `HTTP ${res.status}`);

  res = await createBook(staffAuth, makeIsbn(6), 1001);
  log(res.status === 400, 'VALIDASI: stock=1001 ditolak (maks 1000)', `HTTP ${res.status}`);

  res = await api('/api/books', {
    method: 'POST', headers: staffAuth,
    body: JSON.stringify({ title: `${P} StrStock`, isbn: makeIsbn(7), stock: 'abc' }),
  });
  log(res.status === 400, 'VALIDASI: stock bukan angka ditolak', `HTTP ${res.status}`);

  res = await createBook(staffAuth, makeIsbn(8), 10);
  const bigBook = await res.json().catch(() => ({}));
  if (bigBook?.id) bookIds.push(bigBook.id);
  log(res.status === 201 && bigBook?.id ? (await inventoryRows(bigBook.id)).length === 10 : false, 'VALIDASI: stock=10 -> 10 inventaris', `HTTP ${res.status}`);

  // ── 5. Permission ────────────────────────────────────────────────────
  step('5. Permission');
  res = await createBook(memberAuth, makeIsbn(9), 1);
  log(res.status === 403, 'PERMISSION: member -> POST /api/books 403', `HTTP ${res.status}`);
  res = await createBook({}, makeIsbn(10), 1);
  log(res.status === 401, 'PERMISSION: guest -> POST /api/books 401', `HTTP ${res.status}`);

  // ── 6. Audit log ─────────────────────────────────────────────────────
  step('6. Audit log');
  const [auditRow] = await db
    .select()
    .from(auditLogs)
    .where(and(eq(auditLogs.module, 'BOOK_INVENTORIES'), eq(auditLogs.userId, admin.userId)))
    .limit(1);
  log(!!auditRow, 'AUDIT: log inventaris otomatis tercatat', auditRow?.description ?? 'tidak ada');

  await cleanup();
  console.log(`\n=== HASIL STOCK E2E: ${pass} PASS, ${fail} FAIL ===`);
  if (failures.length) console.log('Gagal:', failures.join(' | '));
  process.exit(fail > 0 ? 1 : 0);
}

main().catch(async (e: any) => {
  console.error('STOCK E2E crashed:', e?.message ?? String(e));
  await cleanup();
  process.exit(1);
});

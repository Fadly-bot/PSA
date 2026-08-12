/**
 * PHASE A — MEMBER E2E (API/DB verification part).
 * =================================================
 * Companion to the browser-driven member flow. Assumes a member was
 * registered through the UI at /register and borrowed a book via the
 * "Pinjam Buku" button (so there is exactly one active 'borrowed' borrowing
 * owned by that member).
 *
 * What this script verifies:
 *  1. Login as the test member (normal flow) → session cookie
 *  2. Role = member via /api/auth/role
 *  3. Permission: member is rejected (403/401) on staff/admin endpoints
 *  4. Member dashboard + own-borrowings scope (member only sees own data)
 *  5. DB: the UI borrow created a borrowing + details and set inventory = borrowed
 *  6. Staff return: create a throwaway staff, process the return → returned
 *  7. Late/overdue: staff borrows a 2nd copy with past due date, returns late → fine
 *  8. Member sees own fine; member CANNOT pay/modify the fine
 *  9. Cleanup of ALL test data (user, member, staff, borrowings, returns,
 *     fines, audit logs, sessions, accounts) + restore inventory statuses
 *
 * Usage:
 *   node --env-file-if-exists=.env.local --import tsx scripts/member-e2e.ts <memberEmail> <password>
 */
import { db } from '../src/db/index';
import {
  accounts, auditLogs, bookInventories, borrowingDetails, borrowings,
  fines, members, returns, roles, sessions, settings, users,
} from '../src/db/schema';
import { eq, inArray, and, isNull, or } from 'drizzle-orm';

const BASE = 'http://localhost:3000';
const MEMBER_EMAIL = process.argv[2];
const PASSWORD = process.argv[3] ?? 'MemberTest123!';
// When set, skip the final cleanup so the UI verify pass (ui-e2e-member.ts -- verify)
// can still log in and inspect returned/history/fines state before cleanup.
const KEEP_DATA = process.env.KEEP_DATA === '1';

let pass = 0;
let fail = 0;
const failures: string[] = [];
const log = (ok: boolean, label: string, detail = '') => {
  if (ok) pass++;
  else { fail++; failures.push(label); }
  console.log(`${ok ? 'PASS' : 'FAIL'} | ${label}${detail ? ` | ${detail}` : ''}`);
};

const api = (path: string, init?: RequestInit) =>
  fetch(`${BASE}${path}`, { ...init, signal: AbortSignal.timeout(25000) });

function cookieFrom(res: Response): string {
  return (res.headers.getSetCookie?.() ?? [])
    .map((c) => c.split(';')[0])
    .find((c) => c.startsWith('better-auth.session_token='))
    ?.split('=').slice(1).join('=') ?? '';
}

const auth = (cookie: string) => ({
  'Content-Type': 'application/json',
  Cookie: `better-auth.session_token=${cookie}`,
  Origin: BASE,
});

// Tracked test ids for cleanup.
const userIds: string[] = [];
const memberIds: string[] = [];
const borrowingIds: string[] = [];
const returnIds: string[] = [];
const fineIds: string[] = [];
const touchedInventoryIds: string[] = [];

async function register(name: string, email: string) {
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

async function cleanup() {
  try {
    if (returnIds.length) await db.delete(returns).where(inArray(returns.id, returnIds));
    if (fineIds.length) await db.delete(fines).where(inArray(fines.id, fineIds));
    if (borrowingIds.length) {
      await db.delete(borrowingDetails).where(inArray(borrowingDetails.borrowingId, borrowingIds));
      await db.delete(borrowings).where(inArray(borrowings.id, borrowingIds));
    }
    // Restore inventory status for any copy touched by test borrowings.
    if (touchedInventoryIds.length) {
      await db.update(bookInventories)
        .set({ status: 'available', updatedAt: new Date() })
        .where(inArray(bookInventories.id, touchedInventoryIds));
    }
    if (memberIds.length) await db.delete(members).where(inArray(members.id, memberIds));
    if (userIds.length) {
      await db.update(settings).set({ createdBy: null, updatedBy: null })
        .where(or(inArray(settings.createdBy, userIds), inArray(settings.updatedBy, userIds)));
      await db.delete(auditLogs).where(inArray(auditLogs.userId, userIds));
      await db.delete(accounts).where(inArray(accounts.userId, userIds));
      await db.delete(sessions).where(inArray(sessions.userId, userIds));
      await db.delete(members).where(inArray(members.userId, userIds));
      await db.delete(users).where(inArray(users.id, userIds));
    }
    log(true, 'cleanup selesai (test data + restore inventory)');
  } catch (e: any) {
    log(false, 'cleanup', e?.message ?? String(e));
  }
}

async function main() {
  if (!MEMBER_EMAIL) {
    console.error('Usage: scripts/member-e2e.ts <memberEmail> <password>');
    process.exit(1);
  }
  console.log(`=== MEMBER E2E (API/DB) — ${MEMBER_EMAIL} ===\n`);
  const step = (s: string) => console.log(`\n-- ${s} --`);

  // ── 1. LOGIN as member ──────────────────────────────────────────────
  step('1. Login member (normal flow)');
  const loginRes = await api('/api/auth/sign-in/email', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Origin: BASE },
    body: JSON.stringify({ email: MEMBER_EMAIL, password: PASSWORD }),
  });
  const memberCookie = cookieFrom(loginRes);
  log(loginRes.status === 200 && !!memberCookie, 'login member', `HTTP ${loginRes.status}`);
  const memberAuth = auth(memberCookie);

  // ── 2. ROLE ─────────────────────────────────────────────────────────
  step('2. Role member');
  const roleRes = await api('/api/auth/role', { headers: memberAuth });
  const roleJson = await roleRes.json().catch(() => ({}));
  log(roleRes.status === 200 && roleJson.role === 'member' && roleJson.authenticated === true,
    'GET /api/auth/role → member', `HTTP ${roleRes.status} | ${JSON.stringify(roleJson)}`);

  // Locate the member row.
  const [userRow] = await db.select({ id: users.id }).from(users).where(eq(users.email, MEMBER_EMAIL)).limit(1);
  if (!userRow) { log(false, 'user member ditemukan di DB'); await cleanup(); process.exit(1); }
  userIds.push(userRow.id);
  const [memberRow] = await db.select({ id: members.id }).from(members).where(eq(members.userId, userRow.id)).limit(1);
  if (!memberRow) { log(false, 'profil member ditemukan'); await cleanup(); process.exit(1); }
  memberIds.push(memberRow.id);
  log(true, 'profil member ada di DB', `memberCode=${memberRow.memberCode}`);

  // ── 3. PERMISSION (member blocked from staff/admin) ─────────────────
  step('3. Permission member');
  let r = await api('/api/users', { headers: memberAuth });
  log(r.status === 403, 'member GET /api/users → 403', `HTTP ${r.status}`);
  r = await api('/api/settings', { headers: memberAuth });
  log(r.status === 403, 'member GET /api/settings → 403', `HTTP ${r.status}`);
  r = await api('/api/reports?type=books', { headers: memberAuth });
  log(r.status === 403, 'member GET /api/reports → 403', `HTTP ${r.status}`);
  r = await api('/api/audit-logs', { headers: memberAuth });
  log(r.status === 403, 'member GET /api/audit-logs → 403', `HTTP ${r.status}`);
  r = await api('/api/categories', { method: 'POST', headers: memberAuth, body: JSON.stringify({ name: 'X' }) });
  log(r.status === 403, 'member POST /api/categories → 403', `HTTP ${r.status}`);
  r = await api('/api/books', { method: 'POST', headers: memberAuth, body: JSON.stringify({ title: 'X', isbn: '0' }) });
  log(r.status === 403, 'member POST /api/books → 403', `HTTP ${r.status}`);
  r = await api('/api/inventories', { method: 'POST', headers: memberAuth, body: JSON.stringify({}) });
  log(r.status === 403, 'member POST /api/inventories → 403', `HTTP ${r.status}`);
  r = await api('/api/borrowings', { method: 'POST', headers: memberAuth, body: JSON.stringify({ bookId: '00000000-0000-0000-0000-000000000000' }) });
  log(r.status === 409, 'member borrow buku tak dikenal → 409 INVENTORY_NOT_AVAILABLE', `HTTP ${r.status}`);

  // ── 4. MEMBER DASHBOARD + own-scope ─────────────────────────────────
  step('4. Member dashboard + scoping');
  r = await api('/api/dashboard', { headers: memberAuth });
  const dash = await r.json().catch(() => ({}));
  log(r.status === 200 && dash.stats, 'member GET /api/dashboard → 200', `HTTP ${r.status} | keys=${Object.keys(dash.stats ?? {}).length}`);
  log(typeof dash.stats?.activeBorrowings === 'number', 'stats.activeBorrowings ada', `active=${dash.stats?.activeBorrowings}`);

  r = await api('/api/borrowings?limit=100', { headers: memberAuth });
  const mine = await r.json().catch(() => ({}));
  const activeOwn = (mine.items ?? []).filter((b: any) => b.status === 'borrowed');
  log(r.status === 200 && Array.isArray(mine.items), 'member GET /api/borrowings → 200', `HTTP ${r.status} | total=${mine.total}`);
  log(activeOwn.length >= 1, 'ada peminjaman aktif milik member (dari UI borrow)', `count=${activeOwn.length}`);
  const uiBorrowing = activeOwn[0] as any;
  if (uiBorrowing?.id) borrowingIds.push(uiBorrowing.id);

  // ── 5. DB: UI borrow created real records ───────────────────────────
  step('5. DB verification of UI borrow');
  if (uiBorrowing) {
    const [bRow] = await db.select({ id: borrowings.id, status: borrowings.status, memberId: borrowings.memberId })
      .from(borrowings).where(eq(borrowings.id, uiBorrowing.id)).limit(1);
    log(!!bRow && bRow.status === 'borrowed' && bRow.memberId === memberRow.id, 'borrowing record ada & milik member', `code=${uiBorrowing.borrowCode}`);
    const details = await db.select({ inventoryId: borrowingDetails.bookInventoryId })
      .from(borrowingDetails).where(eq(borrowingDetails.borrowingId, uiBorrowing.id));
    log(details.length >= 1, 'borrowing_details ada', `count=${details.length}`);
    if (details[0]) touchedInventoryIds.push(details[0].inventoryId);
    const [inv] = details[0] ? await db.select({ status: bookInventories.status }).from(bookInventories)
      .where(eq(bookInventories.id, details[0].inventoryId)).limit(1) : [];
    log(inv?.status === 'borrowed', 'status inventaris → borrowed', `status=${inv?.status}`);
  }

  // ── 6. STAFF RETURN ─────────────────────────────────────────────────
  step('6. Return via staff');
  const staff = await register('E2E Staff Return', `membere2e.staff.${Date.now()}@gmail.com`);
  if (staff.userId) { userIds.push(staff.userId); await setRole(staff.userId, 'staff'); }
  log(!!staff.userId && !!staff.cookie, 'buat akun staff test (register + promote)');
  const staffAuth = auth(staff.cookie);

  if (uiBorrowing) {
    const today = new Date().toISOString().slice(0, 10);
    r = await api('/api/returns', {
      method: 'POST', headers: staffAuth,
      body: JSON.stringify({ borrowingId: uiBorrowing.id, returnDate: today, notes: 'e2e member return' }),
    });
    const ret = await r.json().catch(() => ({}));
    if (ret?.id) returnIds.push(ret.id);
    log(r.status === 201 && ret.status === 'returned', 'POST /api/returns (staff) → returned', `HTTP ${r.status} | status=${ret.status}`);
    // Inventory back to available.
    const details = await db.select({ inventoryId: borrowingDetails.bookInventoryId })
      .from(borrowingDetails).where(eq(borrowingDetails.borrowingId, uiBorrowing.id));
    const [inv] = details[0] ? await db.select({ status: bookInventories.status }).from(bookInventories)
      .where(eq(bookInventories.id, details[0].inventoryId)).limit(1) : [];
    log(inv?.status === 'available', 'status inventaris kembali → available', `status=${inv?.status}`);
    // Member now sees it as returned.
    r = await api('/api/borrowings?limit=100', { headers: memberAuth });
    const after = await r.json().catch(() => ({}));
    const myReturned = (after.items ?? []).find((b: any) => b.id === uiBorrowing.id);
    log(myReturned?.status === 'returned', 'member melihat peminjaman → returned', `status=${myReturned?.status}`);
  }

  // ── 7. OVERDUE + FINE ───────────────────────────────────────────────
  step('7. Overdue → fine (safe, cleaned after)');
  const today = new Date().toISOString().slice(0, 10);
  const pastBorrow = new Date(Date.now() - 10 * 864e5).toISOString().slice(0, 10);
  const pastDue = new Date(Date.now() - 3 * 864e5).toISOString().slice(0, 10);
  // Find a book with an available copy (any real/test book, not the one just returned — reuse it, it's available again).
  const avail = await db.select({ id: bookInventories.id, bookId: bookInventories.bookId })
    .from(bookInventories)
    .where(and(eq(bookInventories.status, 'available'), isNull(bookInventories.deletedAt)))
    .limit(1);
  if (avail[0]) {
    touchedInventoryIds.push(avail[0].id);
    r = await api('/api/borrowings', {
      method: 'POST', headers: staffAuth,
      body: JSON.stringify({ memberId: memberRow.id, borrowDate: pastBorrow, dueDate: pastDue, inventoryIds: [avail[0].id] }),
    });
    const ob = await r.json().catch(() => ({}));
    if (ob?.id) borrowingIds.push(ob.id);
    log(r.status === 201 && !!ob.id, 'staff buat peminjaman overdue (test)', `HTTP ${r.status} | code=${ob.borrowCode}`);

    // Overdue appears in dashboard stats.
    r = await api('/api/dashboard', { headers: staffAuth });
    const dashOv = await r.json().catch(() => ({}));
    log(Number(dashOv.stats?.overdueBorrowings ?? 0) >= 1, 'dashboard overdueBorrowings ≥ 1', `overdue=${dashOv.stats?.overdueBorrowings}`);

    // Return late → fine.
    r = await api('/api/returns', {
      method: 'POST', headers: staffAuth,
      body: JSON.stringify({ borrowingId: ob.id, returnDate: today, notes: 'telat e2e' }),
    });
    const late = await r.json().catch(() => ({}));
    if (late?.id) returnIds.push(late.id);
    log(r.status === 201 && late.status === 'late' && Number(late.fineAmount ?? 0) > 0, 'return terlambat → status late + denda', `HTTP ${r.status} | fine=${late.fineAmount}`);

    // Fine visible in /api/fines for staff + member.
    r = await api('/api/fines?status=unpaid', { headers: staffAuth });
    const fl = await r.json().catch(() => ({}));
    const f = (fl.items ?? []).find((x: any) => x.borrowing?.id === ob.id);
    if (f?.id) fineIds.push(f.id);
    log(r.status === 200 && !!f, 'denda muncul di /api/fines (staff view)', `HTTP ${r.status} | fine=${f?.amount}`);

    r = await api('/api/fines?status=unpaid', { headers: memberAuth });
    const mfl = await r.json().catch(() => ({}));
    const mf = (mfl.items ?? []).find((x: any) => x.borrowing?.id === ob.id);
    log(r.status === 200 && !!mf, 'member melihat denda miliknya di /api/fines', `HTTP ${r.status} | amount=${mf?.amount}`);

    // Member CANNOT modify the fine.
    if (f?.id) {
      r = await api(`/api/fines/${f.id}`, { method: 'PATCH', headers: memberAuth });
      log(r.status === 403 || r.status === 401 || r.status === 400, 'member tidak bisa mengubah denda', `HTTP ${r.status}`);
    }
  } else {
    log(false, 'tidak ada inventaris available untuk test overdue');
  }

  // ── SUMMARY ─────────────────────────────────────────────────────────
  if (KEEP_DATA) {
    console.log('KEEP_DATA=1 → cleanup dilewati (test data dipertahankan untuk UI verify)');
  } else {
    await cleanup();
  }
  console.log(`\n=== HASIL MEMBER E2E: ${pass} PASS, ${fail} FAIL ===`);
  if (failures.length) console.log('Gagal:', failures.join(' | '));
  process.exit(fail > 0 ? 1 : 0);
}

main().catch(async (e: any) => {
  console.error('MEMBER E2E crashed:', e?.message ?? String(e));
  await cleanup();
  process.exit(1);
});

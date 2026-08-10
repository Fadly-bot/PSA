/**
 * Phase 2 Bug 2 reproduction (temporary): create borrowing via API, open
 * list, open detail, and capture the exact failure.
 */
import { db } from '../src/db/index';
import {
  accounts, auditLogs, bookInventories, bookSources, books, borrowingDetails,
  borrowings, members, roles, sessions, users,
} from '../src/db/schema';
import { eq, ilike, inArray } from 'drizzle-orm';

const BASE = 'http://localhost:3000';
const ts = Date.now();
const P = `P2B${ts}`;
let staffId = '';
let memberId = '';
let invId = '';
let borrowId = '';

function log(ok: boolean, label: string, detail = '') {
  console.log(`${ok ? 'PASS' : 'FAIL'} | ${label}${detail ? ` | ${detail}` : ''}`);
}

async function api(path: string, init?: RequestInit) {
  return fetch(`${BASE}${path}`, init);
}

async function register(name: string, email: string): Promise<{ userId: string; cookie: string }> {
  const res = await api('/api/auth/sign-up/email', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Origin: BASE },
    body: JSON.stringify({ name, email, password: 'Test123456!' }),
  });
  const j = await res.json().catch(() => ({}));
  const cookie = (res.headers.getSetCookie?.() ?? [])
    .map((c) => c.split(';')[0])
    .find((c) => c.startsWith('better-auth.session_token='))
    ?.split('=').slice(1).join('=') ?? '';
  return { userId: j?.user?.id ?? '', cookie };
}

async function main() {
  // 1. Staff + member.
  const staff = await register('P2 Staff', `p2.staff.${ts}@gmail.com`);
  const member = await register('P2 Member', `p2.member.${ts}@gmail.com`);
  staffId = staff.userId; memberId = member.userId;
  log(!!staffId && !!memberId, 'register staff + member');

  const [staffRole] = await db.select({ id: roles.id }).from(roles).where(eq(roles.name, 'staff')).limit(1);
  await db.update(users).set({ roleId: staffRole!.id }).where(eq(users.id, staffId));
  log(true, 'staff di-promote');

  const auth = { 'Content-Type': 'application/json', Cookie: `better-auth.session_token=${staff.cookie}`, Origin: BASE };

  // 2. Get the member's row (hook auto-created it).
  const [memberRow] = await db.select({ id: members.id }).from(members).where(eq(members.userId, memberId)).limit(1);
  if (!memberRow) { log(false, 'member row dibuat hook'); await cleanup(); return; }
  log(true, 'member row ada');

  // 3. Book + source + inventory.
  const src = await (await api('/api/book-sources', { method: 'POST', headers: auth, body: JSON.stringify({ name: `${P} Sumber` }) })).json().catch(() => ({}));
  const book = await (await api('/api/books', {
    method: 'POST', headers: auth,
    body: JSON.stringify({ title: `${P} Buku`, isbn: `978${ts.toString().slice(-9)}` }),
  })).json().catch(() => ({}));
  const inv = await (await api('/api/inventories', {
    method: 'POST', headers: auth,
    body: JSON.stringify({ inventoryCode: `${P}INV`, bookId: book.id, sourceId: src.id, condition: 'good', status: 'available' }),
  })).json().catch(() => ({}));
  invId = inv.id ?? '';
  log(!!invId, 'setup buku+inventaris', `invId=${invId ? 'ok' : 'GAGAL'}`);

  // 4. Create borrowing.
  const today = new Date().toISOString().slice(0, 10);
  const due = new Date(Date.now() + 7 * 864e5).toISOString().slice(0, 10);
  const borrowRes = await api('/api/borrowings', {
    method: 'POST', headers: auth,
    body: JSON.stringify({ memberId: memberRow.id, borrowDate: today, dueDate: due, inventoryIds: [invId] }),
  });
  const borrow = await borrowRes.json().catch(() => ({}));
  borrowId = borrow?.id ?? '';
  log(borrowRes.status === 201 && !!borrowId, 'POST /api/borrowings', `HTTP ${borrowRes.status}${borrow?.error ? ` | ${borrow.error}` : ''}`);

  // 5. List.
  const listRes = await api('/api/borrowings?page=1&limit=10', { headers: auth });
  const list = await listRes.json().catch(() => ({}));
  log(listRes.status === 200 && (list.items ?? []).length > 0, 'GET /api/borrowings (list)', `HTTP ${listRes.status} | items=${(list.items ?? []).length}`);

  // 6. DETAIL (the reported bug).
  const detailRes = await api(`/api/borrowings/${borrowId}`, { headers: auth });
  const detail = await detailRes.json().catch(() => ({}));
  log(detailRes.status === 200, 'GET /api/borrowings/:id (detail)', `HTTP ${detailRes.status} | ${JSON.stringify(detail).slice(0, 300)}`);

  // 7. Detail with missing-id edge case (params issue?).
  const badRes = await api('/api/borrowings/not-a-uuid', { headers: auth });
  log(badRes.status === 404 || badRes.status === 500, 'GET /api/borrowings/:id (id invalid)', `HTTP ${badRes.status}`);

  // 8. Member viewing own borrowing detail.
  const memAuth = { 'Content-Type': 'application/json', Cookie: `better-auth.session_token=${member.cookie}`, Origin: BASE };
  const memDetail = await api(`/api/borrowings/${borrowId}`, { headers: memAuth });
  log(memDetail.status === 200, 'member melihat detail miliknya', `HTTP ${memDetail.status}`);

  await cleanup();
  process.exit(0);
}

async function cleanup() {
  try {
    // FK order matters: borrowing_details references borrowings + inventories.
    if (borrowId) await db.delete(borrowingDetails).where(eq(borrowingDetails.borrowingId, borrowId));
    if (borrowId) await db.delete(borrowings).where(eq(borrowings.id, borrowId));
    if (invId) await db.delete(bookInventories).where(eq(bookInventories.id, invId));
    const bks = await db.select({ id: books.id }).from(books).where(ilike(books.title, `${P}%`));
    if (bks.length) await db.delete(books).where(inArray(books.id, bks.map((r) => r.id)));
    const srs = await db.select({ id: bookSources.id }).from(bookSources).where(ilike(bookSources.name, `${P}%`));
    if (srs.length) await db.delete(bookSources).where(inArray(bookSources.id, srs.map((r) => r.id)));
    for (const uid of [staffId, memberId]) {
      if (!uid) continue;
      await db.delete(accounts).where(eq(accounts.userId, uid));
      await db.delete(sessions).where(eq(sessions.userId, uid));
      await db.delete(members).where(eq(members.userId, uid));
      await db.delete(auditLogs).where(eq(auditLogs.userId, uid));
      await db.delete(users).where(eq(users.id, uid));
    }
    log(true, 'cleanup selesai');
  } catch (e: any) {
    log(false, 'cleanup', e?.message ?? String(e));
  }
}

main().catch((e: any) => { console.error('E2E failed:', e?.message ?? String(e)); process.exit(1); });

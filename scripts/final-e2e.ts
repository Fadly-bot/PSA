/**
 * FINAL E2E — one-shot verification of the whole TBM Semesta Alam API.
 * Covers: register, login, session, RBAC (member/staff/admin), master data
 * CRUD (categories, authors, publishers, shelves, book sources, books,
 * inventories), borrowing (create/list/detail/extend), return (on-time +
 * overdue -> fine), fine (list/pay), reports (json + csv), settings
 * (admin-only), dashboard stats, staff management (/api/users), audit logs.
 *
 * All test data uses a unique prefix and is cleaned up at the end.
 * Run: node --env-file-if-exists=.env.local --import tsx scripts/final-e2e.ts
 */
import { db } from '../src/db/index';
import {
  accounts, auditLogs, authors, bookInventories, bookSources, books,
  borrowingDetails, borrowings, categories, fines, members, publishers,
  returns, roles, sessions, shelves, settings, users,
} from '../src/db/schema';
import { or } from 'drizzle-orm';
import { eq, inArray } from 'drizzle-orm';

const BASE = 'http://localhost:3000';
const ts = Date.now();
const P = `E2E${ts}`;
const PASSWORD = 'Test123456!';

let pass = 0;
let fail = 0;
const failures: string[] = [];

function log(ok: boolean, label: string, detail = '') {
  if (ok) pass++;
  else { fail++; failures.push(label); }
  console.log(`${ok ? 'PASS' : 'FAIL'} | ${label}${detail ? ` | ${detail}` : ''}`);
}

async function api(path: string, init?: RequestInit) {
  // Hard timeout so a single hung request fails fast instead of blocking the run.
  const signal = AbortSignal.timeout(25000);
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

// IDs collected for cleanup.
const userIds: string[] = [];
const memberIds: string[] = [];
const categoryIds: string[] = [];
const authorIds: string[] = [];
const publisherIds: string[] = [];
const shelfIds: string[] = [];
const sourceIds: string[] = [];
const bookIds: string[] = [];
const inventoryIds: string[] = [];
const borrowingIds: string[] = [];
const fineIds: string[] = [];
const returnIds: string[] = [];

async function cleanup() {
  try {
    // FK order: returns/fines -> borrowings -> borrowing_details -> inventories -> books -> masters -> members -> users.
    if (returnIds.length) await db.delete(returns).where(inArray(returns.id, returnIds));
    if (fineIds.length) await db.delete(fines).where(inArray(fines.id, fineIds));
    if (borrowingIds.length) {
      await db.delete(borrowingDetails).where(inArray(borrowingDetails.borrowingId, borrowingIds));
      await db.delete(borrowings).where(inArray(borrowings.id, borrowingIds));
    }
    if (inventoryIds.length) await db.delete(bookInventories).where(inArray(bookInventories.id, inventoryIds));
    if (bookIds.length) await db.delete(books).where(inArray(books.id, bookIds));
    if (sourceIds.length) await db.delete(bookSources).where(inArray(bookSources.id, sourceIds));
    if (shelfIds.length) await db.delete(shelves).where(inArray(shelves.id, shelfIds));
    if (publisherIds.length) await db.delete(publishers).where(inArray(publishers.id, publisherIds));
    if (authorIds.length) await db.delete(authors).where(inArray(authors.id, authorIds));
    if (categoryIds.length) await db.delete(categories).where(inArray(categories.id, categoryIds));
    if (memberIds.length) await db.delete(members).where(inArray(members.id, memberIds));
    if (userIds.length) {
      // settings has FK created_by/updated_by -> users (restrict): null them first.
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
  console.log(`=== FINAL E2E TBM SEMESTA ALAM (prefix ${P}) ===\n`);
  const step = (s: string) => console.log(`\n-- ${s} --`);

  // ── 1. REGISTER ─────────────────────────────────────────────────────
  step('1. Register');
  const admin = await register('E2E Admin', `e2e.admin.${ts}@gmail.com`);
  const staff = await register('E2E Staff', `e2e.staff.${ts}@gmail.com`);
  const member = await register('E2E Member', `e2e.member.${ts}@gmail.com`);
  for (const u of [admin.userId, staff.userId, member.userId]) if (u) userIds.push(u);
  log(!!admin.userId && !!staff.userId && !!member.userId, 'register admin/staff/member');

  // Session cookie issued on register (auto sign-in).
  log(!!admin.cookie && !!staff.cookie && !!member.cookie, 'session cookie diterbitkan saat register');

  // Hook created member profile for the member.
  const [memberRow] = await db.select({ id: members.id }).from(members).where(eq(members.userId, member.userId)).limit(1);
  if (memberRow?.id) memberIds.push(memberRow.id);
  log(!!memberRow, 'profil member dibuat otomatis oleh hook');

  // Promote roles.
  await setRole(admin.userId, 'admin');
  await setRole(staff.userId, 'staff');
  log(true, 'role di-set (admin, staff, member)');

  // ── 2. LOGIN ────────────────────────────────────────────────────────
  step('2. Login');
  const loginRes = await api('/api/auth/sign-in/email', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Origin: BASE },
    body: JSON.stringify({ email: `e2e.staff.${ts}@gmail.com`, password: PASSWORD }),
  });
  const loginCookie = cookieFrom(loginRes);
  log(loginRes.status === 200 && !!loginCookie, 'login staff via /api/auth/sign-in/email', `HTTP ${loginRes.status}`);

  const badLogin = await api('/api/auth/sign-in/email', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Origin: BASE },
    body: JSON.stringify({ email: `e2e.staff.${ts}@gmail.com`, password: 'WrongPass1!' }),
  });
  log(badLogin.status === 401, 'login password salah ditolak', `HTTP ${badLogin.status}`);

  const roleRes = await api('/api/auth/role', { headers: auth(admin.cookie) });
  const roleJson = await roleRes.json().catch(() => ({}));
  log(roleRes.status === 200 && roleJson.role === 'admin', 'GET /api/auth/role (admin)', `HTTP ${roleRes.status} | role=${roleJson.role}`);

  const staffAuth = auth(staff.cookie);
  const memberAuth = auth(member.cookie);
  const adminAuth = auth(admin.cookie);

  // ── 3. RBAC ─────────────────────────────────────────────────────────
  step('3. RBAC');
  // Member: no staff/admin endpoints.
  let r = await api('/api/users', { headers: memberAuth });
  log(r.status === 403, 'member -> GET /api/users 403', `HTTP ${r.status}`);
  r = await api('/api/settings', { headers: memberAuth });
  log(r.status === 403, 'member -> GET /api/settings 403', `HTTP ${r.status}`);
  r = await api('/api/reports?type=books', { headers: memberAuth });
  log(r.status === 403, 'member -> GET /api/reports 403', `HTTP ${r.status}`);
  r = await api('/api/audit-logs', { headers: memberAuth });
  log(r.status === 403, 'member -> GET /api/audit-logs 403', `HTTP ${r.status}`);
  r = await api('/api/categories', { method: 'POST', headers: memberAuth, body: JSON.stringify({ name: 'X' }) });
  log(r.status === 403, 'member -> POST /api/categories 403', `HTTP ${r.status}`);

  // Staff: no admin-only endpoints (users, settings).
  r = await api('/api/users', { headers: staffAuth });
  log(r.status === 403, 'staff -> GET /api/users 403', `HTTP ${r.status}`);
  r = await api('/api/settings', { headers: staffAuth });
  log(r.status === 403, 'staff -> GET /api/settings 403', `HTTP ${r.status}`);

  // Admin: full access.
  r = await api('/api/users?limit=5', { headers: adminAuth });
  log(r.status === 200, 'admin -> GET /api/users 200', `HTTP ${r.status}`);
  r = await api('/api/settings', { headers: adminAuth });
  log(r.status === 200, 'admin -> GET /api/settings 200', `HTTP ${r.status}`);

  // Unauthenticated.
  r = await api('/api/dashboard');
  log(r.status === 401, 'guest -> GET /api/dashboard 401', `HTTP ${r.status}`);

  // Member dashboard (member view) works.
  r = await api('/api/dashboard', { headers: memberAuth });
  log(r.status === 200, 'member -> GET /api/dashboard 200', `HTTP ${r.status}`);

  // ── 4. MASTER DATA CRUD (staff) ─────────────────────────────────────
  step('4. Master data');
  // Category.
  let res = await api('/api/categories', { method: 'POST', headers: staffAuth, body: JSON.stringify({ name: `${P} Kategori`, description: 'test' }) });
  const cat = await res.json().catch(() => ({}));
  if (cat?.id) categoryIds.push(cat.id);
  log(res.status === 201 && !!cat.id, 'POST /api/categories', `HTTP ${res.status}`);
  res = await api(`/api/categories/${cat.id}`, { headers: staffAuth });
  log(res.status === 200, 'GET /api/categories/:id', `HTTP ${res.status}`);
  res = await api(`/api/categories/${cat.id}`, { method: 'PATCH', headers: staffAuth, body: JSON.stringify({ name: `${P} Kategori Edit` }) });
  log(res.status === 200, 'PATCH /api/categories/:id', `HTTP ${res.status}`);
  res = await api('/api/categories?q=Kategori', { headers: staffAuth });
  const catList = await res.json().catch(() => ({}));
  log(res.status === 200 && (catList.items ?? []).length > 0, 'GET /api/categories?q=', `HTTP ${res.status} | items=${(catList.items ?? []).length}`);

  // Author.
  res = await api('/api/authors', { method: 'POST', headers: staffAuth, body: JSON.stringify({ name: `${P} Penulis`, biography: 'bio' }) });
  const author = await res.json().catch(() => ({}));
  if (author?.id) authorIds.push(author.id);
  log(res.status === 201 && !!author.id, 'POST /api/authors', `HTTP ${res.status}`);
  res = await api(`/api/authors/${author.id}`, { method: 'PATCH', headers: staffAuth, body: JSON.stringify({ biography: 'bio2' }) });
  log(res.status === 200, 'PATCH /api/authors/:id', `HTTP ${res.status}`);

  // Publisher.
  res = await api('/api/publishers', { method: 'POST', headers: staffAuth, body: JSON.stringify({ name: `${P} Penerbit`, email: 'pub@test.com' }) });
  const publisher = await res.json().catch(() => ({}));
  if (publisher?.id) publisherIds.push(publisher.id);
  log(res.status === 201 && !!publisher.id, 'POST /api/publishers', `HTTP ${res.status}`);

  // Shelf.
  res = await api('/api/shelves', { method: 'POST', headers: staffAuth, body: JSON.stringify({ code: `RAK${ts}`, name: `${P} Rak`, floor: 1 }) });
  const shelf = await res.json().catch(() => ({}));
  if (shelf?.id) shelfIds.push(shelf.id);
  log(res.status === 201 && !!shelf.id, 'POST /api/shelves', `HTTP ${res.status}`);

  // Book source.
  res = await api('/api/book-sources', { method: 'POST', headers: staffAuth, body: JSON.stringify({ name: `${P} Sumber`, description: 'hibah' }) });
  const source = await res.json().catch(() => ({}));
  if (source?.id) sourceIds.push(source.id);
  log(res.status === 201 && !!source.id, 'POST /api/book-sources', `HTTP ${res.status}`);

  // ── 5. BOOKS ────────────────────────────────────────────────────────
  step('5. Books');
  res = await api('/api/books', {
    method: 'POST', headers: staffAuth,
    body: JSON.stringify({
      title: `${P} Buku Utama`,
      isbn: `978${ts.toString().slice(-9)}`,
      authorId: author.id, publisherId: publisher.id, categoryId: cat.id,
      publicationYear: 2024, language: 'Indonesia', pages: 100, status: 'active',
    }),
  });
  const book = await res.json().catch(() => ({}));
  if (book?.id) bookIds.push(book.id);
  log(res.status === 201 && !!book.id && !!book.slug, 'POST /api/books (dengan relasi)', `HTTP ${res.status} | slug=${book.slug}`);

  res = await api(`/api/books/${book.id}`, { headers: staffAuth });
  const bookDetail = await res.json().catch(() => ({}));
  log(res.status === 200 && bookDetail.author?.name === `${P} Penulis`, 'GET /api/books/:id (relasi penulis)', `HTTP ${res.status} | author=${bookDetail.author?.name}`);

  // Public book page by slug (no auth needed).
  res = await api(`/books/${book.slug}`);
  log(res.status === 200, 'GET /books/:slug (publik)', `HTTP ${res.status}`);

  // Catalog search.
  res = await api('/api/books?q=Buku+Utama&limit=5');
  const bookList = await res.json().catch(() => ({}));
  log(res.status === 200 && (bookList.items ?? []).length > 0, 'GET /api/books?q=', `HTTP ${res.status} | items=${(bookList.items ?? []).length}`);

  res = await api(`/api/books/${book.id}`, { method: 'PATCH', headers: staffAuth, body: JSON.stringify({ pages: 120 }) });
  log(res.status === 200, 'PATCH /api/books/:id', `HTTP ${res.status}`);

  // ── 6. INVENTORIES ──────────────────────────────────────────────────
  step('6. Inventories');
  const invCodes: string[] = [];
  const invs: any[] = [];
  for (let i = 1; i <= 2; i++) {
    res = await api('/api/inventories', {
      method: 'POST', headers: staffAuth,
      body: JSON.stringify({ inventoryCode: `${P}INV${i}`, bookId: book.id, sourceId: source.id, shelfId: shelf.id, condition: 'good', status: 'available' }),
    });
    const inv = await res.json().catch(() => ({}));
    invs.push(inv);
    if (inv?.id) { inventoryIds.push(inv.id); invCodes.push(inv.id); }
    log(res.status === 201 && !!inv.id, `POST /api/inventories (${i})`, `HTTP ${res.status}`);
  }

  res = await api(`/api/inventories/${invs[0].id}`, { headers: staffAuth });
  const invDetail = await res.json().catch(() => ({}));
  log(res.status === 200 && invDetail.book?.title === `${P} Buku Utama`, 'GET /api/inventories/:id (relasi buku)', `HTTP ${res.status}`);

  // Duplicate inventory code rejected.
  res = await api('/api/inventories', { method: 'POST', headers: staffAuth, body: JSON.stringify({ inventoryCode: `${P}INV1`, bookId: book.id, sourceId: source.id, condition: 'good', status: 'available' }) });
  log(res.status === 409, 'duplikat kode inventaris ditolak', `HTTP ${res.status}`);

  // ── 7. BORROWING ────────────────────────────────────────────────────
  step('7. Borrowing');
  const today = new Date().toISOString().slice(0, 10);
  const due = new Date(Date.now() + 7 * 864e5).toISOString().slice(0, 10);

  // Member must have a member profile — hook created it; use its id.
  const [memRow] = await db.select({ id: members.id }).from(members).where(eq(members.userId, member.userId)).limit(1);
  if (!memRow) { log(false, 'member row tersedia untuk peminjaman'); await cleanup(); process.exit(1); }
  const memId = memRow.id;

  res = await api('/api/borrowings', {
    method: 'POST', headers: staffAuth,
    body: JSON.stringify({ memberId: memId, borrowDate: today, dueDate: due, inventoryIds: [invs[0].id] }),
  });
  const borrowing = await res.json().catch(() => ({}));
  if (borrowing?.id) borrowingIds.push(borrowing.id);
  log(res.status === 201 && !!borrowing.id && borrowing.status === 'borrowed', 'POST /api/borrowings (create)', `HTTP ${res.status} | code=${borrowing.borrowCode}`);

  // Inventory became borrowed.
  res = await api(`/api/inventories/${invs[0].id}`, { headers: staffAuth });
  const invAfterBorrow = await res.json().catch(() => ({}));
  log(invAfterBorrow.status === 'borrowed', 'status inventaris berubah -> borrowed');

  // Borrowing already-borrowed inventory rejected.
  res = await api('/api/borrowings', {
    method: 'POST', headers: staffAuth,
    body: JSON.stringify({ memberId: memId, borrowDate: today, dueDate: due, inventoryIds: [invs[0].id] }),
  });
  log(res.status === 409, 'inventaris sedang dipinjam -> 409', `HTTP ${res.status}`);

  // List + detail.
  res = await api('/api/borrowings?page=1&limit=10', { headers: staffAuth });
  const bList = await res.json().catch(() => ({}));
  log(res.status === 200 && (bList.items ?? []).length > 0, 'GET /api/borrowings (list)', `HTTP ${res.status} | items=${(bList.items ?? []).length}`);

  res = await api(`/api/borrowings/${borrowing.id}`, { headers: staffAuth });
  const bDetail = await res.json().catch(() => ({}));
  log(res.status === 200 && bDetail.member?.user?.email === `e2e.member.${ts}@gmail.com`, 'GET /api/borrowings/:id (detail)', `HTTP ${res.status} | member=${bDetail.member?.user?.name}`);

  // Member sees own borrowing detail.
  res = await api(`/api/borrowings/${borrowing.id}`, { headers: memberAuth });
  log(res.status === 200, 'member melihat detail peminjaman miliknya', `HTTP ${res.status}`);

  // Extend due date.
  const newDue = new Date(Date.now() + 14 * 864e5).toISOString().slice(0, 10);
  res = await api(`/api/borrowings/${borrowing.id}`, { method: 'PATCH', headers: staffAuth, body: JSON.stringify({ newDueDate: newDue }) });
  log(res.status === 200, 'PATCH /api/borrowings/:id (perpanjang)', `HTTP ${res.status}`);

  // ── 8. RETURN (on time) ─────────────────────────────────────────────
  step('8. Return on-time');
  res = await api('/api/returns', {
    method: 'POST', headers: staffAuth,
    body: JSON.stringify({ borrowingId: borrowing.id, returnDate: today, notes: 'ok' }),
  });
  const ret = await res.json().catch(() => ({}));
  if (ret?.id) returnIds.push(ret.id);
  log(res.status === 201 && ret.status === 'returned' && Number(ret.fineAmount ?? 0) === 0, 'POST /api/returns (tepat waktu, tanpa denda)', `HTTP ${res.status} | fine=${ret.fineAmount}`);

  // Inventory back to available.
  res = await api(`/api/inventories/${invs[0].id}`, { headers: staffAuth });
  const invAfterReturn = await res.json().catch(() => ({}));
  log(invAfterReturn.status === 'available', 'status inventaris kembali -> available');

  // ── 9. OVERDUE BORROWING -> FINE ────────────────────────────────────
  step('9. Overdue + fine');
  // Borrow 10 days ago with a due date 3 days ago -> already overdue when returned today.
  const overdueBorrowDate = new Date(Date.now() - 10 * 864e5).toISOString().slice(0, 10);
  const overdueDue = new Date(Date.now() - 3 * 864e5).toISOString().slice(0, 10);
  res = await api('/api/borrowings', {
    method: 'POST', headers: staffAuth,
    body: JSON.stringify({ memberId: memId, borrowDate: overdueBorrowDate, dueDate: overdueDue, inventoryIds: [invs[1].id] }),
  });
  const overdueBorrow = await res.json().catch(() => ({}));
  if (overdueBorrow?.id) borrowingIds.push(overdueBorrow.id);
  log(res.status === 201, 'POST /api/borrowings (overdue)', `HTTP ${res.status}`);

  // Listing status filter (borrowed is the persisted state for a fresh borrow).
  res = await api('/api/borrowings?status=borrowed', { headers: staffAuth });
  const actList = await res.json().catch(() => ({}));
  log(res.status === 200 && (actList.items ?? []).some((b: any) => b.id === overdueBorrow.id), 'filter status=borrowed (state persist)', `HTTP ${res.status} | items=${(actList.items ?? []).length}`);

  // Overdue is computed in the dashboard (borrowed + dueDate < today), not stored.
  res = await api('/api/dashboard', { headers: staffAuth });
  const dashOv = await res.json().catch(() => ({}));
  log(dashOv.stats?.overdueBorrowings >= 1, 'dashboard menghitung overdueBorrowings >= 1', `overdue=${dashOv.stats?.overdueBorrowings}`);

  // Return late -> fine.
  res = await api('/api/returns', {
    method: 'POST', headers: staffAuth,
    body: JSON.stringify({ borrowingId: overdueBorrow.id, returnDate: today, notes: 'telat' }),
  });
  const lateRet = await res.json().catch(() => ({}));
  if (lateRet?.id) returnIds.push(lateRet.id);
  log(res.status === 201 && lateRet.status === 'late' && Number(lateRet.fineAmount ?? 0) > 0, 'POST /api/returns (terlambat -> denda)', `HTTP ${res.status} | status=${lateRet.status} fine=${lateRet.fineAmount}`);

  // Fine appears in list.
  res = await api('/api/fines?status=unpaid', { headers: staffAuth });
  const fineList = await res.json().catch(() => ({}));
  const foundFine = (fineList.items ?? []).find((f: any) => f.borrowing?.id === overdueBorrow.id);
  if (foundFine?.id) fineIds.push(foundFine.id);
  log(res.status === 200 && !!foundFine, 'GET /api/fines?status=unpaid (denda muncul)', `HTTP ${res.status} | total=${fineList.total}`);

  // Pay fine.
  if (foundFine) {
    res = await api(`/api/fines/${foundFine.id}`, { method: 'PATCH', headers: staffAuth });
    const paidFine = await res.json().catch(() => ({}));
    log(res.status === 200 && paidFine.status === 'paid', 'PATCH /api/fines/:id (bayar denda)', `HTTP ${res.status} | status=${paidFine.status}`);

    // Double-pay rejected.
    res = await api(`/api/fines/${foundFine.id}`, { method: 'PATCH', headers: staffAuth });
    log(res.status === 400, 'denda sudah lunas -> 400', `HTTP ${res.status}`);
  }

  // Member sees own fines (member view works).
  res = await api('/api/fines?status=unpaid', { headers: memberAuth });
  log(res.status === 200, 'member -> GET /api/fines 200 (view sendiri)', `HTTP ${res.status}`);

  // ── 10. REPORTS ─────────────────────────────────────────────────────
  step('10. Reports');
  res = await api('/api/reports?type=books&format=json', { headers: staffAuth });
  const repBooks = await res.json().catch(() => ({}));
  log(res.status === 200 && Array.isArray(repBooks.data), 'GET /api/reports?type=books (json)', `HTTP ${res.status} | count=${repBooks.count}`);

  res = await api('/api/reports?type=borrowings&format=csv', { headers: staffAuth });
  const csvText = await res.text();
  log(res.status === 200 && csvText.includes('No Pinjam'), 'GET /api/reports?type=borrowings (csv)', `HTTP ${res.status} | len=${csvText.length}`);

  res = await api('/api/reports?type=book-borrowings&format=json', { headers: staffAuth });
  log(res.status === 200, 'GET /api/reports?type=book-borrowings', `HTTP ${res.status}`);

  res = await api('/api/reports?type=invalid', { headers: staffAuth });
  log(res.status === 400, 'report type invalid -> 400', `HTTP ${res.status}`);

  // ── 11. SETTINGS (admin) ────────────────────────────────────────────
  step('11. Settings');
  res = await api('/api/settings', { method: 'PATCH', headers: adminAuth, body: JSON.stringify({ settings: { finePerDay: 2000 } }) });
  const setRes = await res.json().catch(() => ({}));
  log(res.status === 200 && setRes.settings?.finePerDay === 2000, 'PATCH /api/settings (admin)', `HTTP ${res.status} | finePerDay=${setRes.settings?.finePerDay}`);

  // Restore original value.
  const [origSetting] = await db.select({ value: settings.value }).from(settings).where(eq(settings.key, 'finePerDay')).limit(1);
  res = await api('/api/settings', { method: 'PATCH', headers: adminAuth, body: JSON.stringify({ settings: { finePerDay: Number(origSetting?.value ?? 1000) } }) });
  log(res.status === 200, 'restore setting finePerDay', `HTTP ${res.status}`);

  // ── 12. DASHBOARD ───────────────────────────────────────────────────
  step('12. Dashboard');
  res = await api('/api/dashboard', { headers: staffAuth });
  const dash = await res.json().catch(() => ({}));
  log(res.status === 200 && dash.stats && typeof dash.stats.totalBooks === 'number', 'GET /api/dashboard (staff stats)', `HTTP ${res.status} | keys=${Object.keys(dash.stats ?? {}).length}`);

  res = await api('/api/dashboard', { headers: adminAuth });
  const dashAdmin = await res.json().catch(() => ({}));
  log(res.status === 200 && Array.isArray(dashAdmin.recentBorrowings), 'GET /api/dashboard (admin + recentBorrowings)', `HTTP ${res.status} | recent=${(dashAdmin.recentBorrowings ?? []).length}`);

  // ── 13. STAFF MANAGEMENT (/api/users, admin) ────────────────────────
  step('13. Staff management');
  // Create a staff via API.
  res = await api('/api/users', {
    method: 'POST', headers: adminAuth,
    body: JSON.stringify({ name: `${P} Petugas`, email: `e2e.petugas.${ts}@gmail.com`, password: PASSWORD, role: 'staff' }),
  });
  const newStaff = await res.json().catch(() => ({}));
  if (newStaff?.id) userIds.push(newStaff.id);
  log(res.status === 201 && !!newStaff.id, 'admin POST /api/users (buat petugas)', `HTTP ${res.status}`);

  // Staff creation must NOT create a member profile.
  const [nsMember] = await db.select({ id: members.id }).from(members).where(eq(members.userId, newStaff.id)).limit(1);
  log(!nsMember, 'petugas baru tidak punya profil member');

  // Staff cannot create users.
  res = await api('/api/users', { method: 'POST', headers: staffAuth, body: JSON.stringify({ name: 'X', email: `x.${ts}@gmail.com`, password: PASSWORD, role: 'staff' }) });
  log(res.status === 403, 'staff POST /api/users 403', `HTTP ${res.status}`);

  // Admin edits staff: demote to member -> member profile auto-created.
  res = await api(`/api/users/${newStaff.id}`, { method: 'PATCH', headers: adminAuth, body: JSON.stringify({ role: 'member' }) });
  log(res.status === 200, 'admin PATCH role staff->member', `HTTP ${res.status}`);
  const [demotedMember] = await db.select({ id: members.id }).from(members).where(eq(members.userId, newStaff.id)).limit(1);
  if (demotedMember) memberIds.push(demotedMember.id);
  log(!!demotedMember, 'profil member dibuat otomatis saat demote');

  // Promote back to staff -> profile kept.
  res = await api(`/api/users/${newStaff.id}`, { method: 'PATCH', headers: adminAuth, body: JSON.stringify({ role: 'staff' }) });
  log(res.status === 200, 'admin PATCH role member->staff', `HTTP ${res.status}`);
  const [promotedMember] = await db.select({ id: members.id }).from(members).where(eq(members.userId, newStaff.id)).limit(1);
  log(!!promotedMember, 'profil member dipertahankan saat promote');

  // Admin cannot edit own account.
  res = await api(`/api/users/${admin.userId}`, { method: 'PATCH', headers: adminAuth, body: JSON.stringify({ name: 'Hacked' }) });
  log(res.status === 400, 'admin tidak bisa mengubah akun sendiri -> 400', `HTTP ${res.status}`);

  // Toggle status active/inactive.
  res = await api(`/api/users/${newStaff.id}`, { method: 'PATCH', headers: adminAuth, body: JSON.stringify({ status: 'inactive' }) });
  log(res.status === 200, 'admin PATCH status inactive (nonaktifkan petugas)', `HTTP ${res.status}`);
  res = await api(`/api/users/${newStaff.id}`, { method: 'PATCH', headers: adminAuth, body: JSON.stringify({ status: 'active' }) });
  log(res.status === 200, 'admin PATCH status active', `HTTP ${res.status}`);

  // Search staff list.
  res = await api(`/api/users?role=staff&q=${encodeURIComponent(`${P} Petugas`)}`, { headers: adminAuth });
  const staffList = await res.json().catch(() => ({}));
  log(res.status === 200 && (staffList.items ?? []).some((u: any) => u.id === newStaff.id), 'GET /api/users?role=staff&q=', `HTTP ${res.status} | items=${(staffList.items ?? []).length}`);

  // ── 14. AUDIT LOGS (admin) ──────────────────────────────────────────
  step('14. Audit logs');
  res = await api('/api/audit-logs?limit=20', { headers: adminAuth });
  const logs = await res.json().catch(() => ({}));
  log(res.status === 200 && (logs.items ?? []).length > 0, 'GET /api/audit-logs (admin)', `HTTP ${res.status} | total=${logs.total}`);

  res = await api('/api/audit-logs?module=USERS', { headers: adminAuth });
  const modLogs = await res.json().catch(() => ({}));
  log(res.status === 200 && (modLogs.items ?? []).length > 0, 'GET /api/audit-logs?module=USERS', `HTTP ${res.status} | total=${modLogs.total}`);

  // ── SUMMARY ─────────────────────────────────────────────────────────
  await cleanup();
  console.log(`\n=== HASIL: ${pass} PASS, ${fail} FAIL ===`);
  if (failures.length) console.log('Gagal:', failures.join(' | '));
  process.exit(fail > 0 ? 1 : 0);
}

main().catch(async (e: any) => {
  console.error('E2E crashed:', e?.message ?? String(e));
  await cleanup();
  process.exit(1);
});

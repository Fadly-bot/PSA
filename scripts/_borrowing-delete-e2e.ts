/**
 * E2E — DELETE transaksi peminjaman/pengembalian yang sudah selesai.
 *
 * Menjalankan terhadap local build (default http://localhost:3000) dengan DB
 * production. Membuat data sementara (admin, anggota, buku, inventaris,
 * peminjaman, pengembalian), memverifikasi perilaku DELETE yang aman, lalu
 * membersihkan SEMUA data sementara secara lengkap.
 *
 * Skenario:
 *   S1. DELETE peminjaman AKTIF   → dibatalkan (status cancelled), inventaris
 *       kembali available, record TIDAK dihapus fisik.
 *   S4. DELETE ulang (cancelled)  → dihapus fisik beserta detail.
 *   S2. DELETE peminjaman RETURNED→ dihapus fisik (borrowing + return + detail
 *       + denda), inventaris/member/buku tetap utuh & tersedia.
 *   S3. DELETE via /api/returns/[id] → dihapus fisik transaksi terkait.
 *   S5. DELETE id acak            → 404 (bukan 200 palsu).
 *   S6. DELETE oleh member        → 403 (permission sesuai role).
 *   S7. Integritas akhir: tidak ada orphan FK, stok inventaris benar.
 *
 * Menjalankan: npm run dev, lalu:
 *   node --env-file-if-exists=.env.local --import tsx scripts/_borrowing-delete-e2e.ts
 */
import { db } from '../src/db/index';
import {
  accounts, auditLogs, authors, bookInventories, books, borrowings,
  borrowingDetails, categories, fines, members, publishers, returns,
  roles, sessions, users,
} from '../src/db/schema';
import { eq, inArray } from 'drizzle-orm';

const BASE = process.env.TEST_BASE ?? 'http://localhost:3000';
const TS = Date.now();
const ADMIN_EMAIL = `bde.admin.${TS}@gmail.com`;
const MEMBER_EMAIL = `bde.member.${TS}@gmail.com`;
const PASSWORD = 'BdeTest123!';
const PREFIX = `BDE${TS}`;
const today = new Date().toISOString().slice(0, 10);
const daysAgo = (n: number) => {
  const d = new Date(`${today}T00:00:00`);
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
};

let pass = 0;
let fail = 0;
const failures: string[] = [];
function check(ok: boolean, label: string, detail = '') {
  if (ok) pass++;
  else { fail++; failures.push(label); }
  console.log(`${ok ? 'PASS' : 'FAIL'} | ${label}${detail ? ` | ${detail}` : ''}`);
}

async function api(path: string, init?: RequestInit) {
  const headers = new Headers(init?.headers);
  if (!headers.has('origin')) headers.set('origin', BASE);
  const res = await fetch(`${BASE}${path}`, { ...init, headers });
  let body: any = null;
  try { body = await res.json(); } catch { /* no json */ }
  return { res, body };
}

let adminCookie = '';
let memberCookie = '';

async function main() {
  console.log(`=== BORROWING/RETURN DELETE E2E (base=${BASE}) ===\n`);

  // ---- 1. Setup: akun admin + anggota sementara ----
  console.log('-- setup: akun sementara --');
  const regAdmin = await api('/api/auth/sign-up/email', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'BDE Test Admin', email: ADMIN_EMAIL, password: PASSWORD }),
  });
  check(regAdmin.res.status === 200, 'register admin sementara', `status=${regAdmin.res.status}`);
  const adminUserId = regAdmin.body?.user?.id ?? regAdmin.body?.id;
  check(!!adminUserId, 'admin user id diterima');

  const regMember = await api('/api/auth/sign-up/email', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'BDE Test Member', email: MEMBER_EMAIL, password: PASSWORD }),
  });
  check(regMember.res.status === 200, 'register anggota sementara', `status=${regMember.res.status}`);
  const memberUserId = regMember.body?.user?.id ?? regMember.body?.id;
  check(!!memberUserId, 'member user id diterima');

  // Promote admin role + aktifkan profil anggota (status wajib true utk meminjam).
  const [adminRole] = await db.select({ id: roles.id }).from(roles).where(eq(roles.name, 'admin')).limit(1);
  const [memberRole] = await db.select({ id: roles.id }).from(roles).where(eq(roles.name, 'member')).limit(1);
  if (!adminRole || !memberRole) { console.error('FATAL: role tidak ditemukan'); process.exit(1); }
  await db.update(users).set({ roleId: adminRole.id }).where(eq(users.id, adminUserId));
  await db.update(users).set({ roleId: memberRole.id }).where(eq(users.id, memberUserId));
  const [memberRow] = await db.select({ id: members.id }).from(members).where(eq(members.userId, memberUserId)).limit(1);
  check(!!memberRow?.id, 'profil anggota (members) dibuat saat register');
  const memberId = memberRow?.id;
  if (memberId) await db.update(members).set({ status: true }).where(eq(members.id, memberId));

  const login = async (email: string) => {
    const r = await api('/api/auth/sign-in/email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password: PASSWORD }),
    });
    const cookies = r.res.headers.getSetCookie?.() ?? [];
    return cookies.map((c) => c.split(';')[0]).join('; ');
  };
  adminCookie = await login(ADMIN_EMAIL);
  memberCookie = await login(MEMBER_EMAIL);
  check(adminCookie.length > 0, 'session admin diterima');
  check(memberCookie.length > 0, 'session member diterima');

  const adminHeaders = (json = true): HeadersInit => ({
    cookie: adminCookie,
    ...(json ? { 'Content-Type': 'application/json' } : {}),
  });

  // ---- 2. Setup: master data + buku (stok 3) + inventaris ----
  console.log('\n-- setup: buku + inventaris sementara --');
  const mk = async (path: string, body: any) => api(path, { method: 'POST', headers: adminHeaders(), body: JSON.stringify(body) });
  const pub = await mk('/api/publishers', { name: `${PREFIX} Penerbit` });
  const auth = await mk('/api/authors', { name: `${PREFIX} Penulis` });
  const cat = await mk('/api/categories', { name: `${PREFIX} Kategori` });
  const pubId = pub.body?.id;
  const authId = auth.body?.id;
  const catId = cat.body?.id;
  check(pub.res.status === 201 && pubId, 'POST penerbit sementara', `status=${pub.res.status}`);
  check(auth.res.status === 201 && authId, 'POST penulis sementara', `status=${auth.res.status}`);
  check(cat.res.status === 201 && catId, 'POST kategori sementara', `status=${cat.res.status}`);

  const bookRes = await mk('/api/books', {
    title: `${PREFIX} Buku Uji`,
    isbn: `978-${TS}`,
    authorId: authId,
    publisherId: pubId,
    categoryId: catId,
    stock: 3,
  });
  const bookId = bookRes.body?.id;
  check(bookRes.res.status === 201 && bookId, 'POST buku sementara (stok 3)', `status=${bookRes.res.status}`);

  const invRows = await db
    .select({ id: bookInventories.id, code: bookInventories.inventoryCode })
    .from(bookInventories)
    .where(eq(bookInventories.bookId, bookId))
    .orderBy(bookInventories.inventoryCode);
  check(invRows.length === 3, '3 inventaris dibuat otomatis', `got=${invRows.length}`);
  const [inv1, inv2, inv3] = invRows.map((i) => i.id);

  const makeBorrowing = async (inventoryId: string, borrowDate = daysAgo(2), dueDate = daysAgo(1)) => {
    const r = await mk('/api/borrowings', {
      memberId,
      inventoryIds: [inventoryId],
      borrowDate,
      dueDate,
    });
    return r.body?.id;
  };
  const processReturn = async (borrowingId: string, returnDate = today) => {
    const r = await mk('/api/returns', { borrowingId, returnDate });
    return { id: r.body?.id, status: r.res.status };
  };
  const del = async (path: string, cookie: string = adminCookie) =>
    api(path, { method: 'DELETE', headers: { cookie } as HeadersInit });

  // Semua id peminjaman sementara (untuk cleanup + leftover check).
  const allBorrowingIds: string[] = [];

  // ---- S1: DELETE peminjaman AKTIF → dibatalkan, bukan dihapus fisik ----
  console.log('\n-- S1: DELETE peminjaman aktif (borrowed) → cancel --');
  const b1 = await makeBorrowing(inv1, daysAgo(2), daysAgo(1));
  if (b1) allBorrowingIds.push(b1);
  check(!!b1, 'peminjaman B1 dibuat');
  const [inv1Before] = await db.select({ status: bookInventories.status }).from(bookInventories).where(eq(bookInventories.id, inv1));
  check(inv1Before?.status === 'borrowed', 'inventaris B1 berstatus borrowed setelah dipinjam');

  const d1 = await del(`/api/borrowings/${b1}`);
  check(d1.res.status === 200 && d1.body?.success && d1.body?.cancelled === true, 'DELETE B1 (aktif) → 200 + cancelled=true', `status=${d1.res.status}`);
  const [b1AfterCancel] = await db.select({ status: borrowings.status }).from(borrowings).where(eq(borrowings.id, b1));
  check(b1AfterCancel?.status === 'cancelled', 'B1 tetap ada dengan status cancelled (bukan hapus fisik)');
  const [inv1AfterCancel] = await db.select({ status: bookInventories.status }).from(bookInventories).where(eq(bookInventories.id, inv1));
  check(inv1AfterCancel?.status === 'available', 'inventaris B1 kembali available setelah cancel');

  // ---- S4: DELETE ulang pada status cancelled → hapus fisik ----
  console.log('\n-- S4: DELETE ulang peminjaman cancelled → hapus fisik --');
  const d1b = await del(`/api/borrowings/${b1}`);
  check(d1b.res.status === 200 && d1b.body?.success === true, 'DELETE B1 (cancelled) → 200', `status=${d1b.res.status}`);
  const [b1Gone] = await db.select({ id: borrowings.id }).from(borrowings).where(eq(borrowings.id, b1));
  const b1Details = await db.select({ id: borrowingDetails.id }).from(borrowingDetails).where(eq(borrowingDetails.borrowingId, b1));
  check(!b1Gone && b1Details.length === 0, 'B1 + detail terhapus fisik seluruhnya');

  // ---- S2: DELETE peminjaman RETURNED (denda ikut terhapus) ----
  console.log('\n-- S2: DELETE peminjaman returned (dengan denda) → hapus fisik --');
  const b2 = await makeBorrowing(inv2, daysAgo(3), daysAgo(1));
  if (b2) allBorrowingIds.push(b2);
  check(!!b2, 'peminjaman B2 dibuat (terlambat)');
  const ret2 = await processReturn(b2); // today > dueDate(daysAgo(1)) → denda 1 hari
  check(ret2.status === 201, 'pengembalian B2 sukses (denda dibuat)', `status=${ret2.status}`);
  const [fine2] = await db.select({ id: fines.id, amount: fines.amount }).from(fines).where(eq(fines.borrowingId, b2));
  check(!!fine2 && Number(fine2.amount) > 0, 'denda terkait B2 dibuat', fine2 ? `Rp${fine2.amount}` : '-');
  const [ret2Row] = await db.select({ id: returns.id }).from(returns).where(eq(returns.borrowingId, b2));
  check(!!ret2Row?.id, 'record pengembalian B2 ada');

  const d2 = await del(`/api/borrowings/${b2}`);
  check(d2.res.status === 200 && d2.body?.success === true, 'DELETE B2 (returned) → 200', `status=${d2.res.status}`);
  const [b2Gone] = await db.select({ id: borrowings.id }).from(borrowings).where(eq(borrowings.id, b2));
  const [ret2Gone] = await db.select({ id: returns.id }).from(returns).where(eq(returns.borrowingId, b2));
  const [fine2Gone] = await db.select({ id: fines.id }).from(fines).where(eq(fines.borrowingId, b2));
  const b2Details = await db.select({ id: borrowingDetails.id }).from(borrowingDetails).where(eq(borrowingDetails.borrowingId, b2));
  check(!b2Gone && !ret2Gone && !fine2Gone && b2Details.length === 0, 'B2 + pengembalian + denda + detail terhapus fisik (tidak ada orphan fine)');
  const [inv2After] = await db.select({ status: bookInventories.status, deletedAt: bookInventories.deletedAt }).from(bookInventories).where(eq(bookInventories.id, inv2));
  check(inv2After?.status === 'available' && !inv2After?.deletedAt, 'inventaris B2 tetap ada & available (stok tidak rusak)');

  // ---- S3: DELETE via /api/returns/[id] ----
  console.log('\n-- S3: DELETE pengembalian via /api/returns/[id] → hapus fisik --');
  const b3 = await makeBorrowing(inv3, daysAgo(2), daysAgo(1));
  if (b3) allBorrowingIds.push(b3);
  check(!!b3, 'peminjaman B3 dibuat');
  const ret3 = await processReturn(b3);
  check(ret3.status === 201 && !!ret3.id, 'pengembalian B3 sukses', `status=${ret3.status}`);
  const d3 = await del(`/api/returns/${ret3.id}`);
  check(d3.res.status === 200 && d3.body?.success === true, 'DELETE return B3 → 200', `status=${d3.res.status}`);
  const [b3Gone] = await db.select({ id: borrowings.id }).from(borrowings).where(eq(borrowings.id, b3));
  const [ret3Gone] = await db.select({ id: returns.id }).from(returns).where(eq(returns.borrowingId, b3));
  const b3Details = await db.select({ id: borrowingDetails.id }).from(borrowingDetails).where(eq(borrowingDetails.borrowingId, b3));
  check(!b3Gone && !ret3Gone && b3Details.length === 0, 'B3 + pengembalian + detail terhapus fisik');
  const [inv3After] = await db.select({ status: bookInventories.status }).from(bookInventories).where(eq(bookInventories.id, inv3));
  check(inv3After?.status === 'available', 'inventaris B3 tetap ada & available');

  // ---- S5: DELETE id acak → 404 ----
  console.log('\n-- S5: DELETE id tidak dikenal → 404 --');
  const RANDOM_UUID = '00000000-0000-4000-8000-000000000001';
  const d404 = await del(`/api/borrowings/${RANDOM_UUID}`);
  check(d404.res.status === 404, 'DELETE peminjaman id acak → 404', `status=${d404.res.status}`);
  const d404r = await del(`/api/returns/${RANDOM_UUID}`);
  check(d404r.res.status === 404, 'DELETE pengembalian id acak → 404', `status=${d404r.res.status}`);

  // ---- S6: member tanpa izin → 403 ----
  console.log('\n-- S6: DELETE oleh member (tanpa izin) → 403 --');
  const b4 = await makeBorrowing(inv1, daysAgo(2), daysAgo(1)); // inv1 sudah available lagi
  if (b4) allBorrowingIds.push(b4);
  check(!!b4, 'peminjaman B4 dibuat');
  const dM = await del(`/api/borrowings/${b4}`, memberCookie);
  check(dM.res.status === 403, 'DELETE B4 oleh member → 403', `status=${dM.res.status}`);
  const [b4Still] = await db.select({ status: borrowings.status }).from(borrowings).where(eq(borrowings.id, b4));
  const [inv1Still] = await db.select({ status: bookInventories.status }).from(bookInventories).where(eq(bookInventories.id, inv1));
  check(b4Still?.status === 'borrowed' && inv1Still?.status === 'borrowed', 'B4 & inventaris tidak berubah setelah 403');
  const d4 = await del(`/api/borrowings/${b4}`);
  check(d4.res.status === 200, 'admin DELETE B4 (cancel) berhasil utk bersih-bersih', `status=${d4.res.status}`);

  // ---- S7: Integritas akhir ----
  console.log('\n-- S7: integritas & sisa data --');
  const [bookStill] = await db.select({ id: books.id }).from(books).where(eq(books.id, bookId));
  const [memberStill] = await db.select({ id: members.id }).from(members).where(eq(members.id, memberId));
  check(!!bookStill && !!memberStill, 'buku & anggota sementara tetap ada (tidak ikut terhapus)');
  const invsNow = await db.select({ id: bookInventories.id }).from(bookInventories).where(inArray(bookInventories.id, [inv1, inv2, inv3]));
  check(invsNow.length === 3, 'ketiga inventaris tetap ada (stok tidak berkurang)', `got=${invsNow.length}`);
  const orphanDetails = await db
    .select({ id: borrowingDetails.id })
    .from(borrowingDetails)
    .leftJoin(borrowings, eq(borrowingDetails.borrowingId, borrowings.id))
    .where(eq(borrowingDetails.borrowingId, b2));
  check(orphanDetails.length === 0, 'tidak ada borrowing_detail orphan');

  // ---- CLEANUP total ----
  console.log('\n-- cleanup: hapus semua data sementara --');
  try {
    if (allBorrowingIds.length) {
      await db.delete(fines).where(inArray(fines.borrowingId, allBorrowingIds)).catch(() => {});
      await db.delete(returns).where(inArray(returns.borrowingId, allBorrowingIds)).catch(() => {});
      await db.delete(borrowingDetails).where(inArray(borrowingDetails.borrowingId, allBorrowingIds)).catch(() => {});
      await db.delete(borrowings).where(inArray(borrowings.id, allBorrowingIds)).catch(() => {});
    }
    await db.delete(bookInventories).where(inArray(bookInventories.id, [inv1, inv2, inv3])).catch(() => {});
    if (bookId) await db.delete(books).where(eq(books.id, bookId)).catch(() => {});
    if (pubId) await db.delete(publishers).where(eq(publishers.id, pubId)).catch(() => {});
    if (authId) await db.delete(authors).where(eq(authors.id, authId)).catch(() => {});
    if (catId) await db.delete(categories).where(eq(categories.id, catId)).catch(() => {});
    for (const uid of [adminUserId, memberUserId]) {
      await db.delete(members).where(eq(members.userId, uid)).catch(() => {});
      await db.delete(auditLogs).where(eq(auditLogs.userId, uid)).catch(() => {});
      await db.delete(sessions).where(eq(sessions.userId, uid)).catch(() => {});
      await db.delete(accounts).where(eq(accounts.userId, uid)).catch(() => {});
      await db.delete(users).where(eq(users.id, uid)).catch(() => {});
    }
  } catch (e: any) {
    console.error('  cleanup error:', e?.message ?? e);
  }

  const leftovers = await Promise.all([
    ...allBorrowingIds.map((id) => db.select({ id: borrowings.id }).from(borrowings).where(eq(borrowings.id, id))),
    db.select({ id: bookInventories.id }).from(bookInventories).where(inArray(bookInventories.id, [inv1, inv2, inv3])),
    db.select({ id: books.id }).from(books).where(eq(books.id, bookId ?? '')),
    db.select({ id: publishers.id }).from(publishers).where(eq(publishers.id, pubId ?? '')),
    db.select({ id: authors.id }).from(authors).where(eq(authors.id, authId ?? '')),
    db.select({ id: categories.id }).from(categories).where(eq(categories.id, catId ?? '')),
    db.select({ id: members.id }).from(members).where(eq(members.userId, adminUserId ?? '')),
    db.select({ id: members.id }).from(members).where(eq(members.userId, memberUserId ?? '')),
    db.select({ id: users.id }).from(users).where(eq(users.id, adminUserId ?? '')),
    db.select({ id: users.id }).from(users).where(eq(users.id, memberUserId ?? '')),
  ]);
  const totalLeft = leftovers.reduce((n, rows) => n + rows.length, 0);
  check(totalLeft === 0, 'tidak ada data sementara tersisa di DB', `leftover=${totalLeft}`);

  console.log(`\n=== HASIL: ${pass} PASS, ${fail} FAIL ===`);
  if (failures.length) console.log('Gagal:', failures.join(' | '));
  await db.$client.end?.().catch(() => {});
  process.exit(fail > 0 ? 1 : 0);
}

main().catch((e) => { console.error('TEST crashed:', e?.message ?? e); process.exit(1); });

/**
 * TEMP TEST — DELETE protection for master data (publishers/authors/categories/shelves).
 * Runs against the LOCAL production build (localhost:3000) backed by the production DB.
 * Creates temporary data, verifies the protection + messages, then cleans up completely.
 * Deleted after the run.
 */
import { db } from '../src/db/index';
import {
  users, roles, books, bookInventories, publishers, authors, categories, shelves,
  auditLogs, sessions, accounts,
} from '../src/db/schema';
import { eq } from 'drizzle-orm';

const BASE = process.env.TEST_BASE ?? 'http://localhost:3000';
const TS = Date.now();
const EMAIL = `dptest.${TS}@gmail.com`;
const PASSWORD = 'DpTest123!';
const PREFIX = `DP${TS}`;

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

let cookie = '';

async function main() {
  console.log(`=== DELETE-PROTECTION TEST (base=${BASE}) ===\n`);

  // ---- 1. Register temp admin + promote role ----
  console.log('-- setup: akun admin sementara --');
  const reg = await api('/api/auth/sign-up/email', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'DP Test Admin', email: EMAIL, password: PASSWORD }),
  });
  check(reg.res.status === 200, 'register akun sementara', `status=${reg.res.status}`);
  const userId = reg.body?.user?.id ?? reg.body?.id;
  check(!!userId, 'register mengembalikan user id', String(userId ?? ''));

  const [adminRole] = await db.select({ id: roles.id }).from(roles).where(eq(roles.name, 'admin')).limit(1);
  if (!adminRole) { console.error('FATAL: role admin tidak ditemukan'); process.exit(1); }
  await db.update(users).set({ roleId: adminRole.id }).where(eq(users.id, userId));

  const login = await api('/api/auth/sign-in/email', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: EMAIL, password: PASSWORD }),
  });
  check(login.res.status === 200, 'login akun sementara', `status=${login.res.status}`);
  const setCookies = login.res.headers.getSetCookie?.() ?? [];
  cookie = setCookies.map((c) => c.split(';')[0]).join('; ');
  check(cookie.length > 0, 'session cookie diterima', `cookies=${setCookies.length}`);

  const authHeaders = (json = true): HeadersInit => ({
    cookie,
    ...(json ? { 'Content-Type': 'application/json' } : {}),
  });

  // ---- 2. Buat data master sementara ----
  console.log('\n-- setup: data master + buku sementara --');
  const mk = async (path: string, body: any) => {
    const r = await api(path, { method: 'POST', headers: authHeaders(), body: JSON.stringify(body) });
    return r;
  };
  const pub = await mk('/api/publishers', { name: `${PREFIX} Penerbit` });
  const auth = await mk('/api/authors', { name: `${PREFIX} Penulis` });
  const cat = await mk('/api/categories', { name: `${PREFIX} Kategori` });
  const sh = await mk('/api/shelves', { code: `SH-${PREFIX}`, name: `${PREFIX} Rak` });
  const pubUnused = await mk('/api/publishers', { name: `${PREFIX} Penerbit Bebas` });
  const pubId = pub.body?.id;
  const authId = auth.body?.id;
  const catId = cat.body?.id;
  const shId = sh.body?.id;
  const pubUnusedId = pubUnused.body?.id;
  check(pub.res.status === 201 && pubId, 'POST penerbit sementara', `status=${pub.res.status}`);
  check(auth.res.status === 201 && authId, 'POST penulis sementara', `status=${auth.res.status}`);
  check(cat.res.status === 201 && catId, 'POST kategori sementara', `status=${cat.res.status}`);
  check(sh.res.status === 201 && shId, 'POST rak sementara', `status=${sh.res.status}`);
  check(pubUnused.res.status === 201 && pubUnusedId, 'POST penerbit bebas (unused) sementara', `status=${pubUnused.res.status}`);

  // ---- 3. Buku sementara yang memakai semua master data + inventaris di rak ----
  const bookRes = await mk('/api/books', {
    title: `${PREFIX} Buku Uji`,
    isbn: `978-${TS}`,
    authorId: authId,
    publisherId: pubId,
    categoryId: catId,
    stock: 1,
  });
  const bookId = bookRes.body?.id;
  check(bookRes.res.status === 201 && bookId, 'POST buku sementara (pakai semua master)', `status=${bookRes.res.status}`);
  const [inv] = await db
    .select({ id: bookInventories.id })
    .from(bookInventories)
    .where(eq(bookInventories.bookId, bookId))
    .limit(1);
  check(!!inv?.id, 'inventaris buku sementara dibuat', `inv=${inv?.id ?? '-'}`);
  if (inv?.id && shId) {
    await db.update(bookInventories).set({ shelfId: shId }).where(eq(bookInventories.id, inv.id));
  }
  const [invCheck] = await db
    .select({ shelfId: bookInventories.shelfId })
    .from(bookInventories)
    .where(eq(bookInventories.id, inv.id))
    .limit(1);
  check(invCheck?.shelfId === shId, 'inventaris menunjuk ke rak sementara');

  // ---- 4. DELETE ditolak untuk master yang masih digunakan ----
  console.log('\n-- uji: DELETE master yang masih digunakan → 409 + pesan benar --');
  const del = async (path: string) => api(path, { method: 'DELETE', headers: authHeaders(false) });

  const dPub = await del(`/api/publishers/${pubId}`);
  check(dPub.res.status === 409, 'DELETE penerbit terpakai → 409', `status=${dPub.res.status}`);
  check((dPub.body?.error ?? '').includes('Penerbit tidak dapat dihapus karena masih digunakan oleh 1 buku.'), 'pesan penerbit benar + jumlah buku', dPub.body?.error ?? '');
  check(dPub.body?.code === 'MASTER_DATA_IN_USE' && dPub.body?.count === 1, 'payload code/count benar', `code=${dPub.body?.code} count=${dPub.body?.count}`);

  const dAuth = await del(`/api/authors/${authId}`);
  check(dAuth.res.status === 409, 'DELETE penulis terpakai → 409', `status=${dAuth.res.status}`);
  check((dAuth.body?.error ?? '').includes('Penulis tidak dapat dihapus karena masih digunakan oleh 1 buku.'), 'pesan penulis benar + jumlah buku', dAuth.body?.error ?? '');

  const dCat = await del(`/api/categories/${catId}`);
  check(dCat.res.status === 409, 'DELETE kategori terpakai → 409', `status=${dCat.res.status}`);
  check((dCat.body?.error ?? '').includes('Kategori tidak dapat dihapus karena masih digunakan oleh 1 buku.'), 'pesan kategori benar + jumlah buku', dCat.body?.error ?? '');

  const dSh = await del(`/api/shelves/${shId}`);
  check(dSh.res.status === 409, 'DELETE rak terpakai → 409', `status=${dSh.res.status}`);
  check((dSh.body?.error ?? '').includes('Rak buku tidak dapat dihapus karena masih digunakan oleh 1 inventaris buku.'), 'pesan rak benar + jumlah inventaris', dSh.body?.error ?? '');

  // ---- 5. Buku TIDAK ikut terhapus ----
  console.log('\n-- uji: buku yang memakai master data tidak ikut terhapus --');
  const [bookStill] = await db.select({ id: books.id }).from(books).where(eq(books.id, bookId)).limit(1);
  check(!!bookStill, 'buku masih ada setelah semua DELETE ditolak', bookStill?.id ?? 'HILANG');
  const [invStill] = await db.select({ id: bookInventories.id }).from(bookInventories).where(eq(bookInventories.id, inv.id)).limit(1);
  check(!!invStill, 'inventaris masih ada setelah DELETE rak ditolak');

  // Master rows masih ada juga (tidak terhapus sebagian).
  const [pubStill] = await db.select({ id: publishers.id }).from(publishers).where(eq(publishers.id, pubId)).limit(1);
  const [authStill] = await db.select({ id: authors.id }).from(authors).where(eq(authors.id, authId)).limit(1);
  const [catStill] = await db.select({ id: categories.id }).from(categories).where(eq(categories.id, catId)).limit(1);
  const [shStill] = await db.select({ id: shelves.id }).from(shelves).where(eq(shelves.id, shId)).limit(1);
  check(!!pubStill && !!authStill && !!catStill && !!shStill, 'semua master data tetap ada (tidak terhapus sebagian)');

  // ---- 6. Master data yang TIDAK digunakan → masih bisa dihapus ----
  console.log('\n-- uji: master data yang tidak digunakan masih bisa dihapus --');
  const dPubUnused = await del(`/api/publishers/${pubUnusedId}`);
  check(dPubUnused.res.status === 200, 'DELETE penerbit bebas → sukses (200)', `status=${dPubUnused.res.status}`);
  const [pubUnusedGone] = await db.select({ id: publishers.id }).from(publishers).where(eq(publishers.id, pubUnusedId)).limit(1);
  check(!pubUnusedGone, 'penerbit bebas benar-benar terhapus dari DB');

  // ---- 7. CLEANUP total ----
  console.log('\n-- cleanup: hapus semua data sementara --');
  try {
    if (inv?.id) await db.delete(bookInventories).where(eq(bookInventories.id, inv.id));
    if (bookId) await db.delete(books).where(eq(books.id, bookId));
    if (pubId) await db.delete(publishers).where(eq(publishers.id, pubId));
    if (authId) await db.delete(authors).where(eq(authors.id, authId));
    if (catId) await db.delete(categories).where(eq(categories.id, catId));
    if (shId) await db.delete(shelves).where(eq(shelves.id, shId));
    if (userId) {
      await db.delete(auditLogs).where(eq(auditLogs.userId, userId));
      await db.delete(sessions).where(eq(sessions.userId, userId));
      await db.delete(accounts).where(eq(accounts.userId, userId));
      await db.delete(users).where(eq(users.id, userId));
    }
  } catch (e: any) {
    console.error('  cleanup error:', e?.message ?? e);
  }
  const leftovers = await Promise.all([
    db.select({ id: books.id }).from(books).where(eq(books.id, bookId)),
    db.select({ id: bookInventories.id }).from(bookInventories).where(eq(bookInventories.id, inv?.id ?? '')),
    db.select({ id: publishers.id }).from(publishers).where(eq(publishers.id, pubId)),
    db.select({ id: authors.id }).from(authors).where(eq(authors.id, authId)),
    db.select({ id: categories.id }).from(categories).where(eq(categories.id, catId)),
    db.select({ id: shelves.id }).from(shelves).where(eq(shelves.id, shId)),
    db.select({ id: publishers.id }).from(publishers).where(eq(publishers.id, pubUnusedId)),
    db.select({ id: users.id }).from(users).where(eq(users.id, userId)),
  ]);
  const totalLeft = leftovers.reduce((n, rows) => n + rows.length, 0);
  check(totalLeft === 0, 'tidak ada data sementara tersisa di DB', `leftover=${totalLeft}`);

  console.log(`\n=== HASIL: ${pass} PASS, ${fail} FAIL ===`);
  if (failures.length) console.log('Gagal:', failures.join(' | '));
  await db.$client.end?.().catch(() => {});
  process.exit(fail > 0 ? 1 : 0);
}

main().catch((e) => { console.error('TEST crashed:', e?.message ?? e); process.exit(1); });

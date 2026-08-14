/**
 * Cleanup target — rak test "dsafsd", buku test soft-deleted, dan user test
 * soft-deleted (hasil audit & persetujuan pengguna).
 *
 * HANYA menghapus item eksplisit di bawah ini, dengan pemeriksaan keamanan:
 *   - Rak "dsafsd": hanya jika tidak dipakai inventaris AKTIF; ref inventaris
 *     soft-deleted dilepas dulu (shelf_id nullable), lalu rak dihapus.
 *   - Buku test: hanya jika TIDAK punya inventaris & TIDAK tercatat di
 *     borrowing_details (tidak menyentuh riwayat peminjaman).
 *   - User test: hanya jika member-nya TIDAK punya peminjaman sama sekali;
 *     audit_logs + members dibersihkan dulu (FK restrict), user dihapus
 *     (sessions/accounts cascade otomatis).
 *
 * Yang TIDAK pernah disentuh: Administrator, MUHAMMAD FADLY NUR HAKIM
 * (pemilik — member-nya memegang 1 peminjaman), Amor Fati (ambigu), buku
 * "pergi" + inventaris 2215451514 + seluruh rantai peminjaman/pengembalian.
 *
 * Dry run: DRY_RUN=1 node --env-file-if-exists=.env.local --import tsx scripts/_cleanup-soft-deleted.ts
 */
import { db } from '../src/db/index';
import {
  auditLogs, bookInventories, books, borrowingDetails, borrowings,
  members, shelves, users,
} from '../src/db/schema';
import { and, eq, inArray, isNull, sql } from 'drizzle-orm';

const DRY_RUN = process.env.DRY_RUN === '1';

const TEST_BOOK_TITLES = [
  'P2S1786290717677 Buku2',
  'FN1786370084851 Buku',
  'DBG1786369417868 Buku',
  'E2E1786369018778 Buku Utama',
  'Buku Uji Deploy 1786445805',
  'P2S1786290400185 Buku',
  'P2S1786290010363 Buku',
  'P2D1786290054690 Buku',
];

const TEST_USER_EMAILS = [
  'admin@tbmsepmestaalam.com',          // orders
  'diag.brw.1786527967941@gmail.com',   // Diag Borrow
  'dbg.1786630228@gmail.com',           // DBG Tmp
  'dbg3.1786630411@gmail.com',          // DBG Tmp3
  'dbg4.1786630413552@gmail.com',       // DBG Tmp4
];

let deleted = 0;
const skipped: string[] = [];

function log(ok: boolean, label: string, detail = '') {
  console.log(`${ok ? '  ✓' : '  ⚠'} ${label}${detail ? ` — ${detail}` : ''}`);
}

async function main() {
  console.log(`=== CLEANUP SOFT-DELETED (rak dsafsd / buku test / user test)${DRY_RUN ? ' [DRY RUN]' : ''} ===\n`);

  // ---- 1. Rak "dsafsd - sdf" ----
  console.log('-- 1. Rak test "dsafsd - sdf" --');
  const [shelf] = await db.select().from(shelves).where(eq(shelves.code, 'dsafsd')).limit(1);
  if (!shelf) {
    console.log('  (rak dsafsd tidak ditemukan)');
  } else {
    const [activeRefs] = await db
      .select({ n: sql<number>`count(*)` })
      .from(bookInventories)
      .where(and(eq(bookInventories.shelfId, shelf.id), isNull(bookInventories.deletedAt)));
    if (Number(activeRefs?.n ?? 0) > 0) {
      skipped.push('RAK:dsafsd');
      log(false, `Dilewati (dipakai ${activeRefs?.n} inventaris aktif)`);
    } else if (DRY_RUN) {
      log(true, 'Siap dihapus (lepas ref inventaris soft-deleted)');
    } else {
      await db.transaction(async (tx) => {
        await tx
          .update(bookInventories)
          .set({ shelfId: null })
          .where(and(eq(bookInventories.shelfId, shelf.id), sql`${bookInventories.deletedAt} IS NOT NULL`));
        await tx.delete(shelves).where(eq(shelves.id, shelf.id));
      });
      deleted++;
      log(true, 'Dihapus', `${shelf.code} - ${shelf.name}`);
    }
  }

  // ---- 2. Buku test soft-deleted ----
  console.log('\n-- 2. Buku test soft-deleted --');
  const testBooks = await db
    .select({ id: books.id, title: books.title, slug: books.slug, deletedAt: books.deletedAt })
    .from(books)
    .where(inArray(books.title, TEST_BOOK_TITLES));
  for (const b of testBooks) {
    if (!b.deletedAt) {
      skipped.push(`BUKU:${b.title}`);
      log(false, 'Dilewati (tidak soft-deleted — bukan target)', b.title);
      continue;
    }
    const [invCount] = await db
      .select({ n: sql<number>`count(*)` })
      .from(bookInventories)
      .where(eq(bookInventories.bookId, b.id));
    const [detailCount] = await db
      .select({ n: sql<number>`count(*)` })
      .from(borrowingDetails)
      .innerJoin(bookInventories, eq(borrowingDetails.bookInventoryId, bookInventories.id))
      .where(eq(bookInventories.bookId, b.id));
    const invN = Number(invCount?.n ?? 0);
    const detN = Number(detailCount?.n ?? 0);
    if (invN > 0 || detN > 0) {
      skipped.push(`BUKU:${b.title}`);
      log(false, `Dilewati (inventaris=${invN}, detail=${detN})`, b.title);
      continue;
    }
    if (DRY_RUN) { log(true, 'Siap dihapus', b.title); continue; }
    await db.delete(books).where(eq(books.id, b.id));
    deleted++;
    log(true, 'Dihapus', b.title);
  }

  // ---- 3. User test soft-deleted ----
  console.log('\n-- 3. User test soft-deleted --');
  const testUsers = await db
    .select({ id: users.id, name: users.name, email: users.email, deletedAt: users.deletedAt })
    .from(users)
    .where(inArray(users.email, TEST_USER_EMAILS));
  for (const u of testUsers) {
    const [member] = await db.select({ id: members.id }).from(members).where(eq(members.userId, u.id)).limit(1);
    let borrowingN = 0;
    if (member) {
      const [br] = await db
        .select({ n: sql<number>`count(*)` })
        .from(borrowings)
        .where(eq(borrowings.memberId, member.id));
      borrowingN = Number(br?.n ?? 0);
    }
    if (borrowingN > 0) {
      skipped.push(`USER:${u.email}`);
      log(false, `Dilewati (member punya ${borrowingN} peminjaman)`, u.name);
      continue;
    }
    if (DRY_RUN) { log(true, 'Siap dihapus (member + user)', `${u.name} <${u.email}>`); continue; }
    await db.transaction(async (tx) => {
      if (member) await tx.delete(members).where(eq(members.id, member.id));
      await tx.delete(auditLogs).where(eq(auditLogs.userId, u.id));
      await tx.delete(users).where(eq(users.id, u.id));
    });
    deleted++;
    log(true, 'Dihapus', `${u.name} <${u.email}>`);
  }

  console.log(`\n=== HASIL: ${deleted} item dihapus, ${skipped.length} dilewati${DRY_RUN ? ' (dry run)' : ''} ===`);
  if (skipped.length) console.log('Dilewati:', skipped.join(' | '));
  await db.$client.end?.().catch(() => {});
  process.exit(0);
}

main().catch((e) => { console.error('CLEANUP crashed:', e?.message ?? e); process.exit(1); });

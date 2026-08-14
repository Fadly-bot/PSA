/**
 * Safe cleanup of TEST/DEMO master data (Phase 2/6).
 *
 * Only removes records whose names clearly mark them as test data
 * (E2E/DBG/FN/P2S/P2D prefixes) and that are NOT referenced by any ACTIVE
 * (non-soft-deleted) book/inventory. It mirrors the exact safety rules of
 * the DELETE APIs:
 *
 *   - categories/authors/publishers: references from soft-deleted books are
 *     detached (column nullable); active books block deletion.
 *   - book sources: active inventories block deletion; soft-deleted
 *     inventories are physically removed only when NOT referenced by
 *     borrowing history (borrowing_details).
 *   - shelves: soft-deleted inventories are detached (shelf_id nullable);
 *     active inventories block deletion.
 *
 * Production master data (fiksi, tere liye, Republika, republika, …) is
 * NEVER touched. Soft-deleted test books/users/members are left in place
 * (already invisible) and reported instead.
 *
 * Dry run:  DRY_RUN=1 node --env-file-if-exists=.env.local --import tsx scripts/_cleanup-test-data.ts
 */
import { db } from '../src/db/index';
import {
  authors, bookInventories, bookSources, books, borrowingDetails,
  categories, publishers, shelves,
} from '../src/db/schema';
import { and, eq, inArray, isNull, like, or, sql } from 'drizzle-orm';

const DRY_RUN = process.env.DRY_RUN === '1';

// Name prefixes used by all test tooling (E2E/DBG/FN/P2S/P2D + timestamp).
const TEST_PATTERN = (col: any) =>
  or(like(col, 'E2E%'), like(col, 'DBG%'), like(col, 'FN%'), like(col, 'P2S%'), like(col, 'P2D%'));

let deleted = 0;
const skipped: string[] = [];

function log(ok: boolean, label: string, detail = '') {
  console.log(`${ok ? '  ✓' : '  ⚠'} ${label}${detail ? ` — ${detail}` : ''}`);
}

const fmt = (rows: { id: string; name?: string | null; code?: string | null }[]) =>
  rows.map((r) => `${r.name ?? r.code ?? r.id.slice(0, 8)}`).join(', ') || '-';

async function main() {
  console.log(`=== CLEANUP TEST MASTER DATA${DRY_RUN ? ' (DRY RUN)' : ''} ===\n`);

  // ---- 1. Categories / Authors / Publishers (nullable FK on books) ----
  // [label, table, fk column on books, JS key for the update set()]
  for (const [label, table, fk, fkKey] of [
    ['KATEGORI', categories, books.categoryId, 'categoryId'],
    ['PENULIS', authors, books.authorId, 'authorId'],
    ['PENERBIT', publishers, books.publisherId, 'publisherId'],
  ] as const) {
    console.log(`\n-- ${label} --`);
    const rows = await db.select({ id: table.id, name: table.name }).from(table).where(TEST_PATTERN(table.name));
    if (rows.length === 0) { console.log('  (tidak ada data test)'); continue; }
    console.log(`  Ditemukan test: ${fmt(rows)}`);

    for (const row of rows) {
      const [activeRefs] = await db
        .select({ n: sql<number>`count(*)` })
        .from(books)
        .where(and(eq(fk, row.id), isNull(books.deletedAt)));
      if (Number(activeRefs?.n ?? 0) > 0) {
        skipped.push(`${label}:${row.name}`);
        log(false, `Dilewati (masih dipakai ${activeRefs?.n} buku aktif)`, row.name ?? row.id);
        continue;
      }
      if (DRY_RUN) { log(true, 'Siap dihapus (lepas ref buku soft-deleted)', row.name ?? row.id); continue; }
      await db.transaction(async (tx) => {
        await tx.update(books).set({ [fkKey]: null }).where(and(eq(fk, row.id), sql`${books.deletedAt} IS NOT NULL`));
        await tx.delete(table).where(eq(table.id, row.id));
      });
      deleted++;
      log(true, 'Dihapus', row.name ?? row.id);
    }
  }

  // ---- 2. Book sources (NOT NULL FK on inventories) ----
  console.log('\n-- SUMBER BUKU --');
  const srcRows = await db.select({ id: bookSources.id, name: bookSources.name }).from(bookSources).where(TEST_PATTERN(bookSources.name));
  if (srcRows.length === 0) console.log('  (tidak ada data test)');
  else {
    console.log(`  Ditemukan test: ${fmt(srcRows)}`);
    for (const row of srcRows) {
      const [activeRefs] = await db
        .select({ n: sql<number>`count(*)` })
        .from(bookInventories)
        .where(and(eq(bookInventories.sourceId, row.id), isNull(bookInventories.deletedAt)));
      if (Number(activeRefs?.n ?? 0) > 0) {
        skipped.push(`SUMBER:${row.name}`);
        log(false, 'Dilewati (dipakai inventaris aktif)', row.name ?? row.id);
        continue;
      }
      const deletedInv = await db
        .select({ id: bookInventories.id })
        .from(bookInventories)
        .where(and(eq(bookInventories.sourceId, row.id), sql`${bookInventories.deletedAt} IS NOT NULL`));
      const invIds = deletedInv.map((i) => i.id);
      if (invIds.length > 0) {
        const [histRefs] = await db
          .select({ n: sql<number>`count(*)` })
          .from(borrowingDetails)
          .where(inArray(borrowingDetails.bookInventoryId, invIds));
        if (Number(histRefs?.n ?? 0) > 0) {
          skipped.push(`SUMBER:${row.name}`);
          log(false, 'Dilewati (tercatat pada riwayat peminjaman)', row.name ?? row.id);
          continue;
        }
      }
      if (DRY_RUN) { log(true, 'Siap dihapus (+ inventaris soft-deleted terkait)', row.name ?? row.id); continue; }
      await db.transaction(async (tx) => {
        if (invIds.length > 0) await tx.delete(bookInventories).where(inArray(bookInventories.id, invIds));
        await tx.delete(bookSources).where(eq(bookSources.id, row.id));
      });
      deleted++;
      log(true, `Dihapus (+ ${invIds.length} inventaris test dibersihkan)`, row.name ?? row.id);
    }
  }

  // ---- 3. Shelves (nullable FK on inventories) ----
  console.log('\n-- RAK BUKU --');
  const shelfRows = await db
    .select({ id: shelves.id, code: shelves.code, name: shelves.name })
    .from(shelves)
    .where(or(TEST_PATTERN(shelves.name), TEST_PATTERN(shelves.code)));
  if (shelfRows.length === 0) console.log('  (tidak ada data test)');
  else {
    console.log(`  Ditemukan test: ${fmt(shelfRows)}`);
    for (const row of shelfRows) {
      const [activeRefs] = await db
        .select({ n: sql<number>`count(*)` })
        .from(bookInventories)
        .where(and(eq(bookInventories.shelfId, row.id), isNull(bookInventories.deletedAt)));
      if (Number(activeRefs?.n ?? 0) > 0) {
        skipped.push(`RAK:${row.code ?? row.id}`);
        log(false, 'Dilewati (dipakai inventaris aktif)', `${row.code} - ${row.name}`);
        continue;
      }
      if (DRY_RUN) { log(true, 'Siap dihapus (lepas ref inventaris soft-deleted)', `${row.code} - ${row.name}`); continue; }
      await db.transaction(async (tx) => {
        await tx
          .update(bookInventories)
          .set({ shelfId: null })
          .where(and(eq(bookInventories.shelfId, row.id), sql`${bookInventories.deletedAt} IS NOT NULL`));
        await tx.delete(shelves).where(eq(shelves.id, row.id));
      });
      deleted++;
      log(true, 'Dihapus', `${row.code} - ${row.name}`);
    }
  }

  // ---- 4. Things intentionally NOT deleted ----
  console.log('\n-- DIBIARKAN (sengaja) --');
  const bookRows = await db
    .select({ title: books.title, deletedAt: books.deletedAt })
    .from(books)
    .where(TEST_PATTERN(books.title));
  if (bookRows.length > 0) {
    log(false, `Buku test ${bookRows.length} judul masih soft-deleted (tidak dihapus fisik)`, bookRows.map((b) => b.title).join(', '));
  }
  const [activeBooks] = await db
    .select({ n: sql<number>`count(*)` })
    .from(books)
    .where(and(isNull(books.deletedAt), eq(books.status, 'active')));
  log(true, `Buku aktif produksi: ${activeBooks?.n ?? 0} (tidak disentuh)`);

  console.log(`\n=== HASIL: ${deleted} record test dihapus, ${skipped.length} dilewati${DRY_RUN ? ' (dry run)' : ''} ===`);
  if (skipped.length) console.log('Dilewati:', skipped.join(' | '));
  await db.$client.end?.().catch(() => {});
  process.exit(0);
}

main().catch((e) => { console.error('CLEANUP crashed:', e?.message ?? e); process.exit(1); });

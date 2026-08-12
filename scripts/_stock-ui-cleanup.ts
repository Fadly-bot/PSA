/**
 * UI CLEANUP — removes staff accounts and any books/inventories created by
 * the Stok browser test (prefix STKUI). Matches ALL stkui test users so it
 * also cleans up leftovers from aborted runs.
 * Run: node --env-file-if-exists=.env.local --import tsx scripts/_stock-ui-cleanup.ts
 */
import { db } from '../src/db/index';
import {
  accounts, auditLogs, bookInventories, books, members, sessions, users,
} from '../src/db/schema';
import { inArray, ilike } from 'drizzle-orm';

async function main() {
  // Books + inventories created by the UI test carry the STKUI prefix in the title.
  const booksToDelete = await db.select({ id: books.id }).from(books).where(ilike(books.title, 'STKUI%'));
  if (booksToDelete.length) {
    const invs = await db.select({ id: bookInventories.id }).from(bookInventories).where(inArray(bookInventories.bookId, booksToDelete.map((b) => b.id)));
    if (invs.length) await db.delete(bookInventories).where(inArray(bookInventories.id, invs.map((i) => i.id)));
    await db.delete(books).where(inArray(books.id, booksToDelete.map((b) => b.id)));
    console.log(`dihapus ${booksToDelete.length} buku test + ${invs.length} inventaris`);
  }

  const userRows = await db.select({ id: users.id }).from(users).where(ilike(users.email, 'stkui.%@gmail.com'));
  if (userRows.length) {
    const ids = userRows.map((u) => u.id);
    await db.delete(auditLogs).where(inArray(auditLogs.userId, ids));
    await db.delete(accounts).where(inArray(accounts.userId, ids));
    await db.delete(sessions).where(inArray(sessions.userId, ids));
    await db.delete(members).where(inArray(members.userId, ids));
    await db.delete(users).where(inArray(users.id, ids));
    console.log(`user test dihapus: ${userRows.length}`);
  }
  process.exit(0);
}

main().catch((e) => { console.error('cleanup crashed:', e?.message ?? e); process.exit(1); });

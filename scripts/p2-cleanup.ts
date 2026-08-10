import { db } from '../src/db/index';
import {
  accounts, auditLogs, bookInventories, books, bookSources, borrowingDetails,
  borrowings, members, sessions, users,
} from '../src/db/schema';
import { eq, ilike, inArray } from 'drizzle-orm';

// Delete test borrowings (FK order: details first).
const borrowRows = await db.select({ id: borrowings.id }).from(borrowings).where(ilike(borrowings.borrowCode, 'BRW-%'));
for (const row of borrowRows) {
  await db.delete(borrowingDetails).where(eq(borrowingDetails.borrowingId, row.id));
}
console.log('borrowings found:', borrowRows.length);
if (borrowRows.length) {
  await db.delete(borrowings).where(inArray(borrowings.id, borrowRows.map((r) => r.id)));
}

const invs = await db.select({ id: bookInventories.id }).from(bookInventories).where(ilike(bookInventories.inventoryCode, 'P2B%'));
if (invs.length) await db.delete(bookInventories).where(inArray(bookInventories.id, invs.map((r) => r.id)));
const bks = await db.select({ id: books.id }).from(books).where(ilike(books.title, 'P2B%'));
if (bks.length) await db.delete(books).where(inArray(books.id, bks.map((r) => r.id)));
const srs = await db.select({ id: bookSources.id }).from(bookSources).where(ilike(bookSources.name, 'P2B%'));
if (srs.length) await db.delete(bookSources).where(inArray(bookSources.id, srs.map((r) => r.id)));

const us = await db.select({ id: users.id }).from(users).where(ilike(users.email, 'p2.%'));
for (const u of us) {
  await db.delete(accounts).where(eq(accounts.userId, u.id));
  await db.delete(sessions).where(eq(sessions.userId, u.id));
  await db.delete(members).where(eq(members.userId, u.id));
  await db.delete(auditLogs).where(eq(auditLogs.userId, u.id));
  await db.delete(users).where(eq(users.id, u.id));
}
console.log('test users removed:', us.length);
console.log('cleanup done');
process.exit(0);

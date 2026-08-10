import { db } from '../src/db/index';
import {
  bookInventories, books, borrowings, fines, members, returns, users,
} from '../src/db/schema';
import { and, eq, isNull, sql } from 'drizzle-orm';

const today = new Date().toISOString().slice(0, 10);

async function oldRun() {
  await Promise.all([
    db.select({ c: sql<number>`count(*)` }).from(books).where(and(isNull(books.deletedAt), eq(books.status, 'active'))),
    db.select({ c: sql<number>`count(*)` }).from(bookInventories).where(isNull(bookInventories.deletedAt)),
    db.select({ c: sql<number>`count(*)` }).from(bookInventories).where(and(isNull(bookInventories.deletedAt), eq(bookInventories.status, 'available'))),
    db.select({ c: sql<number>`count(*)` }).from(bookInventories).where(and(isNull(bookInventories.deletedAt), eq(bookInventories.status, 'borrowed'))),
    db.select({ c: sql<number>`count(*)` }).from(bookInventories).where(and(isNull(bookInventories.deletedAt), eq(bookInventories.status, 'maintenance'))),
    db.select({ c: sql<number>`count(*)` }).from(bookInventories).where(and(isNull(bookInventories.deletedAt), eq(bookInventories.status, 'lost'))),
    db.select({ c: sql<number>`count(*)` }).from(members).innerJoin(users, eq(members.userId, users.id)).where(and(isNull(users.deletedAt), eq(members.status, true))),
    db.select({ c: sql<number>`count(*)` }).from(borrowings),
    db.select({ c: sql<number>`count(*)` }).from(borrowings).where(sql`${borrowings.status} IN ('borrowed', 'overdue')`),
    db.select({ c: sql<number>`count(*)` }).from(borrowings).where(and(eq(borrowings.status, 'borrowed'), sql`${borrowings.dueDate} < ${today}`)),
    db.select({ c: sql<number>`count(*)` }).from(borrowings).where(eq(borrowings.borrowDate, today)),
    db.select({ c: sql<number>`count(*)` }).from(returns).where(eq(returns.returnDate, today)),
    db.select({ c: sql<number>`count(*)` }).from(fines).where(eq(fines.status, 'unpaid')),
    db.select({ t: sql<string>`COALESCE(SUM(${fines.amount}), 0)` }).from(fines).where(eq(fines.status, 'unpaid')),
  ]);
}

async function newRun() {
  await Promise.all([
    db.select({ totalBooks: sql<number>`count(*) FILTER (WHERE ${books.status} = 'active')` }).from(books).where(isNull(books.deletedAt)),
    db.select({
      totalInventories: sql<number>`count(*)`,
      availableInventories: sql<number>`count(*) FILTER (WHERE ${bookInventories.status} = 'available')`,
      borrowedInventories: sql<number>`count(*) FILTER (WHERE ${bookInventories.status} = 'borrowed')`,
      maintenanceInventories: sql<number>`count(*) FILTER (WHERE ${bookInventories.status} = 'maintenance')`,
      lostInventories: sql<number>`count(*) FILTER (WHERE ${bookInventories.status} = 'lost')`,
    }).from(bookInventories).where(isNull(bookInventories.deletedAt)),
    db.select({ totalMembers: sql<number>`count(*)` }).from(members).innerJoin(users, eq(members.userId, users.id)).where(and(isNull(users.deletedAt), eq(members.status, true))),
    db.select({
      totalBorrowings: sql<number>`count(*)`,
      activeBorrowings: sql<number>`count(*) FILTER (WHERE ${borrowings.status} IN ('borrowed', 'overdue'))`,
      overdueBorrowings: sql<number>`count(*) FILTER (WHERE ${borrowings.status} = 'borrowed' AND ${borrowings.dueDate} < ${today})`,
      borrowingsToday: sql<number>`count(*) FILTER (WHERE ${borrowings.borrowDate} = ${today})`,
    }).from(borrowings),
    db.select({ returnsToday: sql<number>`count(*)` }).from(returns).where(eq(returns.returnDate, today)),
    db.select({
      outstandingFines: sql<number>`count(*) FILTER (WHERE ${fines.status} = 'unpaid')`,
      unpaidFineTotal: sql<string>`COALESCE(SUM(${fines.amount}) FILTER (WHERE ${fines.status} = 'unpaid'), 0)`,
    }).from(fines),
    db.select({ id: borrowings.id }).from(borrowings).orderBy(sql`${borrowings.createdAt} DESC`).limit(6),
  ]);
}

console.log('warming up...');
await newRun();
let t0 = performance.now();
await oldRun();
console.log(`OLD (14 queries): ${Math.round(performance.now() - t0)}ms`);
t0 = performance.now();
await newRun();
console.log(`NEW (7 queries): ${Math.round(performance.now() - t0)}ms`);
t0 = performance.now();
await oldRun();
console.log(`OLD (14 queries): ${Math.round(performance.now() - t0)}ms`);
t0 = performance.now();
await newRun();
console.log(`NEW (7 queries): ${Math.round(performance.now() - t0)}ms`);
process.exit(0);

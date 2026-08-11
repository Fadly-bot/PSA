/** TEMP inspection script — delete after use. */
import { db } from '../src/db/index';
import { books, bookInventories, members, borrowings, fines, categories } from '../src/db/schema';
import { sql, isNull } from 'drizzle-orm';

const q = (label: string, rows: unknown[]) => console.log(label + ':', JSON.stringify(rows));

q('BOOKS', await db.select({ c: sql<number>`count(*)::int` }).from(books).where(isNull(books.deletedAt)));
q('INV_BY_STATUS', await db.select({ status: bookInventories.status, c: sql<number>`count(*)::int` }).from(bookInventories).where(isNull(bookInventories.deletedAt)).groupBy(bookInventories.status));
q('CATEGORIES', await db.select({ c: sql<number>`count(*)::int` }).from(categories));
q('MEMBERS', await db.select({ c: sql<number>`count(*)::int` }).from(members));
q('BORROW_BY_STATUS', await db.select({ status: borrowings.status, c: sql<number>`count(*)::int` }).from(borrowings).groupBy(borrowings.status));
q('FINES', await db.select({ c: sql<number>`count(*)::int` }).from(fines));
q('SAMPLE', await db.select({ id: books.id, title: books.title, slug: books.slug }).from(books).where(isNull(books.deletedAt)).limit(6));
q('AVAIL_BOOKS', await db.select({ id: books.id, title: books.title, slug: books.slug, inv: bookInventories.inventoryCode }).from(bookInventories).innerJoin(books, sql`${books.id} = ${bookInventories.bookId}`).where(sql`${bookInventories.status} = 'available' and ${bookInventories.deletedAt} is null`).limit(8));

process.exit(0);

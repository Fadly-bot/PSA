/**
 * TEMP — read-only data audit (no writes).
 * Dumps master data, books, users, members, borrowings, returns, fines,
 * and orphan-FK checks to identify test/demo vs production data.
 */
import { db } from '../src/db/index';
import {
  authors, bookInventories, bookSources, books, borrowings, borrowingDetails,
  categories, fines, members, publishers, returns, roles, shelves, users, auditLogs,
} from '../src/db/schema';
import { eq, isNotNull, sql } from 'drizzle-orm';

async function dump(label: string, rows: any[], cols: string[]) {
  console.log(`\n=== ${label} (${rows.length}) ===`);
  for (const r of rows.slice(0, 100)) {
    const line = cols.map((c) => `${c}=${r[c] ?? '∅'}`).join(' | ');
    console.log('  ' + line);
  }
  if (rows.length > 100) console.log(`  ... dan ${rows.length - 100} lagi`);
}

// 1. Master data
const catRows = await db.select().from(categories).orderBy(categories.name);
await dump('CATEGORIES', catRows, ['id', 'name', 'createdAt']);

const authRows = await db.select().from(authors).orderBy(authors.name);
await dump('AUTHORS', authRows, ['id', 'name', 'createdAt']);

const pubRows = await db.select().from(publishers).orderBy(publishers.name);
await dump('PUBLISHERS', pubRows, ['id', 'name', 'createdAt']);

const srcRows = await db.select().from(bookSources).orderBy(bookSources.name);
await dump('BOOK_SOURCES', srcRows, ['id', 'name', 'createdAt']);

const shelfRows = await db.select().from(shelves).orderBy(shelves.code);
await dump('SHELVES', shelfRows, ['id', 'code', 'name', 'createdAt']);

// 2. Books
const bookRows = await db.select({
  id: books.id, title: books.title, slug: books.slug, isbn: books.isbn,
  authorId: books.authorId, publisherId: books.publisherId, categoryId: books.categoryId,
  status: books.status, deletedAt: books.deletedAt, createdAt: books.createdAt,
}).from(books).orderBy(books.createdAt);
await dump('BOOKS', bookRows, ['title', 'slug', 'isbn', 'authorId', 'publisherId', 'categoryId', 'status', 'deletedAt']);

// 3. Users + roles
const roleRows = await db.select().from(roles).orderBy(roles.name);
await dump('ROLES', roleRows, ['id', 'name']);

const userRows = await db.select({
  id: users.id, name: users.name, email: users.email, roleId: users.roleId,
  status: users.status, createdAt: users.createdAt, deletedAt: users.deletedAt,
}).from(users).orderBy(users.createdAt);
await dump('USERS', userRows, ['name', 'email', 'roleId', 'status', 'deletedAt']);

const memberRows = await db.select().from(members).orderBy(members.createdAt);
await dump('MEMBERS', memberRows, ['id', 'memberCode', 'userId', 'phone', 'status', 'joinDate']);

// 4. Inventories
const invRows = await db.select({
  id: bookInventories.id, inventoryCode: bookInventories.inventoryCode,
  bookId: bookInventories.bookId, sourceId: bookInventories.sourceId, shelfId: bookInventories.shelfId,
  status: bookInventories.status, condition: bookInventories.condition, deletedAt: bookInventories.deletedAt,
}).from(bookInventories).orderBy(bookInventories.createdAt);
await dump('BOOK_INVENTORIES', invRows, ['inventoryCode', 'bookId', 'sourceId', 'shelfId', 'status', 'deletedAt']);

// 5. Transactions
const borrowRows = await db.select({
  id: borrowings.id, borrowCode: borrowings.borrowCode, memberId: borrowings.memberId,
  status: borrowings.status, borrowDate: borrowings.borrowDate, dueDate: borrowings.dueDate,
  returnDate: borrowings.returnDate, createdAt: borrowings.createdAt,
}).from(borrowings).orderBy(borrowings.createdAt);
await dump('BORROWINGS', borrowRows, ['borrowCode', 'memberId', 'status', 'borrowDate', 'dueDate', 'returnDate']);

const retRows = await db.select({
  id: returns.id, borrowingId: returns.borrowingId, returnDate: returns.returnDate,
  status: returns.status, createdAt: returns.createdAt,
}).from(returns).orderBy(returns.createdAt);
await dump('RETURNS', retRows, ['id', 'borrowingId', 'returnDate', 'status']);

const fineRows = await db.select({
  id: fines.id, borrowingId: fines.borrowingId, amount: fines.amount,
  status: fines.status, paidAt: fines.paidAt, createdAt: fines.createdAt,
}).from(fines).orderBy(fines.createdAt);
await dump('FINES', fineRows, ['borrowingId', 'amount', 'status', 'paidAt']);

const auditRows = await db.select({
  id: auditLogs.id, userId: auditLogs.userId, action: auditLogs.action,
  module: auditLogs.module, description: auditLogs.description, createdAt: auditLogs.createdAt,
}).from(auditLogs).orderBy(auditLogs.createdAt);
await dump('AUDIT_LOGS', auditRows, ['action', 'module', 'description', 'userId']);

// 6. Orphan FK checks
console.log('\n=== ORPHAN CHECKS ===');
const orphan = async (label: string, table: any, fk: any, refTable: any, refPk: any) => {
  const [row] = await db.select({ n: sql<number>`count(*)` })
    .from(table)
    .leftJoin(refTable, eq(fk, refPk))
    .where(sql`${refPk} IS NULL`);
  console.log(`  ${label}: ${row?.n ?? 0}`);
};
await orphan('books w/o author', books, books.authorId, authors, authors.id);
await orphan('books w/o publisher', books, books.publisherId, publishers, publishers.id);
await orphan('books w/o category', books, books.categoryId, categories, categories.id);
await orphan('inventories w/o book', bookInventories, bookInventories.bookId, books, books.id);
await orphan('inventories w/o source', bookInventories, bookInventories.sourceId, bookSources, bookSources.id);
await orphan('inventories w/o shelf', bookInventories, bookInventories.shelfId, shelves, shelves.id);
await orphan('borrowings w/o member', borrowings, borrowings.memberId, members, members.id);
await orphan('details w/o borrowing', borrowingDetails, borrowingDetails.borrowingId, borrowings, borrowings.id);
await orphan('details w/o inventory', borrowingDetails, borrowingDetails.bookInventoryId, bookInventories, bookInventories.id);
await orphan('returns w/o borrowing', returns, returns.borrowingId, borrowings, borrowings.id);
await orphan('fines w/o borrowing', fines, fines.borrowingId, borrowings, borrowings.id);
await orphan('members w/o user', members, members.userId, users, users.id);

// 7. Usage counts for master data
console.log('\n=== MASTER DATA USAGE ===');
const usage = async (label: string, table: any, col: any) => {
  const [row] = await db.select({ n: sql<number>`count(*)` }).from(table).where(isNotNull(col));
  console.log(`  ${label}: ${row?.n ?? 0}`);
};
await usage('books with author', books, books.authorId);
await usage('books with publisher', books, books.publisherId);
await usage('books with category', books, books.categoryId);
await usage('inventories with source', bookInventories, bookInventories.sourceId);
await usage('inventories with shelf', bookInventories, bookInventories.shelfId);

await db.$client.end?.().catch(() => {});
process.exit(0);

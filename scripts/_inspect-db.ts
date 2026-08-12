import { db } from '../src/db/index';
import { books, bookInventories, users, borrowings } from '../src/db/schema';
import { eq, ilike, and, isNull } from 'drizzle-orm';

// 1. Candidate test books for borrow flow
const candidates = [
  'e2e1786369018778-buku-utama',
  'fn1786370084851-buku',
];
for (const slug of candidates) {
  const [b] = await db.select({ id: books.id, title: books.title, slug: books.slug })
    .from(books).where(eq(books.slug, slug)).limit(1);
  if (!b) { console.log(`BOOK ${slug}: NOT FOUND`); continue; }
  const invs = await db.select({ id: bookInventories.id, status: bookInventories.status })
    .from(bookInventories)
    .where(and(eq(bookInventories.bookId, b.id), isNull(bookInventories.deletedAt)));
  const avail = invs.filter((i) => i.status === 'available').length;
  console.log(`BOOK ${slug}: title=${b.title} | copies=${invs.length} available=${avail}`);
}

// 2. Leftover test users
const testUsers = await db.select({ id: users.id, email: users.email })
  .from(users)
  .where(ilike(users.email, '%e2e%'));
console.log('leftover e2e users:', testUsers.length, testUsers.map((u) => u.email).join(', '));

const memberE2e = await db.select({ id: users.id, email: users.email })
  .from(users)
  .where(ilike(users.email, 'member.e2e.%'));
console.log('member.e2e users:', memberE2e.length, memberE2e.map((u) => u.email).join(', '));

// 3. Active borrowings count (sanity)
const active = await db.select({ id: borrowings.id, status: borrowings.status })
  .from(borrowings).where(eq(borrowings.status, 'borrowed'));
console.log('active borrowed borrowings:', active.length);

// 4. Any available inventory at all (any book)
const anyAvail = await db.select({ id: bookInventories.id }).from(bookInventories)
  .where(and(eq(bookInventories.status, 'available'), isNull(bookInventories.deletedAt)))
  .limit(3);
console.log('any available inventory rows (sample):', anyAvail.length);

process.exit(0);

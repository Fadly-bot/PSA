/** Dashboard performance comparison (temporary). Old = 14 separate COUNTs; New = 7 merged queries. */
import { db } from '../src/db/index';
import {
  accounts, auditLogs, bookInventories, books, borrowings, fines, members,
  returns, roles, sessions, users,
} from '../src/db/schema';
import { and, eq, isNull, sql } from 'drizzle-orm';

const BASE = 'http://localhost:3000';
const ts = Date.now();
const EMAIL = `p2m.${ts}@gmail.com`;
let userId = '';

const today = new Date().toISOString().slice(0, 10);

async function main() {
  // Staff session for the real endpoint test.
  const res = await fetch(`${BASE}/api/auth/sign-up/email`, {
    method: 'POST', headers: { 'Content-Type': 'application/json', Origin: BASE },
    body: JSON.stringify({ name: 'P2 Measure', email: EMAIL, password: 'Test123456!' }),
  });
  const j = await res.json().catch(() => ({}));
  userId = j?.user?.id ?? '';
  const cookie = (res.headers.getSetCookie?.() ?? []).map((c) => c.split(';')[0])
    .find((c) => c.startsWith('better-auth.session_token='))?.split('=').slice(1).join('=') ?? '';
  const [staffRole] = await db.select({ id: roles.id }).from(roles).where(eq(roles.name, 'staff')).limit(1);
  await db.update(users).set({ roleId: staffRole!.id }).where(eq(users.id, userId));
  const auth = { Cookie: `better-auth.session_token=${cookie}`, Origin: BASE };

  // Real endpoint, 3 runs (warm).
  for (let i = 1; i <= 3; i++) {
    const t0 = performance.now();
    const r = await fetch(`${BASE}/api/dashboard`, { headers: auth });
    const body = await r.json().catch(() => ({}));
    const ms = Math.round(performance.now() - t0);
    console.log(`endpoint run ${i}: HTTP ${r.status} ${ms}ms (totalBooks=${body?.stats?.totalBooks})`);
  }

  // ---- OLD approach: 14 separate COUNT queries (parallel) ----
  const oldQueries = () =>
    Promise.all([
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

  // ---- NEW approach: 7 merged queries (parallel) ----
  const newQueries = () =>
    Promise.all([
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

  // Warm-up + measure (average of 3).
  const runAvg = async (fn: () => Promise<any>, label: string) => {
    await fn();
    let total = 0;
    for (let i = 0; i < 3; i++) {
      const t0 = performance.now();
      await fn();
      total += performance.now() - t0;
    }
    console.log(`${label}: ${Math.round(total / 3)}ms avg (3 runs)`);
  };

  await runAvg(oldQueries, 'OLD 14 query COUNT (parallel)');
  await runAvg(newQueries, 'NEW 7 query COUNT merged (parallel)');

  await cleanup();
  process.exit(0);
}

async function cleanup() {
  if (userId) {
    await db.delete(accounts).where(eq(accounts.userId, userId));
    await db.delete(sessions).where(eq(sessions.userId, userId));
    await db.delete(members).where(eq(members.userId, userId));
    await db.delete(auditLogs).where(eq(auditLogs.userId, userId));
    await db.delete(users).where(eq(users.id, userId));
  }
  console.log('cleanup done');
}

main().catch((e: any) => { console.error('measure failed:', e?.message ?? String(e)); process.exit(1); });

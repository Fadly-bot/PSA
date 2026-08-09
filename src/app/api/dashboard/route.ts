import { NextResponse } from 'next/server';
import { and, eq, isNull, sql } from 'drizzle-orm';
import { db } from '@/db/index';
import {
  bookInventories,
  books,
  borrowings,
  fines,
  members,
  returns,
  users,
} from '@/db/schema';
import { getCurrentUser, hasPermission } from '@/server/auth-utils';
import { formatRupiah } from '@/lib/utils';

export const runtime = 'nodejs';

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Tidak diizinkan.' }, { status: 401 });

    const today = new Date().toISOString().slice(0, 10);

    // Member dashboard: personal stats only.
    if (!hasPermission(user.role, 'book:create')) {
      const [ownMember] = await db
        .select({ id: members.id })
        .from(members)
        .where(eq(members.userId, user.id))
        .limit(1);

      if (!ownMember) {
        return NextResponse.json({ role: 'member', stats: {}, recentBorrowings: [] });
      }

      const [activeBorrowings] = await db
        .select({ count: sql<number>`count(*)` })
        .from(borrowings)
        .where(and(eq(borrowings.memberId, ownMember.id), sql`${borrowings.status} IN ('borrowed', 'overdue')`));
      const [totalBorrowings] = await db
        .select({ count: sql<number>`count(*)` })
        .from(borrowings)
        .where(eq(borrowings.memberId, ownMember.id));
      const [outstandingFines] = await db
        .select({ count: sql<number>`count(*)` })
        .from(fines)
        .innerJoin(borrowings, eq(fines.borrowingId, borrowings.id))
        .where(and(eq(borrowings.memberId, ownMember.id), eq(fines.status, 'unpaid')));
      const [fineTotal] = await db
        .select({ total: sql<string>`COALESCE(SUM(${fines.amount}), 0)` })
        .from(fines)
        .innerJoin(borrowings, eq(fines.borrowingId, borrowings.id))
        .where(and(eq(borrowings.memberId, ownMember.id), eq(fines.status, 'unpaid')));

      const recentBorrowings = await db
        .select({
          id: borrowings.id,
          borrowCode: borrowings.borrowCode,
          borrowDate: borrowings.borrowDate,
          dueDate: borrowings.dueDate,
          status: borrowings.status,
        })
        .from(borrowings)
        .where(eq(borrowings.memberId, ownMember.id))
        .orderBy(sql`${borrowings.createdAt} DESC`)
        .limit(5);

      return NextResponse.json({
        role: 'member',
        stats: {
          activeBorrowings: Number(activeBorrowings?.count ?? 0),
          totalBorrowings: Number(totalBorrowings?.count ?? 0),
          outstandingFines: Number(outstandingFines?.count ?? 0),
          fineTotal: formatRupiah(fineTotal?.total),
        },
        recentBorrowings,
      });
    }

    // Staff/Admin dashboard: global statistics.
    const [
      [totalBooks],
      [totalInventories],
      [availableInventories],
      [borrowedInventories],
      [maintenanceInventories],
      [lostInventories],
      [totalMembers],
      [totalBorrowings],
      [activeBorrowings],
      [overdueBorrowings],
      [borrowingsToday],
      [returnsToday],
      [outstandingFines],
      [unpaidFineTotal],
    ] = await Promise.all([
      db.select({ count: sql<number>`count(*)` }).from(books).where(and(isNull(books.deletedAt), eq(books.status, 'active'))),
      db.select({ count: sql<number>`count(*)` }).from(bookInventories).where(isNull(bookInventories.deletedAt)),
      db.select({ count: sql<number>`count(*)` }).from(bookInventories).where(and(isNull(bookInventories.deletedAt), eq(bookInventories.status, 'available'))),
      db.select({ count: sql<number>`count(*)` }).from(bookInventories).where(and(isNull(bookInventories.deletedAt), eq(bookInventories.status, 'borrowed'))),
      db.select({ count: sql<number>`count(*)` }).from(bookInventories).where(and(isNull(bookInventories.deletedAt), eq(bookInventories.status, 'maintenance'))),
      db.select({ count: sql<number>`count(*)` }).from(bookInventories).where(and(isNull(bookInventories.deletedAt), eq(bookInventories.status, 'lost'))),
      db.select({ count: sql<number>`count(*)` }).from(members).innerJoin(users, eq(members.userId, users.id)).where(and(isNull(users.deletedAt), eq(members.status, true))),
      db.select({ count: sql<number>`count(*)` }).from(borrowings),
      db.select({ count: sql<number>`count(*)` }).from(borrowings).where(sql`${borrowings.status} IN ('borrowed', 'overdue')`),
      db.select({ count: sql<number>`count(*)` }).from(borrowings).where(and(eq(borrowings.status, 'borrowed'), sql`${borrowings.dueDate} < ${today}`)),
      db.select({ count: sql<number>`count(*)` }).from(borrowings).where(eq(borrowings.borrowDate, today)),
      db.select({ count: sql<number>`count(*)` }).from(returns).where(eq(returns.returnDate, today)),
      db.select({ count: sql<number>`count(*)` }).from(fines).where(eq(fines.status, 'unpaid')),
      db.select({ total: sql<string>`COALESCE(SUM(${fines.amount}), 0)` }).from(fines).where(eq(fines.status, 'unpaid')),
    ]);

    const recentBorrowings = await db
      .select({
        id: borrowings.id,
        borrowCode: borrowings.borrowCode,
        borrowDate: borrowings.borrowDate,
        dueDate: borrowings.dueDate,
        status: borrowings.status,
        memberName: users.name,
      })
      .from(borrowings)
      .leftJoin(members, eq(borrowings.memberId, members.id))
      .leftJoin(users, eq(members.userId, users.id))
      .orderBy(sql`${borrowings.createdAt} DESC`)
      .limit(6);

    return NextResponse.json({
      role: user.role,
      stats: {
        totalBooks: Number(totalBooks?.count ?? 0),
        totalInventories: Number(totalInventories?.count ?? 0),
        availableInventories: Number(availableInventories?.count ?? 0),
        borrowedInventories: Number(borrowedInventories?.count ?? 0),
        maintenanceInventories: Number(maintenanceInventories?.count ?? 0),
        lostInventories: Number(lostInventories?.count ?? 0),
        totalMembers: Number(totalMembers?.count ?? 0),
        totalBorrowings: Number(totalBorrowings?.count ?? 0),
        activeBorrowings: Number(activeBorrowings?.count ?? 0),
        overdueBorrowings: Number(overdueBorrowings?.count ?? 0),
        borrowingsToday: Number(borrowingsToday?.count ?? 0),
        returnsToday: Number(returnsToday?.count ?? 0),
        outstandingFines: Number(outstandingFines?.count ?? 0),
        unpaidFineTotal: formatRupiah(unpaidFineTotal?.total),
      },
      recentBorrowings,
    });
  } catch (error) {
    console.error('GET /api/dashboard error', error);
    return NextResponse.json({ error: 'Gagal memuat statistik dashboard.' }, { status: 500 });
  }
}

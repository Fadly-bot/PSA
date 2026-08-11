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
      const [returnedBorrowings] = await db
        .select({ count: sql<number>`count(*)` })
        .from(borrowings)
        .where(and(eq(borrowings.memberId, ownMember.id), eq(borrowings.status, 'returned')));
      const [overdueBorrowings] = await db
        .select({ count: sql<number>`count(*)` })
        .from(borrowings)
        .where(and(eq(borrowings.memberId, ownMember.id), sql`${borrowings.status} = 'borrowed' AND ${borrowings.dueDate} < ${today}`));
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
          returnedBorrowings: Number(returnedBorrowings?.count ?? 0),
          overdueBorrowings: Number(overdueBorrowings?.count ?? 0),
          outstandingFines: Number(outstandingFines?.count ?? 0),
          fineTotal: formatRupiah(fineTotal?.total),
        },
        recentBorrowings,
      });
    }

    // Staff/Admin dashboard: global statistics.
    // Each table is scanned ONCE per query (count(*) FILTER ...), instead of
    // issuing one COUNT per statistic. 7 parallel queries total (was 15),
    // which cuts round-trips to the database and avoids repeated scans.
    const [
      [bookRow],
      [inventoryRow],
      [memberRow],
      [borrowingRow],
      [returnRow],
      [fineRow],
      recentBorrowings,
    ] = await Promise.all([
      db
        .select({
          totalBooks: sql<number>`count(*) FILTER (WHERE ${books.status} = 'active')`,
        })
        .from(books)
        .where(isNull(books.deletedAt)),
      db
        .select({
          totalInventories: sql<number>`count(*)`,
          availableInventories: sql<number>`count(*) FILTER (WHERE ${bookInventories.status} = 'available')`,
          borrowedInventories: sql<number>`count(*) FILTER (WHERE ${bookInventories.status} = 'borrowed')`,
          maintenanceInventories: sql<number>`count(*) FILTER (WHERE ${bookInventories.status} = 'maintenance')`,
          lostInventories: sql<number>`count(*) FILTER (WHERE ${bookInventories.status} = 'lost')`,
        })
        .from(bookInventories)
        .where(isNull(bookInventories.deletedAt)),
      db
        .select({ totalMembers: sql<number>`count(*)` })
        .from(members)
        .innerJoin(users, eq(members.userId, users.id))
        .where(and(isNull(users.deletedAt), eq(members.status, true))),
      db
        .select({
          totalBorrowings: sql<number>`count(*)`,
          activeBorrowings: sql<number>`count(*) FILTER (WHERE ${borrowings.status} IN ('borrowed', 'overdue'))`,
          overdueBorrowings: sql<number>`count(*) FILTER (WHERE ${borrowings.status} = 'borrowed' AND ${borrowings.dueDate} < ${today})`,
          borrowingsToday: sql<number>`count(*) FILTER (WHERE ${borrowings.borrowDate} = ${today})`,
        })
        .from(borrowings),
      db
        .select({ returnsToday: sql<number>`count(*)` })
        .from(returns)
        .where(eq(returns.returnDate, today)),
      db
        .select({
          outstandingFines: sql<number>`count(*) FILTER (WHERE ${fines.status} = 'unpaid')`,
          unpaidFineTotal: sql<string>`COALESCE(SUM(${fines.amount}) FILTER (WHERE ${fines.status} = 'unpaid'), 0)`,
        })
        .from(fines),
      db
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
        .limit(6),
    ]);

    return NextResponse.json({
      role: user.role,
      stats: {
        totalBooks: Number(bookRow?.totalBooks ?? 0),
        totalInventories: Number(inventoryRow?.totalInventories ?? 0),
        availableInventories: Number(inventoryRow?.availableInventories ?? 0),
        borrowedInventories: Number(inventoryRow?.borrowedInventories ?? 0),
        maintenanceInventories: Number(inventoryRow?.maintenanceInventories ?? 0),
        lostInventories: Number(inventoryRow?.lostInventories ?? 0),
        totalMembers: Number(memberRow?.totalMembers ?? 0),
        totalBorrowings: Number(borrowingRow?.totalBorrowings ?? 0),
        activeBorrowings: Number(borrowingRow?.activeBorrowings ?? 0),
        overdueBorrowings: Number(borrowingRow?.overdueBorrowings ?? 0),
        borrowingsToday: Number(borrowingRow?.borrowingsToday ?? 0),
        returnsToday: Number(returnRow?.returnsToday ?? 0),
        outstandingFines: Number(fineRow?.outstandingFines ?? 0),
        unpaidFineTotal: formatRupiah(fineRow?.unpaidFineTotal),
      },
      recentBorrowings,
    });
  } catch (error) {
    console.error('GET /api/dashboard error', error);
    return NextResponse.json({ error: 'Gagal memuat statistik dashboard.' }, { status: 500 });
  }
}

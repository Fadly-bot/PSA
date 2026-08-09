import { NextResponse } from 'next/server';
import { and, desc, eq, sql } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '@/db/index';
import {
  bookInventories,
  borrowings,
  borrowingDetails,
  fines,
  members,
  returns,
  users,
} from '@/db/schema';
import { getCurrentUser, hasPermission } from '@/server/auth-utils';
import { createAuditLog } from '@/server/audit';
import { getSetting } from '@/server/settings';
import type { SelectedFields } from 'drizzle-orm/operations';

export const runtime = 'nodejs';

const createReturnSchema = z.object({
  borrowingId: z.string().uuid('Peminjaman tidak valid'),
  returnDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Tanggal pengembalian tidak valid'),
  notes: z.string().trim().max(1000).nullable().optional(),
  // Optional per-detail conditions, keyed by borrowing detail id.
  conditions: z.record(z.string(), z.enum(['good', 'damaged', 'lost'])).optional(),
});

const returnSelect: SelectedFields<any, any> = {
  id: returns.id,
  returnDate: returns.returnDate,
  status: returns.status,
  notes: returns.notes,
  createdAt: returns.createdAt,
  borrowing: {
    id: borrowings.id,
    borrowCode: borrowings.borrowCode,
    borrowDate: borrowings.borrowDate,
    dueDate: borrowings.dueDate,
    status: borrowings.status,
    member: {
      id: members.id,
      memberCode: members.memberCode,
      user: { name: users.name, email: users.email },
    },
  },
};

export async function GET(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Tidak diizinkan.' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const page = Math.max(1, Number(searchParams.get('page') ?? '1'));
    const limit = Math.max(1, Math.min(100, Number(searchParams.get('limit') ?? '10')));
    const offset = (page - 1) * limit;

    const conditions: any[] = [];
    // Members only see their own returns.
    if (!hasPermission(user.role, 'return:read')) {
      const [ownMember] = await db.select({ id: members.id }).from(members).where(eq(members.userId, user.id)).limit(1);
      if (!ownMember) {
        return NextResponse.json({ items: [], page: 1, limit, total: 0, totalPages: 1 });
      }
      conditions.push(eq(borrowings.memberId, ownMember.id));
    }
    const where = conditions.length > 0 ? and(...conditions) : undefined;

    const [items, [{ count }]] = await Promise.all([
      db
        .select(returnSelect)
        .from(returns)
        .leftJoin(borrowings, eq(returns.borrowingId, borrowings.id))
        .leftJoin(members, eq(borrowings.memberId, members.id))
        .leftJoin(users, eq(members.userId, users.id))
        .where(where)
        .orderBy(desc(returns.createdAt))
        .limit(limit)
        .offset(offset),
      db
        .select({ count: sql<number>`count(*)` })
        .from(returns)
        .leftJoin(borrowings, eq(returns.borrowingId, borrowings.id))
        .leftJoin(members, eq(borrowings.memberId, members.id))
        .leftJoin(users, eq(members.userId, users.id))
        .where(where),
    ]);

    return NextResponse.json({
      items,
      page,
      limit,
      total: Number(count),
      totalPages: Math.max(1, Math.ceil(Number(count) / limit)),
    });
  } catch (error) {
    console.error('GET /api/returns error', error);
    return NextResponse.json({ error: 'Gagal memuat data pengembalian.' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Tidak diizinkan.' }, { status: 401 });
    if (!hasPermission(user.role, 'return:create')) {
      return NextResponse.json({ error: 'Tidak memiliki izin.' }, { status: 403 });
    }

    const body = await request.json().catch(() => null);
    const parsed = createReturnSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? 'Data pengembalian tidak valid.' },
        { status: 400 },
      );
    }
    const data = parsed.data;

    const [borrowing] = await db
      .select({
        id: borrowings.id,
        status: borrowings.status,
        borrowCode: borrowings.borrowCode,
        borrowDate: borrowings.borrowDate,
        dueDate: borrowings.dueDate,
      })
      .from(borrowings)
      .where(eq(borrowings.id, data.borrowingId))
      .limit(1);

    if (!borrowing) {
      return NextResponse.json({ error: 'BORROWING_NOT_FOUND: Data peminjaman tidak ditemukan.' }, { status: 404 });
    }
    if (borrowing.status !== 'borrowed' && borrowing.status !== 'overdue') {
      return NextResponse.json({ error: 'RETURN_ALREADY_COMPLETED: Peminjaman sudah dikembalikan/dibatalkan.' }, { status: 400 });
    }
    if (data.returnDate < borrowing.borrowDate) {
      return NextResponse.json({ error: 'INVALID_RETURN_DATE: Tanggal pengembalian tidak boleh sebelum tanggal pinjam.' }, { status: 400 });
    }

    const detailRows = await db
      .select({
        id: borrowingDetails.id,
        inventoryId: borrowingDetails.bookInventoryId,
        inventoryCode: bookInventories.inventoryCode,
        condition: bookInventories.condition,
      })
      .from(borrowingDetails)
      .innerJoin(bookInventories, eq(borrowingDetails.bookInventoryId, bookInventories.id))
      .where(eq(borrowingDetails.borrowingId, data.borrowingId));

    if (detailRows.length === 0) {
      return NextResponse.json({ error: 'Peminjaman tidak memiliki inventaris.' }, { status: 400 });
    }

    // Late return calculation.
    const due = new Date(borrowing.dueDate);
    const returned = new Date(data.returnDate);
    const lateDays = Math.max(0, Math.floor((returned.getTime() - due.getTime()) / (1000 * 60 * 60 * 24)));
    const finePerDay = Number(await getSetting('finePerDay', 1000));
    const fineAmount = lateDays > 0 ? lateDays * finePerDay : 0;

    const result = await db.transaction(async (tx) => {
      // 1. Update each inventory: back to available (or lost when condition = lost).
      for (const detail of detailRows) {
        const returnedCondition = data.conditions?.[detail.id];
        const nextStatus: 'available' | 'lost' =
          returnedCondition === 'lost' ? 'lost' : 'available';
        const nextCondition = returnedCondition ?? detail.condition;

        await tx
          .update(bookInventories)
          .set({
            status: nextStatus,
            condition: nextCondition,
            updatedAt: new Date(),
          })
          .where(eq(bookInventories.id, detail.inventoryId));
      }

      // 2. Create the return record.
      const [returnRow] = await tx
        .insert(returns)
        .values({
          borrowingId: data.borrowingId,
          returnDate: data.returnDate,
          status: lateDays > 0 ? 'late' : 'returned',
          notes: data.notes ?? null,
        })
        .returning();

      // 3. Update borrowing status.
      await tx
        .update(borrowings)
        .set({
          status: 'returned',
          returnDate: data.returnDate,
          updatedAt: new Date(),
        })
        .where(eq(borrowings.id, data.borrowingId));

      // 4. Generate fine when overdue.
      if (fineAmount > 0) {
        await tx
          .insert(fines)
          .values({
            borrowingId: data.borrowingId,
            amount: String(fineAmount),
            status: 'unpaid',
          })
          .onConflictDoUpdate({
            target: fines.borrowingId,
            set: { amount: String(fineAmount), status: 'unpaid', paidAt: null },
          });
      }

      return { returnRow, fineAmount };
    });

    await createAuditLog({
      userId: user.id,
      action: 'RETURN',
      module: 'RETURNS',
      description: `Pengembalian ${borrowing.borrowCode}${fineAmount > 0 ? ` — denda Rp${fineAmount}` : ''}`,
    });

    return NextResponse.json({ ...result.returnRow, fineAmount }, { status: 201 });
  } catch (error) {
    console.error('POST /api/returns error', error);
    return NextResponse.json({ error: 'Gagal memproses pengembalian.' }, { status: 500 });
  }
}

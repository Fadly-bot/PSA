import { NextResponse } from 'next/server';
import { and, desc, eq, sql } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '@/db/index';
import { borrowings, fines, members, users } from '@/db/schema';
import { getCurrentUser, hasPermission } from '@/server/auth-utils';
import { createAuditLog } from '@/server/audit';
import type { SelectedFields } from 'drizzle-orm/operations';

export const runtime = 'nodejs';

const createFineSchema = z.object({
  borrowingId: z.string().uuid('Peminjaman tidak valid'),
  amount: z.number().min(0, 'Nominal denda tidak boleh negatif'),
  description: z.string().trim().max(1000).nullable().optional(),
});

const fineSelect: SelectedFields<any, any> = {
  id: fines.id,
  amount: fines.amount,
  paidAt: fines.paidAt,
  status: fines.status,
  createdAt: fines.createdAt,
  borrowing: {
    id: borrowings.id,
    borrowCode: borrowings.borrowCode,
    dueDate: borrowings.dueDate,
    returnDate: borrowings.returnDate,
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
    const status = searchParams.get('status');
    const page = Math.max(1, Number(searchParams.get('page') ?? '1'));
    const limit = Math.max(1, Math.min(100, Number(searchParams.get('limit') ?? '10')));
    const offset = (page - 1) * limit;

    const conditions: any[] = [];

    // Members only see their own fines.
    if (!hasPermission(user.role, 'fine:read')) {
      const [ownMember] = await db.select({ id: members.id }).from(members).where(eq(members.userId, user.id)).limit(1);
      if (!ownMember) {
        return NextResponse.json({ items: [], page: 1, limit, total: 0, totalPages: 1 });
      }
      conditions.push(eq(borrowings.memberId, ownMember.id));
    }

    if (status === 'paid' || status === 'unpaid') {
      conditions.push(eq(fines.status, status));
    }
    const where = conditions.length > 0 ? and(...conditions) : undefined;

    const [items, [{ count }]] = await Promise.all([
      db
        .select(fineSelect)
        .from(fines)
        .leftJoin(borrowings, eq(fines.borrowingId, borrowings.id))
        .leftJoin(members, eq(borrowings.memberId, members.id))
        .leftJoin(users, eq(members.userId, users.id))
        .where(where)
        .orderBy(desc(fines.createdAt))
        .limit(limit)
        .offset(offset),
      db
        .select({ count: sql<number>`count(*)` })
        .from(fines)
        .leftJoin(borrowings, eq(fines.borrowingId, borrowings.id))
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
    console.error('GET /api/fines error', error);
    return NextResponse.json({ error: 'Gagal memuat data denda.' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Tidak diizinkan.' }, { status: 401 });
    if (!hasPermission(user.role, 'fine:create')) {
      return NextResponse.json({ error: 'Tidak memiliki izin.' }, { status: 403 });
    }

    const body = await request.json().catch(() => null);
    const parsed = createFineSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Data denda tidak valid.' }, { status: 400 });
    }
    const data = parsed.data;

    const [borrowing] = await db.select({ id: borrowings.id }).from(borrowings).where(eq(borrowings.id, data.borrowingId)).limit(1);
    if (!borrowing) {
      return NextResponse.json({ error: 'BORROWING_NOT_FOUND: Data peminjaman tidak ditemukan.' }, { status: 404 });
    }

    const [row] = await db
      .insert(fines)
      .values({
        borrowingId: data.borrowingId,
        amount: String(data.amount),
        status: 'unpaid',
      })
      .onConflictDoUpdate({
        target: fines.borrowingId,
        set: { amount: String(data.amount), status: 'unpaid', paidAt: null },
      })
      .returning();

    await createAuditLog({
      userId: user.id,
      action: 'CREATE',
      module: 'FINES',
      description: `Buat denda Rp${data.amount}`,
    });

    return NextResponse.json(row, { status: 201 });
  } catch (error) {
    console.error('POST /api/fines error', error);
    return NextResponse.json({ error: 'Gagal menyimpan denda.' }, { status: 500 });
  }
}

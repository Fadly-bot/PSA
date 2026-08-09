import { NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { db } from '@/db/index';
import { borrowings, fines, members, users } from '@/db/schema';
import { getCurrentUser, hasPermission } from '@/server/auth-utils';
import { createAuditLog } from '@/server/audit';
import type { SelectedFields } from 'drizzle-orm/operations';

export const runtime = 'nodejs';

const detailSelect: SelectedFields<any, any> = {
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
    member: {
      id: members.id,
      memberCode: members.memberCode,
      user: { name: users.name, email: users.email },
    },
  },
};

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Tidak diizinkan.' }, { status: 401 });

    const [row] = await db
      .select(detailSelect)
      .from(fines)
      .leftJoin(borrowings, eq(fines.borrowingId, borrowings.id))
      .leftJoin(members, eq(borrowings.memberId, members.id))
      .leftJoin(users, eq(members.userId, users.id))
      .where(eq(fines.id, id))
      .limit(1);

    if (!row) {
      return NextResponse.json({ error: 'FINE_NOT_FOUND: Denda tidak ditemukan.' }, { status: 404 });
    }

    // Members may only view their own fines.
    const isStaff = hasPermission(user.role, 'fine:read');
    if (!isStaff && row.borrowing?.member?.user?.email !== user.email) {
      return NextResponse.json({ error: 'Tidak memiliki izin.' }, { status: 403 });
    }

    return NextResponse.json(row);
  } catch (error) {
    console.error('GET /api/fines/:id error', error);
    return NextResponse.json({ error: 'Gagal memuat detail denda.' }, { status: 500 });
  }
}

/** Mark a fine as paid (staff/admin). */
export async function PATCH(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Tidak diizinkan.' }, { status: 401 });
    if (!hasPermission(user.role, 'fine:pay')) {
      return NextResponse.json({ error: 'Tidak memiliki izin.' }, { status: 403 });
    }

    const [existing] = await db.select().from(fines).where(eq(fines.id, id)).limit(1);
    if (!existing) {
      return NextResponse.json({ error: 'FINE_NOT_FOUND: Denda tidak ditemukan.' }, { status: 404 });
    }
    if (existing.status === 'paid') {
      return NextResponse.json({ error: 'FINE_ALREADY_PAID: Denda sudah lunas.' }, { status: 400 });
    }

    const [row] = await db
      .update(fines)
      .set({ status: 'paid', paidAt: new Date() })
      .where(eq(fines.id, id))
      .returning();

    await createAuditLog({
      userId: user.id,
      action: 'PAY_FINE',
      module: 'FINES',
      description: `Bayar denda Rp${row.amount}`,
    });

    return NextResponse.json(row);
  } catch (error) {
    console.error('PATCH /api/fines/:id error', error);
    return NextResponse.json({ error: 'Gagal memproses pembayaran denda.' }, { status: 500 });
  }
}

import { NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { db } from '@/db/index';
import { bookInventories, books, borrowings, borrowingDetails, fines, members, returns, users } from '@/db/schema';
import { getCurrentUser, hasPermission } from '@/server/auth-utils';
import { createAuditLog } from '@/server/audit';
import type { SelectedFields } from 'drizzle-orm/operations';

export const runtime = 'nodejs';

const detailSelect: SelectedFields<any, any> = {
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

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Tidak diizinkan.' }, { status: 401 });

    const [row] = await db
      .select(detailSelect)
      .from(returns)
      .leftJoin(borrowings, eq(returns.borrowingId, borrowings.id))
      .leftJoin(members, eq(borrowings.memberId, members.id))
      .leftJoin(users, eq(members.userId, users.id))
      .where(eq(returns.id, id))
      .limit(1);

    if (!row) {
      return NextResponse.json({ error: 'RETURN_NOT_FOUND: Data pengembalian tidak ditemukan.' }, { status: 404 });
    }

    // Staff/admin may view all returns; members may only view their own.
    const isStaff = hasPermission(user.role, 'return:read');
    if (!isStaff && row.borrowing?.member?.user?.email !== user.email) {
      return NextResponse.json({ error: 'Tidak memiliki izin.' }, { status: 403 });
    }

    const items = await db
      .select({
        id: borrowingDetails.id,
        inventoryCode: bookInventories.inventoryCode,
        condition: bookInventories.condition,
        status: bookInventories.status,
        bookTitle: books.title,
      })
      .from(borrowingDetails)
      .innerJoin(bookInventories, eq(borrowingDetails.bookInventoryId, bookInventories.id))
      .innerJoin(books, eq(bookInventories.bookId, books.id))
      .where(eq(borrowingDetails.borrowingId, row.borrowing.id))
      .orderBy(bookInventories.inventoryCode);

    return NextResponse.json({ ...row, items });
  } catch (error) {
    console.error('GET /api/returns/:id error', error);
    return NextResponse.json({ error: 'Gagal memuat detail pengembalian.' }, { status: 500 });
  }
}

/**
 * Hapus data pengembalian beserta seluruh transaksi terkait (peminjaman,
 * detail, denda) — hanya untuk transaksi yang sudah selesai. Status
 * inventaris tidak disentuh karena transaksi sudah dikembalikan.
 */
export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Tidak diizinkan.' }, { status: 401 });
    }
    // Tidak ada permission khusus return:delete; gunakan izin operasional
    // yang sudah ada (admin + petugas memegang borrowing:borrow).
    if (!hasPermission(user.role, 'borrowing:borrow')) {
      return NextResponse.json({ error: 'Tidak memiliki izin.' }, { status: 403 });
    }

    const [existing] = await db.select().from(returns).where(eq(returns.id, id)).limit(1);
    if (!existing) {
      return NextResponse.json({ error: 'RETURN_NOT_FOUND: Data pengembalian tidak ditemukan.' }, { status: 404 });
    }

    const [borrowing] = await db
      .select({ id: borrowings.id, status: borrowings.status, borrowCode: borrowings.borrowCode })
      .from(borrowings)
      .where(eq(borrowings.id, existing.borrowingId))
      .limit(1);
    if (!borrowing) {
      return NextResponse.json({ error: 'BORROWING_NOT_FOUND: Data peminjaman terkait tidak ditemukan.' }, { status: 404 });
    }
    if (borrowing.status === 'borrowed' || borrowing.status === 'overdue') {
      return NextResponse.json(
        { error: 'Pengembalian tidak dapat dihapus karena peminjaman masih aktif. Selesaikan transaksi terlebih dahulu.' },
        { status: 400 },
      );
    }

    await db.transaction(async (tx) => {
      await tx.delete(fines).where(eq(fines.borrowingId, borrowing.id));
      await tx.delete(returns).where(eq(returns.borrowingId, borrowing.id));
      await tx.delete(borrowingDetails).where(eq(borrowingDetails.borrowingId, borrowing.id));
      await tx.delete(borrowings).where(eq(borrowings.id, borrowing.id));
    });

    await createAuditLog({
      userId: user.id,
      action: 'DELETE',
      module: 'RETURNS',
      description: `Hapus pengembalian ${borrowing.borrowCode}`,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DELETE /api/returns/:id error', error);
    return NextResponse.json({ error: 'Gagal menghapus pengembalian.' }, { status: 500 });
  }
}

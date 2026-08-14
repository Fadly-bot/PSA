import { NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '@/db/index';
import {
  bookInventories,
  books,
  borrowings,
  borrowingDetails,
  fines,
  members,
  returns,
  users,
} from '@/db/schema';
import { getCurrentUser, hasPermission } from '@/server/auth-utils';
import { createAuditLog } from '@/server/audit';
import type { SelectedFields } from 'drizzle-orm/operations';

export const runtime = 'nodejs';

const extendSchema = z.object({
  newDueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Tanggal jatuh tempo tidak valid'),
});

const detailSelect: SelectedFields<any, any> = {
  id: borrowings.id,
  borrowCode: borrowings.borrowCode,
  borrowDate: borrowings.borrowDate,
  dueDate: borrowings.dueDate,
  returnDate: borrowings.returnDate,
  status: borrowings.status,
  notes: borrowings.notes,
  createdAt: borrowings.createdAt,
  member: {
    id: members.id,
    memberCode: members.memberCode,
    user: { name: users.name, email: users.email },
  },
  fine: {
    id: fines.id,
    amount: fines.amount,
    status: fines.status,
    paidAt: fines.paidAt,
  },
};

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    // A non-UUID id (e.g. "not-a-uuid") would raise a Postgres error (500);
    // treat it as "not found" instead.
    if (!UUID_RE.test(id)) {
      return NextResponse.json({ error: 'BORROWING_NOT_FOUND: Data peminjaman tidak ditemukan.' }, { status: 404 });
    }
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Tidak diizinkan.' }, { status: 401 });

    const [row] = await db
      .select(detailSelect)
      .from(borrowings)
      .leftJoin(members, eq(borrowings.memberId, members.id))
      .leftJoin(users, eq(members.userId, users.id))
      .leftJoin(fines, eq(borrowings.id, fines.borrowingId))
      .where(eq(borrowings.id, id))
      .limit(1);
    if (!row) {
      return NextResponse.json({ error: 'BORROWING_NOT_FOUND: Data peminjaman tidak ditemukan.' }, { status: 404 });
    }

    // Members may only view their own borrowings.
    const isStaff = hasPermission(user.role, 'borrowing:borrow');
    if (!isStaff && row.member?.user?.email !== user.email) {
      return NextResponse.json({ error: 'Tidak memiliki izin.' }, { status: 403 });
    }

    const items = await db
      .select({
        id: borrowingDetails.id,
        inventoryCode: bookInventories.inventoryCode,
        condition: bookInventories.condition,
        status: bookInventories.status,
        bookTitle: books.title,
        bookSlug: books.slug,
        bookIsbn: books.isbn,
      })
      .from(borrowingDetails)
      .innerJoin(bookInventories, eq(borrowingDetails.bookInventoryId, bookInventories.id))
      .innerJoin(books, eq(bookInventories.bookId, books.id))
      .where(eq(borrowingDetails.borrowingId, id))
      .orderBy(bookInventories.inventoryCode);

    return NextResponse.json({ ...row, items });
  } catch (error) {
    console.error('GET /api/borrowings/:id error', error);
    return NextResponse.json({ error: 'Gagal memuat detail peminjaman.' }, { status: 500 });
  }
}

/** Extend the due date (perpanjang masa pinjam). */
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Tidak diizinkan.' }, { status: 401 });
    if (!hasPermission(user.role, 'borrowing:extend')) {
      return NextResponse.json({ error: 'Tidak memiliki izin.' }, { status: 403 });
    }

    const body = await request.json().catch(() => null);
    const parsed = extendSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Data tidak valid.' }, { status: 400 });
    }

    const [existing] = await db
      .select({ id: borrowings.id, status: borrowings.status, borrowDate: borrowings.borrowDate })
      .from(borrowings)
      .where(eq(borrowings.id, id))
      .limit(1);
    if (!existing) {
      return NextResponse.json({ error: 'BORROWING_NOT_FOUND: Data peminjaman tidak ditemukan.' }, { status: 404 });
    }
    if (existing.status !== 'borrowed' && existing.status !== 'overdue') {
      return NextResponse.json({ error: 'Peminjaman tidak dapat diperpanjang.' }, { status: 400 });
    }
    if (parsed.data.newDueDate <= existing.borrowDate) {
      return NextResponse.json({ error: 'INVALID_DUE_DATE: Tanggal jatuh tempo harus lebih besar dari tanggal pinjam.' }, { status: 400 });
    }

    const [row] = await db
      .update(borrowings)
      .set({ dueDate: parsed.data.newDueDate, status: 'borrowed', updatedAt: new Date() })
      .where(eq(borrowings.id, id))
      .returning();

    await createAuditLog({
      userId: user.id,
      action: 'UPDATE',
      module: 'BORROWINGS',
      description: `Perpanjang ${row.borrowCode} hingga ${row.dueDate}`,
    });

    return NextResponse.json(row);
  } catch (error) {
    console.error('PATCH /api/borrowings/:id error', error);
    return NextResponse.json({ error: 'Gagal memperpanjang peminjaman.' }, { status: 500 });
  }
}

/**
 * DELETE peminjaman — dua perilaku aman:
 *  1. Status aktif (borrowed/overdue): batalkan; eksemplar dikembalikan ke
 *     status available. Inventaris/anggota/buku tidak dihapus.
 *  2. Status selesai (returned/cancelled): hapus permanen seluruh transaksi
 *     (detail, pengembalian, denda terkait) di dalam satu transaksi DB.
 *     Status inventaris TIDAK disentuh — transaksi sudah selesai.
 */
export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Tidak diizinkan.' }, { status: 401 });
    if (!hasPermission(user.role, 'borrowing:borrow')) {
      return NextResponse.json({ error: 'Tidak memiliki izin.' }, { status: 403 });
    }

    const [existing] = await db
      .select({ id: borrowings.id, status: borrowings.status, borrowCode: borrowings.borrowCode })
      .from(borrowings)
      .where(eq(borrowings.id, id))
      .limit(1);
    if (!existing) {
      return NextResponse.json({ error: 'BORROWING_NOT_FOUND: Data peminjaman tidak ditemukan.' }, { status: 404 });
    }

    // --- Transaksi masih aktif → batalkan (inventaris kembali tersedia). ---
    if (existing.status === 'borrowed' || existing.status === 'overdue') {
      await db.transaction(async (tx) => {
        const detailRows = await tx
          .select({ inventoryId: borrowingDetails.bookInventoryId })
          .from(borrowingDetails)
          .where(eq(borrowingDetails.borrowingId, id));

        await tx
          .update(borrowings)
          .set({ status: 'cancelled', updatedAt: new Date() })
          .where(eq(borrowings.id, id));

        for (const d of detailRows) {
          await tx
            .update(bookInventories)
            .set({ status: 'available', updatedAt: new Date() })
            .where(eq(bookInventories.id, d.inventoryId));
        }
      });

      await createAuditLog({
        userId: user.id,
        action: 'DELETE',
        module: 'BORROWINGS',
        description: `Batalkan ${existing.borrowCode}`,
      });

      return NextResponse.json({ success: true, cancelled: true });
    }

    // --- Transaksi selesai → hapus permanen (bersihkan data lama/testing). ---
    if (existing.status === 'returned' || existing.status === 'cancelled') {
      await db.transaction(async (tx) => {
        await tx.delete(fines).where(eq(fines.borrowingId, id));
        await tx.delete(returns).where(eq(returns.borrowingId, id));
        await tx.delete(borrowingDetails).where(eq(borrowingDetails.borrowingId, id));
        await tx.delete(borrowings).where(eq(borrowings.id, id));
      });

      await createAuditLog({
        userId: user.id,
        action: 'DELETE',
        module: 'BORROWINGS',
        description: `Hapus ${existing.borrowCode}`,
      });

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Status peminjaman tidak valid untuk dihapus.' }, { status: 400 });
  } catch (error) {
    console.error('DELETE /api/borrowings/:id error', error);
    return NextResponse.json({ error: 'Gagal menghapus peminjaman.' }, { status: 500 });
  }
}

import { NextResponse } from 'next/server';
import { and, eq, isNull, sql } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '@/db/index';
import { bookInventories, books, bookSources, borrowings, borrowingDetails, shelves } from '@/db/schema';
import { getCurrentUser, hasPermission } from '@/server/auth-utils';
import { createAuditLog } from '@/server/audit';

export const runtime = 'nodejs';

const updateInventorySchema = z.object({
  inventoryCode: z.string().trim().min(3).max(50).optional(),
  bookId: z.string().uuid('Buku tidak valid').optional(),
  sourceId: z.string().uuid('Sumber buku tidak valid').optional(),
  shelfId: z.string().uuid('Rak tidak valid').nullable().optional(),
  condition: z.enum(['good', 'damaged', 'lost']).optional(),
  status: z.enum(['available', 'borrowed', 'maintenance', 'lost']).optional(),
  notes: z.string().trim().max(1000).nullable().optional(),
});

const detailSelect = {
  id: bookInventories.id,
  inventoryCode: bookInventories.inventoryCode,
  condition: bookInventories.condition,
  status: bookInventories.status,
  notes: bookInventories.notes,
  createdAt: bookInventories.createdAt,
  updatedAt: bookInventories.updatedAt,
  book: { id: books.id, title: books.title, isbn: books.isbn, slug: books.slug },
  source: { id: bookSources.id, name: bookSources.name },
  shelf: { id: shelves.id, code: shelves.code, name: shelves.name },
};

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const [row] = await db
      .select(detailSelect)
      .from(bookInventories)
      .leftJoin(books, eq(bookInventories.bookId, books.id))
      .leftJoin(bookSources, eq(bookInventories.sourceId, bookSources.id))
      .leftJoin(shelves, eq(bookInventories.shelfId, shelves.id))
      .where(and(eq(bookInventories.id, id), isNull(bookInventories.deletedAt)))
      .limit(1);
    if (!row) {
      return NextResponse.json({ error: 'INVENTORY_NOT_FOUND: Inventaris tidak ditemukan.' }, { status: 404 });
    }
    return NextResponse.json(row);
  } catch (error) {
    console.error('GET /api/inventories/:id error', error);
    return NextResponse.json({ error: 'Gagal memuat detail inventaris.' }, { status: 500 });
  }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Tidak diizinkan.' }, { status: 401 });
    if (!hasPermission(user.role, 'inventory:update')) {
      return NextResponse.json({ error: 'Tidak memiliki izin.' }, { status: 403 });
    }

    const [existing] = await db
      .select()
      .from(bookInventories)
      .where(and(eq(bookInventories.id, id), isNull(bookInventories.deletedAt)))
      .limit(1);
    if (!existing) {
      return NextResponse.json({ error: 'INVENTORY_NOT_FOUND: Inventaris tidak ditemukan.' }, { status: 404 });
    }

    const body = await request.json().catch(() => null);
    const parsed = updateInventorySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Data tidak valid.' }, { status: 400 });
    }
    const data = parsed.data;

    const values: Record<string, any> = { updatedAt: new Date() };
    if (data.inventoryCode !== undefined) values.inventoryCode = data.inventoryCode;
    if (data.bookId !== undefined) values.bookId = data.bookId;
    if (data.sourceId !== undefined) values.sourceId = data.sourceId;
    if (data.shelfId !== undefined) values.shelfId = data.shelfId;
    if (data.condition !== undefined) values.condition = data.condition;
    if (data.status !== undefined) values.status = data.status;
    if (data.notes !== undefined) values.notes = data.notes;

    // Referential checks on changed fields.
    if (values.bookId && values.bookId !== existing.bookId) {
      const [b] = await db.select({ id: books.id }).from(books).where(eq(books.id, values.bookId)).limit(1);
      if (!b) return NextResponse.json({ error: 'INVALID_BOOK: Buku tidak ditemukan.' }, { status: 400 });
    }
    if (values.sourceId && values.sourceId !== existing.sourceId) {
      const [s] = await db.select({ id: bookSources.id }).from(bookSources).where(eq(bookSources.id, values.sourceId)).limit(1);
      if (!s) return NextResponse.json({ error: 'INVALID_BOOK_SOURCE: Sumber buku tidak ditemukan.' }, { status: 400 });
    }
    if (values.shelfId) {
      const [sh] = await db.select({ id: shelves.id }).from(shelves).where(eq(shelves.id, values.shelfId)).limit(1);
      if (!sh) return NextResponse.json({ error: 'INVALID_SHELF: Rak tidak ditemukan.' }, { status: 400 });
    }
    if (values.inventoryCode && values.inventoryCode !== existing.inventoryCode) {
      const [dup] = await db
        .select({ id: bookInventories.id })
        .from(bookInventories)
        .where(and(eq(bookInventories.inventoryCode, values.inventoryCode), isNull(bookInventories.deletedAt), sql`${bookInventories.id} != ${id}`))
        .limit(1);
      if (dup) return NextResponse.json({ error: 'INVENTORY_CODE_EXISTS: Kode inventaris sudah digunakan.' }, { status: 409 });
    }

    const [row] = await db.update(bookInventories).set(values).where(eq(bookInventories.id, id)).returning();

    await createAuditLog({
      userId: user.id,
      action: 'UPDATE',
      module: 'BOOK_INVENTORIES',
      description: `Edit inventaris "${row.inventoryCode}"`,
    });

    return NextResponse.json(row);
  } catch (error: any) {
    console.error('PATCH /api/inventories/:id error', error);
    if (error?.code === '23505') {
      return NextResponse.json({ error: 'INVENTORY_CODE_EXISTS: Kode inventaris sudah digunakan.' }, { status: 409 });
    }
    return NextResponse.json({ error: 'Gagal memperbarui inventaris.' }, { status: 500 });
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Tidak diizinkan.' }, { status: 401 });
    if (!hasPermission(user.role, 'inventory:delete')) {
      return NextResponse.json({ error: 'Tidak memiliki izin.' }, { status: 403 });
    }

    const [existing] = await db
      .select({ id: bookInventories.id, inventoryCode: bookInventories.inventoryCode })
      .from(bookInventories)
      .where(and(eq(bookInventories.id, id), isNull(bookInventories.deletedAt)))
      .limit(1);
    if (!existing) {
      return NextResponse.json({ error: 'INVENTORY_NOT_FOUND: Inventaris tidak ditemukan.' }, { status: 404 });
    }

    // Cannot delete while still actively borrowed.
    const [active] = await db
      .select({ id: borrowingDetails.id })
      .from(borrowingDetails)
      .innerJoin(borrowings, eq(borrowingDetails.borrowingId, borrowings.id))
      .where(
        and(
          eq(borrowingDetails.bookInventoryId, id),
          sql`${borrowings.status} IN ('borrowed', 'overdue')`,
        ),
      )
      .limit(1);
    if (active) {
      return NextResponse.json({ error: 'Inventaris masih dipinjam dan tidak dapat dihapus.' }, { status: 409 });
    }

    await db
      .update(bookInventories)
      .set({ deletedAt: new Date(), status: 'maintenance', updatedAt: new Date() })
      .where(eq(bookInventories.id, id));

    await createAuditLog({
      userId: user.id,
      action: 'DELETE',
      module: 'BOOK_INVENTORIES',
      description: `Hapus (soft) inventaris "${existing.inventoryCode}"`,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DELETE /api/inventories/:id error', error);
    return NextResponse.json({ error: 'Gagal menghapus inventaris.' }, { status: 500 });
  }
}

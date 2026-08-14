import { NextResponse } from 'next/server';
import { db } from '@/db/index';
import { categories, books } from '@/db/schema';
import { and, eq, isNull, sql } from 'drizzle-orm';
import { getCurrentUser, hasPermission } from '@/server/auth-utils';
import { createAuditLog } from '@/server/audit';

export const runtime = 'nodejs';

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const [row] = await db.select().from(categories).where(eq(categories.id, id)).limit(1);
    if (!row) {
      return NextResponse.json({ error: 'Kategori tidak ditemukan.' }, { status: 404 });
    }
    return NextResponse.json(row);
  } catch (error) {
    console.error('GET /api/categories/:id error', error);
    return NextResponse.json({ error: 'Gagal memuat data kategori.' }, { status: 500 });
  }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Tidak diizinkan.' }, { status: 401 });
    }
    if (!hasPermission(user.role, 'category:update')) {
      return NextResponse.json({ error: 'Tidak memiliki izin.' }, { status: 403 });
    }

    const [existing] = await db.select().from(categories).where(eq(categories.id, id)).limit(1);
    if (!existing) {
      return NextResponse.json({ error: 'Kategori tidak ditemukan.' }, { status: 404 });
    }

    const body = await request.json().catch(() => null);
    const name = typeof body?.name === 'string' ? body.name.trim() : existing.name;
    if (name.length < 2 || name.length > 150) {
      return NextResponse.json({ error: 'Nama kategori harus 2-150 karakter.' }, { status: 400 });
    }

    const description = typeof body?.description === 'string' ? body.description.trim() : existing.description;
    if (description && description.length > 5000) {
      return NextResponse.json({ error: 'Deskripsi maksimal 5000 karakter.' }, { status: 400 });
    }

    const [row] = await db.update(categories).set({
      name,
      description: description ?? undefined,
      updatedAt: new Date(),
    }).where(eq(categories.id, id)).returning();

    await createAuditLog({
      userId: user.id,
      action: 'UPDATE',
      module: 'CATEGORIES',
      description: `Edit kategori "${name}"`,
    });

    return NextResponse.json(row);
  } catch (error: any) {
    console.error('PATCH /api/categories/:id error', error);
    if (error?.code === '23505') {
      return NextResponse.json({ error: 'Nama kategori sudah digunakan.' }, { status: 409 });
    }
    return NextResponse.json({ error: 'Gagal memperbarui kategori.' }, { status: 500 });
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Tidak diizinkan.' }, { status: 401 });
    }
    if (!hasPermission(user.role, 'category:delete')) {
      return NextResponse.json({ error: 'Tidak memiliki izin.' }, { status: 403 });
    }

    const [existing] = await db.select().from(categories).where(eq(categories.id, id)).limit(1);
    if (!existing) {
      return NextResponse.json({ error: 'Kategori tidak ditemukan.' }, { status: 404 });
    }

    // Only ACTIVE books (not soft-deleted) block deletion. A kategori that is
    // only referenced by soft-deleted books is considered unused; those
    // references are safely detached (the column is nullable) before delete.
    const [relatedBooks] = await db
      .select({ count: sql<number>`count(*)` })
      .from(books)
      .where(and(eq(books.categoryId, id), isNull(books.deletedAt)));
    const categoryInUseCount = Number(relatedBooks?.count ?? 0);
    if (categoryInUseCount > 0) {
      return NextResponse.json(
        {
          error: `Kategori tidak dapat dihapus karena masih digunakan oleh ${categoryInUseCount} buku. Ubah atau hapus relasi buku terlebih dahulu, lalu coba lagi.`,
          code: 'MASTER_DATA_IN_USE',
          count: categoryInUseCount,
        },
        { status: 409 },
      );
    }

    await db.transaction(async (tx) => {
      // Lepas referensi hanya dari buku yang sudah dihapus (soft-delete).
      // Buku aktif tidak pernah kehilangan relasinya.
      await tx
        .update(books)
        .set({ categoryId: null })
        .where(and(eq(books.categoryId, id), sql`${books.deletedAt} IS NOT NULL`));
      await tx.delete(categories).where(eq(categories.id, id));
    });
    await createAuditLog({
      userId: user.id,
      action: 'DELETE',
      module: 'CATEGORIES',
      description: `Hapus kategori "${existing.name}"`,
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DELETE /api/categories/:id error', error);
    return NextResponse.json({ error: 'Gagal menghapus kategori.' }, { status: 500 });
  }
}

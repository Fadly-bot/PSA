import { NextResponse } from 'next/server';
import { db } from '@/db/index';
import { authors, books } from '@/db/schema';
import { and, eq, isNull, sql } from 'drizzle-orm';
import { getCurrentUser, hasPermission } from '@/server/auth-utils';
import { createAuditLog } from '@/server/audit';

export const runtime = 'nodejs';

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const [row] = await db.select().from(authors).where(eq(authors.id, id)).limit(1);
    if (!row) {
      return NextResponse.json({ error: 'Penulis tidak ditemukan.' }, { status: 404 });
    }
    return NextResponse.json(row);
  } catch (error) {
    console.error('GET /api/authors/:id error', error);
    return NextResponse.json({ error: 'Gagal memuat data penulis.' }, { status: 500 });
  }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Tidak diizinkan.' }, { status: 401 });
    }
    if (!hasPermission(user.role, 'author:update')) {
      return NextResponse.json({ error: 'Tidak memiliki izin.' }, { status: 403 });
    }

    const [existing] = await db.select().from(authors).where(eq(authors.id, id)).limit(1);
    if (!existing) {
      return NextResponse.json({ error: 'Penulis tidak ditemukan.' }, { status: 404 });
    }

    const body = await request.json().catch(() => null);
    const name = typeof body?.name === 'string' ? body.name.trim() : existing.name;
    if (name.length < 2 || name.length > 150) {
      return NextResponse.json({ error: 'Nama penulis harus 2-150 karakter.' }, { status: 400 });
    }

    const biography = typeof body?.biography === 'string' ? body.biography.trim() : existing.biography;
    if (biography && biography.length > 3000) {
      return NextResponse.json({ error: 'Biografi maksimal 3000 karakter.' }, { status: 400 });
    }

    let photoUrl = existing.photoUrl;
    if (typeof body?.photoUrl === 'string') {
      photoUrl = body.photoUrl.trim() || null;
      if (photoUrl && !/^https?:\/\/.+/.test(photoUrl)) {
        return NextResponse.json({ error: 'URL foto tidak valid.' }, { status: 400 });
      }
    }

    const [row] = await db.update(authors).set({
      name,
      biography: biography ?? undefined,
      photoUrl: photoUrl ?? undefined,
      updatedAt: new Date(),
    }).where(eq(authors.id, id)).returning();

    await createAuditLog({
      userId: user.id,
      action: 'UPDATE',
      module: 'AUTHORS',
      description: `Edit penulis "${name}"`,
    });

    return NextResponse.json(row);
  } catch (error: any) {
    console.error('PATCH /api/authors/:id error', error);
    if (error?.code === '23505') {
      return NextResponse.json({ error: 'Nama penulis sudah digunakan.' }, { status: 409 });
    }
    return NextResponse.json({ error: 'Gagal memperbarui penulis.' }, { status: 500 });
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Tidak diizinkan.' }, { status: 401 });
    }
    if (!hasPermission(user.role, 'author:delete')) {
      return NextResponse.json({ error: 'Tidak memiliki izin.' }, { status: 403 });
    }

    const [existing] = await db.select().from(authors).where(eq(authors.id, id)).limit(1);
    if (!existing) {
      return NextResponse.json({ error: 'Penulis tidak ditemukan.' }, { status: 404 });
    }

    // Only ACTIVE books (not soft-deleted) block deletion. A penulis that is
    // only referenced by soft-deleted books is considered unused; those
    // references are safely detached (the column is nullable) before delete.
    const [relatedBooks] = await db
      .select({ count: sql<number>`count(*)` })
      .from(books)
      .where(and(eq(books.authorId, id), isNull(books.deletedAt)));
    const authorInUseCount = Number(relatedBooks?.count ?? 0);
    if (authorInUseCount > 0) {
      return NextResponse.json(
        {
          error: `Penulis tidak dapat dihapus karena masih digunakan oleh ${authorInUseCount} buku. Ubah atau hapus relasi buku terlebih dahulu, lalu coba lagi.`,
          code: 'MASTER_DATA_IN_USE',
          count: authorInUseCount,
        },
        { status: 409 },
      );
    }

    await db.transaction(async (tx) => {
      // Lepas referensi hanya dari buku yang sudah dihapus (soft-delete).
      // Buku aktif tidak pernah kehilangan relasinya.
      await tx
        .update(books)
        .set({ authorId: null })
        .where(and(eq(books.authorId, id), sql`${books.deletedAt} IS NOT NULL`));
      await tx.delete(authors).where(eq(authors.id, id));
    });
    await createAuditLog({
      userId: user.id,
      action: 'DELETE',
      module: 'AUTHORS',
      description: `Hapus penulis "${existing.name}"`,
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DELETE /api/authors/:id error', error);
    return NextResponse.json({ error: 'Gagal menghapus penulis.' }, { status: 500 });
  }
}

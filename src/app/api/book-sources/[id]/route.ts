import { NextResponse } from 'next/server';
import { db } from '@/db/index';
import { bookSources, bookInventories } from '@/db/schema';
import { eq, sql } from 'drizzle-orm';
import { getCurrentUser, hasPermission } from '@/server/auth-utils';
import { createAuditLog } from '@/server/audit';

export const runtime = 'nodejs';

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const [row] = await db.select().from(bookSources).where(eq(bookSources.id, id)).limit(1);
    if (!row) {
      return NextResponse.json({ error: 'Sumber buku tidak ditemukan.' }, { status: 404 });
    }
    return NextResponse.json(row);
  } catch (error) {
    console.error('GET /api/book-sources/:id error', error);
    return NextResponse.json({ error: 'Gagal memuat data sumber buku.' }, { status: 500 });
  }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Tidak diizinkan.' }, { status: 401 });
    }
    if (!hasPermission(user.role, 'source:update')) {
      return NextResponse.json({ error: 'Tidak memiliki izin.' }, { status: 403 });
    }

    const [existing] = await db.select().from(bookSources).where(eq(bookSources.id, id)).limit(1);
    if (!existing) {
      return NextResponse.json({ error: 'Sumber buku tidak ditemukan.' }, { status: 404 });
    }

    const body = await request.json().catch(() => null);
    const name = typeof body?.name === 'string' ? body.name.trim() : existing.name;
    if (name.length < 2 || name.length > 100) {
      return NextResponse.json({ error: 'Nama sumber buku harus 2-100 karakter.' }, { status: 400 });
    }

    const description = typeof body?.description === 'string' ? body.description.trim() : existing.description;
    if (description && description.length > 1000) {
      return NextResponse.json({ error: 'Deskripsi maksimal 1000 karakter.' }, { status: 400 });
    }

    const [row] = await db.update(bookSources).set({
      name,
      description: description ?? undefined,
      updatedAt: new Date(),
    }).where(eq(bookSources.id, id)).returning();

    await createAuditLog({
      userId: user.id,
      action: 'UPDATE',
      module: 'BOOK_SOURCES',
      description: `Edit sumber buku "${name}"`,
    });

    return NextResponse.json(row);
  } catch (error: any) {
    console.error('PATCH /api/book-sources/:id error', error);
    if (error?.code === '23505') {
      return NextResponse.json({ error: 'Nama sumber buku sudah digunakan.' }, { status: 409 });
    }
    return NextResponse.json({ error: 'Gagal memperbarui sumber buku.' }, { status: 500 });
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Tidak diizinkan.' }, { status: 401 });
    }
    if (!hasPermission(user.role, 'source:delete')) {
      return NextResponse.json({ error: 'Tidak memiliki izin.' }, { status: 403 });
    }

    const [existing] = await db.select().from(bookSources).where(eq(bookSources.id, id)).limit(1);
    if (!existing) {
      return NextResponse.json({ error: 'Sumber buku tidak ditemukan.' }, { status: 404 });
    }

    const [relatedInventories] = await db.select({ count: sql<number>`count(*)` }).from(bookInventories).where(eq(bookInventories.sourceId, id)).limit(1);
    if (Number(relatedInventories?.count ?? 0) > 0) {
      return NextResponse.json({ error: 'Sumber buku masih digunakan oleh inventaris.' }, { status: 409 });
    }

    await db.delete(bookSources).where(eq(bookSources.id, id));
    await createAuditLog({
      userId: user.id,
      action: 'DELETE',
      module: 'BOOK_SOURCES',
      description: `Hapus sumber buku "${existing.name}"`,
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DELETE /api/book-sources/:id error', error);
    return NextResponse.json({ error: 'Gagal menghapus sumber buku.' }, { status: 500 });
  }
}

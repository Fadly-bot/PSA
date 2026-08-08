import { NextResponse } from 'next/server';
import { db } from '@/db/index';
import { categories, books } from '@/db/schema';
import { eq, and, sql } from 'drizzle-orm';
import { getCurrentUser, hasPermission } from '@/server/auth-utils';

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

    const [relatedBooks] = await db.select({ count: sql<number>`count(*)` }).from(books).where(eq(books.categoryId, id)).limit(1);
    if (Number(relatedBooks?.count ?? 0) > 0) {
      return NextResponse.json({ error: 'Kategori masih digunakan oleh buku.' }, { status: 409 });
    }

    await db.delete(categories).where(eq(categories.id, id));
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DELETE /api/categories/:id error', error);
    return NextResponse.json({ error: 'Gagal menghapus kategori.' }, { status: 500 });
  }
}

import { NextResponse } from 'next/server';
import { db } from '@/db/index';
import { shelves, bookInventories } from '@/db/schema';
import { eq, and, sql } from 'drizzle-orm';
import { getCurrentUser, hasPermission } from '@/server/auth-utils';

export const runtime = 'nodejs';

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const [row] = await db.select().from(shelves).where(eq(shelves.id, id)).limit(1);
    if (!row) {
      return NextResponse.json({ error: 'Rak tidak ditemukan.' }, { status: 404 });
    }
    return NextResponse.json(row);
  } catch (error) {
    console.error('GET /api/shelves/:id error', error);
    return NextResponse.json({ error: 'Gagal memuat data rak.' }, { status: 500 });
  }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Tidak diizinkan.' }, { status: 401 });
    }
    if (!hasPermission(user.role, 'shelf:update')) {
      return NextResponse.json({ error: 'Tidak memiliki izin.' }, { status: 403 });
    }

    const [existing] = await db.select().from(shelves).where(eq(shelves.id, id)).limit(1);
    if (!existing) {
      return NextResponse.json({ error: 'Rak tidak ditemukan.' }, { status: 404 });
    }

    const body = await request.json().catch(() => null);
    const code = typeof body?.code === 'string' ? body.code.trim() : existing.code;
    if (code.length > 30) {
      return NextResponse.json({ error: 'Kode rak maksimal 30 karakter.' }, { status: 400 });
    }

    const name = typeof body?.name === 'string' ? body.name.trim() : existing.name;
    if (name.length < 2 || name.length > 100) {
      return NextResponse.json({ error: 'Nama rak harus 2-100 karakter.' }, { status: 400 });
    }

    const description = typeof body?.description === 'string' ? body.description.trim() : existing.description;
    if (description && description.length > 1000) {
      return NextResponse.json({ error: 'Deskripsi maksimal 1000 karakter.' }, { status: 400 });
    }

    let floor = existing.floor ?? 0;
    if (typeof body?.floor === 'number') {
      floor = body.floor;
      if (!Number.isInteger(floor) || floor < 0) {
        return NextResponse.json({ error: 'Lantai harus angka bulat non-negatif.' }, { status: 400 });
      }
    }

    const [row] = await db.update(shelves).set({
      code,
      name,
      description: description ?? undefined,
      floor,
      updatedAt: new Date(),
    }).where(eq(shelves.id, id)).returning();

    return NextResponse.json(row);
  } catch (error: any) {
    console.error('PATCH /api/shelves/:id error', error);
    if (error?.code === '23505') {
      return NextResponse.json({ error: 'Kode rak sudah digunakan.' }, { status: 409 });
    }
    return NextResponse.json({ error: 'Gagal memperbarui rak.' }, { status: 500 });
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Tidak diizinkan.' }, { status: 401 });
    }
    if (!hasPermission(user.role, 'shelf:delete')) {
      return NextResponse.json({ error: 'Tidak memiliki izin.' }, { status: 403 });
    }

    const [existing] = await db.select().from(shelves).where(eq(shelves.id, id)).limit(1);
    if (!existing) {
      return NextResponse.json({ error: 'Rak tidak ditemukan.' }, { status: 404 });
    }

    const [relatedInventories] = await db.select({ count: sql<number>`count(*)` }).from(bookInventories).where(eq(bookInventories.shelfId, id)).limit(1);
    if (Number(relatedInventories?.count ?? 0) > 0) {
      return NextResponse.json({ error: 'Rak masih digunakan oleh inventaris buku.' }, { status: 409 });
    }

    await db.delete(shelves).where(eq(shelves.id, id));
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DELETE /api/shelves/:id error', error);
    return NextResponse.json({ error: 'Gagal menghapus rak.' }, { status: 500 });
  }
}

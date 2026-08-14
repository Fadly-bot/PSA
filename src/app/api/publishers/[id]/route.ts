import { NextResponse } from 'next/server';
import { db } from '@/db/index';
import { publishers, books } from '@/db/schema';
import { and, eq, isNull, sql } from 'drizzle-orm';
import { getCurrentUser, hasPermission } from '@/server/auth-utils';
import { createAuditLog } from '@/server/audit';

export const runtime = 'nodejs';

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const [row] = await db.select().from(publishers).where(eq(publishers.id, id)).limit(1);
    if (!row) {
      return NextResponse.json({ error: 'Penerbit tidak ditemukan.' }, { status: 404 });
    }
    return NextResponse.json(row);
  } catch (error) {
    console.error('GET /api/publishers/:id error', error);
    return NextResponse.json({ error: 'Gagal memuat data penerbit.' }, { status: 500 });
  }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Tidak diizinkan.' }, { status: 401 });
    }
    if (!hasPermission(user.role, 'publisher:update')) {
      return NextResponse.json({ error: 'Tidak memiliki izin.' }, { status: 403 });
    }

    const [existing] = await db.select().from(publishers).where(eq(publishers.id, id)).limit(1);
    if (!existing) {
      return NextResponse.json({ error: 'Penerbit tidak ditemukan.' }, { status: 404 });
    }

    const body = await request.json().catch(() => null);
    const name = typeof body?.name === 'string' ? body.name.trim() : existing.name;
    if (name.length < 2 || name.length > 200) {
      return NextResponse.json({ error: 'Nama penerbit harus 2-200 karakter.' }, { status: 400 });
    }

    const address = typeof body?.address === 'string' ? body.address.trim() : existing.address;
    if (address && address.length > 500) {
      return NextResponse.json({ error: 'Alamat maksimal 500 karakter.' }, { status: 400 });
    }

    let email = existing.email;
    if (typeof body?.email === 'string') {
      email = body.email.trim() || undefined;
      if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return NextResponse.json({ error: 'Format email tidak valid.' }, { status: 400 });
      }
    }

    const phone = typeof body?.phone === 'string' ? body.phone.trim() : existing.phone;
    let website = existing.website;
    if (typeof body?.website === 'string') {
      website = body.website.trim() || undefined;
      if (website && !/^https?:\/\/.+/.test(website)) {
        return NextResponse.json({ error: 'URL website tidak valid.' }, { status: 400 });
      }
    }

    const [row] = await db.update(publishers).set({
      name,
      address: address ?? undefined,
      email,
      phone,
      website,
      updatedAt: new Date(),
    }).where(eq(publishers.id, id)).returning();

    await createAuditLog({
      userId: user.id,
      action: 'UPDATE',
      module: 'PUBLISHERS',
      description: `Edit penerbit "${name}"`,
    });

    return NextResponse.json(row);
  } catch (error: any) {
    console.error('PATCH /api/publishers/:id error', error);
    if (error?.code === '23505') {
      return NextResponse.json({ error: 'Nama penerbit sudah digunakan.' }, { status: 409 });
    }
    return NextResponse.json({ error: 'Gagal memperbarui penerbit.' }, { status: 500 });
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Tidak diizinkan.' }, { status: 401 });
    }
    if (!hasPermission(user.role, 'publisher:delete')) {
      return NextResponse.json({ error: 'Tidak memiliki izin.' }, { status: 403 });
    }

    const [existing] = await db.select().from(publishers).where(eq(publishers.id, id)).limit(1);
    if (!existing) {
      return NextResponse.json({ error: 'Penerbit tidak ditemukan.' }, { status: 404 });
    }

    // Only ACTIVE books (not soft-deleted) block deletion. A penerbit that is
    // only referenced by soft-deleted books is considered unused; those
    // references are safely detached (the column is nullable) before delete.
    const [relatedBooks] = await db
      .select({ count: sql<number>`count(*)` })
      .from(books)
      .where(and(eq(books.publisherId, id), isNull(books.deletedAt)));
    const publisherInUseCount = Number(relatedBooks?.count ?? 0);
    if (publisherInUseCount > 0) {
      return NextResponse.json(
        {
          error: `Penerbit tidak dapat dihapus karena masih digunakan oleh ${publisherInUseCount} buku. Ubah atau hapus relasi buku terlebih dahulu, lalu coba lagi.`,
          code: 'MASTER_DATA_IN_USE',
          count: publisherInUseCount,
        },
        { status: 409 },
      );
    }

    await db.transaction(async (tx) => {
      // Lepas referensi hanya dari buku yang sudah dihapus (soft-delete).
      // Buku aktif tidak pernah kehilangan relasinya.
      await tx
        .update(books)
        .set({ publisherId: null })
        .where(and(eq(books.publisherId, id), sql`${books.deletedAt} IS NOT NULL`));
      await tx.delete(publishers).where(eq(publishers.id, id));
    });
    await createAuditLog({
      userId: user.id,
      action: 'DELETE',
      module: 'PUBLISHERS',
      description: `Hapus penerbit "${existing.name}"`,
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DELETE /api/publishers/:id error', error);
    return NextResponse.json({ error: 'Gagal menghapus penerbit.' }, { status: 500 });
  }
}

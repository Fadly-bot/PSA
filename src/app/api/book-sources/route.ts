import { NextResponse } from 'next/server';
import { db } from '@/db/index';
import { bookSources } from '@/db/schema';
import { desc, sql } from 'drizzle-orm';
import { getCurrentUser, hasPermission } from '@/server/auth-utils';
import { createAuditLog } from '@/server/audit';

export const runtime = 'nodejs';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get('q')?.trim() ?? '';
    const page = Math.max(1, Number(searchParams.get('page') ?? '1'));
    const limit = Math.max(1, Math.min(100, Number(searchParams.get('limit') ?? '10')));
    const sortBy = searchParams.get('sortBy') ?? 'createdAt';

    const offset = (page - 1) * limit;

    const conditions = [];
    if (q) {
      conditions.push(sql`${bookSources.name} ILIKE ${`%${q}%`}`);
    }

    const whereClause = conditions.length > 0 ? sql`${sql.join(conditions, sql` AND `)}` : undefined;

    const orderByMap: Record<string, any> = {
      name: desc(bookSources.name),
      createdAt: desc(bookSources.createdAt),
      updatedAt: desc(bookSources.updatedAt),
    };
    const orderBy = orderByMap[sortBy] ?? desc(bookSources.createdAt);

    const [items, [{ count }]] = await Promise.all([
      db.select().from(bookSources).where(whereClause).orderBy(orderBy).limit(limit).offset(offset),
      db.select({ count: sql<number>`count(*)` }).from(bookSources).where(whereClause),
    ]);

    return NextResponse.json({
      items,
      page,
      limit,
      total: Number(count),
      totalPages: Math.max(1, Math.ceil(Number(count) / limit)),
    });
  } catch (error) {
    console.error('GET /api/book-sources error', error);
    return NextResponse.json({ error: 'Gagal memuat data sumber buku.' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Tidak diizinkan.' }, { status: 401 });
    }
    if (!hasPermission(user.role, 'source:create')) {
      return NextResponse.json({ error: 'Tidak memiliki izin.' }, { status: 403 });
    }

    const body = await request.json().catch(() => null);
    if (!body?.name || typeof body.name !== 'string') {
      return NextResponse.json({ error: 'Nama sumber buku wajib diisi.' }, { status: 400 });
    }

    const name = body.name.trim();
    if (name.length < 2 || name.length > 100) {
      return NextResponse.json({ error: 'Nama sumber buku harus 2-100 karakter.' }, { status: 400 });
    }

    const description = typeof body.description === 'string' ? body.description.trim() : undefined;
    if (description && description.length > 1000) {
      return NextResponse.json({ error: 'Deskripsi maksimal 1000 karakter.' }, { status: 400 });
    }

    const [row] = await db.insert(bookSources).values({
      name,
      description: description ?? undefined,
    }).returning();

    await createAuditLog({
      userId: user.id,
      action: 'CREATE',
      module: 'BOOK_SOURCES',
      description: `Tambah sumber buku "${name}"`,
    });

    return NextResponse.json(row, { status: 201 });
  } catch (error: any) {
    console.error('POST /api/book-sources error', error);
    if (error?.code === '23505') {
      return NextResponse.json({ error: 'Nama sumber buku sudah digunakan.' }, { status: 409 });
    }
    return NextResponse.json({ error: 'Gagal menyimpan sumber buku.' }, { status: 500 });
  }
}

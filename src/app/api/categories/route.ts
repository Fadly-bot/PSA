import { NextResponse } from 'next/server';
import { db } from '@/db/index';
import { categories } from '@/db/schema';
import { eq, desc, sql } from 'drizzle-orm';
import { getCurrentUser, hasPermission } from '@/server/auth-utils';

export const runtime = 'nodejs';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get('q')?.trim() ?? '';
    const page = Math.max(1, Number(searchParams.get('page') ?? '1'));
    const limit = Math.max(1, Math.min(100, Number(searchParams.get('limit') ?? '10')));
    const sortBy = searchParams.get('sortBy') ?? 'createdAt';
    const sortOrder = searchParams.get('sortOrder') === 'asc' ? 'asc' : 'desc';

    const offset = (page - 1) * limit;

    const conditions = [];
    if (q) {
      conditions.push(sql`${categories.name} ILIKE ${`%${q}%`}`);
    }

    const whereClause = conditions.length > 0 ? sql`WHERE ${sql.join(conditions, sql` AND `)}` : sql``;

    const orderByMap: Record<string, any> = {
      name: desc(categories.name),
      createdAt: desc(categories.createdAt),
      updatedAt: desc(categories.updatedAt),
    };
    const orderBy = orderByMap[sortBy] ?? desc(categories.createdAt);

    const [items, [{ count }]] = await Promise.all([
      db.select().from(categories).where(whereClause).orderBy(orderBy).limit(limit).offset(offset),
      db.select({ count: sql<number>`count(*)` }).from(categories).where(whereClause),
    ]);

    return NextResponse.json({
      items,
      page,
      limit,
      total: Number(count),
      totalPages: Math.max(1, Math.ceil(Number(count) / limit)),
    });
  } catch (error) {
    console.error('GET /api/categories error', error);
    return NextResponse.json({ error: 'Gagal memuat data kategori.' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Tidak diizinkan.' }, { status: 401 });
    }
    if (!hasPermission(user.role, 'category:create')) {
      return NextResponse.json({ error: 'Tidak memiliki izin.' }, { status: 403 });
    }

    const body = await request.json().catch(() => null);
    if (!body?.name || typeof body.name !== 'string') {
      return NextResponse.json({ error: 'Nama kategori wajib diisi.' }, { status: 400 });
    }

    const name = body.name.trim();
    if (name.length < 2 || name.length > 150) {
      return NextResponse.json({ error: 'Nama kategori harus 2-150 karakter.' }, { status: 400 });
    }

    const description = typeof body.description === 'string' ? body.description.trim() : undefined;
    if (description && description.length > 5000) {
      return NextResponse.json({ error: 'Deskripsi maksimal 5000 karakter.' }, { status: 400 });
    }

    const [row] = await db.insert(categories).values({
      name,
      description: description ?? undefined,
    }).returning();

    return NextResponse.json(row, { status: 201 });
  } catch (error: any) {
    console.error('POST /api/categories error', error);
    if (error?.code === '23505') {
      return NextResponse.json({ error: 'Nama kategori sudah digunakan.' }, { status: 409 });
    }
    return NextResponse.json({ error: 'Gagal menyimpan kategori.' }, { status: 500 });
  }
}

import { NextResponse } from 'next/server';
import { db } from '@/db/index';
import { authors } from '@/db/schema';
import { eq, desc, sql } from 'drizzle-orm';
import { getCurrentUser, requirePermission } from '@/server/auth-utils';
import { hasPermission } from '@/server/permissions';

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
      conditions.push(sql`${authors.name} ILIKE ${`%${q}%`}`);
    }

    const whereClause = conditions.length > 0 ? sql`WHERE ${sql.join(conditions, sql` AND `)}` : sql``;

    const orderByMap: Record<string, any> = {
      name: desc(authors.name),
      createdAt: desc(authors.createdAt),
      updatedAt: desc(authors.updatedAt),
    };
    const orderBy = orderByMap[sortBy] ?? desc(authors.createdAt);

    const [items, [{ count }]] = await Promise.all([
      db.select().from(authors).where(whereClause).orderBy(orderBy).limit(limit).offset(offset),
      db.select({ count: sql<number>`count(*)` }).from(authors).where(whereClause),
    ]);

    return NextResponse.json({
      items,
      page,
      limit,
      total: Number(count),
      totalPages: Math.max(1, Math.ceil(Number(count) / limit)),
    });
  } catch (error) {
    console.error('GET /api/authors error', error);
    return NextResponse.json({ error: 'Gagal memuat data penulis.' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Tidak diizinkan.' }, { status: 401 });
    }
    if (!hasPermission(user.role, 'author:create')) {
      return NextResponse.json({ error: 'Tidak memiliki izin.' }, { status: 403 });
    }

    const body = await request.json().catch(() => null);
    if (!body?.name || typeof body.name !== 'string') {
      return NextResponse.json({ error: 'Nama penulis wajib diisi.' }, { status: 400 });
    }

    const name = body.name.trim();
    if (name.length < 2 || name.length > 150) {
      return NextResponse.json({ error: 'Nama penulis harus 2-150 karakter.' }, { status: 400 });
    }

    const biography = typeof body.biography === 'string' ? body.biography.trim() : null;
    if (biography && biography.length > 3000) {
      return NextResponse.json({ error: 'Biografi maksimal 3000 karakter.' }, { status: 400 });
    }

    const photoUrl = typeof body.photoUrl === 'string' ? body.photoUrl.trim() : null;
    if (photoUrl && !/^https?:\/\/.+/.test(photoUrl)) {
      return NextResponse.json({ error: 'URL foto tidak valid.' }, { status: 400 });
    }

    const [row] = await db.insert(authors).values({
      name,
      biography: biography ?? undefined,
      photoUrl: photoUrl ?? undefined,
    }).returning();

    return NextResponse.json(row, { status: 201 });
  } catch (error: any) {
    console.error('POST /api/authors error', error);
    if (error?.code === '23505') {
      return NextResponse.json({ error: 'Nama penulis sudah digunakan.' }, { status: 409 });
    }
    return NextResponse.json({ error: 'Gagal menyimpan penulis.' }, { status: 500 });
  }
}

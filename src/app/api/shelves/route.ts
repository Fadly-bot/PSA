import { NextResponse } from 'next/server';
import { db } from '@/db/index';
import { shelves } from '@/db/schema';
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
      conditions.push(
        sql`${shelves.code} ILIKE ${`%${q}%`} OR ${shelves.name} ILIKE ${`%${q}%`}`,
      );
    }

    const whereClause = conditions.length > 0 ? sql`WHERE ${sql.join(conditions, sql` AND `)}` : sql``;

    const orderByMap: Record<string, any> = {
      code: desc(shelves.code),
      name: desc(shelves.name),
      createdAt: desc(shelves.createdAt),
      updatedAt: desc(shelves.updatedAt),
    };
    const orderBy = orderByMap[sortBy] ?? desc(shelves.createdAt);

    const [items, [{ count }]] = await Promise.all([
      db.select().from(shelves).where(whereClause).orderBy(orderBy).limit(limit).offset(offset),
      db.select({ count: sql<number>`count(*)` }).from(shelves).where(whereClause),
    ]);

    return NextResponse.json({
      items,
      page,
      limit,
      total: Number(count),
      totalPages: Math.max(1, Math.ceil(Number(count) / limit)),
    });
  } catch (error) {
    console.error('GET /api/shelves error', error);
    return NextResponse.json({ error: 'Gagal memuat data rak.' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Tidak diizinkan.' }, { status: 401 });
    }
    if (!hasPermission(user.role, 'shelf:create')) {
      return NextResponse.json({ error: 'Tidak memiliki izin.' }, { status: 403 });
    }

    const body = await request.json().catch(() => null);
    if (!body?.code || typeof body.code !== 'string') {
      return NextResponse.json({ error: 'Kode rak wajib diisi.' }, { status: 400 });
    }
    if (!body?.name || typeof body.name !== 'string') {
      return NextResponse.json({ error: 'Nama rak wajib diisi.' }, { status: 400 });
    }

    const code = body.code.trim();
    const name = body.name.trim();
    if (code.length > 30) {
      return NextResponse.json({ error: 'Kode rak maksimal 30 karakter.' }, { status: 400 });
    }
    if (name.length < 2 || name.length > 100) {
      return NextResponse.json({ error: 'Nama rak harus 2-100 karakter.' }, { status: 400 });
    }

    const description = typeof body.description === 'string' ? body.description.trim() : undefined;
    if (description && description.length > 1000) {
      return NextResponse.json({ error: 'Deskripsi maksimal 1000 karakter.' }, { status: 400 });
    }

    const floor = typeof body.floor === 'number' ? body.floor : undefined;
    if (floor !== undefined && (!Number.isInteger(floor) || floor < 0)) {
      return NextResponse.json({ error: 'Lantai harus angka bulat non-negatif.' }, { status: 400 });
    }

    const [row] = await db.insert(shelves).values({
      code,
      name,
      description: description ?? undefined,
      floor,
    }).returning();

    await createAuditLog({
      userId: user.id,
      action: 'CREATE',
      module: 'SHELVES',
      description: `Tambah rak "${code} - ${name}"`,
    });

    return NextResponse.json(row, { status: 201 });
  } catch (error: any) {
    console.error('POST /api/shelves error', error);
    if (error?.code === '23505') {
      return NextResponse.json({ error: 'Kode rak sudah digunakan.' }, { status: 409 });
    }
    return NextResponse.json({ error: 'Gagal menyimpan rak.' }, { status: 500 });
  }
}

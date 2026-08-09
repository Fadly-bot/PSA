import { NextResponse } from 'next/server';
import { db } from '@/db/index';
import { publishers } from '@/db/schema';
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
      conditions.push(sql`${publishers.name} ILIKE ${`%${q}%`}`);
    }

    const whereClause = conditions.length > 0 ? sql`${sql.join(conditions, sql` AND `)}` : undefined;

    const orderByMap: Record<string, any> = {
      name: desc(publishers.name),
      createdAt: desc(publishers.createdAt),
      updatedAt: desc(publishers.updatedAt),
    };
    const orderBy = orderByMap[sortBy] ?? desc(publishers.createdAt);

    const [items, [{ count }]] = await Promise.all([
      db.select().from(publishers).where(whereClause).orderBy(orderBy).limit(limit).offset(offset),
      db.select({ count: sql<number>`count(*)` }).from(publishers).where(whereClause),
    ]);

    return NextResponse.json({
      items,
      page,
      limit,
      total: Number(count),
      totalPages: Math.max(1, Math.ceil(Number(count) / limit)),
    });
  } catch (error) {
    console.error('GET /api/publishers error', error);
    return NextResponse.json({ error: 'Gagal memuat data penerbit.' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Tidak diizinkan.' }, { status: 401 });
    }
    if (!hasPermission(user.role, 'publisher:create')) {
      return NextResponse.json({ error: 'Tidak memiliki izin.' }, { status: 403 });
    }

    const body = await request.json().catch(() => null);
    if (!body?.name || typeof body.name !== 'string') {
      return NextResponse.json({ error: 'Nama penerbit wajib diisi.' }, { status: 400 });
    }

    const name = body.name.trim();
    if (name.length < 2 || name.length > 200) {
      return NextResponse.json({ error: 'Nama penerbit harus 2-200 karakter.' }, { status: 400 });
    }

    const address = typeof body.address === 'string' ? body.address.trim() : undefined;
    if (address && address.length > 500) {
      return NextResponse.json({ error: 'Alamat maksimal 500 karakter.' }, { status: 400 });
    }

    const email = typeof body.email === 'string' ? body.email.trim() : undefined;
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: 'Format email tidak valid.' }, { status: 400 });
    }

    const phone = typeof body.phone === 'string' ? body.phone.trim() : undefined;
    const website = typeof body.website === 'string' ? body.website.trim() : undefined;
    if (website && !/^https?:\/\/.+/.test(website)) {
      return NextResponse.json({ error: 'URL website tidak valid.' }, { status: 400 });
    }

    const [row] = await db.insert(publishers).values({
      name,
      address,
      email,
      phone,
      website,
    }).returning();

    await createAuditLog({
      userId: user.id,
      action: 'CREATE',
      module: 'PUBLISHERS',
      description: `Tambah penerbit "${name}"`,
    });

    return NextResponse.json(row, { status: 201 });
  } catch (error: any) {
    console.error('POST /api/publishers error', error);
    if (error?.code === '23505') {
      return NextResponse.json({ error: 'Nama penerbit sudah digunakan.' }, { status: 409 });
    }
    return NextResponse.json({ error: 'Gagal menyimpan penerbit.' }, { status: 500 });
  }
}
